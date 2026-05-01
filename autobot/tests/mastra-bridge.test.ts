/**
 * Tests for ai/mastra-bridge.ts — WhatsApp message → Mastra agent bridge.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
const mockGenerate = vi.fn().mockResolvedValue({ text: 'Hola! ¿En qué te puedo ayudar?' });
vi.mock('../src/ai/agents.js', () => ({
  whatsappAgent: { generate: mockGenerate, instructions: '' },
  whatsappAgentHpc: { generate: mockGenerate, instructions: '' },
  directAgent: { generate: mockGenerate, instructions: '' },
  directAgentHpc: { generate: mockGenerate, instructions: '' },
  setTenantId: vi.fn(),
}));

vi.mock('../src/ai/model-router.js', () => ({
  classifyRoute: vi.fn().mockReturnValue('local'),
  ensureHealthy: vi.fn().mockResolvedValue(true),
  recordLatency: vi.fn(),
}));

vi.mock('../src/db/business-context-repo.js', () => ({
  getBusinessContext: vi.fn().mockResolvedValue({ businessType: 'restaurant' }),
  getAdminSettings: vi.fn().mockResolvedValue({ ownerJid: '51987654321@s.whatsapp.net' }),
  isOwner: vi.fn().mockImplementation((_tid: string, jid: string) =>
    jid === '51987654321@s.whatsapp.net',
  ),
  setOwnerJid: vi.fn(),
}));

vi.mock('../src/db/tenants-repo.js', () => ({
  getTenantById: vi.fn().mockResolvedValue({
    id: 'tenant-1',
    name: 'Pizza Express',
    phone: '+51987654321',
  }),
}));

vi.mock('../src/db/pg-messages-repo.js', () => ({
  getConversationHistory: vi.fn().mockResolvedValue({ messages: [] }),
}));

vi.mock('../src/shared/logger.js', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const { processWithOpenClaw, processOwnerWithOpenClaw, isOwnerChat } =
  await import('../src/ai/mastra-bridge.js');

describe('mastra-bridge', () => {
  describe('processWithOpenClaw', () => {
    it('should process a message and return reply', async () => {
      const chunks: string[] = [];
      const result = await processWithOpenClaw(
        'tenant-1',
        'whatsapp',
        '51999@s.whatsapp.net',
        'Hola',
        async (chunk) => { chunks.push(chunk); },
      );

      expect(result.reply).toBeTruthy();
      expect(result.reply).toContain('ayudar');
      expect(result.imagesToSend).toEqual([]);
      expect(chunks.length).toBe(1);
    });

    it('should handle image media path', async () => {
      const result = await processWithOpenClaw(
        'tenant-1',
        'whatsapp',
        '51999@s.whatsapp.net',
        'Que es esto?',
        async () => {},
        '/media/image.jpg',
      );
      expect(result.reply).toBeTruthy();
    });

    it('should return fallback on agent failure', async () => {
      const { whatsappAgent } = await import('../src/ai/agents.js');
      // Must reject twice: once for initial call, once for retry-without-history
      (whatsappAgent.generate as any)
        .mockRejectedValueOnce(new Error('LLM down'))
        .mockRejectedValueOnce(new Error('LLM still down'));

      const result = await processWithOpenClaw(
        'tenant-1',
        'whatsapp',
        '51999@s.whatsapp.net',
        'test',
        async () => {},
      );

      expect(result.reply).toContain('problema');
    });
  });

  describe('processOwnerWithOpenClaw', () => {
    it('should process owner message', async () => {
      const result = await processOwnerWithOpenClaw(
        'tenant-1',
        '51987654321@s.whatsapp.net',
        'Cuantas ventas hoy?',
      );
      expect(result.reply).toBeTruthy();
    });

    it('should retry without history on first failure', async () => {
      const { directAgent } = await import('../src/ai/agents.js');
      (directAgent.generate as any)
        .mockRejectedValueOnce(new Error('first attempt fail'))
        .mockResolvedValueOnce({ text: 'Recovered reply' });

      const result = await processOwnerWithOpenClaw(
        'tenant-1',
        '51987654321@s.whatsapp.net',
        'test retry',
      );
      expect(result.reply).toBe('Recovered reply');
    });

    it('should return fallback on error', async () => {
      const { directAgent } = await import('../src/ai/agents.js');
      // Must reject twice: once for initial call, once for retry-without-history
      (directAgent.generate as any)
        .mockRejectedValueOnce(new Error('fail'))
        .mockRejectedValueOnce(new Error('still failing'));

      const result = await processOwnerWithOpenClaw(
        'tenant-1',
        '51987654321@s.whatsapp.net',
        'test',
      );
      expect(result.reply).toContain('problema');
    });
  });

  describe('isOwnerChat', () => {
    it('should detect owner by ownerJid setting', async () => {
      const result = await isOwnerChat('tenant-1', '51987654321@s.whatsapp.net');
      expect(result).toBe(true);
    });

    it('should reject non-owner JID', async () => {
      const result = await isOwnerChat('tenant-1', '51999888777@s.whatsapp.net');
      expect(result).toBe(false);
    });
  });
});

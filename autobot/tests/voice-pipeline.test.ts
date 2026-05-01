/**
 * Tests for voice/voice-pipeline.ts — voice message processing.
 * Tests for voice/nlu-extractor.ts — deterministic NLU extraction.
 *
 * Mocks external HTTP calls (Whisper, TTS) to test pipeline logic.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';

// Mock logger
vi.mock('../src/shared/logger.js', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// Mock audio-compliance (added by Ley 29733 hook)
vi.mock('../src/voice/audio-compliance.js', () => ({
  prepareAudioAudit: vi.fn(() => ({ hash: 'test-hash', sizeBytes: 3, mimetype: 'audio/ogg' })),
  finalizeAudioDeletion: vi.fn(),
}));

// Mock model-router (HPC endpoints not available in tests)
vi.mock('../src/ai/model-router.js', () => ({
  HPC_ASR_BASE: 'http://localhost:18082/v1',
  HPC_TTS_BASE: 'http://localhost:18083/v1',
  HPC_TTS_VOICE: 'vivian',
  isHpcAsrAvailable: vi.fn().mockResolvedValue(false),
  isHpcTtsAvailable: vi.fn().mockResolvedValue(false),
}));

// Mock NLU agent — return regex results without needing vLLM
vi.mock('../src/voice/nlu-agent.js', async (importOriginal) => {
  const { extractTransaction } = await import('../src/voice/nlu-extractor.js');
  return {
    extractTransactionWithAgent: vi.fn(async (text: string) => {
      const result = extractTransaction(text);
      return (result.amount !== null || result.type !== 'unknown') ? result : null;
    }),
    extractTransactionRegex: extractTransaction,
  };
});

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const { synthesizeSpeech, transcribeSpeech, processVoiceMessage } =
  await import('../src/voice/voice-pipeline.js');

const { extractAmount, extractVendor, extractDate, extractTransaction } =
  await import('../src/voice/nlu-extractor.js');

describe('voice-pipeline', () => {
  afterEach(() => {
    mockFetch.mockReset();
  });

  describe('synthesizeSpeech', () => {
    it('should call TTS API and return buffer', async () => {
      const audioData = new Uint8Array([1, 2, 3, 4]);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: () => Promise.resolve(audioData.buffer),
      });

      const result = await synthesizeSpeech('Hola mundo');
      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBe(4);

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.input).toBe('Hola mundo');
      expect(callBody.response_format).toBe('mp3');
    });

    it('should strip markdown from input', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
      });

      await synthesizeSpeech('**Hello** _world_ `code`');
      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.input).not.toContain('*');
      expect(callBody.input).not.toContain('_');
      expect(callBody.input).not.toContain('`');
    });

    it('should truncate long text to 500 chars', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
      });

      const longText = 'a'.repeat(1000);
      await synthesizeSpeech(longText);
      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.input.length).toBeLessThanOrEqual(504); // 500 + '...'
    });

    it('should throw on TTS error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Server error'),
      });

      await expect(synthesizeSpeech('test')).rejects.toThrow('TTS failed: 500');
    });
  });

  describe('transcribeSpeech', () => {
    it('should call Whisper API and return text', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ text: 'Hola como estas' }),
      });

      const audio = Buffer.from([1, 2, 3]);
      const result = await transcribeSpeech(audio, 'audio/ogg');
      expect(result).toBe('Hola como estas');
    });

    it('should throw on STT error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: () => Promise.resolve('Bad request'),
      });

      const audio = Buffer.from([1, 2, 3]);
      await expect(transcribeSpeech(audio, 'audio/ogg')).rejects.toThrow('STT failed: 400');
    });
  });

  describe('processVoiceMessage', () => {
    it('should run full pipeline: STT -> NLU -> LLM -> TTS', async () => {
      // Mock STT
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ text: 'vendí 50 soles de arroz ayer' }),
      });
      // Mock TTS
      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: () => Promise.resolve(new Uint8Array([5, 6, 7]).buffer),
      });

      const result = await processVoiceMessage(
        Buffer.from([1, 2, 3]),
        'audio/ogg',
        async (text) => `Respuesta a: ${text}`,
      );

      expect(result.transcription).toBe('vendí 50 soles de arroz ayer');
      expect(result.response).toBe('Respuesta a: vendí 50 soles de arroz ayer');
      expect(result.audioBuffer).toBeInstanceOf(Buffer);
      expect(result.ttsAvailable).toBe(true);

      // NLU extraction should have been performed
      expect(result.transaction).not.toBeNull();
      expect(result.transaction!.type).toBe('sale');
      expect(result.transaction!.amount!.value).toBe(50);
      expect(result.transaction!.amount!.currency).toBe('PEN');
      expect(result.transaction!.category).toBe('food');

      // Timings should include nluMs
      expect(result.timings.sttMs).toBeGreaterThanOrEqual(0);
      expect(result.timings.nluMs).toBeGreaterThanOrEqual(0);
      expect(result.timings.llmMs).toBeGreaterThanOrEqual(0);
      expect(result.timings.ttsMs).toBeGreaterThanOrEqual(0);
      expect(result.timings.totalMs).toBeGreaterThanOrEqual(0);
    });

    it('should return null transaction for non-transactional text', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ text: 'hola como estas' }),
      });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: () => Promise.resolve(new Uint8Array([5, 6]).buffer),
      });

      const result = await processVoiceMessage(
        Buffer.from([1]),
        'audio/ogg',
        async () => 'Bien, gracias!',
      );

      expect(result.transaction).toBeNull();
      expect(result.ttsAvailable).toBe(true);
    });

    it('should return text-only result when TTS fails', async () => {
      // Mock STT success
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ text: 'hola mundo' }),
      });
      // Mock TTS failure
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.resolve('TTS server error'),
      });

      const result = await processVoiceMessage(
        Buffer.from([1]),
        'audio/ogg',
        async () => 'Respuesta de prueba',
      );

      expect(result.transcription).toBe('hola mundo');
      expect(result.response).toBe('Respuesta de prueba');
      expect(result.ttsAvailable).toBe(false);
      expect(result.audioBuffer.length).toBe(0);
    });

    it('should throw on empty transcription', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ text: '   ' }),
      });

      await expect(
        processVoiceMessage(
          Buffer.from([1]),
          'audio/ogg',
          async () => 'should not reach',
        ),
      ).rejects.toThrow('Empty transcription');
    });
  });
});

// ── NLU Extractor Tests ──

describe('nlu-extractor', () => {
  describe('extractAmount', () => {
    it('should extract "50 soles"', () => {
      const result = extractAmount('vendí 50 soles de arroz');
      expect(result).not.toBeNull();
      expect(result!.value).toBe(50);
      expect(result!.currency).toBe('PEN');
      expect(result!.currencySymbol).toBe('S/');
    });

    it('should extract "S/ 150.50"', () => {
      const result = extractAmount('me pagaron S/ 150.50');
      expect(result).not.toBeNull();
      expect(result!.value).toBe(150.50);
      expect(result!.currency).toBe('PEN');
    });

    it('should extract "S/.30"', () => {
      const result = extractAmount('gasté S/.30 en taxi');
      expect(result).not.toBeNull();
      expect(result!.value).toBe(30);
      expect(result!.currency).toBe('PEN');
    });

    it('should extract "$100 dolares"', () => {
      const result = extractAmount('me depositaron 100 dolares');
      expect(result).not.toBeNull();
      expect(result!.value).toBe(100);
      expect(result!.currency).toBe('USD');
    });

    it('should extract "3.50 soles"', () => {
      const result = extractAmount('la empanada cuesta 3.50 soles');
      expect(result).not.toBeNull();
      expect(result!.value).toBe(3.50);
    });

    it('should extract written number "cincuenta soles"', () => {
      const result = extractAmount('pagué cincuenta soles');
      expect(result).not.toBeNull();
      expect(result!.value).toBe(50);
      expect(result!.currency).toBe('PEN');
    });

    it('should extract "mil quinientos soles"', () => {
      const result = extractAmount('gasté mil quinientos soles en mercadería');
      expect(result).not.toBeNull();
      expect(result!.value).toBe(1500);
    });

    it('should extract "treinta y cinco soles"', () => {
      const result = extractAmount('cobré treinta y cinco soles');
      expect(result).not.toBeNull();
      expect(result!.value).toBe(35);
    });

    it('should extract standalone amount after verb "pagué 50"', () => {
      const result = extractAmount('pagué 50 por el almuerzo');
      expect(result).not.toBeNull();
      expect(result!.value).toBe(50);
      expect(result!.confidence).toBeLessThan(0.9); // lower confidence
    });

    it('should extract amount with comma decimal "25,50 soles"', () => {
      const result = extractAmount('compré por 25,50 soles');
      expect(result).not.toBeNull();
      expect(result!.value).toBe(25.50);
    });

    it('should return null for no amount', () => {
      const result = extractAmount('hola como estas');
      expect(result).toBeNull();
    });

    it('should extract "$" prefix', () => {
      const result = extractAmount('me cobraron $200');
      expect(result).not.toBeNull();
      expect(result!.value).toBe(200);
    });

    it('should default to PEN for ambiguous amounts', () => {
      const result = extractAmount('cobré 80');
      expect(result).not.toBeNull();
      expect(result!.currency).toBe('PEN');
    });
  });

  describe('extractVendor', () => {
    it('should extract "Don Pedro"', () => {
      const result = extractVendor('le vendí arroz a Don Pedro');
      expect(result).not.toBeNull();
      expect(result!.vendor).toBe('Don Pedro');
    });

    it('should extract vendor with "en la"', () => {
      const result = extractVendor('compré carne en la Tienda Central');
      expect(result).not.toBeNull();
      expect(result!.vendor).toContain('Tienda');
    });

    it('should extract name after "a"', () => {
      const result = extractVendor('pagué a Carlos');
      expect(result).not.toBeNull();
      expect(result!.vendor).toBe('Carlos');
    });

    it('should return null for no vendor', () => {
      const result = extractVendor('vendí 50 soles');
      expect(result).toBeNull();
    });
  });

  describe('extractDate', () => {
    const ref = new Date(2026, 3, 7, 12, 0); // April 7, 2026, noon

    it('should parse "hoy"', () => {
      const result = extractDate('vendí hoy', ref);
      expect(result).not.toBeNull();
      expect(result!.date.getDate()).toBe(7);
      expect(result!.date.getMonth()).toBe(3); // April
      expect(result!.isRelative).toBe(true);
    });

    it('should parse "ayer"', () => {
      const result = extractDate('compré ayer', ref);
      expect(result).not.toBeNull();
      expect(result!.date.getDate()).toBe(6);
      expect(result!.isRelative).toBe(true);
    });

    it('should parse "anteayer"', () => {
      const result = extractDate('gasté anteayer', ref);
      expect(result).not.toBeNull();
      expect(result!.date.getDate()).toBe(5);
    });

    it('should parse "hace 3 dias"', () => {
      const result = extractDate('compré hace 3 dias', ref);
      expect(result).not.toBeNull();
      expect(result!.date.getDate()).toBe(4);
    });

    it('should parse "el lunes" (most recent)', () => {
      // April 7 2026 is a Tuesday, so "el lunes" = April 6
      const result = extractDate('vendí el lunes', ref);
      expect(result).not.toBeNull();
      expect(result!.date.getDate()).toBe(6);
    });

    it('should parse "la semana pasada"', () => {
      const result = extractDate('gasté la semana pasada', ref);
      expect(result).not.toBeNull();
      expect(result!.date.getDate()).toBe(31); // March 31
    });

    it('should parse absolute "15 de marzo"', () => {
      const result = extractDate('compré el 15 de marzo', ref);
      expect(result).not.toBeNull();
      expect(result!.date.getDate()).toBe(15);
      expect(result!.date.getMonth()).toBe(2); // March
      expect(result!.isRelative).toBe(false);
    });

    it('should parse "15 de marzo del 2025"', () => {
      const result = extractDate('vendí el 15 de marzo del 2025', ref);
      expect(result).not.toBeNull();
      expect(result!.date.getFullYear()).toBe(2025);
    });

    it('should parse DD/MM format "15/03"', () => {
      const result = extractDate('gasté 15/03', ref);
      expect(result).not.toBeNull();
      expect(result!.date.getDate()).toBe(15);
      expect(result!.date.getMonth()).toBe(2);
    });

    it('should parse DD/MM/YYYY format "15/03/2025"', () => {
      const result = extractDate('compré 15/03/2025', ref);
      expect(result).not.toBeNull();
      expect(result!.date.getFullYear()).toBe(2025);
    });

    it('should return null for no date', () => {
      const result = extractDate('vendí arroz');
      expect(result).toBeNull();
    });
  });

  describe('extractTransaction (full)', () => {
    it('should extract a complete sale transaction', () => {
      const tx = extractTransaction('vendí 50 soles de arroz a Don Pedro ayer', new Date(2026, 3, 7));
      expect(tx.type).toBe('sale');
      expect(tx.amount!.value).toBe(50);
      expect(tx.amount!.currency).toBe('PEN');
      expect(tx.category).toBe('food');
      expect(tx.vendor).toBe('Don Pedro');
      expect(tx.date).not.toBeNull();
      expect(tx.date!.date.getDate()).toBe(6);
      expect(tx.extractedFields).toContain('type');
      expect(tx.extractedFields).toContain('amount');
      expect(tx.extractedFields).toContain('category');
      expect(tx.extractedFields).toContain('vendor');
      expect(tx.extractedFields).toContain('date');
      expect(tx.confidence).toBeGreaterThan(0.7);
    });

    it('should extract an expense transaction', () => {
      const tx = extractTransaction('gasté 200 soles en gasolina hoy');
      expect(tx.type).toBe('expense');
      expect(tx.amount!.value).toBe(200);
      expect(tx.category).toBe('transport');
      expect(tx.extractedFields).toContain('type');
      expect(tx.extractedFields).toContain('amount');
      expect(tx.extractedFields).toContain('category');
    });

    it('should extract a payment received', () => {
      const tx = extractTransaction('me pagaron 1000 soles hoy');
      expect(tx.type).toBe('payment_received');
      expect(tx.amount!.value).toBe(1000);
    });

    it('should handle text with no transaction', () => {
      const tx = extractTransaction('buenos días, cómo estás');
      expect(tx.type).toBe('unknown');
      expect(tx.amount).toBeNull();
      expect(tx.category).toBeNull();
      expect(tx.extractedFields).toHaveLength(0);
    });

    it('should handle purchase with dollar amount', () => {
      const tx = extractTransaction('compré materiales por $500 dolares');
      expect(tx.type).toBe('expense');
      expect(tx.amount!.value).toBe(500);
      expect(tx.amount!.currency).toBe('USD');
      expect(tx.category).toBe('supplies');
    });

    it('should detect salary expense', () => {
      const tx = extractTransaction('pagué el sueldo de 1500 soles');
      expect(tx.type).toBe('expense');
      expect(tx.amount!.value).toBe(1500);
      expect(tx.category).toBe('salary');
    });

    it('should detect utilities expense', () => {
      const tx = extractTransaction('pagué el recibo de luz por 80 soles');
      expect(tx.type).toBe('expense');
      expect(tx.amount!.value).toBe(80);
      expect(tx.category).toBe('utilities');
    });

    it('should have high confidence for well-structured input', () => {
      const tx = extractTransaction('vendí 300 soles de pollo a Don José ayer', new Date(2026, 3, 7));
      expect(tx.confidence).toBeGreaterThan(0.8);
      expect(tx.extractedFields.length).toBeGreaterThanOrEqual(4);
    });

    it('should have lower confidence for sparse input', () => {
      const tx = extractTransaction('cobré 50');
      expect(tx.confidence).toBeLessThan(0.85);
    });
  });
});

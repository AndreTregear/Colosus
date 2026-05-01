/**
 * Tests for ai/pii-scrubber.ts — PII redaction for training data.
 */
import { describe, it, expect } from 'vitest';
import { scrubPII, scrubConversation } from '../src/ai/pii-scrubber.js';

describe('scrubPII', () => {
  describe('phone numbers', () => {
    it('should scrub Peruvian phone +51 format', () => {
      expect(scrubPII('Llama al +51 987 654 321')).toBe('Llama al [PHONE]');
    });

    it('should scrub phone without country code', () => {
      expect(scrubPII('Mi numero es 987654321')).toBe('Mi numero es [PHONE]');
    });

    it('should scrub phone with 51 prefix no plus', () => {
      expect(scrubPII('Contactar 51987654321')).toBe('Contactar [PHONE]');
    });

    it('should scrub phone with separators', () => {
      expect(scrubPII('Tel: 987-654-321')).toBe('Tel: [PHONE]');
    });
  });

  describe('email addresses', () => {
    it('should scrub email', () => {
      expect(scrubPII('Escribir a juan@gmail.com')).toBe('Escribir a [EMAIL]');
    });

    it('should scrub multiple emails', () => {
      const input = 'CC: a@test.com y b@test.com';
      const result = scrubPII(input);
      expect(result).toBe('CC: [EMAIL] y [EMAIL]');
    });
  });

  describe('RUC numbers', () => {
    it('should scrub 11-digit RUC starting with 10', () => {
      expect(scrubPII('RUC: 10123456789')).toBe('RUC: [RUC]');
    });

    it('should scrub 11-digit RUC starting with 20', () => {
      expect(scrubPII('Factura a 20987654321')).toBe('Factura a [RUC]');
    });
  });

  describe('DNI numbers', () => {
    it('should scrub DNI with keyword', () => {
      expect(scrubPII('DNI: 12345678')).toBe('[DNI]');
    });

    it('should scrub dni lowercase', () => {
      expect(scrubPII('documento 87654321')).toBe('[DNI]');
    });
  });

  describe('amounts', () => {
    it('should scrub S/ amounts', () => {
      expect(scrubPII('Total: S/150.00')).toBe('Total: [AMOUNT]');
    });

    it('should scrub S/. amounts', () => {
      expect(scrubPII('Pago S/.25')).toBe('Pago [AMOUNT]');
    });

    it('should scrub S/ with space', () => {
      expect(scrubPII('Son S/ 99.50')).toBe('Son [AMOUNT]');
    });
  });

  describe('Yape/Plin sender names', () => {
    it('should scrub Yape sender name', () => {
      const result = scrubPII('Yape de Juan Carlos');
      expect(result).toContain('[CUSTOMER_NAME]');
      expect(result).not.toContain('Juan Carlos');
    });

    it('should scrub Plin sender name', () => {
      const result = scrubPII('Plin de Maria');
      expect(result).toContain('[CUSTOMER_NAME]');
      expect(result).not.toContain('Maria');
    });
  });

  describe('names after context patterns', () => {
    it('should scrub name after Cliente:', () => {
      const result = scrubPII('Cliente: Juan Perez');
      expect(result).toContain('[CUSTOMER_NAME]');
      expect(result).not.toContain('Juan Perez');
    });

    it('should scrub name after para', () => {
      const result = scrubPII('Pedido para Ana Lopez');
      expect(result).toContain('[CUSTOMER_NAME]');
    });
  });

  describe('preserves non-PII', () => {
    it('should not modify regular text', () => {
      const text = 'Hola, quiero ordenar una pizza grande';
      expect(scrubPII(text)).toBe(text);
    });

    it('should not modify product descriptions', () => {
      const text = 'Pizza Hawaiana - con jamon y pina';
      expect(scrubPII(text)).toBe(text);
    });
  });
});

describe('scrubConversation', () => {
  it('should scrub PII from all messages', () => {
    const messages = [
      { role: 'user', content: 'Soy Juan, mi tel es 987654321' },
      { role: 'assistant', content: 'Hola Juan! Encontre tu pedido' },
    ];
    const scrubbed = scrubConversation(messages);
    expect(scrubbed[0].content).toContain('[PHONE]');
    expect(scrubbed[0].role).toBe('user');
    expect(scrubbed[1].role).toBe('assistant');
  });

  it('should not mutate original array', () => {
    const messages = [{ role: 'user', content: 'Email: test@test.com' }];
    const scrubbed = scrubConversation(messages);
    expect(messages[0].content).toBe('Email: test@test.com');
    expect(scrubbed[0].content).toBe('Email: [EMAIL]');
  });

  it('should handle empty conversation', () => {
    expect(scrubConversation([])).toEqual([]);
  });
});

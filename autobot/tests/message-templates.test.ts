/**
 * Tests for shared/message-templates.ts — i18n notification templates.
 */
import { describe, it, expect } from 'vitest';
import { getMessage } from '../src/shared/message-templates.js';

describe('getMessage', () => {
  describe('payment-confirmed', () => {
    it('should render Spanish template', () => {
      const msg = getMessage('payment-confirmed', 'es', { orderId: 42 });
      expect(msg).toBe('Tu pago por el pedido #42 fue confirmado. ¡Gracias!');
    });

    it('should render English template', () => {
      const msg = getMessage('payment-confirmed', 'en', { orderId: 42 });
      expect(msg).toBe('Your payment for order #42 has been confirmed. Thank you!');
    });

    it('should render Portuguese template', () => {
      const msg = getMessage('payment-confirmed', 'pt', { orderId: 42 });
      expect(msg).toBe('Seu pagamento pelo pedido #42 foi confirmado. Obrigado!');
    });
  });

  describe('payment-followup', () => {
    it('should interpolate all variables', () => {
      const msg = getMessage('payment-followup', 'es', {
        orderId: 15,
        total: 'S/50.00',
        yapeNumber: '987654321',
      });
      expect(msg).toContain('#15');
      expect(msg).toContain('S/50.00');
      expect(msg).toContain('987654321');
    });
  });

  describe('low-stock-alert', () => {
    it('should include product name and stock count', () => {
      const msg = getMessage('low-stock-alert', 'es', {
        productName: 'Pizza Hawaiana',
        currentStock: 3,
      });
      expect(msg).toContain('Pizza Hawaiana');
      expect(msg).toContain('3');
    });
  });

  describe('appointment-reminder', () => {
    it('should include service name and time', () => {
      const msg = getMessage('appointment-reminder', 'en', {
        serviceName: 'Haircut',
        scheduledAt: '3:00 PM',
      });
      expect(msg).toContain('Haircut');
      expect(msg).toContain('3:00 PM');
    });
  });

  describe('followup templates', () => {
    it('should render post-purchase', () => {
      const msg = getMessage('post-purchase', 'es', {
        customerName: 'Ana',
        orderId: 99,
      });
      expect(msg).toContain('Ana');
      expect(msg).toContain('#99');
    });

    it('should render abandoned-cart', () => {
      const msg = getMessage('abandoned-cart', 'es', {
        orderId: 77,
        total: 'S/120',
      });
      expect(msg).toContain('#77');
      expect(msg).toContain('S/120');
    });

    it('should render re-engagement', () => {
      const msg = getMessage('re-engagement', 'es', {});
      expect(msg).toContain('extrañamos');
    });
  });

  describe('fallback behavior', () => {
    it('should fall back to Spanish for unknown language', () => {
      const msg = getMessage('payment-confirmed', 'fr', { orderId: 1 });
      expect(msg).toContain('pago');
    });

    it('should return empty string for unknown key', () => {
      const msg = getMessage('nonexistent-template', 'es', {});
      expect(msg).toBe('');
    });

    it('should handle missing variables gracefully', () => {
      const msg = getMessage('payment-confirmed', 'es', {});
      expect(msg).toContain('#');
    });
  });
});

/**
 * Tests for crypto/field-crypto.ts — per-field encryption with AAD.
 */
import { describe, it, expect } from 'vitest';
import { encryptField, decryptField, isEncrypted } from '../src/crypto/field-crypto.js';
import { generateDEK } from '../src/crypto/envelope.js';

describe('field-crypto', () => {
  const dek = generateDEK();
  const tenantId = 'tenant-abc-123';
  const table = 'customers';
  const column = 'phone';

  describe('encryptField / decryptField', () => {
    it('should round-trip encrypt and decrypt a string', () => {
      const value = '+51987654321';
      const encrypted = encryptField(value, dek, tenantId, table, column);
      const decrypted = decryptField(encrypted, dek, tenantId, table, column);
      expect(decrypted).toBe(value);
    });

    it('should produce base64 output', () => {
      const encrypted = encryptField('test', dek, tenantId, table, column);
      expect(() => Buffer.from(encrypted, 'base64')).not.toThrow();
    });

    it('should produce different ciphertexts for same input', () => {
      const e1 = encryptField('same', dek, tenantId, table, column);
      const e2 = encryptField('same', dek, tenantId, table, column);
      expect(e1).not.toBe(e2); // different nonces
    });

    it('should handle empty string', () => {
      const encrypted = encryptField('', dek, tenantId, table, column);
      const decrypted = decryptField(encrypted, dek, tenantId, table, column);
      expect(decrypted).toBe('');
    });

    it('should handle unicode', () => {
      const value = 'Contraseña secreta 🔒';
      const encrypted = encryptField(value, dek, tenantId, table, column);
      const decrypted = decryptField(encrypted, dek, tenantId, table, column);
      expect(decrypted).toBe(value);
    });

    it('should handle long strings', () => {
      const value = 'a'.repeat(10000);
      const encrypted = encryptField(value, dek, tenantId, table, column);
      const decrypted = decryptField(encrypted, dek, tenantId, table, column);
      expect(decrypted).toBe(value);
    });
  });

  describe('AAD enforcement', () => {
    it('should fail with wrong tenantId', () => {
      const encrypted = encryptField('secret', dek, tenantId, table, column);
      const decrypted = decryptField(encrypted, dek, 'wrong-tenant', table, column);
      expect(decrypted).toBeNull();
    });

    it('should fail with wrong table', () => {
      const encrypted = encryptField('secret', dek, tenantId, table, column);
      const decrypted = decryptField(encrypted, dek, tenantId, 'other_table', column);
      expect(decrypted).toBeNull();
    });

    it('should fail with wrong column', () => {
      const encrypted = encryptField('secret', dek, tenantId, table, column);
      const decrypted = decryptField(encrypted, dek, tenantId, table, 'other_col');
      expect(decrypted).toBeNull();
    });
  });

  describe('wrong key', () => {
    it('should return null with wrong DEK', () => {
      const wrongDek = generateDEK();
      const encrypted = encryptField('secret', dek, tenantId, table, column);
      const decrypted = decryptField(encrypted, wrongDek, tenantId, table, column);
      expect(decrypted).toBeNull();
    });
  });

  describe('tampered data', () => {
    it('should return null for tampered ciphertext', () => {
      const encrypted = encryptField('secret', dek, tenantId, table, column);
      const buf = Buffer.from(encrypted, 'base64');
      buf[15] ^= 0xff;
      const tampered = buf.toString('base64');
      const decrypted = decryptField(tampered, dek, tenantId, table, column);
      expect(decrypted).toBeNull();
    });

    it('should return null for invalid base64', () => {
      const decrypted = decryptField('not-base64!!!', dek, tenantId, table, column);
      expect(decrypted).toBeNull();
    });

    it('should return null for too-short data', () => {
      const decrypted = decryptField('dG9vc2hvcnQ=', dek, tenantId, table, column);
      expect(decrypted).toBeNull();
    });
  });

  describe('isEncrypted', () => {
    it('should detect encrypted values', () => {
      const encrypted = encryptField('test', dek, tenantId, table, column);
      expect(isEncrypted(encrypted)).toBe(true);
    });

    it('should reject plaintext', () => {
      expect(isEncrypted('hello world')).toBe(false);
    });

    it('should reject null/undefined', () => {
      expect(isEncrypted(null)).toBe(false);
      expect(isEncrypted(undefined)).toBe(false);
    });

    it('should reject empty string', () => {
      expect(isEncrypted('')).toBe(false);
    });

    it('should reject short base64', () => {
      expect(isEncrypted('aGVsbG8=')).toBe(false);
    });

    it('should reject non-base64 long strings', () => {
      expect(isEncrypted('a'.repeat(50))).toBe(false);
    });
  });
});

/**
 * Tests for crypto/envelope.ts — key derivation, DEK generation, encryption.
 */
import { describe, it, expect } from 'vitest';
import {
  deriveKEK,
  generateDEK,
  generateSalt,
  encryptDEK,
  decryptDEK,
} from '../src/crypto/envelope.js';

describe('crypto/envelope', () => {
  describe('generateDEK', () => {
    it('should generate a 32-byte DEK', () => {
      const dek = generateDEK();
      expect(dek).toBeInstanceOf(Buffer);
      expect(dek.length).toBe(32);
    });

    it('should generate unique DEKs', () => {
      const dek1 = generateDEK();
      const dek2 = generateDEK();
      expect(dek1.equals(dek2)).toBe(false);
    });
  });

  describe('generateSalt', () => {
    it('should generate a 16-byte salt', () => {
      const salt = generateSalt();
      expect(salt).toBeInstanceOf(Buffer);
      expect(salt.length).toBe(16);
    });

    it('should generate unique salts', () => {
      const s1 = generateSalt();
      const s2 = generateSalt();
      expect(s1.equals(s2)).toBe(false);
    });
  });

  describe('deriveKEK', () => {
    it('should derive a 32-byte key from password + salt', async () => {
      const salt = generateSalt();
      const kek = await deriveKEK('mypassword123', salt);
      expect(kek).toBeInstanceOf(Buffer);
      expect(kek.length).toBe(32);
    });

    it('should produce same key for same password + salt', async () => {
      const salt = generateSalt();
      const kek1 = await deriveKEK('password', salt);
      const kek2 = await deriveKEK('password', salt);
      expect(kek1.equals(kek2)).toBe(true);
    });

    it('should produce different keys for different passwords', async () => {
      const salt = generateSalt();
      const kek1 = await deriveKEK('password1', salt);
      const kek2 = await deriveKEK('password2', salt);
      expect(kek1.equals(kek2)).toBe(false);
    });

    it('should produce different keys for different salts', async () => {
      const kek1 = await deriveKEK('password', generateSalt());
      const kek2 = await deriveKEK('password', generateSalt());
      expect(kek1.equals(kek2)).toBe(false);
    });
  });

  describe('encryptDEK / decryptDEK', () => {
    it('should round-trip encrypt and decrypt a DEK', () => {
      const dek = generateDEK();
      const kek = generateDEK(); // reuse 32-byte random as KEK

      const { encryptedDek, nonce } = encryptDEK(dek, kek);
      const decrypted = decryptDEK(encryptedDek, nonce, kek);

      expect(decrypted.equals(dek)).toBe(true);
    });

    it('should fail with wrong KEK', () => {
      const dek = generateDEK();
      const kek1 = generateDEK();
      const kek2 = generateDEK();

      const { encryptedDek, nonce } = encryptDEK(dek, kek1);

      expect(() => decryptDEK(encryptedDek, nonce, kek2)).toThrow();
    });

    it('should fail with tampered ciphertext', () => {
      const dek = generateDEK();
      const kek = generateDEK();

      const { encryptedDek, nonce } = encryptDEK(dek, kek);

      // Tamper with encrypted data
      encryptedDek[0] ^= 0xff;

      expect(() => decryptDEK(encryptedDek, nonce, kek)).toThrow();
    });

    it('should produce different ciphertexts for same DEK+KEK', () => {
      const dek = generateDEK();
      const kek = generateDEK();

      const enc1 = encryptDEK(dek, kek);
      const enc2 = encryptDEK(dek, kek);

      // Different nonces → different ciphertexts
      expect(enc1.encryptedDek.equals(enc2.encryptedDek)).toBe(false);
    });
  });

  describe('full key lifecycle', () => {
    it('should derive KEK from password, encrypt DEK, and recover DEK', async () => {
      const password = 'user-registration-password';
      const salt = generateSalt();
      const dek = generateDEK();

      // Registration: derive KEK and encrypt DEK
      const kek = await deriveKEK(password, salt);
      const { encryptedDek, nonce } = encryptDEK(dek, kek);

      // Login: derive same KEK and decrypt DEK
      const kekAgain = await deriveKEK(password, salt);
      const recoveredDek = decryptDEK(encryptedDek, nonce, kekAgain);

      expect(recoveredDek.equals(dek)).toBe(true);
    });
  });
});

import { describe, it, expect, vi, beforeAll } from 'vitest';

// Mock the config module BEFORE importing encryption
vi.mock('../config', () => ({
    config: {
        encryption: {
            key: 'test-encryption-key-for-unit-tests-32bytes',
        },
    },
}));

import { encrypt, decrypt } from '../utils/encryption';

describe('Encryption Utility', () => {
    it('should encrypt and decrypt a string correctly (round-trip)', () => {
        const original = 'my-secret-api-key-12345';
        const encrypted = encrypt(original);
        const decrypted = decrypt(encrypted);

        expect(decrypted).toBe(original);
        expect(encrypted).not.toBe(original);
    });

    it('should produce different ciphertexts for the same input (random IV)', () => {
        const original = 'same-input-different-output';
        const encrypted1 = encrypt(original);
        const encrypted2 = encrypt(original);

        expect(decrypt(encrypted1)).toBe(original);
        expect(decrypt(encrypted2)).toBe(original);
        expect(encrypted1).not.toBe(encrypted2);
    });

    it('should handle empty string', () => {
        const original = '';
        const encrypted = encrypt(original);
        const decrypted = decrypt(encrypted);

        expect(decrypted).toBe(original);
    });

    it('should handle unicode characters', () => {
        const original = 'Ünïcödé κλειδί 🔑';
        const encrypted = encrypt(original);
        const decrypted = decrypt(encrypted);

        expect(decrypted).toBe(original);
    });

    it('should throw on invalid ciphertext format', () => {
        expect(() => decrypt('invalid')).toThrow('Invalid encrypted value format');
    });

    it('should include iv:encrypted:tag format', () => {
        const encrypted = encrypt('test');
        const parts = encrypted.split(':');

        expect(parts.length).toBe(3);
        expect(parts[0].length).toBe(32); // IV: 16 bytes = 32 hex chars
        expect(parts[2].length).toBe(32); // Tag: 16 bytes = 32 hex chars
    });
});

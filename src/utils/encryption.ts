import crypto from 'crypto';
import { config } from '../config';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

/**
 * Encrypt a string value using AES-256-GCM.
 * Returns a hex-encoded string: iv:encrypted:tag
 * Used for storing API keys securely (FR-013).
 */
export function encrypt(plaintext: string): string {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${encrypted}:${tag.toString('hex')}`;
}

/**
 * Decrypt an AES-256-GCM encrypted string.
 * Input format: iv:encrypted:tag (hex-encoded)
 */
export function decrypt(ciphertext: string): string {
    const key = getEncryptionKey();
    const parts = ciphertext.split(':');

    if (parts.length !== 3) {
        throw new Error('Invalid encrypted value format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const tag = Buffer.from(parts[2], 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}

/** Derive a 32-byte key from the ENCRYPTION_KEY env var */
function getEncryptionKey(): Buffer {
    const envKey = config.encryption.key;
    if (!envKey) {
        throw new Error('ENCRYPTION_KEY environment variable is required');
    }
    // Use SHA-256 to ensure we always have exactly 32 bytes
    return crypto.createHash('sha256').update(envKey).digest();
}

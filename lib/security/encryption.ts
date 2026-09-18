/**
 * AES-256-GCM token encryption helper.
 *
 * TOKEN_ENCRYPTION_KEY must be a 64-hex-character (32-byte) key.
 * Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 *
 * This module is server-only — never import in client components.
 */
import 'server-only';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96-bit IV for GCM
const TAG_LENGTH = 16; // 128-bit auth tag

function getEncryptionKey(): Buffer {
  const key = process.env.TOKEN_ENCRYPTION_KEY;
  if (!key || !/^[a-f0-9]{64}$/i.test(key)) {
    throw new Error(
      'TOKEN_ENCRYPTION_KEY must be a 64-hex-character string (32 bytes). ' +
        'Generate with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"',
    );
  }
  return Buffer.from(key, 'hex');
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Returns a hex-encoded string: IV + AuthTag + CipherText
 */
export function encryptToken(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  // Format: iv (24 hex) + authTag (32 hex) + ciphertext (variable hex)
  return iv.toString('hex') + authTag.toString('hex') + encrypted.toString('hex');
}

/**
 * Decrypts a hex-encoded string produced by encryptToken.
 */
export function decryptToken(encoded: string): string {
  const key = getEncryptionKey();

  const ivHex = encoded.slice(0, IV_LENGTH * 2);
  const tagHex = encoded.slice(IV_LENGTH * 2, IV_LENGTH * 2 + TAG_LENGTH * 2);
  const cipherHex = encoded.slice(IV_LENGTH * 2 + TAG_LENGTH * 2);

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(tagHex, 'hex');
  const cipherText = Buffer.from(cipherHex, 'hex');

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(cipherText), decipher.final()]);
  return decrypted.toString('utf8');
}

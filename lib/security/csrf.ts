import { randomBytes } from 'crypto';
import { SECURITY_CONFIG } from '@/lib/config';

/**
 * Generates a cryptographically secure state parameter for OAuth flows.
 * Returns hex string + expiry timestamp joined by '|'.
 */
export function generateOAuthState(): string {
  const random = randomBytes(32).toString('hex');
  const expiry = Date.now() + SECURITY_CONFIG.oauthStateExpiry;
  return `${random}|${expiry}`;
}

/**
 * Validates an OAuth state parameter.
 * Returns true if state matches and has not expired.
 */
export function validateOAuthState(stored: string, received: string): boolean {
  if (!stored || !received) return false;

  const [storedRandom, storedExpiry] = stored.split('|');
  const [receivedRandom] = received.split('|');

  if (!storedRandom || !storedExpiry || !receivedRandom) return false;
  if (!Number.isFinite(Number(storedExpiry)) || Date.now() > Number(storedExpiry) || stored !== received) return false;

  // Constant-time comparison to prevent timing attacks
  if (storedRandom.length !== receivedRandom.length) return false;

  let diff = 0;
  for (let i = 0; i < storedRandom.length; i++) {
    diff |= storedRandom.charCodeAt(i) ^ receivedRandom.charCodeAt(i);
  }
  return diff === 0;
}

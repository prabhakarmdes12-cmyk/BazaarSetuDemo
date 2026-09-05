// Encrypt sensitive data (bank account numbers) at rest with AES-256-GCM.
// The key is derived from PAYOUT_ENC_KEY (env). Development falls back to a
// non-secret local key; production MUST set PAYOUT_ENC_KEY to a long random
// string or encrypted values cannot be read back after a key change.

import crypto from 'crypto';

function getKey(): Buffer {
  const secret = process.env.PAYOUT_ENC_KEY || 'dev-only-payout-enc-key';
  return crypto.createHash('sha256').update(secret).digest();
}

export function encryptSecret(plaintext: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getKey(), iv);
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString('base64'), tag.toString('base64'), enc.toString('base64')].join(':');
}

export function decryptSecret(payload: string): string {
  const [ivB64, tagB64, dataB64] = payload.split(':');
  if (!ivB64 || !tagB64 || !dataB64) throw new Error('Malformed encrypted payload');
  const decipher = crypto.createDecipheriv('aes-256-gcm', getKey(), Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64')), decipher.final()]).toString('utf8');
}

export function maskAccountNumber(accountNumber: string): string {
  if (accountNumber.length <= 4) return '••••';
  return `••••${accountNumber.slice(-4)}`;
}

import crypto from 'crypto';

// Real OTP store (in-memory, single-instance). Swap for Redis in a
// multi-instance deployment. Entries are hashed, never stored in plaintext.
interface OtpRecord {
  hash: string;
  expiresAt: number;
  attempts: number;
  resendAt: number;
}

const store = new Map<string, OtpRecord>();

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const RESEND_COOLDOWN_MS = 30 * 1000; // 30 seconds
const MAX_ATTEMPTS = 5;

function hashOtp(phone: string, otp: string): string {
  return crypto.createHmac('sha256', phone).update(otp).digest('hex');
}

export function generateOtp(): string {
  return String(crypto.randomInt(100000, 1000000));
}

export function saveOtp(phone: string, otp: string): void {
  store.set(phone, {
    hash: hashOtp(phone, otp),
    expiresAt: Date.now() + OTP_TTL_MS,
    attempts: 0,
    resendAt: Date.now() + RESEND_COOLDOWN_MS,
  });
}

export function canResend(phone: string): boolean {
  const rec = store.get(phone);
  if (!rec) return true;
  return Date.now() >= rec.resendAt;
}

export function verifyOtp(phone: string, otp: string): { valid: boolean; reason?: string } {
  const rec = store.get(phone);
  if (!rec) return { valid: false, reason: 'No OTP requested. Please request a new OTP.' };

  if (Date.now() > rec.expiresAt) {
    store.delete(phone);
    return { valid: false, reason: 'OTP expired. Please request a new one.' };
  }

  if (rec.attempts >= MAX_ATTEMPTS) {
    store.delete(phone);
    return { valid: false, reason: 'Too many attempts. Please request a new OTP.' };
  }

  const expected = rec.hash;
  const actual = hashOtp(phone, otp);
  const valid =
    expected.length === actual.length &&
    crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(actual, 'hex'));

  if (valid) {
    store.delete(phone);
    return { valid: true };
  }

  rec.attempts += 1;
  return { valid: false, reason: 'Invalid OTP. Please try again.' };
}

export function clearOtp(phone: string): void {
  store.delete(phone);
}

import Razorpay from 'razorpay';

// Razorpay is optional — online udhaar payments only activate when
// RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are present in the environment.
let client: Razorpay | null = null;

export function isRazorpayConfigured(): boolean {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

export function getRazorpayClient(): Razorpay {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error('Razorpay is not configured (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET missing)');
  }
  if (!client) client = new Razorpay({ key_id: keyId, key_secret: keySecret });
  return client;
}

// Verify the HMAC-SHA256 webhook signature over the raw body bytes using
// RAZORPAY_WEBHOOK_SECRET. Returns false when the secret is not set.
export function verifyRazorpaySignature(rawBody: string | Buffer, signature: string | undefined): boolean {
  if (!signature) return false;
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return false;
  try {
    return Razorpay.validateWebhookSignature(rawBody.toString(), signature, secret);
  } catch {
    return false;
  }
}

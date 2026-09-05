// OTP delivery via a real SMS gateway.
//
// Contract:
//  - Development/test (NODE_ENV !== 'production'): the OTP is returned to the
//    caller so local flows are testable. No network is hit.
//  - Production: the OTP is sent via the configured provider and NEVER returned.
//    If no provider is configured the call fails closed (sent: false) so the
//    OTP can never leak into a response or log.

export type SmsResult = { sent: true; otp?: string } | { sent: false; reason: string };

interface SmsProvider {
  send(phone: string, otp: string): Promise<void>;
}

// Fast2SMS bulkV2 OTP route. Docs: https://docs.fast2sms.com
class Fast2SmsProvider implements SmsProvider {
  constructor(private readonly apiKey: string) {}

  async send(phone: string, otp: string): Promise<void> {
    const res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: {
        authorization: this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ route: 'otp', variables_values: otp, numbers: phone }),
    });
    if (!res.ok) {
      throw new Error(`Fast2SMS responded with status ${res.status}`);
    }
    const data = (await res.json()) as { return?: boolean; message?: string };
    if (data.return === false) {
      throw new Error(data.message || 'Fast2SMS rejected the send');
    }
  }
}

function getProvider(): SmsProvider | null {
  const provider = process.env.SMS_PROVIDER;
  const apiKey = process.env.SMS_API_KEY;
  if (provider === 'fast2sms') {
    if (apiKey) return new Fast2SmsProvider(apiKey);
    throw new Error('SMS_API_KEY is required when SMS_PROVIDER=fast2sms');
  }
  return null;
}

export async function deliverOtp(phone: string, otp: string): Promise<SmsResult> {
  // Non-production: echo the OTP for local/testing flows, no network involved.
  if (process.env.NODE_ENV !== 'production') {
    return { sent: true, otp };
  }

  let provider: SmsProvider | null;
  try {
    provider = getProvider();
  } catch (err) {
    return { sent: false, reason: err instanceof Error ? err.message : 'SMS provider misconfigured' };
  }

  if (!provider) {
    return { sent: false, reason: 'SMS_PROVIDER/SMS_API_KEY not configured' };
  }

  try {
    await provider.send(phone, otp);
    return { sent: true };
  } catch (err) {
    return { sent: false, reason: err instanceof Error ? err.message : 'SMS delivery failed' };
  }
}

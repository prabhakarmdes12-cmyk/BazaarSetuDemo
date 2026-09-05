import request from 'supertest';
import { app } from '../index';
import { deliverOtp } from '../lib/sms';
import { prisma } from '../lib/prisma';

// 10-digit Indian-format phone, unique per call.
const phone = () => `9${Math.floor(100000000 + Math.random() * 900000000)}`;

const ENV_KEYS = ['NODE_ENV', 'SMS_PROVIDER', 'SMS_API_KEY', 'SMS_SENDER_ID'];
const savedEnv: Record<string, string | undefined> = {};
for (const k of ENV_KEYS) savedEnv[k] = process.env[k];

const originalFetch = global.fetch;

function restoreEnv() {
  for (const k of ENV_KEYS) {
    if (savedEnv[k] === undefined) delete process.env[k];
    else process.env[k] = savedEnv[k];
  }
  global.fetch = originalFetch;
}

describe('SMS OTP delivery', () => {
  afterEach(restoreEnv);

  it('echoes the OTP in non-production environments without hitting the network', async () => {
    process.env.NODE_ENV = 'test';
    delete process.env.SMS_PROVIDER;
    const result = await deliverOtp(phone(), '123456');
    expect(result).toEqual({ sent: true, otp: '123456' });
  });

  it('fails closed in production when no provider is configured', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.SMS_PROVIDER;
    delete process.env.SMS_API_KEY;
    const result = await deliverOtp(phone(), '123456');
    expect(result.sent).toBe(false);
  });

  it('sends via Fast2SMS and never returns the OTP in production', async () => {
    process.env.NODE_ENV = 'production';
    process.env.SMS_PROVIDER = 'fast2sms';
    process.env.SMS_API_KEY = 'k_test';
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ return: true }),
    }) as unknown as typeof fetch;

    const result = await deliverOtp('9876543210', '654321');
    expect(result).toEqual({ sent: true });

    const fetchMock = global.fetch as jest.Mock;
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(String(url)).toContain('fast2sms.com');
    expect(init.headers).toMatchObject({ authorization: 'k_test' });
    const body = JSON.parse(String(init.body));
    expect(body.route).toBe('otp');
    expect(body.numbers).toBe('9876543210');
  });

  it('reports provider rejection in production without leaking the OTP', async () => {
    process.env.NODE_ENV = 'production';
    process.env.SMS_PROVIDER = 'fast2sms';
    process.env.SMS_API_KEY = 'k_test';
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ return: false, message: 'invalid key' }),
    }) as unknown as typeof fetch;

    const result = await deliverOtp('9876543210', '654321');
    expect(result.sent).toBe(false);
  });
});

describe('send-otp endpoint', () => {
  afterEach(restoreEnv);

  it('returns 503 without echoing the OTP in production without a provider', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.SMS_PROVIDER;
    delete process.env.SMS_API_KEY;

    const res = await request(app).post('/api/auth/send-otp').send({ phone: phone() });
    expect(res.status).toBe(503);
    expect(res.body.success).toBe(false);
    expect(res.body.otp).toBeUndefined();
  });

  it('returns 200 with no OTP in the body when the provider delivers in production', async () => {
    process.env.NODE_ENV = 'production';
    process.env.SMS_PROVIDER = 'fast2sms';
    process.env.SMS_API_KEY = 'k_test';
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ return: true }),
    }) as unknown as typeof fetch;

    const res = await request(app).post('/api/auth/send-otp').send({ phone: phone() });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.otp).toBeUndefined();
    expect(global.fetch as jest.Mock).toHaveBeenCalledTimes(1);
  });
});

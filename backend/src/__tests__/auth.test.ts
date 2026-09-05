import request from 'supertest';
import { app } from '../index';
import { prisma } from '../lib/prisma';

// 10-digit Indian-format phone, unique per call.
const phone = () => `9${Math.floor(100000000 + Math.random() * 900000000)}`;

describe('Auth flow', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('registers a customer with a token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ phone: phone(), name: 'Test Customer', role: 'customer', acceptPrivacy: true });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe('customer');
    expect(res.body.data.token).toBeTruthy();
  });

  it('rejects self-assigning the admin role (whitelist)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ phone: phone(), name: 'Hacker', role: 'admin', acceptPrivacy: true });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('rejects duplicate phone registration', async () => {
    const p = phone();
    await request(app).post('/api/auth/register').send({ phone: p, name: 'First', role: 'customer', acceptPrivacy: true });
    const res = await request(app).post('/api/auth/register').send({ phone: p, name: 'Second', role: 'customer', acceptPrivacy: true });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already exists/i);
  });

  it('creates a shop when a vendor registers', async () => {
    const p = phone();
    const res = await request(app)
      .post('/api/auth/register')
      .send({ phone: p, name: 'Vendor Ji', role: 'vendor', acceptPrivacy: true });

    expect(res.body.data.user.role).toBe('vendor');

    const shop = await prisma.shop.findFirst({ where: { ownerId: res.body.data.user.id } });
    expect(shop).not.toBeNull();
  });

  it('validates the send-otp / verify-otp login flow', async () => {
    const p = phone();
    await request(app).post('/api/auth/register').send({ phone: p, name: 'OTP User', role: 'customer', acceptPrivacy: true });

    const sent = await request(app).post('/api/auth/send-otp').send({ phone: p });
    expect(sent.status).toBe(200);
    expect(sent.body.otp).toBeTruthy();

    const wrong = await request(app).post('/api/auth/verify-otp').send({ phone: p, otp: '000000' });
    expect(wrong.status).toBe(400);

    const ok = await request(app).post('/api/auth/verify-otp').send({ phone: p, otp: sent.body.otp });
    expect(ok.status).toBe(200);
    expect(ok.body.data.token).toBeTruthy();
  });

  it('rejects verify-otp for an unregistered phone', async () => {
    const sent = await request(app).post('/api/auth/send-otp').send({ phone: phone() });
    const res = await request(app).post('/api/auth/verify-otp').send({ phone: sent.body.phone || '', otp: sent.body.otp || '' });
    // send-otp succeeds even for unknown phones; verify must fail
    expect([400, 404]).toContain(res.status);
  });

  it('requires auth on /me', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns the current user with a valid token', async () => {
    const p = phone();
    const reg = await request(app).post('/api/auth/register').send({ phone: p, name: 'Me User', role: 'customer', acceptPrivacy: true });

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${reg.body.data.token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.phone).toBe(p);
  });
});

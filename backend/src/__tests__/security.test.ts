import request from 'supertest';
import { app } from '../index';
import { prisma } from '../lib/prisma';

const phone = () => `9${Math.floor(100000000 + Math.random() * 900000000)}`;

async function register(role: 'customer' | 'vendor' = 'customer', name = 'Sec User') {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ phone: phone(), name, role, acceptPrivacy: true });
  return res.body.data.user.id as string;
}

describe('Security hardening', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('rejects unauthenticated requests on protected routes', async () => {
    const cases = [
      { method: 'post' as const, path: '/api/orders' },
      { method: 'post' as const, path: '/api/upload' },
      { method: 'post' as const, path: '/api/favorites/toggle' },
      { method: 'get' as const, path: '/api/notifications' },
      { method: 'get' as const, path: '/api/orders/my' },
    ];
    for (const { method, path } of cases) {
      const res = await request(app)[method](path).send({});
      expect(res.status).toBe(401);
    }
  });

  it('rejects adding a product to a different shop (cart IDOR)', async () => {
    const customerId = await register('customer');
    const vendorA = await register('vendor', 'Shop A');
    const vendorB = await register('vendor', 'Shop B');

    const shopA = await prisma.shop.findFirstOrThrow({ where: { ownerId: vendorA } });
    const shopB = await prisma.shop.findFirstOrThrow({ where: { ownerId: vendorB } });

    const product = await prisma.product.create({
      data: {
        shopId: shopA.id,
        name: 'Tata Salt',
        price: 28,
        unit: 'pack',
      },
    });

    const reg = await prisma.user.findUniqueOrThrow({ where: { id: customerId } });
    const sent = await request(app).post('/api/auth/send-otp').send({ phone: reg.phone });
    const verified = await request(app).post('/api/auth/verify-otp').send({ phone: reg.phone, otp: sent.body.otp });

    const res = await request(app)
      .post('/api/cart')
      .set('Authorization', `Bearer ${verified.body.data.token}`)
      .send({ shopId: shopB.id, productId: product.id, quantity: 1 });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/does not belong to this shop/i);
  });

  it('rejects uploads whose magic bytes do not match an image', async () => {
    const customerId = await register('customer');
    const user = await prisma.user.findUniqueOrThrow({ where: { id: customerId } });
    const sent = await request(app).post('/api/auth/send-otp').send({ phone: user.phone });
    const verified = await request(app).post('/api/auth/verify-otp').send({ phone: user.phone, otp: sent.body.otp });
    const token = verified.body.data.token;

    const fake = Buffer.from('this is definitely not an image').toString('base64');
    const bad = await request(app)
      .post('/api/upload')
      .set('Authorization', `Bearer ${token}`)
      .send({ image: fake });

    expect(bad.status).toBe(400);
    expect(bad.body.message).toMatch(/invalid image type/i);
  });

  it('accepts uploads with a genuine PNG signature', async () => {
    const customerId = await register('customer');
    const user = await prisma.user.findUniqueOrThrow({ where: { id: customerId } });
    const sent = await request(app).post('/api/auth/send-otp').send({ phone: user.phone });
    const verified = await request(app).post('/api/auth/verify-otp').send({ phone: user.phone, otp: sent.body.otp });
    const token = verified.body.data.token;

    const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]).toString('base64');
    const ok = await request(app)
      .post('/api/upload')
      .set('Authorization', `Bearer ${token}`)
      .send({ image: pngSignature });

    expect(ok.status).toBe(200);
    expect(ok.body.data.url).toMatch(/^\/uploads\/img_/);
  });
});

import crypto from 'crypto';
import request from 'supertest';
import { app } from '../index';
import { prisma } from '../lib/prisma';

jest.mock('../lib/razorpay', () => {
  const actual = jest.requireActual('../lib/razorpay');
  return {
    ...actual,
    isRazorpayConfigured: jest.fn(() => true),
    getRazorpayClient: jest.fn(() => ({
      paymentLink: {
        create: jest.fn(async (params: { amount: number }) => {
          const id = `plink_test_${Math.random().toString(36).slice(2, 10)}`;
          return { id, short_url: `https://rzp.io/l/${id}`, amount: params.amount };
        }),
      },
    })),
  };
});

const WEBHOOK_SECRET = 'test-webhook-secret';

const phone = () => `9${Math.floor(100000000 + Math.random() * 900000000)}`;

async function register(role: 'customer' | 'vendor' = 'customer', name = 'Rz User') {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ phone: phone(), name, role, acceptPrivacy: true });
  return { userId: res.body.data.user.id as string, token: res.body.data.token as string };
}

async function seedCredit(name: string) {
  const vendor = await register('vendor', name);
  const shop = await prisma.shop.findFirstOrThrow({ where: { ownerId: vendor.userId } });
  const customer = await register('customer', `${name} Customer`);
  await request(app)
    .post('/api/udhaar/entry')
    .set('Authorization', `Bearer ${vendor.token}`)
    .send({ customerId: customer.userId, shopId: shop.id, type: 'CREDIT', amount: 300, note: 'atta' });
  return { vendor, shop, customer };
}

describe('Razorpay gateway (udhaar pay links + webhook)', () => {
  beforeAll(() => {
    process.env.RAZORPAY_WEBHOOK_SECRET = WEBHOOK_SECRET;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  function sign(body: string) {
    return crypto.createHmac('sha256', WEBHOOK_SECRET).update(body).digest('hex');
  }

  it('creates a Razorpay payment link and a pending Payment row', async () => {
    const { vendor, customer } = await seedCredit('Link Shop');

    const res = await request(app)
      .post(`/api/udhaar/vendor/${customer.userId}/paylink`)
      .set('Authorization', `Bearer ${vendor.token}`)
      .send({});
    expect(res.status).toBe(200);
    expect(res.body.data.linkUrl).toMatch(/^https:\/\/rzp\.io\/l\//);
    expect(res.body.data.linkId).toMatch(/^plink_test_/);

    const payment = await prisma.payment.findUniqueOrThrow({ where: { id: res.body.data.paymentId } });
    expect(payment.status).toBe('pending');
    expect(payment.amount).toBe(300);
    expect(payment.method).toBe('upi');
    expect(payment.reference).toBe(res.body.data.linkId);
  });

  it('honours a partial amount capped at the outstanding balance', async () => {
    const { vendor, customer } = await seedCredit('Partial Shop');

    const res = await request(app)
      .post(`/api/udhaar/vendor/${customer.userId}/paylink`)
      .set('Authorization', `Bearer ${vendor.token}`)
      .send({ amount: 100 });
    expect(res.status).toBe(200);
    const payment = await prisma.payment.findUniqueOrThrow({ where: { id: res.body.data.paymentId } });
    expect(payment.amount).toBe(100);
  });

  it('rejects an unsigned or wrongly-signed webhook', async () => {
    const body = JSON.stringify({ event: 'payment_link.paid', payload: { payment_link: { entity: { id: 'plink_x' } } } });

    const unsigned = await request(app)
      .post('/api/webhooks/razorpay')
      .set('content-type', 'application/json')
      .send(body);
    expect(unsigned.status).toBe(401);

    const bad = await request(app)
      .post('/api/webhooks/razorpay')
      .set('content-type', 'application/json')
      .set('x-razorpay-signature', sign(body) + 'tampered')
      .send(body);
    expect(bad.status).toBe(401);
  });

  it('settles the ledger when the webhook reports the link paid', async () => {
    const { vendor, shop, customer } = await seedCredit('Settle Shop');

    const created = await request(app)
      .post(`/api/udhaar/vendor/${customer.userId}/paylink`)
      .set('Authorization', `Bearer ${vendor.token}`)
      .send({});
    const pending = await prisma.payment.findUniqueOrThrow({ where: { id: created.body.data.paymentId } });
    const linkId = pending.reference!;

    const body = JSON.stringify({
      event: 'payment_link.paid',
      payload: { payment_link: { entity: { id: linkId, amount: 30000, status: 'paid' } } },
    });
    const res = await request(app)
      .post('/api/webhooks/razorpay')
      .set('content-type', 'application/json')
      .set('x-razorpay-signature', sign(body))
      .send(body);
    expect(res.status).toBe(200);
    expect(res.body.received).toBe(300);

    const ledger = await prisma.udharLedger.findUniqueOrThrow({
      where: { customerId_shopId: { customerId: customer.userId, shopId: shop.id } },
    });
    expect(ledger.totalPaid).toBe(300);
    expect(ledger.totalDue - ledger.totalPaid).toBe(0);

    const payment = await prisma.payment.findUniqueOrThrow({ where: { id: pending.id } });
    expect(payment.status).toBe('paid');
  });

  it('is idempotent — replaying the webhook does not double-settle', async () => {
    const { vendor, shop, customer } = await seedCredit('Idem Shop');

    const created = await request(app)
      .post(`/api/udhaar/vendor/${customer.userId}/paylink`)
      .set('Authorization', `Bearer ${vendor.token}`)
      .send({});
    const pending = await prisma.payment.findUniqueOrThrow({ where: { id: created.body.data.paymentId } });
    const linkId = pending.reference!;

    const body = JSON.stringify({
      event: 'payment_link.paid',
      payload: { payment_link: { entity: { id: linkId, amount: 30000, status: 'paid' } } },
    });
    const opts = {
      method: 'post' as const,
      url: '/api/webhooks/razorpay',
      set: { 'content-type': 'application/json', 'x-razorpay-signature': sign(body) },
      send: body,
    };
    await request(app).post(opts.url).set(opts.set).send(opts.send);
    await request(app).post(opts.url).set(opts.set).send(opts.send);

    const ledger = await prisma.udharLedger.findUniqueOrThrow({
      where: { customerId_shopId: { customerId: customer.userId, shopId: shop.id } },
    });
    expect(ledger.totalPaid).toBe(300);
  });
});

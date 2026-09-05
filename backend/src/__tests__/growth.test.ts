import request from 'supertest';
import { app } from '../index';
import { prisma } from '../lib/prisma';

const phone = () => `9${Math.floor(100000000 + Math.random() * 900000000)}`;

async function register(role: 'customer' | 'vendor' = 'customer', name = 'Growth User', ref?: string) {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ phone: phone(), name, role, acceptPrivacy: true, ...(ref ? { ref } : {}) });
  return { userId: res.body.data.user.id as string, token: res.body.data.token as string, user: res.body.data.user };
}

async function otpToken(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const sent = await request(app).post('/api/auth/send-otp').send({ phone: user.phone });
  const verified = await request(app).post('/api/auth/verify-otp').send({ phone: user.phone, otp: sent.body.otp });
  return verified.body.data.token as string;
}

async function seedOrder() {
  const vendor = await register('vendor', 'Growth Shop');
  const shop = await prisma.shop.findFirstOrThrow({ where: { ownerId: vendor.userId } });
  const product = await prisma.product.create({
    data: { shopId: shop.id, name: 'Aashirvaad Atta', price: 245, unit: '5kg' },
  });
  const customer = await register('customer', 'Growth Customer');
  const token = await otpToken(customer.userId);

  await request(app)
    .post('/api/cart')
    .set('Authorization', `Bearer ${token}`)
    .send({ shopId: shop.id, productId: product.id, quantity: 1 });

  const orderRes = await request(app)
    .post('/api/orders')
    .set('Authorization', `Bearer ${token}`)
    .send({ shopId: shop.id });

  return { order: orderRes.body.data, shop, token };
}

describe('Growth features (guest browse, WhatsApp, referrals, udhaar)', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('allows guest browsing of shops and products without a token', async () => {
    const vendor = await register('vendor', 'Browse Shop');
    await prisma.shop.findFirstOrThrow({ where: { ownerId: vendor.userId } });

    const shops = await request(app).get('/api/shops');
    expect(shops.status).toBe(200);
    expect(shops.body.success).toBe(true);
    expect(shops.body.data.length).toBeGreaterThanOrEqual(1);

    const shopId = shops.body.data[0].id;
    const products = await request(app).get(`/api/shops/${shopId}/products`);
    expect(products.status).toBe(200);
    expect(products.body.success).toBe(true);
  });

  it('exposes status via publicToken but hides customer PII', async () => {
    const { order, shop } = await seedOrder();

    const pub = await request(app).get(`/api/orders/public/${order.publicToken}`);
    expect(pub.status).toBe(200);
    expect(pub.body.data.shopName).toBe(shop.name);
    expect(pub.body.data.status).toBe('pending');
    expect(pub.body.data.items.length).toBe(1);
    expect(JSON.stringify(pub.body.data)).not.toMatch(/customerId|customerName|customerPhone/);

    const authed = await request(app).get(`/api/orders/${order.orderId}`);
    expect(authed.status).toBe(401);
  });

  it('records a referral when a customer registers with a ref code', async () => {
    const referrer = await register('customer', 'Reffy');

    const newbie = await register('customer', 'Referred Pal', referrer.user.referralCode);
    expect(newbie.user.referralCode).toBeTruthy();

    const mine = await request(app)
      .get('/api/referrals/mine')
      .set('Authorization', `Bearer ${referrer.token}`);
    expect(mine.status).toBe(200);
    expect(mine.body.data.code).toBe(referrer.user.referralCode);
    expect(mine.body.data.joinedCount).toBe(1);
  });

  it('computes an udhaar vendor summary with outstanding + DSO', async () => {
    const vendor = await register('vendor', 'Ledger Shop');
    const shop = await prisma.shop.findFirstOrThrow({ where: { ownerId: vendor.userId } });
    const customer = await register('customer', 'Udhaar Customer');

    await request(app)
      .post('/api/udhaar/entry')
      .set('Authorization', `Bearer ${vendor.token}`)
      .send({ customerId: customer.userId, shopId: shop.id, type: 'CREDIT', amount: 500, note: 'atta' });

    const summary = await request(app)
      .get('/api/udhaar/vendor/summary')
      .set('Authorization', `Bearer ${vendor.token}`);
    expect(summary.status).toBe(200);
    expect(summary.body.data.outstanding).toBe(500);
    expect(summary.body.data.activeCustomerCount).toBe(1);
    expect(typeof summary.body.data.dsoDays).toBe('number');
  });

  it('throttles udhaar reminders to once per cooldown window', async () => {
    const vendor = await register('vendor', 'Remind Shop');
    const shop = await prisma.shop.findFirstOrThrow({ where: { ownerId: vendor.userId } });
    const customer = await register('customer', 'Remind Customer');

    await request(app)
      .post('/api/udhaar/entry')
      .set('Authorization', `Bearer ${vendor.token}`)
      .send({ customerId: customer.userId, shopId: shop.id, type: 'CREDIT', amount: 300, note: 'doodh' });

    const first = await request(app)
      .post(`/api/udhaar/vendor/${customer.userId}/remind`)
      .set('Authorization', `Bearer ${vendor.token}`);
    expect(first.status).toBe(200);
    expect(first.body.data.link).toMatch(/wa\.me\//);

    const second = await request(app)
      .post(`/api/udhaar/vendor/${customer.userId}/remind`)
      .set('Authorization', `Bearer ${vendor.token}`);
    expect(second.status).toBe(429);
  });

  it('sets a credit limit for a customer ledger', async () => {
    const vendor = await register('vendor', 'Limit Shop');
    const shop = await prisma.shop.findFirstOrThrow({ where: { ownerId: vendor.userId } });
    const customer = await register('customer', 'Limit Customer');

    const res = await request(app)
      .post(`/api/udhaar/vendor/${customer.userId}/limit`)
      .set('Authorization', `Bearer ${vendor.token}`)
      .send({ creditLimit: 2000 });
    expect(res.status).toBe(200);
    expect(res.body.data.creditLimit).toBe(2000);
  });

  it('records a payment against a ledger, posts a Payment row and refuses overpayment', async () => {
    const vendor = await register('vendor', 'Pay Shop');
    const shop = await prisma.shop.findFirstOrThrow({ where: { ownerId: vendor.userId } });
    const customer = await register('customer', 'Pay Customer');

    await request(app)
      .post('/api/udhaar/entry')
      .set('Authorization', `Bearer ${vendor.token}`)
      .send({ customerId: customer.userId, shopId: shop.id, type: 'CREDIT', amount: 500, note: 'atta' });

    const pay = await request(app)
      .post(`/api/udhaar/vendor/${customer.userId}/pay`)
      .set('Authorization', `Bearer ${vendor.token}`)
      .send({ amount: 300, method: 'upi' });
    expect(pay.status).toBe(200);
    expect(pay.body.data.paymentId).toBeTruthy();
    expect(pay.body.data.newBalance).toBe(200);

    const ledger = await prisma.udharLedger.findUniqueOrThrow({
      where: { customerId_shopId: { customerId: customer.userId, shopId: shop.id } },
    });
    const payments = await prisma.payment.findMany({ where: { ledgerId: ledger.id } });
    expect(payments.length).toBe(1);
    expect(payments[0].amount).toBe(300);
    expect(payments[0].method).toBe('upi');
    expect(ledger.totalPaid).toBe(300);

    const overpay = await request(app)
      .post(`/api/udhaar/vendor/${customer.userId}/pay`)
      .set('Authorization', `Bearer ${vendor.token}`)
      .send({ amount: 400, method: 'cash' });
    expect(overpay.status).toBe(400);

    const settle = await request(app)
      .post(`/api/udhaar/vendor/${customer.userId}/pay`)
      .set('Authorization', `Bearer ${vendor.token}`)
      .send({ amount: 200, method: 'cash' });
    expect(settle.status).toBe(200);
    expect(settle.body.data.newBalance).toBe(0);

    const none = await request(app)
      .post(`/api/udhaar/vendor/${customer.userId}/pay`)
      .set('Authorization', `Bearer ${vendor.token}`)
      .send({ amount: 100, method: 'cash' });
    expect(none.status).toBe(400);
  });

  it('exposes payments history with customer names and collection totals', async () => {
    const vendor = await register('vendor', 'History Shop');
    const shop = await prisma.shop.findFirstOrThrow({ where: { ownerId: vendor.userId } });
    const customer = await register('customer', 'History Customer');

    await request(app)
      .post('/api/udhaar/entry')
      .set('Authorization', `Bearer ${vendor.token}`)
      .send({ customerId: customer.userId, shopId: shop.id, type: 'CREDIT', amount: 700, note: 'atta' });

    await request(app)
      .post(`/api/udhaar/vendor/${customer.userId}/pay`)
      .set('Authorization', `Bearer ${vendor.token}`)
      .send({ amount: 400, method: 'upi' });

    const history = await request(app)
      .get('/api/udhaar/vendor/payments')
      .set('Authorization', `Bearer ${vendor.token}`);
    expect(history.status).toBe(200);
    expect(history.body.data.payments.length).toBe(1);
    expect(history.body.data.payments[0].customerName).toBe('History Customer');
    expect(history.body.data.payments[0].amount).toBe(400);
    expect(history.body.data.payments[0].method).toBe('upi');
    expect(history.body.data.total).toBe(1);
    expect(history.body.data.collectedToday).toBe(400);
    expect(history.body.data.totalCollected).toBe(400);

    const filtered = await request(app)
      .get(`/api/udhaar/vendor/payments?customerId=${customer.userId}`)
      .set('Authorization', `Bearer ${vendor.token}`);
    expect(filtered.body.data.payments.length).toBe(1);

    const other = await request(app)
      .get(`/api/udhaar/vendor/payments?customerId=${vendor.userId}`)
      .set('Authorization', `Bearer ${vendor.token}`);
    expect(other.body.data.payments.length).toBe(0);
  });

  it('refuses to create a pay link when Razorpay is not configured', async () => {
    const vendor = await register('vendor', 'NoRz Shop');
    const shop = await prisma.shop.findFirstOrThrow({ where: { ownerId: vendor.userId } });
    const customer = await register('customer', 'NoRz Customer');

    await request(app)
      .post('/api/udhaar/entry')
      .set('Authorization', `Bearer ${vendor.token}`)
      .send({ customerId: customer.userId, shopId: shop.id, type: 'CREDIT', amount: 100, note: 'atta' });

    const res = await request(app)
      .post(`/api/udhaar/vendor/${customer.userId}/paylink`)
      .set('Authorization', `Bearer ${vendor.token}`)
      .send({});
    expect(res.status).toBe(503);
  });
});

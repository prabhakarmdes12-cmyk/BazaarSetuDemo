import request from 'supertest';
import { app } from '../index';
import { prisma } from '../lib/prisma';

// End-to-end smoke of the core marketplace journey: register → browse →
// cart → order → fulfil → udhaar → payout dashboard → referral.
// Runs entirely against the real API + SQLite DB, no mocks.
const phone = () => `9${Math.floor(100000000 + Math.random() * 900000000)}`;

describe('E2E smoke — core marketplace journey', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('walks the full customer + vendor lifecycle', async () => {
    // 1. Vendor and customer register (with DPDP consent).
    const vreg = await request(app).post('/api/auth/register').send({
      phone: phone(),
      name: 'Smoke Dukaan',
      role: 'vendor',
      acceptPrivacy: true,
    });
    expect(vreg.status).toBe(200);
    const vendorToken = vreg.body.data.token as string;

    const creg = await request(app).post('/api/auth/register').send({
      phone: phone(),
      name: 'Smoke Customer',
      role: 'customer',
      acceptPrivacy: true,
    });
    expect(creg.status).toBe(200);
    const customerToken = creg.body.data.token as string;
    const customerId = creg.body.data.user.id as string;

    // 2. Vendor shop is auto-created; vendor adds a product.
    const shopRes = await request(app)
      .get('/api/shops/vendor/my-shop')
      .set('Authorization', `Bearer ${vendorToken}`);
    const shopId = shopRes.body.data.id as string;
    const prodRes = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({ name: 'Tata Salt', price: 25, unit: 'kg', category: 'Grocery' });
    expect(prodRes.status).toBe(200);
    const productId = prodRes.body.data.id as string;

    // 3. Browse as guest — shop and product are discoverable.
    const browse = await request(app).get('/api/shops');
    expect(browse.status).toBe(200);
    expect(browse.body.data.some((s: { id: string }) => s.id === shopId)).toBe(true);
    const guestProducts = await request(app).get(`/api/products/shop/${shopId}`);
    expect(guestProducts.body.data.some((p: { id: string }) => p.id === productId)).toBe(true);

    // 4. Cart and order.
    await request(app)
      .post('/api/cart')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ shopId, productId, quantity: 2 });
    const cartRes = await request(app)
      .get(`/api/cart/${shopId}`)
      .set('Authorization', `Bearer ${customerToken}`);
    expect(cartRes.body.data.items.length).toBe(1);

    const orderRes = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ shopId });
    expect(orderRes.status).toBe(200);
    const orderId = orderRes.body.data.orderId as string;
    expect(orderRes.body.data.status).toBe('pending');
    expect(orderRes.body.data.totalAmount).toBe(50);

    // 5. Vendor accepts and completes the order; customer sees the final state.
    await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({ status: 'accepted' })
      .expect(200);
    await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({ status: 'completed' })
      .expect(200);
    const orderDetail = await request(app)
      .get(`/api/orders/${orderId}`)
      .set('Authorization', `Bearer ${customerToken}`);
    expect(orderDetail.body.data.status).toBe('completed');
    expect(orderDetail.body.data.items[0].quantity).toBe(2);

    // 6. Udhaar: vendor credits the customer, customer sees the balance,
    //    vendor records a partial cash payment.
    const credit = await request(app)
      .post('/api/udhaar/entry')
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({ customerId, shopId, type: 'CREDIT', amount: 300, note: 'atta' });
    expect(credit.status).toBe(200);

    const ledgerRes = await request(app)
      .get(`/api/udhaar/${shopId}`)
      .set('Authorization', `Bearer ${customerToken}`);
    expect(ledgerRes.body.data.balance).toBe(300);

    const pay = await request(app)
      .post(`/api/udhaar/vendor/${customerId}/pay`)
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({ amount: 100, method: 'cash' });
    expect(pay.status).toBe(200);

    const vendorLedger = await request(app)
      .get(`/api/udhaar/vendor/${customerId}`)
      .set('Authorization', `Bearer ${vendorToken}`);
    expect(vendorLedger.body.data.totalDue).toBe(300);
    expect(vendorLedger.body.data.totalPaid).toBe(100);
    expect(vendorLedger.body.data.balance).toBe(200);

    // 7. Payout dashboard reflects collected money.
    const payoutRes = await request(app)
      .get('/api/vendor/payouts')
      .set('Authorization', `Bearer ${vendorToken}`);
    expect(payoutRes.status).toBe(200);
    expect(payoutRes.body.data.totalCollected).toBe(100);
    expect(payoutRes.body.data.availableForPayout).toBe(100);

    // 8. Referral: a second customer registers with the first customer's code.
    const refMine = await request(app)
      .get('/api/referrals/mine')
      .set('Authorization', `Bearer ${customerToken}`);
    const code = refMine.body.data.code as string;
    const referred = await request(app).post('/api/auth/register').send({
      phone: phone(),
      name: 'Referred Pal',
      role: 'customer',
      acceptPrivacy: true,
      ref: code,
    });
    expect(referred.status).toBe(200);
    const refStats = await request(app)
      .get('/api/referrals/mine')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(refStats.body.data.joinedCount).toBeGreaterThanOrEqual(1);
  });
});

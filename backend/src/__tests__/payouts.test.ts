import request from 'supertest';
import { app } from '../index';
import { prisma } from '../lib/prisma';
import { encryptSecret, decryptSecret, maskAccountNumber } from '../lib/encrypt';
import { isRazorpayXConfigured, createVendorPayout } from '../lib/razorpayX';

jest.mock('../lib/razorpayX', () => {
  const actual = jest.requireActual('../lib/razorpayX');
  return {
    ...actual,
    isRazorpayXConfigured: jest.fn(),
    createVendorPayout: jest.fn(),
  };
});

const phone = () => `9${Math.floor(100000000 + Math.random() * 900000000)}`;

async function register(role: 'customer' | 'vendor' = 'customer', name = 'Payout User') {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ phone: phone(), name, role, acceptPrivacy: true });
  return { userId: res.body.data.user.id as string, token: res.body.data.token as string };
}

async function seedVendor() {
  const vendor = await register('vendor', 'Payout Shop');
  const shop = await prisma.shop.findFirstOrThrow({ where: { ownerId: vendor.userId } });
  return { vendor, shop };
}

const bankPayload = {
  accountNumber: '9876543210',
  ifsc: 'SBIN0001234',
  bankName: 'State Bank of India',
  holderName: 'Ramesh Kumar',
};

describe('Encryption helpers', () => {
  it('round-trips and never stores the plaintext', () => {
    const enc = encryptSecret('9876543210');
    expect(enc).not.toContain('9876543210');
    expect(decryptSecret(enc)).toBe('9876543210');
    expect(maskAccountNumber('9876543210')).toBe('••••3210');
    expect(maskAccountNumber('12')).toBe('••••');
  });

  it('produces a different ciphertext each time (random IV)', () => {
    expect(encryptSecret('12345')).not.toBe(encryptSecret('12345'));
  });
});

describe('Vendor payouts', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('links a bank account and stores it encrypted', async () => {
    const { vendor } = await seedVendor();

    const res = await request(app)
      .post('/api/vendor/payouts/link-bank')
      .set('Authorization', `Bearer ${vendor.token}`)
      .send(bankPayload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.masked).toBe('••••3210');
    expect(res.body.data.isPrimary).toBe(true);

    const stored = await prisma.bankAccount.findFirstOrThrow({ where: { vendorId: vendor.userId } });
    expect(stored.accountNumber).not.toContain('9876543210');
    expect(decryptSecret(stored.accountNumber)).toBe('9876543210');
  });

  it('dedupes re-linking the same account', async () => {
    const { vendor } = await seedVendor();
    const auth = { Authorization: `Bearer ${vendor.token}` };

    await request(app).post('/api/vendor/payouts/link-bank').set(auth).send(bankPayload);
    await request(app).post('/api/vendor/payouts/link-bank').set(auth).send(bankPayload);

    const count = await prisma.bankAccount.count({ where: { vendorId: vendor.userId } });
    expect(count).toBe(1);
  });

  it('rejects invalid IFSC and account numbers', async () => {
    const { vendor } = await seedVendor();
    const bad = { ...bankPayload, ifsc: 'INVALID', accountNumber: '123' };
    const res = await request(app)
      .post('/api/vendor/payouts/link-bank')
      .set('Authorization', `Bearer ${vendor.token}`)
      .send(bad);
    expect(res.status).toBe(400);
  });

  it('only lets vendors use the payouts endpoints', async () => {
    const customer = await register('customer');
    const res = await request(app)
      .post('/api/vendor/payouts/link-bank')
      .set('Authorization', `Bearer ${customer.token}`)
      .send(bankPayload);
    expect(res.status).toBe(403);
  });

  it('shows real collected earnings and masked banks on the dashboard', async () => {
    const { vendor, shop } = await seedVendor();
    const auth = { Authorization: `Bearer ${vendor.token}` };

    const customer = await register('customer', 'Payout Customer');
    await request(app)
      .post('/api/udhaar/entry')
      .set(auth)
      .send({ customerId: customer.userId, shopId: shop.id, type: 'CREDIT', amount: 500, note: 'kirana' });
    await request(app)
      .post(`/api/udhaar/vendor/${customer.userId}/pay`)
      .set(auth)
      .send({ amount: 200, method: 'cash' });
    await request(app).post('/api/vendor/payouts/link-bank').set(auth).send(bankPayload);

    const res = await request(app).get('/api/vendor/payouts').set(auth);
    expect(res.status).toBe(200);
    expect(res.body.data.totalCollected).toBe(200);
    expect(res.body.data.availableForPayout).toBe(200);
    expect(res.body.data.banks).toHaveLength(1);
    expect(res.body.data.banks[0].masked).toBe('••••3210');
    expect(res.body.data.banks[0].accountNumber).toBeUndefined();
    expect(res.body.data.recentPayouts).toHaveLength(0);
  });

  it('returns 503 for a payout request when settlement is not configured', async () => {
    (isRazorpayXConfigured as jest.Mock).mockReturnValue(false);
    const { vendor } = await seedVendor();
    const auth = { Authorization: `Bearer ${vendor.token}` };

    const link = await request(app).post('/api/vendor/payouts/link-bank').set(auth).send(bankPayload);

    const res = await request(app)
      .post('/api/vendor/payouts/request')
      .set(auth)
      .send({ amount: 100, bankAccountId: link.body.data.bankAccountId });
    expect(res.status).toBe(503);
  });

  it('rejects a payout larger than the available balance', async () => {
    (isRazorpayXConfigured as jest.Mock).mockReturnValue(true);
    const { vendor } = await seedVendor();
    const auth = { Authorization: `Bearer ${vendor.token}` };

    const link = await request(app).post('/api/vendor/payouts/link-bank').set(auth).send(bankPayload);
    const res = await request(app)
      .post('/api/vendor/payouts/request')
      .set(auth)
      .send({ amount: 500, bankAccountId: link.body.data.bankAccountId });
    expect(res.status).toBe(400);
    expect(res.body.availableForPayout).toBe(0);
  });

  it('initiates a RazorpayX transfer and records the payout', async () => {
    (isRazorpayXConfigured as jest.Mock).mockReturnValue(true);
    (createVendorPayout as jest.Mock).mockResolvedValue({ id: 'pout_test_1', status: 'created' });

    const { vendor, shop } = await seedVendor();
    const auth = { Authorization: `Bearer ${vendor.token}` };

    const customer = await register('customer', 'Payout Payee');
    await request(app)
      .post('/api/udhaar/entry')
      .set(auth)
      .send({ customerId: customer.userId, shopId: shop.id, type: 'CREDIT', amount: 1000, note: 'ration' });
    await request(app)
      .post(`/api/udhaar/vendor/${customer.userId}/pay`)
      .set(auth)
      .send({ amount: 600, method: 'upi' });

    const link = await request(app).post('/api/vendor/payouts/link-bank').set(auth).send(bankPayload);
    const res = await request(app)
      .post('/api/vendor/payouts/request')
      .set(auth)
      .send({ amount: 250, bankAccountId: link.body.data.bankAccountId });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('processing');
    expect(res.body.data.gatewayReference).toBe('pout_test_1');

    expect(createVendorPayout).toHaveBeenCalledTimes(1);
    const gatewayInput = (createVendorPayout as jest.Mock).mock.calls[0][0];
    expect(gatewayInput.accountNumber).toBe('9876543210');
    expect(gatewayInput.referenceId).toBe(res.body.data.payoutId);
    expect(gatewayInput.amount).toBe(250);

    const payout = await prisma.payout.findFirstOrThrow({ where: { id: res.body.data.payoutId } });
    expect(payout.status).toBe('processing');

    const dash = await request(app).get('/api/vendor/payouts').set(auth);
    expect(dash.body.data.paidOut).toBe(250);
    expect(dash.body.data.availableForPayout).toBe(350);
    expect(dash.body.data.recentPayouts[0].status).toBe('processing');

    const history = await request(app).get('/api/vendor/payouts/history').set(auth);
    expect(history.body.data.total).toBe(1);
    expect(history.body.data.payouts[0].amount).toBe(250);
  });

  it('marks the payout failed when the gateway rejects it', async () => {
    (isRazorpayXConfigured as jest.Mock).mockReturnValue(true);
    (createVendorPayout as jest.Mock).mockRejectedValue(new Error('insufficient funds'));

    const { vendor, shop } = await seedVendor();
    const auth = { Authorization: `Bearer ${vendor.token}` };

    const customer = await register('customer', 'Payout Fail');
    await request(app)
      .post('/api/udhaar/entry')
      .set(auth)
      .send({ customerId: customer.userId, shopId: shop.id, type: 'CREDIT', amount: 500, note: 'grocery' });
    await request(app)
      .post(`/api/udhaar/vendor/${customer.userId}/pay`)
      .set(auth)
      .send({ amount: 500, method: 'cash' });

    const link = await request(app).post('/api/vendor/payouts/link-bank').set(auth).send(bankPayload);
    const res = await request(app)
      .post('/api/vendor/payouts/request')
      .set(auth)
      .send({ amount: 500, bankAccountId: link.body.data.bankAccountId });

    expect(res.status).toBe(502);
    const payout = await prisma.payout.findFirstOrThrow({ where: { vendorId: vendor.userId } });
    expect(payout.status).toBe('failed');
  });
});

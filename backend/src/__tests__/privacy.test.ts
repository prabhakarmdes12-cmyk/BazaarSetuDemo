import request from 'supertest';
import { app } from '../index';
import { prisma } from '../lib/prisma';

// 10-digit Indian-format phone, unique per call.
const phone = () => `9${Math.floor(100000000 + Math.random() * 900000000)}`;

async function register(role: 'customer' | 'vendor' = 'customer', name = 'Privacy User', ref?: string) {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ phone: phone(), name, role, acceptPrivacy: true, ...(ref ? { ref } : {}) });
  return {
    userId: res.body.data.user.id as string,
    token: res.body.data.token as string,
    user: res.body.data.user,
  };
}

describe('DPDP privacy & data erasure', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('rejects registration without explicit privacy consent', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ phone: phone(), name: 'No Consent', role: 'customer' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('rejects a non-literal (false) consent value', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ phone: phone(), name: 'No Consent', role: 'customer', acceptPrivacy: false });
    expect(res.status).toBe(400);
  });

  it('records the consent timestamp at signup', async () => {
    const { userId } = await register('customer', 'Consent User');
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    expect(user.privacyAcceptedAt).toBeInstanceOf(Date);
  });

  it('requires authentication to delete an account', async () => {
    const res = await request(app).delete('/api/auth/account');
    expect(res.status).toBe(401);
  });

  it('erases a customer account and every trace of their data', async () => {
    const vendor = await register('vendor', 'Erase Shop');
    const shop = await prisma.shop.findFirstOrThrow({ where: { ownerId: vendor.userId } });
    const product = await prisma.product.create({
      data: { shopId: shop.id, name: 'Sugar', price: 45, unit: 'kg' },
    });

    const { userId, token } = await register('customer', 'Erase Customer');

    // Exercise each customer-owned relation through the real API surface.
    await request(app)
      .post('/api/cart')
      .set('Authorization', `Bearer ${token}`)
      .send({ shopId: shop.id, productId: product.id, quantity: 2 });
    const orderRes = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ shopId: shop.id });
    const orderId = orderRes.body.data.orderId as string;
    await request(app)
      .post('/api/favorites/toggle')
      .set('Authorization', `Bearer ${token}`)
      .send({ shopId: shop.id });
    await request(app)
      .post('/api/udhaar/entry')
      .set('Authorization', `Bearer ${vendor.token}`)
      .send({ customerId: userId, shopId: shop.id, type: 'CREDIT', amount: 100, note: 'chai' });
    await request(app)
      .post('/api/chats')
      .set('Authorization', `Bearer ${token}`)
      .send({ shopId: shop.id });

    // Messages + read receipts (created via the chat the customer just opened).
    const chat = await prisma.chat.findFirstOrThrow({ where: { customerId: userId } });
    const msg = await prisma.message.create({
      data: { chatId: chat.id, senderId: userId, senderRole: 'customer', type: 'TEXT', content: 'namaste' },
    });
    const readReceipt = await prisma.messageRead.create({ data: { userId, messageId: msg.id } });
    await prisma.notification.create({
      data: { userId, type: 'ORDER', title: 'Order update', body: 'test' },
    });

    const del = await request(app)
      .delete('/api/auth/account')
      .set('Authorization', `Bearer ${token}`);
    expect(del.status).toBe(200);
    expect(del.body.success).toBe(true);

    expect(await prisma.user.findUnique({ where: { id: userId } })).toBeNull();
    expect(await prisma.cart.findFirst({ where: { customerId: userId } })).toBeNull();
    expect(await prisma.cartItem.findFirst({ where: { cart: { customerId: userId } } })).toBeNull();
    expect(await prisma.order.findUnique({ where: { id: orderId } })).toBeNull();
    expect(await prisma.orderItem.findFirst({ where: { orderId } })).toBeNull();
    expect(await prisma.favoriteShop.findFirst({ where: { userId } })).toBeNull();
    expect(await prisma.udharLedger.findFirst({ where: { customerId: userId } })).toBeNull();
    expect(await prisma.udharEntry.findFirst({ where: { ledger: { customerId: userId } } })).toBeNull();
    expect(await prisma.chat.findFirst({ where: { customerId: userId } })).toBeNull();
    expect(await prisma.message.findUnique({ where: { id: msg.id } })).toBeNull();
    expect(await prisma.messageRead.findUnique({ where: { id: readReceipt.id } })).toBeNull();
    expect(await prisma.notification.findFirst({ where: { userId } })).toBeNull();

    // The vendor, their shop and the product survive — their data isn't ours to erase.
    expect(await prisma.user.findUnique({ where: { id: vendor.userId } })).not.toBeNull();
    expect(await prisma.shop.findUnique({ where: { id: shop.id } })).not.toBeNull();
    expect(await prisma.product.findUnique({ where: { id: product.id } })).not.toBeNull();
  });

  it('erases a vendor account, shop, products and bank accounts', async () => {
    const { userId, token } = await register('vendor', 'Erase Vendor');
    const shop = await prisma.shop.findFirstOrThrow({ where: { ownerId: userId } });

    await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Atta', price: 245, unit: '5kg' });
    await request(app)
      .post('/api/vendor/payouts/link-bank')
      .set('Authorization', `Bearer ${token}`)
      .send({
        accountNumber: '1111222233',
        ifsc: 'SBIN0001234',
        bankName: 'State Bank of India',
        holderName: 'Erase Vendor',
      });

    const del = await request(app)
      .delete('/api/auth/account')
      .set('Authorization', `Bearer ${token}`);
    expect(del.status).toBe(200);

    expect(await prisma.user.findUnique({ where: { id: userId } })).toBeNull();
    expect(await prisma.shop.findFirst({ where: { ownerId: userId } })).toBeNull();
    expect(await prisma.product.findFirst({ where: { shopId: shop.id } })).toBeNull();
    expect(await prisma.bankAccount.findFirst({ where: { vendorId: userId } })).toBeNull();
  });

  it('anonymises referral rows that hold the deleted user as PII', async () => {
    const referrer = await register('customer', 'Reffy');
    const newbie = await register('customer', 'Referred', referrer.user.referralCode);

    const before = await prisma.referral.findUnique({
      where: {
        referrerId_referredPhone: { referrerId: referrer.userId, referredPhone: newbie.user.phone },
      },
    });
    expect(before?.status).toBe('joined');

    await request(app)
      .delete('/api/auth/account')
      .set('Authorization', `Bearer ${newbie.token}`);

    const after = await prisma.referral.findFirst({ where: { referrerId: referrer.userId } });
    expect(after).not.toBeNull();
    expect(after!.referredPhone).not.toBe(newbie.user.phone);
    expect(after!.referredName).toBe('Deleted User');
    expect(await prisma.user.findUnique({ where: { id: newbie.userId } })).toBeNull();
    expect(await prisma.user.findUnique({ where: { id: referrer.userId } })).not.toBeNull();
  });
});

import request from 'supertest';
import { app } from '../index';
import { prisma } from '../lib/prisma';
import { generateToken } from '../middleware/auth';
import { runMerchantSlaSweep } from '../services/slaService';

const phone = () => `7${Math.floor(100000000 + Math.random() * 900000000)}`;

async function createPilotContext() {
  const vendorReg = await request(app).post('/api/auth/register').send({
    phone: phone(),
    name: 'Voice Gupta Ji',
    role: 'vendor',
    acceptPrivacy: true,
  });
  expect(vendorReg.status).toBe(200);
  const vendorToken = vendorReg.body.data.token as string;

  const customerReg = await request(app).post('/api/auth/register').send({
    phone: phone(),
    name: 'Voice Rahul',
    role: 'customer',
    acceptPrivacy: true,
  });
  expect(customerReg.status).toBe(200);
  const customerToken = customerReg.body.data.token as string;
  const customerId = customerReg.body.data.user.id as string;

  const shopRes = await request(app)
    .get('/api/shops/vendor/my-shop')
    .set('Authorization', `Bearer ${vendorToken}`);
  expect(shopRes.status).toBe(200);
  const shopId = shopRes.body.data.id as string;

  await request(app)
    .post('/api/products')
    .set('Authorization', `Bearer ${vendorToken}`)
    .send({ name: 'Aashirvaad Atta', price: 44, unit: 'kg', category: 'Grains' })
    .expect(200);

  const chatRes = await request(app)
    .post('/api/chats')
    .set('Authorization', `Bearer ${customerToken}`)
    .send({ shopId });
  expect(chatRes.status).toBe(200);
  const chatId = chatRes.body.data.chatId as string;

  return { vendorToken, customerToken, customerId, shopId, chatId };
}

async function createAdminToken() {
  const admin = await prisma.user.create({
    data: { phone: phone(), name: 'Chiti Operator', role: 'admin', privacyAcceptedAt: new Date() },
  });
  return generateToken(admin.id, 'admin');
}

describe('Pilot voice order and Chiti Console radar', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('uploads a voice order, mock-transcribes it, persists audioUrl, and creates a basket proposal', async () => {
    const ctx = await createPilotContext();

    const res = await request(app)
      .post('/api/shop-bot/voice-order')
      .set('Authorization', `Bearer ${ctx.customerToken}`)
      .field('customerId', ctx.customerId)
      .field('shopId', ctx.shopId)
      .field('conversationId', ctx.chatId)
      .field('locale', 'hinglish')
      .field('mockTranscript', '2kg atta aur ek accha hair oil')
      .attach('audio', Buffer.from('fake-webm-audio'), { filename: 'rahul-order.webm', contentType: 'audio/webm' });

    expect(res.status).toBe(200);
    expect(res.body.data.transcript).toBe('2kg atta aur ek accha hair oil');
    expect(res.body.data.audioUrl).toMatch(/\/uploads\/voice-orders\//);
    expect(res.body.data.items.some((item: { requestedName: string }) => /atta/i.test(item.requestedName))).toBe(true);
    expect(res.body.data.items.some((item: { requestedName: string; availabilityStatus: string }) => /hair oil/i.test(item.requestedName) && item.availabilityStatus === 'NEEDS_MERCHANT_CHECK')).toBe(true);

    const voiceMessage = await prisma.message.findFirst({ where: { chatId: ctx.chatId, type: 'VOICE_ORDER' } });
    expect(voiceMessage).toBeTruthy();
    const voicePayload = JSON.parse(voiceMessage!.productData || '{}');
    expect(voicePayload.audioUrl).toBe(res.body.data.audioUrl);

    const proposal = await prisma.message.findFirst({ where: { chatId: ctx.chatId, type: 'BAZAAR.BASKET_PROPOSAL' } });
    expect(proposal).toBeTruthy();
  });

  it('returns a Paaska Sahayak parchi basket resolved against the shop catalog', async () => {
    const ctx = await createPilotContext();

    const res = await request(app)
      .post('/api/shop-bot/voice-order')
      .set('Authorization', `Bearer ${ctx.customerToken}`)
      .field('customerId', ctx.customerId)
      .field('shopId', ctx.shopId)
      .field('conversationId', ctx.chatId)
      .field('locale', 'hinglish')
      .field('mockTranscript', 'Bhaiya do kilo Aashirvaad atta aur special bakery biscuit bhej dena')
      .attach('audio', Buffer.from('fake-webm-audio'), { filename: 'parchi.webm', contentType: 'audio/webm' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.detectedLanguage).toBe('hinglish');
    expect(typeof res.body.data.transcript).toBe('string');

    const basket = res.body.data.basket;
    expect(basket).toBeTruthy();
    expect(Array.isArray(basket.items)).toBe(true);
    expect(basket.estimatedDeliveryMinutes).toBeGreaterThan(0);

    // The atta SKU exists in this shop's catalog, so it must resolve to a real
    // product id with a price the review sheet can render.
    const atta = basket.items.find((item: { productName: string }) => /atta/i.test(item.productName));
    expect(atta).toBeTruthy();
    expect(atta.productId).toBeTruthy();
    expect(atta.quantity).toBe(2);
    expect(atta.unit).toBeTruthy();
    expect(atta.price).toBeGreaterThan(0);
    expect(atta.matchConfidence).toBeGreaterThan(0);

    // Unresolvable free-text stays in unmatchedItems instead of inventing a SKU.
    expect(basket.unmatchedItems.some((name: string) => /biscuit/i.test(name))).toBe(true);

    // Subtotal is the sum of matched line totals only.
    const expectedSubtotal = Number(
      basket.items
        .reduce((sum: number, item: { price: number; quantity: number }) => sum + item.price * item.quantity, 0)
        .toFixed(2),
    );
    expect(basket.subtotal).toBe(expectedSubtotal);
  });

  it('parses Hindi pack quantities and rupee pack-size hints from speech', async () => {
    const ctx = await createPilotContext();

    const res = await request(app)
      .post('/api/shop-bot/voice-order')
      .set('Authorization', `Bearer ${ctx.customerToken}`)
      .field('customerId', ctx.customerId)
      .field('shopId', ctx.shopId)
      .field('conversationId', ctx.chatId)
      .field('locale', 'hinglish')
      .field('mockTranscript', 'aadha kilo atta aur das rupaye wali maggi')
      .attach('audio', Buffer.from('fake-webm-audio'), { filename: 'hinglish.webm', contentType: 'audio/webm' });

    expect(res.status).toBe(200);

    const atta = res.body.data.items.find((item: { requestedName: string }) => /atta/i.test(item.requestedName));
    expect(atta).toBeTruthy();
    expect(atta.quantity).toBe(0.5);
    expect(atta.unit).toBe('kg');

    // "das rupaye wali" is a ₹10 pack-size hint, never a quantity of ten.
    const maggi = res.body.data.items.find((item: { requestedName: string }) => /maggi/i.test(item.requestedName));
    expect(maggi).toBeTruthy();
    expect(maggi.quantity).toBe(1);
  });

  it('never exposes customer or vendor phone numbers in the voice-order payload (VOICE_INV_007)', async () => {
    const vendorPhone = phone();
    const customerPhone = phone();

    const vendorReg = await request(app).post('/api/auth/register').send({
      phone: vendorPhone, name: 'Privacy Gupta Ji', role: 'vendor', acceptPrivacy: true,
    });
    const vendorToken = vendorReg.body.data.token as string;
    const customerReg = await request(app).post('/api/auth/register').send({
      phone: customerPhone, name: 'Privacy Rahul', role: 'customer', acceptPrivacy: true,
    });
    const customerToken = customerReg.body.data.token as string;
    const customerId = customerReg.body.data.user.id as string;

    const shopRes = await request(app).get('/api/shops/vendor/my-shop').set('Authorization', `Bearer ${vendorToken}`);
    const shopId = shopRes.body.data.id as string;
    const chatRes = await request(app).post('/api/chats').set('Authorization', `Bearer ${customerToken}`).send({ shopId });
    const chatId = chatRes.body.data.chatId as string;

    const res = await request(app)
      .post('/api/shop-bot/voice-order')
      .set('Authorization', `Bearer ${customerToken}`)
      .field('customerId', customerId)
      .field('shopId', shopId)
      .field('conversationId', chatId)
      .field('mockTranscript', '1 kg atta')
      .attach('audio', Buffer.from('fake-webm-audio'), { filename: 'privacy.webm', contentType: 'audio/webm' });

    expect(res.status).toBe(200);
    const serialized = JSON.stringify(res.body.data.basket);
    expect(serialized).not.toContain(customerPhone);
    expect(serialized).not.toContain(vendorPhone);
  });

  it('fires SLA reminder and delayed events, then marks stale merchant requests for operator assist', async () => {
    const ctx = await createPilotContext();
    const parse = await request(app)
      .post('/api/shop-bot/parse')
      .set('Authorization', `Bearer ${ctx.customerToken}`)
      .send({ customerId: ctx.customerId, shopId: ctx.shopId, conversationId: ctx.chatId, message: '2kg atta', locale: 'hinglish' })
      .expect(200);
    const draftId = parse.body.data.draftId as string;

    await request(app)
      .post(`/api/basket/draft/${draftId}/confirm`)
      .set('Authorization', `Bearer ${ctx.customerToken}`)
      .send({})
      .expect(200);

    const staleTime = new Date(Date.now() - 4 * 60 * 1000);
    await prisma.conversationDraft.update({ where: { id: draftId }, data: { status: 'SENT_TO_MERCHANT', updatedAt: staleTime } });

    const sweep = await runMerchantSlaSweep(undefined, new Date());
    expect(sweep.emitted.map((event: any) => event.eventType)).toEqual(expect.arrayContaining([
      'BAZAAR.MERCHANT_REMINDER',
      'BAZAAR.MERCHANT_RESPONSE_DELAYED',
    ]));

    const delayedEvent = await prisma.operationalEventLog.findFirst({
      where: { eventType: 'BAZAAR.MERCHANT_RESPONSE_DELAYED', conversationId: ctx.chatId },
    });
    expect(delayedEvent).toBeTruthy();

    const draft = await prisma.conversationDraft.findUnique({ where: { id: draftId } });
    expect(draft?.status).toBe('NEEDS_OPERATOR_ASSIST');
  });

  it('returns active marketplace requests through the Chiti Console radar feed', async () => {
    const ctx = await createPilotContext();
    const adminToken = await createAdminToken();

    const parse = await request(app)
      .post('/api/shop-bot/parse')
      .set('Authorization', `Bearer ${ctx.customerToken}`)
      .send({ customerId: ctx.customerId, shopId: ctx.shopId, conversationId: ctx.chatId, message: '2kg atta', locale: 'hinglish' })
      .expect(200);
    const draftId = parse.body.data.draftId as string;
    await prisma.conversationDraft.update({ where: { id: draftId }, data: { status: 'SENT_TO_MERCHANT' } });

    const radar = await request(app)
      .get('/api/admin/radar/active-requests')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(radar.status).toBe(200);
    expect(radar.body.data.ACTIVE_REQUESTS.some((row: { draftId?: string }) => row.draftId === draftId)).toBe(true);
    expect(radar.body.data.WAITING_MERCHANT.some((row: { draftId?: string; shopName?: string; customerPhone?: string }) => (
      row.draftId === draftId && !!row.shopName && !!row.customerPhone
    ))).toBe(true);

    const escalation = await request(app)
      .post(`/api/admin/radar/${draftId}/escalate`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ action: 'CALL_SHOP', note: 'Please respond to the customer request.' });
    expect(escalation.status).toBe(200);
    expect(escalation.body.data.status).toBe('NEEDS_OPERATOR_ASSIST');
  });
});

import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { app } from '../index';
import { prisma } from '../lib/prisma';

const phone = () => `8${Math.floor(100000000 + Math.random() * 900000000)}`;

describe('Pilot conversational commerce journey', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('persists Shop Bot draft state, merchant substitution, Chitigram events, checkout and restart recovery', async () => {
    const vendorReg = await request(app).post('/api/auth/register').send({
      phone: phone(),
      name: 'Gupta Ji',
      role: 'vendor',
      acceptPrivacy: true,
    });
    expect(vendorReg.status).toBe(200);
    const vendorToken = vendorReg.body.data.token as string;

    const customerReg = await request(app).post('/api/auth/register').send({
      phone: phone(),
      name: 'Rahul',
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
    await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({ name: 'Surf Excel Detergent', price: 99, unit: 'packet', category: 'Household' })
      .expect(200);
    await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({ name: 'Ariel Detergent', price: 110, unit: 'packet', category: 'Household' })
      .expect(200);

    const chatRes = await request(app)
      .post('/api/chats')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ shopId });
    expect(chatRes.status).toBe(200);
    const chatId = chatRes.body.data.chatId as string;

    const firstParse = await request(app)
      .post('/api/shop-bot/parse')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        customerId,
        shopId,
        conversationId: chatId,
        message: '2kg atta, 1 Surf packet aur ek accha hair oil',
        locale: 'hinglish',
      });
    expect(firstParse.status).toBe(200);
    expect(firstParse.body.data.intent).toBe('ADD_ITEM');
    expect(firstParse.body.data.items).toHaveLength(3);
    expect(firstParse.body.data.items.find((item: { requestedName: string }) => /atta/i.test(item.requestedName)).matchedProductId).toBeTruthy();
    expect(firstParse.body.data.items.find((item: { requestedName: string }) => /hair oil/i.test(item.requestedName)).availabilityStatus).toBe('NEEDS_MERCHANT_CHECK');
    const draftId = firstParse.body.data.draftId as string;

    const changeBrand = await request(app)
      .post('/api/shop-bot/parse')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ customerId, shopId, conversationId: chatId, message: 'Surf nahi Ariel kar do', locale: 'hinglish' });
    expect(changeBrand.status).toBe(200);
    expect(changeBrand.body.data.intent).toBe('CHANGE_BRAND');
    const changedNames = changeBrand.body.data.items.map((item: { requestedName: string }) => item.requestedName.toLowerCase());
    expect(changedNames.some((name: string) => name.includes('surf'))).toBe(false);
    expect(changedNames.some((name: string) => name.includes('ariel'))).toBe(true);

    await request(app)
      .post(`/api/basket/draft/${draftId}/confirm`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({})
      .expect(200);

    const cardRes = await request(app)
      .get(`/api/basket/draft/${chatId}`)
      .set('Authorization', `Bearer ${vendorToken}`);
    expect(cardRes.status).toBe(200);
    expect(cardRes.body.data.requestCard.items).toHaveLength(3);
    const hairOil = cardRes.body.data.requestCard.items.find((item: { requestedName: string }) => /hair oil/i.test(item.requestedName));
    expect(hairOil.availabilityStatus).toBe('NEEDS_MERCHANT_CHECK');

    const adjustmentRes = await request(app)
      .post(`/api/basket/draft/${draftId}/adjustments`)
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({
        itemId: hairOil.id,
        type: 'SUBSTITUTION',
        originalText: 'Hair Oil',
        proposedName: 'Parachute 500ml',
        proposedQuantity: 1,
        proposedPrice: 210,
        reason: 'Hair Oil unavailable',
      });
    expect(adjustmentRes.status).toBe(200);
    const adjustmentId = adjustmentRes.body.data.adjustments[0].id as string;

    const approval = await request(app)
      .post(`/api/basket/adjustments/${adjustmentId}/respond`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ action: 'ACCEPT_SUBSTITUTION' });
    expect(approval.status).toBe(200);
    expect(approval.body.data.draft.items.find((item: { requestedName: string }) => /parachute/i.test(item.requestedName))).toBeTruthy();

    const quote = await request(app)
      .post(`/api/basket/draft/${draftId}/final-quote`)
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({ subtotal: 408, deliveryFee: 20, finalTotal: 428 });
    expect(quote.status).toBe(200);
    expect(quote.body.data.quote.finalTotal).toBe(428);

    const checkout = await request(app)
      .post(`/api/basket/draft/${draftId}/checkout`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ paymentMethod: 'COD' });
    expect(checkout.status).toBe(200);
    expect(checkout.body.data.order.status).toBe('pending');
    expect(checkout.body.data.order.totalAmount).toBe(428);
    const orderId = checkout.body.data.order.id as string;

    const callRecord = await request(app)
      .post('/api/chitigram/call-record')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ conversationId: chatId, callId: 'call_pilot_1', duration: 42, status: 'COMPLETED' });
    expect(callRecord.status).toBe(200);

    for (const status of ['accepted', 'preparing', 'ready', 'completed']) {
      await request(app)
        .patch(`/api/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${vendorToken}`)
        .send({ status })
        .expect(200);
    }

    const eventTypes = (await prisma.operationalEventLog.findMany({
      where: { conversationId: chatId },
      orderBy: { occurredAt: 'asc' },
    })).map((event) => event.eventType);
    expect(eventTypes).toEqual(expect.arrayContaining([
      'BAZAAR.BASKET_DRAFT_UPDATED',
      'BAZAAR.BASKET_CONFIRMED',
      'BAZAAR.MERCHANT_REQUEST_VIEWED',
      'BAZAAR.SUBSTITUTION_PROPOSED',
      'BAZAAR.SUBSTITUTION_ACCEPTED',
      'BAZAAR.FINAL_QUOTE_CREATED',
      'BAZAAR.ORDER_REQUESTED',
      'CHITIGRAM.CALL_RECORD',
      'BAZAAR.ORDER_STATUS_UPDATED',
    ]));

    const freshClient = new PrismaClient();
    const restoredDraft = await freshClient.conversationDraft.findUnique({
      where: { id: draftId },
      include: { items: true, adjustments: true },
    });
    const restoredOrder = await freshClient.order.findUnique({ where: { id: orderId }, include: { items: true } });
    await freshClient.$disconnect();

    expect(restoredDraft?.status).toBe('CONVERTED');
    expect(restoredDraft?.items.some((item: { requestedName: string }) => /parachute/i.test(item.requestedName))).toBe(true);
    expect(restoredOrder?.status).toBe('completed');
    expect(restoredOrder?.items.length).toBe(3);
  });
});

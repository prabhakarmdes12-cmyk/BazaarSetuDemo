import { Router, Response } from 'express';
import { randomBytes } from 'crypto';
import { prisma } from '../lib/prisma';
import { appendChitigramMessage, CHITIGRAM_TYPES } from '../lib/chitigram';
import {
  estimateDraftSubtotal,
  findOrCreateConversationalProduct,
  formatDraft,
  loadDraftOrThrow,
  summarizeDraftItems,
} from '../lib/conversationalCommerce';
import { queueOperationalEvent } from '../lib/operationalEvents';
import { assertPilotCheckoutMethod, assertPilotDeliveryAllowed, getAvailableCheckoutMethods, isPilotMode, PilotPolicyError } from '../lib/config';
import { assertFinancialWriteReady, isFinancialGuardError } from '../lib/financialGuard';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  confirmDraftSchema,
  draftAdjustmentSchema,
  draftCheckoutSchema,
  finalQuoteSchema,
  respondAdjustmentSchema,
} from '../validators';

const router = Router();

type LoadedDraft = NonNullable<Awaited<ReturnType<typeof loadDraftOrThrow>>>;

function isDraftCustomer(req: AuthRequest, draft: LoadedDraft): boolean {
  return draft.customerId === req.userId;
}

function isDraftVendor(req: AuthRequest, draft: LoadedDraft): boolean {
  return draft.chat.shop.ownerId === req.userId;
}

function normalizeActionStatus(body: { status?: string; action?: string }): 'CUSTOMER_ACCEPTED' | 'CUSTOMER_DECLINED' {
  if (body.status === 'CUSTOMER_ACCEPTED' || body.action === 'ACCEPT' || body.action === 'ACCEPT_SUBSTITUTION') {
    return 'CUSTOMER_ACCEPTED';
  }
  return 'CUSTOMER_DECLINED';
}

function requestCardFromDraft(draft: LoadedDraft) {
  const formatted = formatDraft(draft);
  return {
    requestNumber: `BS-${draft.id.slice(0, 8).toUpperCase()}`,
    customer: {
      id: draft.customerId,
      name: draft.chat.customer?.name || 'Customer',
      phone: draft.chat.customer?.phone || '',
    },
    shop: {
      id: draft.shopId,
      name: draft.chat.shop?.name || 'Shop',
      phone: draft.chat.shop?.phone || '',
      upiId: draft.chat.shop?.upiId || '',
    },
    delivery: 'HOME_DELIVERY',
    items: formatted.items.map((item) => ({
      ...item,
      actions: ['AVAILABLE', 'SUBSTITUTE', 'UNAVAILABLE', 'EDIT_QTY', 'EDIT_PRICE'],
    })),
    totals: {
      subtotal: formatted.quotedSubtotal ?? formatted.totalEstimate,
      deliveryFee: formatted.deliveryFee ?? 0,
      finalTotal: formatted.finalTotal ?? (formatted.quotedSubtotal ?? formatted.totalEstimate) + (formatted.deliveryFee ?? 0),
    },
    actions: ['CONFIRM_AND_SEND_QUOTE', 'MESSAGE', 'CALL'],
  };
}

async function createDraftNotification(draft: LoadedDraft, title: string, body: string, type = 'BASKET_UPDATE') {
  const vendorId = draft.chat.shop.ownerId;
  if (!vendorId) return;
  await prisma.notification.create({
    data: {
      userId: vendorId,
      type,
      title,
      body,
      data: JSON.stringify({ draftId: draft.id, chatId: draft.chatId }),
    },
  });
}

async function materializeOrderItems(draft: LoadedDraft) {
  const orderItems: Array<{ productId: string; productName: string; quantity: number; price: number }> = [];

  for (const item of draft.items) {
    if (item.availabilityStatus === 'UNAVAILABLE') continue;
    const price = item.quotedPrice ?? item.catalogPrice;
    if (typeof price !== 'number' || !Number.isFinite(price)) {
      throw new Error(`Missing merchant quote for ${item.requestedName}`);
    }

    let productId = item.matchedProductId;
    if (!productId) {
      const product = await findOrCreateConversationalProduct({
        shopId: draft.shopId,
        name: item.requestedName,
        price,
        unit: item.unit,
      });
      productId = product.id;
      await prisma.draftItem.update({
        where: { id: item.id },
        data: { matchedProductId: product.id, catalogPrice: product.price, availabilityStatus: 'AVAILABLE' },
      });
    }

    orderItems.push({
      productId,
      productName: item.requestedName,
      quantity: Math.max(1, Math.round(item.quantity)),
      price,
    });
  }

  if (orderItems.length === 0) {
    throw new Error('No available items to checkout');
  }
  return orderItems;
}

async function applyUdhaarCredit(input: { customerId: string; shopId: string; orderId: string; amount: number }) {
  const ledger = await prisma.udharLedger.upsert({
    where: { customerId_shopId: { customerId: input.customerId, shopId: input.shopId } },
    create: { customerId: input.customerId, shopId: input.shopId, totalDue: 0, totalPaid: 0, creditLimit: 0 },
    update: {},
    include: { entries: true },
  });

  const previousBalance = ledger.totalDue - ledger.totalPaid;
  const updatedLedger = await prisma.udharLedger.update({
    where: { id: ledger.id },
    data: {
      totalDue: { increment: input.amount },
      lastUpdated: new Date(),
      entries: {
        create: {
          type: 'CREDIT',
          amount: input.amount,
          note: `Conversational order ${input.orderId}`,
          orderId: input.orderId,
        },
      },
    },
  });
  const newBalance = updatedLedger.totalDue - updatedLedger.totalPaid;

  return {
    ledgerId: updatedLedger.id,
    creditAmount: input.amount,
    previousBalance,
    newBalance,
  };
}

router.get('/draft/:chatId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const chat = await prisma.chat.findUnique({
      where: { id: req.params.chatId },
      include: { shop: { select: { ownerId: true } } },
    });
    if (!chat) return res.status(404).json({ success: false, message: 'Chat not found' });
    if (chat.customerId !== req.userId && chat.shop.ownerId !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const draft = await prisma.conversationDraft.findFirst({
      where: { chatId: req.params.chatId },
      include: {
        items: true,
        adjustments: true,
        chat: {
          include: {
            customer: { select: { name: true, phone: true } },
            shop: { select: { name: true, phone: true, ownerId: true, upiId: true } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
    if (!draft) return res.status(404).json({ success: false, message: 'Draft not found' });

    let currentDraft = draft;
    if (chat.shop.ownerId === req.userId && ['CUSTOMER_CONFIRMED', 'SENT_TO_MERCHANT'].includes(draft.status)) {
      currentDraft = await prisma.conversationDraft.update({
        where: { id: draft.id },
        data: { status: 'MERCHANT_REVIEW' },
        include: {
          items: true,
          adjustments: true,
          chat: {
            include: {
              customer: { select: { name: true, phone: true } },
              shop: { select: { name: true, phone: true, ownerId: true, upiId: true } },
            },
          },
        },
      });
      await queueOperationalEvent({
        eventType: 'BAZAAR.MERCHANT_REQUEST_VIEWED',
        shopId: currentDraft.shopId,
        customerId: currentDraft.customerId,
        conversationId: currentDraft.chatId,
        payload: { draftId: currentDraft.id },
      });
    }

    const payload = { draft: formatDraft(currentDraft), requestCard: requestCardFromDraft(currentDraft) };
    return res.json({ success: true, data: payload, ...payload });
  } catch (err) {
    console.error('Get basket draft error:', err);
    return res.status(500).json({ success: false, message: 'Failed to get basket draft' });
  }
});

router.post('/draft/:draftId/confirm', authenticateToken, validate(confirmDraftSchema), async (req: AuthRequest, res: Response) => {
  try {
    const draft = await loadDraftOrThrow(req.params.draftId);
    if (!draft) return res.status(404).json({ success: false, message: 'Draft not found' });
    if (!isDraftCustomer(req, draft)) return res.status(403).json({ success: false, message: 'Only the customer can confirm this draft' });

    const updated = await prisma.conversationDraft.update({
      where: { id: draft.id },
      data: { status: 'SENT_TO_MERCHANT' },
      include: {
        items: true,
        adjustments: true,
        chat: {
          include: {
            customer: { select: { name: true, phone: true } },
            shop: { select: { name: true, phone: true, ownerId: true, upiId: true } },
          },
        },
      },
    });

    const formatted = formatDraft(updated);
    await appendChitigramMessage(
      {
        chatId: updated.chatId,
        senderId: 'SHOP_BOT',
        senderRole: 'SHOP_BOT',
        type: CHITIGRAM_TYPES.BASKET_PROPOSAL,
        content: `Customer ne basket confirm kiya. Merchant review ke liye request ready hai:\n${summarizeDraftItems(updated.items)}`,
        payload: { draftId: updated.id, items: formatted.items, totalEstimate: formatted.totalEstimate },
      },
      req.app.locals.io,
    );
    await createDraftNotification(updated, 'Naya conversational order request', `${updated.chat.customer?.name || 'Customer'} ne basket confirm kiya`, 'NEW_BASKET_REQUEST');
    req.app.locals.io?.to(`user:${updated.chat.shop.ownerId}`).emit('notification', { type: 'NEW_BASKET_REQUEST', draftId: updated.id });

    await queueOperationalEvent({
      eventType: 'BAZAAR.BASKET_CONFIRMED',
      shopId: updated.shopId,
      customerId: updated.customerId,
      conversationId: updated.chatId,
      payload: { draftId: updated.id, itemsCount: updated.items.length, totalEstimate: formatted.totalEstimate },
    });

    const payload = { draft: formatted, requestCard: requestCardFromDraft(updated) };
    return res.json({ success: true, data: payload, ...payload });
  } catch (err) {
    console.error('Confirm draft error:', err);
    return res.status(500).json({ success: false, message: 'Failed to confirm draft' });
  }
});

router.post('/draft/:draftId/adjustments', authenticateToken, validate(draftAdjustmentSchema), async (req: AuthRequest, res: Response) => {
  try {
    const draft = await loadDraftOrThrow(req.params.draftId);
    if (!draft) return res.status(404).json({ success: false, message: 'Draft not found' });
    if (!isDraftVendor(req, draft)) return res.status(403).json({ success: false, message: 'Only the merchant can adjust this draft' });

    const body = req.body as {
      adjustments?: Array<Record<string, unknown>>;
      itemId?: string;
      type?: string;
      originalText?: string;
      proposedName?: string;
      proposedQuantity?: number;
      proposedPrice?: number;
      replacement?: string;
      price?: number;
      reason?: string;
    };
    const adjustmentInputs = Array.isArray(body.adjustments) && body.adjustments.length > 0 ? body.adjustments : [body];
    const createdAdjustments: unknown[] = [];

    for (const raw of adjustmentInputs) {
      const itemId = typeof raw.itemId === 'string' ? raw.itemId : body.itemId;
      const proposedName = typeof raw.proposedName === 'string'
        ? raw.proposedName
        : typeof raw.replacement === 'string'
          ? raw.replacement
          : body.proposedName || body.replacement;
      const proposedPrice = typeof raw.proposedPrice === 'number'
        ? raw.proposedPrice
        : typeof raw.price === 'number'
          ? raw.price
          : body.proposedPrice ?? body.price;
      const proposedQuantity = typeof raw.proposedQuantity === 'number' ? raw.proposedQuantity : body.proposedQuantity;
      const reason = typeof raw.reason === 'string' ? raw.reason : body.reason;
      const type = (typeof raw.type === 'string' ? raw.type : body.type) || (proposedName ? 'SUBSTITUTION' : 'UNAVAILABLE');
      const originalItem = itemId ? draft.items.find((item: { id: string }) => item.id === itemId) : undefined;

      const adjustment = await prisma.draftAdjustment.create({
        data: {
          draftId: draft.id,
          itemId,
          type,
          originalText: (typeof raw.originalText === 'string' ? raw.originalText : body.originalText) || originalItem?.requestedName,
          proposedName,
          proposedQuantity,
          proposedPrice,
          reason,
        },
      });
      createdAdjustments.push(adjustment);

      if (itemId) {
        await prisma.draftItem.update({
          where: { id: itemId },
          data: {
            availabilityStatus: type === 'UNAVAILABLE' && !proposedName ? 'UNAVAILABLE' : 'SUBSTITUTE_PROPOSED',
            ...(type === 'PRICE_CHANGE' && proposedPrice !== undefined && { quotedPrice: proposedPrice }),
            ...(type === 'QUANTITY_CHANGE' && proposedQuantity !== undefined && { quantity: proposedQuantity }),
          },
        });
      }

      const originalQuotedPrice = originalItem?.quotedPrice;
      const priceDiff = proposedPrice !== undefined && originalQuotedPrice !== null && originalQuotedPrice !== undefined
        ? proposedPrice - originalQuotedPrice
        : undefined;

      await appendChitigramMessage(
        {
          chatId: draft.chatId,
          senderId: req.userId!,
          senderRole: 'MERCHANT',
          type: proposedName ? CHITIGRAM_TYPES.SUBSTITUTION : CHITIGRAM_TYPES.BASKET_PROPOSAL,
          content: proposedName
            ? `Merchant ne substitute propose kiya: ${originalItem?.requestedName || 'Item'} → ${proposedName}${proposedPrice !== undefined ? ` ₹${proposedPrice}` : ''}`
            : `Merchant ne item update kiya: ${originalItem?.requestedName || 'Item'} ${type}`,
          payload: {
            draftId: draft.id,
            adjustmentId: adjustment.id,
            original: originalItem?.requestedName || adjustment.originalText,
            replacement: proposedName,
            priceDiff,
          },
        },
        req.app.locals.io,
      );

      await queueOperationalEvent({
        eventType: proposedName ? 'BAZAAR.SUBSTITUTION_PROPOSED' : 'BAZAAR.DRAFT_ADJUSTED',
        shopId: draft.shopId,
        customerId: draft.customerId,
        conversationId: draft.chatId,
        payload: { draftId: draft.id, adjustmentId: adjustment.id, type, proposedName, proposedPrice },
      });
    }

    const updated = await prisma.conversationDraft.update({
      where: { id: draft.id },
      data: { status: 'CHANGES_PROPOSED' },
      include: {
        items: true,
        adjustments: true,
        chat: {
          include: {
            customer: { select: { name: true, phone: true } },
            shop: { select: { name: true, phone: true, ownerId: true, upiId: true } },
          },
        },
      },
    });

    const payload = { draft: formatDraft(updated), adjustments: createdAdjustments };
    return res.json({ success: true, data: payload, ...payload });
  } catch (err) {
    console.error('Draft adjustment error:', err);
    return res.status(500).json({ success: false, message: 'Failed to adjust draft' });
  }
});

router.post('/adjustments/:adjustmentId/respond', authenticateToken, validate(respondAdjustmentSchema), async (req: AuthRequest, res: Response) => {
  try {
    const adjustment = await prisma.draftAdjustment.findUnique({
      where: { id: req.params.adjustmentId },
      include: {
        draft: {
          include: {
            items: true,
            adjustments: true,
            chat: {
              include: {
                customer: { select: { name: true, phone: true } },
                shop: { select: { name: true, phone: true, ownerId: true, upiId: true } },
              },
            },
          },
        },
      },
    });
    if (!adjustment) return res.status(404).json({ success: false, message: 'Adjustment not found' });
    if (adjustment.draft.customerId !== req.userId) {
      return res.status(403).json({ success: false, message: 'Only the customer can respond to this adjustment' });
    }

    const status = normalizeActionStatus(req.body as { status?: string; action?: string });
    const updatedAdjustment = await prisma.draftAdjustment.update({ where: { id: adjustment.id }, data: { status } });

    if (status === 'CUSTOMER_ACCEPTED' && adjustment.itemId) {
      let matchedProductId: string | undefined;
      if (adjustment.proposedName && adjustment.proposedPrice !== null) {
        const product = await findOrCreateConversationalProduct({
          shopId: adjustment.draft.shopId,
          name: adjustment.proposedName,
          price: adjustment.proposedPrice,
          unit: adjustment.draft.items.find((item: { id: string; unit: string }) => item.id === adjustment.itemId)?.unit || 'piece',
        });
        matchedProductId = product.id;
      }

      await prisma.draftItem.update({
        where: { id: adjustment.itemId },
        data: {
          ...(adjustment.proposedName && { requestedName: adjustment.proposedName, rawText: adjustment.proposedName }),
          ...(adjustment.proposedQuantity && { quantity: adjustment.proposedQuantity }),
          ...(adjustment.proposedPrice !== null && { quotedPrice: adjustment.proposedPrice, catalogPrice: adjustment.proposedPrice }),
          ...(matchedProductId && { matchedProductId }),
          availabilityStatus: 'AVAILABLE',
        },
      });
    }

    await appendChitigramMessage(
      {
        chatId: adjustment.draft.chatId,
        senderId: req.userId!,
        senderRole: 'CUSTOMER',
        type: CHITIGRAM_TYPES.SUBSTITUTION,
        content: status === 'CUSTOMER_ACCEPTED'
          ? `Customer ne substitute approve kiya: ${adjustment.proposedName || adjustment.originalText || 'item'}`
          : `Customer ne substitute reject kiya: ${adjustment.proposedName || adjustment.originalText || 'item'}`,
        payload: {
          draftId: adjustment.draftId,
          adjustmentId: adjustment.id,
          status,
          original: adjustment.originalText,
          replacement: adjustment.proposedName,
          priceDiff: adjustment.proposedPrice,
        },
      },
      req.app.locals.io,
    );

    await queueOperationalEvent({
      eventType: status === 'CUSTOMER_ACCEPTED' ? 'BAZAAR.SUBSTITUTION_ACCEPTED' : 'BAZAAR.SUBSTITUTION_DECLINED',
      shopId: adjustment.draft.shopId,
      customerId: adjustment.draft.customerId,
      conversationId: adjustment.draft.chatId,
      payload: { draftId: adjustment.draftId, adjustmentId: adjustment.id, status },
    });

    const freshDraft = await loadDraftOrThrow(adjustment.draftId);
    const payload = { adjustment: updatedAdjustment, draft: freshDraft ? formatDraft(freshDraft) : undefined };
    return res.json({ success: true, data: payload, ...payload });
  } catch (err) {
    console.error('Respond adjustment error:', err);
    return res.status(500).json({ success: false, message: 'Failed to respond to adjustment' });
  }
});

router.post('/draft/:draftId/final-quote', authenticateToken, validate(finalQuoteSchema), async (req: AuthRequest, res: Response) => {
  try {
    const draft = await loadDraftOrThrow(req.params.draftId);
    if (!draft) return res.status(404).json({ success: false, message: 'Draft not found' });
    if (!isDraftVendor(req, draft)) return res.status(403).json({ success: false, message: 'Only the merchant can quote this draft' });

    const body = req.body as { subtotal?: number; quotedSubtotal?: number; deliveryFee?: number; finalTotal?: number };
    const subtotal = body.subtotal ?? body.quotedSubtotal ?? estimateDraftSubtotal(draft.items);
    const deliveryFee = body.deliveryFee ?? 0;
    const finalTotal = body.finalTotal ?? subtotal + deliveryFee;

    const updated = await prisma.conversationDraft.update({
      where: { id: draft.id },
      data: { status: 'FINAL_QUOTE', quotedSubtotal: subtotal, deliveryFee, finalTotal },
      include: {
        items: true,
        adjustments: true,
        chat: {
          include: {
            customer: { select: { name: true, phone: true } },
            shop: { select: { name: true, phone: true, ownerId: true, upiId: true } },
          },
        },
      },
    });
    const formatted = formatDraft(updated);

    await appendChitigramMessage(
      {
        chatId: updated.chatId,
        senderId: req.userId!,
        senderRole: 'MERCHANT',
        type: CHITIGRAM_TYPES.FINAL_QUOTE,
        content: `Final quote: Subtotal ₹${subtotal}, Delivery ₹${deliveryFee}, Total ₹${finalTotal}`,
        payload: { draftId: updated.id, subtotal, deliveryFee, finalTotal },
      },
      req.app.locals.io,
    );

    await queueOperationalEvent({
      eventType: 'BAZAAR.FINAL_QUOTE_CREATED',
      shopId: updated.shopId,
      customerId: updated.customerId,
      conversationId: updated.chatId,
      payload: { draftId: updated.id, subtotal, deliveryFee, finalTotal },
    });

    const payload = { draft: formatted, quote: { draftId: updated.id, subtotal, deliveryFee, finalTotal } };
    return res.json({ success: true, data: payload, ...payload });
  } catch (err) {
    console.error('Final quote error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create final quote' });
  }
});

router.post('/draft/:draftId/checkout', authenticateToken, validate(draftCheckoutSchema), async (req: AuthRequest, res: Response) => {
  try {
    await assertFinancialWriteReady('conversation draft checkout');

    const draft = await loadDraftOrThrow(req.params.draftId);
    if (!draft) return res.status(404).json({ success: false, message: 'Draft not found' });
    if (!isDraftCustomer(req, draft)) return res.status(403).json({ success: false, message: 'Only the customer can checkout this draft' });

    const existingOrder = await prisma.order.findFirst({ where: { conversationDraftId: draft.id }, include: { items: true } });
    if (existingOrder) {
      const payload = { order: existingOrder, draft: formatDraft(draft), idempotent: true };
      return res.json({ success: true, data: payload, ...payload });
    }

    const {
      paymentMethod = 'COD',
      deliveryPincode,
      deliveryAddress,
      deliveryLat,
      deliveryLng,
    } = req.body as {
      paymentMethod?: 'COD' | 'DIRECT_UPI' | 'UDHAAR' | 'RAZORPAY';
      clientActionId?: string;
      deliveryPincode?: string;
      deliveryAddress?: string;
      deliveryLat?: number;
      deliveryLng?: number;
    };
    assertPilotCheckoutMethod(paymentMethod);
    const customerForPilot = isPilotMode()
      ? await (prisma as any).user.findUnique({
          where: { id: draft.customerId },
          select: { address: true, locality: true, pincode: true, lat: true, lng: true },
        })
      : undefined;
    const pilotDelivery = assertPilotDeliveryAllowed({
      shop: draft.chat.shop,
      customer: customerForPilot,
      deliveryPincode,
      deliveryAddress,
      deliveryLat,
      deliveryLng,
    });

    const orderItems = await materializeOrderItems(draft);
    const subtotal = draft.quotedSubtotal ?? estimateDraftSubtotal(draft.items);
    const deliveryFee = draft.deliveryFee ?? 0;
    const totalAmount = draft.finalTotal ?? subtotal + deliveryFee;

    const order = await prisma.order.create({
      data: {
        customerId: draft.customerId,
        shopId: draft.shopId,
        totalAmount,
        status: 'pending',
        publicToken: randomBytes(16).toString('hex'),
        conversationDraftId: draft.id,
        items: { create: orderItems },
      },
      include: { items: true, shop: { select: { ownerId: true, name: true, upiId: true } } },
    });

    const updatedDraft = await prisma.conversationDraft.update({
      where: { id: draft.id },
      data: { status: 'CONVERTED' },
      include: {
        items: true,
        adjustments: true,
        chat: {
          include: {
            customer: { select: { name: true, phone: true } },
            shop: { select: { name: true, phone: true, ownerId: true, upiId: true } },
          },
        },
      },
    });

    await prisma.notification.create({
      data: {
        userId: order.shop.ownerId,
        type: 'NEW_ORDER',
        title: 'Naya Order aaya!',
        body: `₹${totalAmount} ka conversational order aaya hai`,
        data: JSON.stringify({ orderId: order.id, draftId: draft.id, paymentMethod }),
      },
    });
    req.app.locals.io?.to(`user:${order.shop.ownerId}`).emit('notification', { type: 'NEW_ORDER', orderId: order.id, draftId: draft.id });

    await appendChitigramMessage(
      {
        chatId: updatedDraft.chatId,
        senderId: 'SHOP_BOT',
        senderRole: 'SHOP_BOT',
        type: CHITIGRAM_TYPES.ORDER_CARD,
        content: `Order #${order.id.slice(0, 8)} created. Status: ${order.status}. Total ₹${order.totalAmount}`,
        payload: { orderId: order.id, status: order.status, items: order.items, totalAmount: order.totalAmount },
      },
      req.app.locals.io,
    );

    await appendChitigramMessage(
      {
        chatId: updatedDraft.chatId,
        senderId: 'SHOP_BOT',
        senderRole: 'SHOP_BOT',
        type: CHITIGRAM_TYPES.PAYMENT_REQUEST,
        content: `Payment selected: ${paymentMethod}. Amount ₹${order.totalAmount}`,
        payload: {
          orderId: order.id,
          amount: order.totalAmount,
          upiLink: order.shop.upiId ? `upi://pay?pa=${encodeURIComponent(order.shop.upiId)}&am=${order.totalAmount}` : null,
          allowUdhar: true,
          allowCod: true,
          selectedMethod: paymentMethod,
          allowedMethods: getAvailableCheckoutMethods(),
          pilotDelivery,
        },
      },
      req.app.locals.io,
    );

    let udhaarReceipt: Awaited<ReturnType<typeof applyUdhaarCredit>> | undefined;
    if (paymentMethod === 'UDHAAR') {
      udhaarReceipt = await applyUdhaarCredit({ customerId: draft.customerId, shopId: draft.shopId, orderId: order.id, amount: order.totalAmount });
      await appendChitigramMessage(
        {
          chatId: updatedDraft.chatId,
          senderId: 'SHOP_BOT',
          senderRole: 'SHOP_BOT',
          type: CHITIGRAM_TYPES.UDHAAR_RECEIPT,
          content: `₹${udhaarReceipt.creditAmount} Khata mein add ho gaya. Naya balance ₹${udhaarReceipt.newBalance}`,
          payload: udhaarReceipt,
        },
        req.app.locals.io,
      );
    }

    await queueOperationalEvent({
      eventType: 'BAZAAR.ORDER_REQUESTED',
      shopId: draft.shopId,
      customerId: draft.customerId,
      conversationId: draft.chatId,
      orderId: order.id,
      payload: { draftId: draft.id, itemsCount: order.items.length, estimatedAmount: order.totalAmount, paymentMethod, pilotDelivery },
    });

    const payload = {
      order: {
        id: order.id,
        orderId: order.id,
        status: order.status,
        totalAmount: order.totalAmount,
        publicToken: order.publicToken,
        items: order.items,
        paymentMethod,
        allowedPaymentMethods: getAvailableCheckoutMethods(),
        pilotDelivery,
      },
      draft: formatDraft(updatedDraft),
      udhaarReceipt,
    };
    return res.json({ success: true, data: payload, ...payload });
  } catch (err) {
    if (err instanceof PilotPolicyError) {
      return res.status(err.statusCode).json({ success: false, message: err.message, details: err.details });
    }
    if (isFinancialGuardError(err)) {
      return res.status(err.statusCode).json({ success: false, message: 'Financial transactions are temporarily unavailable. Please retry once database health is restored.', code: err.code });
    }
    console.error('Draft checkout error:', err);
    const message = err instanceof Error ? err.message : 'Failed to checkout draft';
    return res.status(400).json({ success: false, message });
  }
});

export default router;

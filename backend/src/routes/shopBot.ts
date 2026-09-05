import { Router, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { prisma } from '../lib/prisma';
import { appendChitigramMessage, CHITIGRAM_TYPES, formatChatMessage } from '../lib/chitigram';
import { ACTIVE_DRAFT_STATUSES, formatDraft, summarizeDraftItems } from '../lib/conversationalCommerce';
import { queueOperationalEvent } from '../lib/operationalEvents';
import {
  ExistingDraftItem,
  ParsedBasketItem,
  itemMatchesTerm,
  parseShoppingIntent,
} from '../lib/shopBotEngine';
import { AuthRequest, optionalAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { shopBotParseSchema } from '../validators';
import { parseMultipartForm } from '../lib/multipart';
import { transcribeVoiceOrder } from '../lib/transcription';

const router = Router();

function toExistingItems(items: Array<{
  id: string;
  rawText: string;
  requestedName: string;
  quantity: number;
  unit: string;
  matchedProductId?: string | null;
}>): ExistingDraftItem[] {
  return items.map((item: any) => ({
    id: item.id,
    rawText: item.rawText,
    requestedName: item.requestedName,
    quantity: item.quantity,
    unit: item.unit,
    matchedProductId: item.matchedProductId,
  }));
}

function parseDraftPayload<T>(value: T) {
  return value as T & {
    items: Array<{
      id: string;
      rawText: string;
      requestedName: string;
      quantity: number;
      unit: string;
      matchedProductId?: string | null;
      matchConfidence: number;
      catalogPrice?: number | null;
      quotedPrice?: number | null;
      availabilityStatus: string;
      brandPreference?: string | null;
      sourceMessageId?: string | null;
      createdAt: Date;
    }>;
    adjustments: Array<{ id: string; status: string; createdAt: Date }>;
  };
}

async function ensureConversation(customerId: string, shopId: string, conversationId: string) {
  const [customer, shop] = await Promise.all([
    prisma.user.findUnique({ where: { id: customerId } }),
    prisma.shop.findUnique({ where: { id: shopId } }),
  ]);

  if (!customer) return { error: { status: 404, message: 'Customer not found' } } as const;
  if (!shop) return { error: { status: 404, message: 'Shop not found' } } as const;

  let chat = await prisma.chat.findUnique({ where: { id: conversationId } });
  if (chat && (chat.customerId !== customerId || chat.shopId !== shopId)) {
    return { error: { status: 409, message: 'Conversation does not belong to this customer/shop pair' } } as const;
  }

  if (!chat) {
    chat = await prisma.chat.findUnique({
      where: { customerId_shopId: { customerId, shopId } },
    });
  }

  if (!chat) {
    chat = await prisma.chat.create({
      data: { id: conversationId, customerId, shopId },
    });
  }

  return { chat, customer, shop } as const;
}

async function loadActiveDraft(chatId: string) {
  return prisma.conversationDraft.findFirst({
    where: { chatId, status: { in: ACTIVE_DRAFT_STATUSES } },
    include: { items: true, adjustments: true },
    orderBy: { updatedAt: 'desc' },
  });
}

async function createDraftFromPrevious(chatId: string, customerId: string, shopId: string, rawMessage: string, clientActionId?: string) {
  const previous = await prisma.conversationDraft.findFirst({
    where: { chatId },
    include: { items: true },
    orderBy: { updatedAt: 'desc' },
  });

  return prisma.conversationDraft.create({
    data: {
      chatId,
      customerId,
      shopId,
      rawMessage,
      ...(clientActionId && { clientActionId }),
      items: previous?.items.length
        ? {
            create: previous.items.map((item: {
              rawText: string;
              requestedName: string;
              quantity: number;
              unit: string;
              brandPreference?: string | null;
              matchedProductId?: string | null;
              matchConfidence: number;
              catalogPrice?: number | null;
              quotedPrice?: number | null;
              availabilityStatus: string;
              sourceMessageId?: string | null;
            }) => ({ 
              rawText: item.rawText,
              requestedName: item.requestedName,
              quantity: item.quantity,
              unit: item.unit,
              brandPreference: item.brandPreference,
              matchedProductId: item.matchedProductId,
              matchConfidence: item.matchConfidence,
              catalogPrice: item.catalogPrice,
              quotedPrice: item.quotedPrice,
              availabilityStatus: item.availabilityStatus,
              sourceMessageId: item.sourceMessageId,
            })),
          }
        : undefined,
    },
    include: { items: true, adjustments: true },
  });
}

async function getOrCreateDraft(chatId: string, customerId: string, shopId: string, message: string, clientActionId?: string) {
  if (clientActionId) {
    const idempotentDraft = await prisma.conversationDraft.findUnique({
      where: { clientActionId },
      include: { items: true, adjustments: true },
    });
    if (idempotentDraft) return idempotentDraft;
  }

  const active = await loadActiveDraft(chatId);
  if (active) return active;

  const shouldClonePrevious = /\b(same list|repeat|dobara|again|phir se)\b/i.test(message);
  if (shouldClonePrevious) {
    return createDraftFromPrevious(chatId, customerId, shopId, message, clientActionId);
  }

  return prisma.conversationDraft.create({
    data: { chatId, customerId, shopId, rawMessage: message, ...(clientActionId && { clientActionId }) },
    include: { items: true, adjustments: true },
  });
}

function draftItemCreateData(item: ParsedBasketItem, sourceMessageId?: string) {
  return {
    rawText: item.rawText,
    requestedName: item.requestedName,
    quantity: item.quantity,
    unit: item.unit,
    brandPreference: item.brandPreference,
    matchedProductId: item.matchedProductId,
    matchConfidence: item.matchConfidence,
    catalogPrice: item.catalogPrice,
    quotedPrice: item.catalogPrice,
    availabilityStatus: item.availabilityStatus,
    sourceMessageId,
  };
}

async function createOrIncrementItem(draftId: string, item: ParsedBasketItem, existingItems: ExistingDraftItem[], sourceMessageId: string) {
  const existing = existingItems.find((draftItem: any) => {
    if (item.matchedProductId && draftItem.matchedProductId === item.matchedProductId) return true;
    return itemMatchesTerm(draftItem, item.requestedName);
  });

  if (existing) {
    await prisma.draftItem.update({
      where: { id: existing.id },
      data: {
        quantity: existing.quantity + item.quantity,
        rawText: item.rawText,
        brandPreference: item.brandPreference,
        matchedProductId: item.matchedProductId || existing.matchedProductId,
        matchConfidence: Math.max(item.matchConfidence, 0),
        catalogPrice: item.catalogPrice,
        quotedPrice: item.catalogPrice,
        availabilityStatus: item.availabilityStatus,
        sourceMessageId,
      },
    });
    return;
  }

  await prisma.draftItem.create({
    data: {
      draftId,
      ...draftItemCreateData(item, sourceMessageId),
    },
  });
}

async function setItemQuantity(draftId: string, item: ParsedBasketItem, existingItems: ExistingDraftItem[], sourceMessageId: string) {
  const existing = existingItems.find((draftItem: any) => itemMatchesTerm(draftItem, item.requestedName));
  if (!existing) {
    await prisma.draftItem.create({ data: { draftId, ...draftItemCreateData(item, sourceMessageId) } });
    return;
  }

  await prisma.draftItem.update({
    where: { id: existing.id },
    data: {
      quantity: item.quantity,
      unit: item.unit,
      rawText: item.rawText,
      brandPreference: item.brandPreference,
      matchedProductId: item.matchedProductId || existing.matchedProductId,
      matchConfidence: item.matchConfidence,
      catalogPrice: item.catalogPrice,
      quotedPrice: item.catalogPrice,
      availabilityStatus: item.availabilityStatus,
      sourceMessageId,
    },
  });
}

async function applyCommand(input: {
  draftId: string;
  sourceMessageId: string;
  command: ReturnType<typeof parseShoppingIntent>;
  existingItems: ExistingDraftItem[];
}) {
  const { draftId, sourceMessageId, command, existingItems } = input;

  if (command.intent === 'CANCEL_REQUEST') {
    await prisma.conversationDraft.update({ where: { id: draftId }, data: { status: 'CANCELLED' } });
    return;
  }

  if (command.intent === 'REMOVE_ITEM') {
    const ids = existingItems
      .filter((item: any) => command.removeTerms.some((term: any) => itemMatchesTerm(item, term)))
      .map((item: any) => item.id);
    if (ids.length > 0) await prisma.draftItem.deleteMany({ where: { id: { in: ids } } });
    return;
  }

  if (command.intent === 'CHANGE_BRAND' && command.changeBrand) {
    const removeIds = existingItems
      .filter((item: any) => itemMatchesTerm(item, command.changeBrand!.from))
      .map((item: any) => item.id);
    if (removeIds.length > 0) await prisma.draftItem.deleteMany({ where: { id: { in: removeIds } } });
    await prisma.draftItem.create({ data: { draftId, ...draftItemCreateData(command.changeBrand.to, sourceMessageId) } });
    return;
  }

  if (command.intent === 'CHANGE_QUANTITY' && command.updateTarget) {
    await setItemQuantity(draftId, command.updateTarget, existingItems, sourceMessageId);
    return;
  }

  if (command.intent === 'CONFIRM_BASKET') {
    await prisma.conversationDraft.update({ where: { id: draftId }, data: { status: 'CUSTOMER_CONFIRMED' } });
    return;
  }

  if (command.intent === 'ACCEPT_SUBSTITUTION' || command.intent === 'REJECT_SUBSTITUTION') {
    const nextStatus = command.intent === 'ACCEPT_SUBSTITUTION' ? 'CUSTOMER_ACCEPTED' : 'CUSTOMER_DECLINED';
    const adjustment = await prisma.draftAdjustment.findFirst({
      where: { draftId, status: 'PROPOSED' },
      orderBy: { createdAt: 'desc' },
    });
    if (adjustment) {
      await prisma.draftAdjustment.update({ where: { id: adjustment.id }, data: { status: nextStatus } });
      if (nextStatus === 'CUSTOMER_ACCEPTED' && adjustment.itemId) {
        await prisma.draftItem.update({
          where: { id: adjustment.itemId },
          data: {
            ...(adjustment.proposedName && { requestedName: adjustment.proposedName, rawText: adjustment.proposedName }),
            ...(adjustment.proposedQuantity && { quantity: adjustment.proposedQuantity }),
            ...(adjustment.proposedPrice !== null && { quotedPrice: adjustment.proposedPrice }),
            availabilityStatus: 'AVAILABLE',
          },
        });
      }
    }
    return;
  }

  for (const item of command.items) {
    await createOrIncrementItem(draftId, item, existingItems, sourceMessageId);
  }
}


interface ProcessShopBotMessageInput {
  customerId: string;
  shopId: string;
  conversationId: string;
  message: string;
  locale?: 'hi-IN' | 'en-IN' | 'hinglish';
  clientActionId?: string;
  messageType?: string;
  messagePayload?: Record<string, unknown>;
  eventTypeOverride?: string;
}

function buildParseResponsePayload(input: {
  command: ReturnType<typeof parseShoppingIntent>;
  formattedDraft: ReturnType<typeof formatDraft>;
  draftId: string;
  chatId: string;
  status: string;
  extras?: Record<string, unknown>;
}) {
  const { command, formattedDraft, draftId, chatId, status, extras } = input;
  return {
    intent: command.intent,
    items: formattedDraft.items.map((item: any) => ({
      rawText: item.rawText,
      requestedName: item.requestedName,
      quantity: item.quantity,
      unit: item.unit,
      brandPreference: item.brandPreference,
      matchedProductId: item.matchedProductId,
      matchConfidence: item.matchConfidence,
      catalogPrice: item.catalogPrice,
      availabilityStatus: item.availabilityStatus,
      requiresClarification: item.requiresClarification,
    })),
    unresolvedQuestions: formattedDraft.unresolvedQuestions,
    basketAction: command.basketAction,
    draftId,
    chatId,
    status,
    chitigramType: CHITIGRAM_TYPES.BASKET_PROPOSAL,
    totalEstimate: formattedDraft.totalEstimate,
    draft: formattedDraft,
    ...(extras || {}),
  };
}

async function processShopBotMessage(input: ProcessShopBotMessageInput, io?: { to: (room: string) => { emit: (event: string, data: unknown) => void } }) {
  const { customerId, shopId, conversationId, message, clientActionId, messageType = 'TEXT', messagePayload } = input;

  const conversation = await ensureConversation(customerId, shopId, conversationId);
  if ('error' in conversation) {
    return { error: conversation.error } as const;
  }

  if (clientActionId) {
    const existingDraft = await prisma.conversationDraft.findUnique({
      where: { clientActionId },
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
    if (existingDraft) {
      const formattedDraft = formatDraft(existingDraft);
      const replayCommand = parseShoppingIntent(message, [], toExistingItems(existingDraft.items), false);
      return {
        payload: buildParseResponsePayload({
          command: { ...replayCommand, basketAction: 'IDEMPOTENT_REPLAY' },
          formattedDraft,
          draftId: existingDraft.id,
          chatId: existingDraft.chatId,
          status: existingDraft.status,
          extras: messagePayload,
        }),
      } as const;
    }
  }

  const customerMessage = await prisma.message.create({
    data: {
      chatId: conversation.chat.id,
      senderId: customerId,
      senderRole: 'CUSTOMER',
      type: messageType,
      content: message,
      productData: messagePayload ? JSON.stringify(messagePayload) : '',
    },
  });
  await prisma.chat.update({ where: { id: conversation.chat.id }, data: { updatedAt: new Date() } });
  io?.to(`chat:${conversation.chat.id}`).emit('new_message', formatChatMessage(customerMessage));

  const products = await prisma.product.findMany({ where: { shopId }, orderBy: { createdAt: 'desc' } });
  const draft = parseDraftPayload(await getOrCreateDraft(conversation.chat.id, customerId, shopId, message, clientActionId));
  const command = parseShoppingIntent(
    message,
    products,
    toExistingItems(draft.items),
    draft.adjustments.some((adjustment: { status: string }) => adjustment.status === 'PROPOSED'),
  );

  await applyCommand({
    draftId: draft.id,
    sourceMessageId: customerMessage.id,
    command,
    existingItems: toExistingItems(draft.items),
  });

  if (command.items.length === 0 && /(sasta|cheap|budget|economical)/i.test(message) && /(accha|acha|achha|good|quality|best)/i.test(message)) {
    await prisma.draftItem.updateMany({
      where: { draftId: draft.id, availabilityStatus: { in: ['NEEDS_MERCHANT_CHECK', 'AVAILABLE'] } },
      data: { brandPreference: 'economical_quality' },
    });
  }

  await prisma.conversationDraft.update({
    where: { id: draft.id },
    data: { rawMessage: message },
  });

  const freshDraft = await prisma.conversationDraft.findUnique({
    where: { id: draft.id },
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

  if (!freshDraft) throw new Error('Draft not found after parse');

  const formattedDraft = formatDraft(freshDraft);
  const payload = buildParseResponsePayload({
    command,
    formattedDraft,
    draftId: freshDraft.id,
    chatId: freshDraft.chatId,
    status: freshDraft.status,
    extras: messagePayload,
  });

  if (freshDraft.status !== 'CANCELLED') {
    await appendChitigramMessage(
      {
        chatId: freshDraft.chatId,
        senderId: 'SHOP_BOT',
        senderRole: 'SHOP_BOT',
        type: CHITIGRAM_TYPES.BASKET_PROPOSAL,
        content: `Shop Bot ne basket draft update kiya:\n${summarizeDraftItems(freshDraft.items)}`,
        payload: {
          draftId: freshDraft.id,
          items: formattedDraft.items,
          totalEstimate: formattedDraft.totalEstimate,
          ...(messagePayload?.audioUrl ? { audioUrl: messagePayload.audioUrl, transcript: messagePayload.transcript } : {}),
        },
      },
      io,
    );
  }

  await queueOperationalEvent({
    eventType: input.eventTypeOverride || (freshDraft.status === 'CANCELLED'
      ? 'BAZAAR.BASKET_DRAFT_CANCELLED'
      : command.intent === 'CONFIRM_BASKET'
        ? 'BAZAAR.BASKET_CONFIRMED'
        : 'BAZAAR.BASKET_DRAFT_UPDATED'),
    shopId,
    customerId,
    conversationId: freshDraft.chatId,
    payload: {
      draftId: freshDraft.id,
      intent: command.intent,
      itemsCount: formattedDraft.items.length,
      totalEstimate: formattedDraft.totalEstimate,
      unresolvedQuestions: formattedDraft.unresolvedQuestions,
      ...(messagePayload?.audioUrl ? { audioUrl: messagePayload.audioUrl, transcript: messagePayload.transcript } : {}),
    },
  });

  return { payload } as const;
}

function extensionFromMime(mimeType: string, filename: string): string {
  const existing = path.extname(filename || '').toLowerCase();
  if (existing) return existing;
  if (mimeType.includes('mpeg') || mimeType.includes('mp3')) return '.mp3';
  if (mimeType.includes('wav')) return '.wav';
  if (mimeType.includes('ogg')) return '.ogg';
  return '.webm';
}

router.post('/parse', optionalAuth, validate(shopBotParseSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { customerId, shopId, conversationId, message, locale, clientActionId } = req.body as {
      customerId: string;
      shopId: string;
      conversationId: string;
      message: string;
      locale?: 'hi-IN' | 'en-IN' | 'hinglish';
      clientActionId?: string;
    };

    if (req.userId && req.userId !== customerId && req.userRole !== 'admin') {
      return res.status(403).json({ success: false, message: 'Token customer does not match request customerId' });
    }

    const result = await processShopBotMessage({ customerId, shopId, conversationId, message, locale, clientActionId }, req.app.locals.io);
    if ('error' in result) {
      return res.status(result.error!.status).json({ success: false, message: result.error!.message });
    }

    return res.json({ success: true, data: result.payload, ...result.payload });
  } catch (err) {
    console.error('Shop Bot parse error:', err);
    return res.status(500).json({ success: false, message: 'Failed to parse shop bot message' });
  }
});

router.post('/voice-order', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (!String(req.headers['content-type'] || '').includes('multipart/form-data')) {
      return res.status(415).json({ success: false, message: 'multipart/form-data audio upload required' });
    }

    const form = await parseMultipartForm(req, 15 * 1024 * 1024);
    const { fields } = form;
    const audio = form.files.find((file: any) => ['audio', 'file', 'voice', 'voiceOrder'].includes(file.fieldName)) || form.files[0];

    const customerId = fields.customerId;
    const shopId = fields.shopId;
    const conversationId = fields.conversationId || fields.chatId;
    const locale = (fields.locale || 'hinglish') as 'hi-IN' | 'en-IN' | 'hinglish';
    const clientActionId = fields.clientActionId;

    if (!customerId || !shopId || !conversationId) {
      return res.status(400).json({ success: false, message: 'customerId, shopId and conversationId are required' });
    }
    if (!audio || audio.buffer.length === 0) {
      return res.status(400).json({ success: false, message: 'Audio file is required' });
    }
    if (req.userId && req.userId !== customerId && req.userRole !== 'admin') {
      return res.status(403).json({ success: false, message: 'Token customer does not match request customerId' });
    }

    const uploadDir = path.join(process.cwd(), 'uploads', 'voice-orders');
    await fs.mkdir(uploadDir, { recursive: true });
    const ext = extensionFromMime(audio.mimeType, audio.filename);
    const safeFileName = `voice_${Date.now()}_${randomUUID()}${ext}`;
    const audioPath = path.join(uploadDir, safeFileName);
    await fs.writeFile(audioPath, audio.buffer);
    const audioUrl = `/uploads/voice-orders/${safeFileName}`;

    const transcription = await transcribeVoiceOrder({
      audioPath,
      audioBuffer: audio.buffer,
      mimeType: audio.mimeType,
      fields,
    });
    const transcript = transcription.transcript || 'Voice note received. Transcript unavailable; merchant manual review needed.';

    const result = await processShopBotMessage(
      {
        customerId,
        shopId,
        conversationId,
        message: transcript,
        locale,
        clientActionId,
        messageType: 'VOICE_ORDER',
        messagePayload: {
          audioUrl,
          transcript: transcription.transcript,
          transcriptionConfidence: transcription.confidence,
          transcriptionProvider: transcription.provider,
          requiresManualReview: transcription.requiresManualReview,
          originalFilename: audio.filename,
          mimeType: audio.mimeType,
        },
        eventTypeOverride: 'BAZAAR.VOICE_ORDER_RECEIVED',
      },
      req.app.locals.io,
    );

    if ('error' in result) {
      return res.status(result.error!.status).json({ success: false, message: result.error!.message });
    }

    const payload = {
      ...result.payload,
      audioUrl,
      transcript: transcription.transcript,
      transcription,
    };
    return res.json({ success: true, data: payload, ...payload });
  } catch (err) {
    console.error('Voice order error:', err);
    const message = err instanceof Error ? err.message : 'Failed to process voice order';
    return res.status(400).json({ success: false, message });
  }
});

export default router;

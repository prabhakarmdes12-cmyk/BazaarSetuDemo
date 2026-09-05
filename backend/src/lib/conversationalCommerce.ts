import { prisma } from './prisma';
import { buildUnresolvedQuestions, ParsedBasketItem } from './shopBotEngine';

export const ACTIVE_DRAFT_STATUSES = [
  'DRAFT',
  'CUSTOMER_CONFIRMED',
  'SENT_TO_MERCHANT',
  'MERCHANT_REVIEW',
  'CHANGES_PROPOSED',
  'FINAL_QUOTE',
  'NEEDS_OPERATOR_ASSIST',
];

export interface DraftItemLike {
  id: string;
  draftId: string;
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
  createdAt: Date;
}

export interface DraftAdjustmentLike {
  id: string;
  draftId: string;
  itemId?: string | null;
  type: string;
  originalText?: string | null;
  proposedName?: string | null;
  proposedQuantity?: number | null;
  proposedPrice?: number | null;
  status: string;
  reason?: string | null;
  createdAt: Date;
}

export interface DraftLike {
  id: string;
  chatId: string;
  customerId: string;
  shopId: string;
  rawMessage: string;
  status: string;
  quotedSubtotal?: number | null;
  deliveryFee?: number | null;
  finalTotal?: number | null;
  clientActionId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  items: DraftItemLike[];
  adjustments: DraftAdjustmentLike[];
  chat?: {
    customer?: { name: string; phone?: string };
    shop?: { name: string; phone?: string; ownerId?: string; upiId?: string };
  };
}

export function formatDraftItem(item: DraftItemLike) {
  return {
    id: item.id,
    draftId: item.draftId,
    rawText: item.rawText,
    requestedName: item.requestedName,
    quantity: item.quantity,
    unit: item.unit,
    brandPreference: item.brandPreference || undefined,
    matchedProductId: item.matchedProductId || undefined,
    matchConfidence: item.matchConfidence,
    catalogPrice: item.catalogPrice ?? undefined,
    quotedPrice: item.quotedPrice ?? undefined,
    availabilityStatus: item.availabilityStatus,
    requiresClarification: item.availabilityStatus === 'NEEDS_MERCHANT_CHECK' || item.availabilityStatus === 'UNAVAILABLE',
    sourceMessageId: item.sourceMessageId || undefined,
    createdAt: item.createdAt.toISOString(),
  };
}

export function formatDraftAdjustment(adjustment: DraftAdjustmentLike) {
  return {
    id: adjustment.id,
    draftId: adjustment.draftId,
    itemId: adjustment.itemId || undefined,
    type: adjustment.type,
    originalText: adjustment.originalText || undefined,
    proposedName: adjustment.proposedName || undefined,
    proposedQuantity: adjustment.proposedQuantity ?? undefined,
    proposedPrice: adjustment.proposedPrice ?? undefined,
    status: adjustment.status,
    reason: adjustment.reason || undefined,
    createdAt: adjustment.createdAt.toISOString(),
  };
}

export function estimateDraftSubtotal(items: Array<Pick<DraftItemLike, 'quantity' | 'catalogPrice' | 'quotedPrice' | 'availabilityStatus'>>): number {
  return Number(
    items
      .filter((item) => item.availabilityStatus !== 'UNAVAILABLE')
      .reduce((sum, item) => {
        const price = item.quotedPrice ?? item.catalogPrice;
        return typeof price === 'number' && Number.isFinite(price) ? sum + price * item.quantity : sum;
      }, 0)
      .toFixed(2),
  );
}

export function formatDraft(draft: DraftLike) {
  const items = [...draft.items].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()).map(formatDraftItem);
  const adjustments = [...draft.adjustments]
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    .map(formatDraftAdjustment);
  const totalEstimate = estimateDraftSubtotal(draft.items);
  const unresolvedQuestions = buildUnresolvedQuestions(items as ParsedBasketItem[]);

  return {
    id: draft.id,
    draftId: draft.id,
    chatId: draft.chatId,
    conversationId: draft.chatId,
    customerId: draft.customerId,
    shopId: draft.shopId,
    rawMessage: draft.rawMessage,
    status: draft.status,
    quotedSubtotal: draft.quotedSubtotal ?? undefined,
    deliveryFee: draft.deliveryFee ?? 0,
    finalTotal: draft.finalTotal ?? undefined,
    totalEstimate,
    clientActionId: draft.clientActionId || undefined,
    customerName: draft.chat?.customer?.name,
    customerPhone: draft.chat?.customer?.phone,
    shopName: draft.chat?.shop?.name,
    shopPhone: draft.chat?.shop?.phone,
    shopUpiId: draft.chat?.shop?.upiId,
    items,
    adjustments,
    unresolvedQuestions,
    createdAt: draft.createdAt.toISOString(),
    updatedAt: draft.updatedAt.toISOString(),
  };
}

export function summarizeDraftItems(items: Array<Pick<DraftItemLike, 'requestedName' | 'quantity' | 'unit' | 'catalogPrice' | 'quotedPrice' | 'availabilityStatus'>>): string {
  if (items.length === 0) return 'No items in draft yet.';
  return items
    .map((item) => {
      const price = item.quotedPrice ?? item.catalogPrice;
      const priceText = typeof price === 'number' ? ` ₹${price}` : ' price pending';
      const statusText = item.availabilityStatus === 'NEEDS_MERCHANT_CHECK' ? ' merchant check' : item.availabilityStatus.toLowerCase();
      return `${item.requestedName} - ${item.quantity} ${item.unit}${priceText} (${statusText})`;
    })
    .join('\n');
}

export async function loadDraftOrThrow(draftId: string) {
  const draft = await prisma.conversationDraft.findUnique({
    where: { id: draftId },
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
  return draft;
}

export async function findOrCreateConversationalProduct(input: {
  shopId: string;
  name: string;
  price: number;
  unit: string;
  category?: string;
}) {
  const existing = await prisma.product.findFirst({
    where: {
      shopId: input.shopId,
      name: { equals: input.name },
    },
  });
  if (existing) return existing;

  return prisma.product.create({
    data: {
      shopId: input.shopId,
      name: input.name,
      price: input.price,
      unit: input.unit,
      category: input.category || 'Conversational',
      description: 'Created from merchant-confirmed conversational quote',
      isAvailable: true,
    },
  });
}

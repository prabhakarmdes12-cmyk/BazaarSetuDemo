import { prisma } from './prisma';

export const CHITIGRAM_TYPES = {
  BASKET_PROPOSAL: 'BAZAAR.BASKET_PROPOSAL',
  SUBSTITUTION: 'BAZAAR.SUBSTITUTION',
  FINAL_QUOTE: 'BAZAAR.FINAL_QUOTE',
  ORDER_CARD: 'BAZAAR.ORDER_CARD',
  PAYMENT_REQUEST: 'BAZAAR.PAYMENT_REQUEST',
  UDHAAR_RECEIPT: 'BAZAAR.UDHAAR_RECEIPT',
  CALL_RECORD: 'CHITIGRAM.CALL_RECORD',
} as const;

export type ChitigramType = (typeof CHITIGRAM_TYPES)[keyof typeof CHITIGRAM_TYPES];
export type ChitigramParticipant = 'CUSTOMER' | 'SHOP_BOT' | 'MERCHANT' | 'CHITI_OPERATOR';

export interface ChitigramMessageInput {
  chatId: string;
  senderId: string;
  senderRole: ChitigramParticipant;
  type: ChitigramType | string;
  content: string;
  payload?: unknown;
}

export function formatChatMessage(message: {
  id: string;
  chatId: string;
  senderId: string;
  senderRole: string;
  type: string;
  content: string;
  productId?: string | null;
  productData?: string | null;
  isRead?: boolean;
  createdAt: Date;
}) {
  let product = undefined;
  let payload = undefined;

  if (message.productData) {
    try {
      const parsed = JSON.parse(message.productData);
      if (message.type === 'PRODUCT') {
        product = parsed;
      } else {
        payload = parsed;
      }
    } catch {
      // Ignore malformed payloads; preserve the human-readable content.
    }
  }

  return {
    id: message.id,
    chatId: message.chatId,
    senderId: message.senderId,
    senderRole: message.senderRole,
    type: message.type,
    content: message.content,
    productId: message.productId || undefined,
    product,
    payload,
    isRead: message.isRead,
    createdAt: message.createdAt.toISOString(),
  };
}

export async function appendChitigramMessage(input: ChitigramMessageInput, io?: { to: (room: string) => { emit: (event: string, data: unknown) => void } }) {
  const message = await prisma.message.create({
    data: {
      chatId: input.chatId,
      senderId: input.senderId,
      senderRole: input.senderRole,
      type: input.type,
      content: input.content,
      productData: input.payload === undefined ? '' : JSON.stringify(input.payload),
    },
  });

  await prisma.chat.update({
    where: { id: input.chatId },
    data: { updatedAt: new Date() },
  });

  const formatted = formatChatMessage(message);
  io?.to(`chat:${input.chatId}`).emit('new_message', formatted);
  io?.to(`chat:${input.chatId}`).emit('chat_updated', { chatId: input.chatId, lastMessage: input.content });
  return formatted;
}

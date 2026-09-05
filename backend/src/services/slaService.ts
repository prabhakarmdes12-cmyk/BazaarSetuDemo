import { prisma } from '../lib/prisma';
import { queueOperationalEvent } from '../lib/operationalEvents';

type SocketLike = { to: (room: string) => { emit: (event: string, data: unknown) => void } };

const REMINDER_AFTER_MS = 2 * 60 * 1000;
const DELAYED_AFTER_MS = 3 * 60 * 1000;

function minutesWaitingSince(date: Date, now: Date): number {
  return Math.max(0, Math.floor((now.getTime() - date.getTime()) / 60000));
}

async function eventExists(eventId: string): Promise<boolean> {
  const existing = await prisma.operationalEventLog.findUnique({ where: { eventId }, select: { id: true } });
  return !!existing;
}

async function createMerchantNotification(input: {
  userId?: string | null;
  draftId: string;
  chatId: string;
  title: string;
  body: string;
  type: string;
  io?: SocketLike;
}) {
  if (!input.userId) return;
  await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      data: JSON.stringify({ draftId: input.draftId, chatId: input.chatId }),
    },
  });
  input.io?.to(`user:${input.userId}`).emit('notification', { type: input.type, draftId: input.draftId, chatId: input.chatId });
}

export async function runMerchantSlaSweep(io?: SocketLike, now = new Date()) {
  const reminderCutoff = new Date(now.getTime() - REMINDER_AFTER_MS);
  const delayedCutoff = new Date(now.getTime() - DELAYED_AFTER_MS);

  const candidates = await prisma.conversationDraft.findMany({
    where: {
      status: { in: ['SENT_TO_MERCHANT', 'MERCHANT_REVIEW'] },
      updatedAt: { lte: reminderCutoff },
    },
    include: {
      items: true,
      adjustments: true,
      chat: {
        include: {
          customer: { select: { name: true, phone: true } },
          shop: { select: { name: true, phone: true, ownerId: true } },
        },
      },
    },
  });

  const emitted: Array<{ draftId: string; eventType: string }> = [];

  for (const draft of candidates as Array<any>) {
    const waitingMinutes = minutesWaitingSince(draft.updatedAt, now);
    const merchantUserId = draft.chat?.shop?.ownerId;

    if (draft.status === 'SENT_TO_MERCHANT') {
      const reminderEventId = `evt_sla_reminder_${draft.id}`;
      if (!(await eventExists(reminderEventId))) {
        await createMerchantNotification({
          userId: merchantUserId,
          draftId: draft.id,
          chatId: draft.chatId,
          title: 'Order request reminder',
          body: `${draft.chat?.customer?.name || 'Customer'} ka request ${waitingMinutes} min se wait kar raha hai`,
          type: 'MERCHANT_REMINDER',
          io,
        });
        await queueOperationalEvent({
          eventId: reminderEventId,
          eventType: 'BAZAAR.MERCHANT_REMINDER',
          shopId: draft.shopId,
          customerId: draft.customerId,
          conversationId: draft.chatId,
          payload: {
            draftId: draft.id,
            status: draft.status,
            waitingMinutes,
            itemsCount: draft.items.length,
          },
        });
        emitted.push({ draftId: draft.id, eventType: 'BAZAAR.MERCHANT_REMINDER' });
      }
    }

    if (draft.updatedAt <= delayedCutoff) {
      const delayedEventId = `evt_sla_delayed_${draft.id}`;
      if (!(await eventExists(delayedEventId))) {
        await prisma.conversationDraft.update({
          where: { id: draft.id },
          data: { status: 'NEEDS_OPERATOR_ASSIST' },
        });
        await queueOperationalEvent({
          eventId: delayedEventId,
          eventType: 'BAZAAR.MERCHANT_RESPONSE_DELAYED',
          shopId: draft.shopId,
          customerId: draft.customerId,
          conversationId: draft.chatId,
          payload: {
            draftId: draft.id,
            previousStatus: draft.status,
            status: 'NEEDS_OPERATOR_ASSIST',
            waitingMinutes,
            itemsCount: draft.items.length,
            shopName: draft.chat?.shop?.name,
            customerPhone: draft.chat?.customer?.phone,
          },
        });
        emitted.push({ draftId: draft.id, eventType: 'BAZAAR.MERCHANT_RESPONSE_DELAYED' });
        io?.to(`chat:${draft.chatId}`).emit('chat_updated', { chatId: draft.chatId, status: 'NEEDS_OPERATOR_ASSIST' });
      }
    }
  }

  return { checked: candidates.length, emitted };
}

export function startMerchantSlaService(io?: SocketLike) {
  const intervalMs = Number(process.env.SLA_SWEEP_INTERVAL_MS || 60_000);
  const timer = setInterval(() => {
    runMerchantSlaSweep(io).catch((err: any) => console.error('Merchant SLA sweep failed:', err));
  }, intervalMs);
  timer.unref?.();
  return timer;
}

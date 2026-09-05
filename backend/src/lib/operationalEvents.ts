import { createHmac, randomUUID } from 'crypto';
import { prisma } from './prisma';

export const OPERATIONAL_EVENT_VERSION = '1.0.0';

export interface OperationalEventInput {
  eventType: string;
  shopId?: string | null;
  customerId?: string | null;
  conversationId?: string | null;
  orderId?: string | null;
  payload?: unknown;
  eventId?: string;
  version?: string;
}

export interface OperationalEventEnvelope {
  eventId: string;
  eventType: string;
  version: string;
  shopId?: string | null;
  customerId?: string | null;
  conversationId?: string | null;
  orderId?: string | null;
  occurredAt: string;
  payload: unknown;
  signature?: string;
}

function signEnvelope(envelope: Omit<OperationalEventEnvelope, 'signature'>): string | undefined {
  const secret = process.env.CHITI_CONSOLE_WEBHOOK_SECRET || process.env.CHITI_CONSOLE_SECRET;
  if (!secret) return undefined;
  return createHmac('sha256', secret).update(JSON.stringify(envelope)).digest('hex');
}

export function buildOperationalEventEnvelope(input: OperationalEventInput): OperationalEventEnvelope {
  const eventId = input.eventId || `evt_bazaar_${randomUUID()}`;
  const version = input.version || OPERATIONAL_EVENT_VERSION;
  const occurredAt = new Date().toISOString();
  const envelopeWithoutSignature: Omit<OperationalEventEnvelope, 'signature'> = {
    eventId,
    eventType: input.eventType,
    version,
    shopId: input.shopId ?? null,
    customerId: input.customerId ?? null,
    conversationId: input.conversationId ?? null,
    orderId: input.orderId ?? null,
    occurredAt,
    payload: input.payload ?? {},
  };
  const signature = signEnvelope(envelopeWithoutSignature);
  return signature ? { ...envelopeWithoutSignature, signature } : envelopeWithoutSignature;
}

async function attemptConfiguredDelivery(eventLogId: string, envelope: OperationalEventEnvelope) {
  const url = process.env.CHITI_CONSOLE_WEBHOOK_URL;
  if (!url) return;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(envelope.signature && { 'X-Chiti-Signature': envelope.signature }),
        'X-BazaarSetu-Event-Id': envelope.eventId,
      },
      body: JSON.stringify(envelope),
    });

    await prisma.operationalEventLog.update({
      where: { id: eventLogId },
      data: { delivered: response.ok, attempts: { increment: 1 } },
    });
  } catch {
    await prisma.operationalEventLog.update({
      where: { id: eventLogId },
      data: { delivered: false, attempts: { increment: 1 } },
    });
  }
}

/**
 * Queue an idempotent operational event for Chiti Console delivery. Commerce is
 * never blocked by console availability; callers persist the envelope here and
 * retry workers can deliver it later.
 */
export async function queueOperationalEvent(input: OperationalEventInput) {
  const envelope = buildOperationalEventEnvelope(input);

  try {
    const eventLog = await prisma.operationalEventLog.create({
      data: {
        eventId: envelope.eventId,
        eventType: envelope.eventType,
        version: envelope.version,
        shopId: envelope.shopId || undefined,
        customerId: envelope.customerId || undefined,
        conversationId: envelope.conversationId || undefined,
        orderId: envelope.orderId || undefined,
        payload: JSON.stringify(envelope),
        delivered: false,
        attempts: 0,
        occurredAt: new Date(envelope.occurredAt),
      },
    });

    await attemptConfiguredDelivery(eventLog.id, envelope);
    return prisma.operationalEventLog.findUnique({ where: { id: eventLog.id } });
  } catch (err) {
    // Prisma unique-constraint error: make repeated clientActionId-derived
    // events idempotent by returning the already queued row.
    if (typeof err === 'object' && err !== null && 'code' in err && (err as { code?: string }).code === 'P2002') {
      const existing = await prisma.operationalEventLog.findUnique({ where: { eventId: envelope.eventId } });
      if (existing) return existing;
    }
    throw err;
  }
}

export function parseOperationalPayload(payload: string): unknown {
  try {
    return JSON.parse(payload);
  } catch {
    return payload;
  }
}

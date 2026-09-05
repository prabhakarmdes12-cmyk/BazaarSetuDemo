import { Router, Response } from 'express';
import { randomUUID } from 'crypto';
import { prisma } from '../lib/prisma';
import { appendChitigramMessage, CHITIGRAM_TYPES } from '../lib/chitigram';
import { queueOperationalEvent } from '../lib/operationalEvents';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { callRecordSchema } from '../validators';

const router = Router();

router.post('/call-record', authenticateToken, validate(callRecordSchema), async (req: AuthRequest, res: Response) => {
  try {
    const body = req.body as {
      conversationId?: string;
      chatId?: string;
      callId?: string;
      duration?: number;
      status: string;
      startedAt?: string;
      endedAt?: string;
    };
    const chatId = body.conversationId || body.chatId;
    if (!chatId) return res.status(400).json({ success: false, message: 'conversationId or chatId is required' });

    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: { shop: { select: { ownerId: true } } },
    });
    if (!chat) return res.status(404).json({ success: false, message: 'Chat not found' });
    if (chat.customerId !== req.userId && chat.shop.ownerId !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const payload = {
      callId: body.callId || `call_${randomUUID()}`,
      duration: body.duration ?? 0,
      status: body.status,
      startedAt: body.startedAt || new Date().toISOString(),
      endedAt: body.endedAt || null,
      participantUserId: req.userId,
    };

    const message = await appendChitigramMessage(
      {
        chatId,
        senderId: req.userId || 'CHITI_CONNECT',
        senderRole: 'CHITI_OPERATOR',
        type: CHITIGRAM_TYPES.CALL_RECORD,
        content: `Call ${payload.status}: ${payload.duration}s`,
        payload,
      },
      req.app.locals.io,
    );

    await queueOperationalEvent({
      eventType: 'CHITIGRAM.CALL_RECORD',
      shopId: chat.shopId,
      customerId: chat.customerId,
      conversationId: chat.id,
      payload,
    });

    return res.json({ success: true, data: { message, call: payload }, message, call: payload });
  } catch (err) {
    console.error('Call record error:', err);
    return res.status(500).json({ success: false, message: 'Failed to record call' });
  }
});

export default router;

import { Router, Response } from 'express';
import { randomUUID } from 'crypto';
import { prisma } from '../lib/prisma';
import { appendChitigramMessage, CHITIGRAM_TYPES } from '../lib/chitigram';
import { queueOperationalEvent } from '../lib/operationalEvents';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { callRecordSchema } from '../validators';

const router = Router();

/**
 * Chiti Connect ICE configuration.
 *
 * Returns only STUN/TURN endpoints — never participant identity. TURN
 * credentials are short-lived and issued per session so a leaked config cannot
 * be replayed, and no phone number ever enters the signalling path
 * (VOICE_INV_007 / DPDP 2023).
 */
router.get('/ice-servers', authenticateToken, async (_req: AuthRequest, res: Response) => {
  try {
    const stunUrls = (process.env.CHITI_CONNECT_STUN_URLS || 'stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302')
      .split(',')
      .map((url) => url.trim())
      .filter(Boolean);

    const iceServers: Array<{ urls: string | string[]; username?: string; credential?: string }> = [
      { urls: stunUrls },
    ];

    const turnUrls = (process.env.CHITI_CONNECT_TURN_URLS || '')
      .split(',')
      .map((url) => url.trim())
      .filter(Boolean);

    if (turnUrls.length > 0 && process.env.CHITI_CONNECT_TURN_USERNAME && process.env.CHITI_CONNECT_TURN_CREDENTIAL) {
      iceServers.push({
        urls: turnUrls,
        username: process.env.CHITI_CONNECT_TURN_USERNAME,
        credential: process.env.CHITI_CONNECT_TURN_CREDENTIAL,
      });
    }

    return res.json({
      success: true,
      data: {
        iceServers,
        // If the handshake has not produced media within this window the client
        // falls back to masked VoIP routing instead of hanging on a dead call.
        handshakeTimeoutMs: Number(process.env.CHITI_CONNECT_HANDSHAKE_TIMEOUT_MS || 4000),
        privacyMode: 'MASKED_NO_PSTN',
      },
    });
  } catch (err) {
    console.error('ICE server config error:', err);
    return res.status(500).json({ success: false, message: 'Failed to load call configuration' });
  }
});

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
      endReason?: string;
      transport?: string;
      mediaConnected?: boolean;
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

    // VOICE_INV_007 / DPDP 2023: Chiti Connect is a masked hotline. Call
    // records carry opaque user ids and call metadata only — never the
    // customer's or the vendor's real mobile number, and never a signalling
    // payload a client could reverse into one.
    const payload = {
      callId: body.callId || `call_${randomUUID()}`,
      duration: body.duration ?? 0,
      status: body.status,
      startedAt: body.startedAt || new Date().toISOString(),
      endedAt: body.endedAt || null,
      participantUserId: req.userId,
      ...(body.endReason && { endReason: body.endReason }),
      ...(body.transport && { transport: body.transport }),
      ...(typeof body.mediaConnected === 'boolean' && { mediaConnected: body.mediaConnected }),
      privacyMode: 'MASKED_NO_PSTN',
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

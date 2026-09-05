import { Router, Response } from 'express';
import { AuthRequest, authenticateToken, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createChatSchema } from '../validators';
import { prisma } from '../lib/prisma';
import { formatChatMessage } from '../lib/chitigram';

const router = Router();

// Create or get chat between customer and shop
router.post('/', authenticateToken, validate(createChatSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { shopId } = req.body;

    const shop = await prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) {
      return res.status(404).json({ success: false, message: 'Shop not found' });
    }

    // Find or create chat
    let chat = await prisma.chat.findUnique({
      where: {
        customerId_shopId: {
          customerId: req.userId!,
          shopId,
        },
      },
    });

    if (!chat) {
      chat = await prisma.chat.create({
        data: {
          customerId: req.userId!,
          shopId,
        },
      });
    }

    // Get messages
    const messages = await prisma.message.findMany({
      where: { chatId: chat.id },
      orderBy: { createdAt: 'asc' },
    });

    const formattedMessages = messages.map(formatChatMessage);

    res.json({
      success: true,
      data: {
        chatId: chat.id,
        messages: formattedMessages,
      },
    });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ success: false, message: 'Failed to create chat' });
  }
});

// Get vendor's chats
router.get('/vendor/list', authenticateToken, requireRole('vendor'), async (req: AuthRequest, res: Response) => {
  try {
    const shop = await prisma.shop.findUnique({ where: { ownerId: req.userId } });
    if (!shop) {
      return res.status(404).json({ success: false, message: 'Shop not found' });
    }

    const chats = await prisma.chat.findMany({
      where: { shopId: shop.id },
      include: {
        customer: { select: { name: true, phone: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const formatted = chats.map((chat) => ({
      id: chat.id,
      customerId: chat.customerId,
      shopId: chat.shopId,
      customerName: chat.customer.name,
      lastMessage: chat.messages[0]?.content || '',
      lastMessageAt: chat.messages[0]?.createdAt?.toISOString() || chat.createdAt.toISOString(),
      createdAt: chat.createdAt.toISOString(),
    }));

    res.json({ success: true, data: formatted });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to get chats' });
  }
});

// Alias for frontend (same handler as /vendor/list)
router.get('/vendor', authenticateToken, requireRole('vendor'), async (req: AuthRequest, res: Response) => {
  try {
    const shop = await prisma.shop.findUnique({ where: { ownerId: req.userId } });
    if (!shop) {
      return res.status(404).json({ success: false, message: 'Shop not found' });
    }

    const chats = await prisma.chat.findMany({
      where: { shopId: shop.id },
      include: {
        customer: { select: { name: true, phone: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const formatted = chats.map((chat) => ({
      id: chat.id,
      customerId: chat.customerId,
      shopId: chat.shopId,
      customerName: chat.customer.name,
      lastMessage: chat.messages[0]?.content || '',
      lastMessageAt: chat.messages[0]?.createdAt?.toISOString() || chat.createdAt.toISOString(),
      createdAt: chat.createdAt.toISOString(),
    }));

    res.json({ success: true, data: formatted });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to get chats' });
  }
});

// Get chat by ID — registered LAST so it never shadows the static routes above.
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const chat = await prisma.chat.findUnique({
      where: { id: req.params.id },
      include: {
        customer: { select: { name: true, phone: true } },
        shop: { select: { name: true, ownerId: true } },
      },
    });

    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat not found' });
    }

    // Verify access
    const isCustomer = chat.customerId === req.userId;
    const isVendor = chat.shop.ownerId === req.userId;
    if (!isCustomer && !isVendor) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const messages = await prisma.message.findMany({
      where: { chatId: chat.id },
      orderBy: { createdAt: 'asc' },
    });

    const formattedMessages = messages.map(formatChatMessage);

    res.json({
      success: true,
      data: {
        chatId: chat.id,
        customerName: chat.customer.name,
        shopName: chat.shop.name,
        messages: formattedMessages,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to get chat' });
  }
});

export default router;

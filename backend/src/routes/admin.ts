import { Router, Response } from 'express';
import { AuthRequest, authenticateToken, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { getPagination } from '../middleware/pagination';
import { adminToggleShopSchema } from '../validators';
import { prisma } from '../lib/prisma';
import { appendChitigramMessage } from '../lib/chitigram';
import { queueOperationalEvent } from '../lib/operationalEvents';
import { buildWhatsAppLink } from '../lib/whatsapp';
import { runMerchantSlaSweep } from '../services/slaService';

const router = Router();
const adminOnly = requireRole('admin');

// Get all shops
router.get('/shops', authenticateToken, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const { limit, offset } = getPagination(req);
    const [shops, total] = await Promise.all([
      prisma.shop.findMany({
        include: { owner: { select: { name: true, phone: true } } },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.shop.count(),
    ]);

    const formatted = shops.map((shop: any) => ({
      id: shop.id, ownerId: shop.ownerId, name: shop.name,
      description: shop.description, address: shop.address, phone: shop.phone,
      image: shop.image, isActive: shop.isActive, rating: shop.rating,
      createdAt: shop.createdAt.toISOString(),
    }));

    res.json({ success: true, data: formatted, total, limit, offset });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to get shops' });
  }
});

// Toggle shop
router.patch('/shops/:id', authenticateToken, adminOnly, validate(adminToggleShopSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { isActive } = req.body;
    const shop = await prisma.shop.update({
      where: { id: req.params.id },
      data: { isActive },
    });
    res.json({ success: true, data: shop });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update shop' });
  }
});

// Get all orders
router.get('/orders', authenticateToken, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const { limit, offset } = getPagination(req);
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        include: {
          items: true,
          shop: { select: { name: true } },
          customer: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.order.count(),
    ]);

    const formatted = orders.map((order: any) => ({
      id: order.id, shopId: order.shopId, shopName: order.shop.name,
      customerName: order.customer.name,
      items: order.items.map((item: any) => ({
        id: item.id, orderId: item.orderId, productId: item.productId,
        productName: item.productName, quantity: item.quantity, price: item.price,
      })),
      totalAmount: order.totalAmount, status: order.status,
      createdAt: order.createdAt.toISOString(),
    }));

    res.json({ success: true, data: formatted, total, limit, offset });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to get orders' });
  }
});

// Enhanced analytics with daily trends
router.get('/analytics', authenticateToken, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const [totalShops, activeShops, totalOrders, totalUsers, allOrders, customers, vendors] = await Promise.all([
      prisma.shop.count(),
      prisma.shop.count({ where: { isActive: true } }),
      prisma.order.count(),
      prisma.user.count(),
      prisma.order.findMany({ select: { totalAmount: true, status: true, createdAt: true } }),
      prisma.user.count({ where: { role: 'customer' } }),
      prisma.user.count({ where: { role: 'vendor' } }),
    ]);

    const totalRevenue = allOrders
      .filter((o: any) => o.status === 'completed')
      .reduce((sum: any, o: any) => sum + o.totalAmount, 0);

    const pendingOrders = allOrders.filter((o: any) => o.status === 'pending').length;
    const completedOrders = allOrders.filter((o: any) => o.status === 'completed').length;

    // Orders per day (last 7 days)
    const dailyMap = new Map<string, { orders: number; revenue: number }>();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    allOrders
      .filter((o: any) => o.createdAt >= sevenDaysAgo)
      .forEach((o: any) => {
        const day = o.createdAt.toISOString().split('T')[0];
        const existing = dailyMap.get(day) || { orders: 0, revenue: 0 };
        existing.orders += 1;
        if (o.status === 'completed') existing.revenue += o.totalAmount;
        dailyMap.set(day, existing);
      });

    const dailyTrends = Array.from(dailyMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a: any, b: any) => a.date.localeCompare(b.date));

    res.json({
      success: true,
      data: {
        totalShops, activeShops, totalOrders, totalUsers,
        totalRevenue, pendingOrders, completedOrders,
        customers, vendors,
        dailyTrends,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to get analytics' });
  }
});

type RadarBucket =
  | 'ACTIVE_REQUESTS'
  | 'WAITING_MERCHANT'
  | 'NEGOTIATING'
  | 'PAYMENT_PENDING'
  | 'PREPARING'
  | 'READY'
  | 'SLA_BREACHED';

const radarBuckets: RadarBucket[] = [
  'ACTIVE_REQUESTS',
  'WAITING_MERCHANT',
  'NEGOTIATING',
  'PAYMENT_PENDING',
  'PREPARING',
  'READY',
  'SLA_BREACHED',
];

function emptyRadarBuckets() {
  return radarBuckets.reduce<Record<RadarBucket, unknown[]>>((acc, bucket) => {
    acc[bucket] = [];
    return acc;
  }, {} as Record<RadarBucket, unknown[]>);
}

function waitTime(updatedAt: Date) {
  const waitTimeMs = Math.max(0, Date.now() - updatedAt.getTime());
  return { waitTimeMs, waitMinutes: Math.floor(waitTimeMs / 60000) };
}

function draftBucket(status: string): RadarBucket {
  if (status === 'SENT_TO_MERCHANT') return 'WAITING_MERCHANT';
  if (status === 'MERCHANT_REVIEW' || status === 'CHANGES_PROPOSED') return 'NEGOTIATING';
  if (status === 'FINAL_QUOTE') return 'PAYMENT_PENDING';
  if (status === 'NEEDS_OPERATOR_ASSIST') return 'SLA_BREACHED';
  return 'ACTIVE_REQUESTS';
}

// Chiti Console Marketplace Radar — active conversational requests grouped by operational state.
router.get('/radar/active-requests', authenticateToken, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    await runMerchantSlaSweep(req.app.locals.io);

    const buckets = emptyRadarBuckets();
    const activeDrafts = await prisma.conversationDraft.findMany({
      where: { status: { in: ['DRAFT', 'CUSTOMER_CONFIRMED', 'SENT_TO_MERCHANT', 'MERCHANT_REVIEW', 'CHANGES_PROPOSED', 'FINAL_QUOTE', 'NEEDS_OPERATOR_ASSIST'] } },
      include: {
        items: true,
        adjustments: true,
        chat: {
          include: {
            customer: { select: { name: true, phone: true } },
            shop: { select: { name: true, phone: true, ownerId: true } },
            messages: { orderBy: { createdAt: 'desc' }, take: 1 },
          },
        },
      },
      orderBy: { updatedAt: 'asc' },
    });

    for (const draft of activeDrafts as Array<any>) {
      const unreadCount = await prisma.message.count({
        where: { chatId: draft.chatId, isRead: false, senderRole: { in: ['CUSTOMER', 'customer'] } },
      });
      const row = {
        id: draft.id,
        draftId: draft.id,
        chatId: draft.chatId,
        shopId: draft.shopId,
        shopName: draft.chat?.shop?.name || 'Shop',
        shopPhone: draft.chat?.shop?.phone || '',
        customerId: draft.customerId,
        customerName: draft.chat?.customer?.name || 'Customer',
        customerPhone: draft.chat?.customer?.phone || '',
        status: draft.status,
        itemsCount: draft.items.length,
        adjustmentsCount: draft.adjustments.length,
        hasUnreadMessages: unreadCount > 0,
        unreadCount,
        lastMessage: draft.chat?.messages?.[0]?.content || '',
        ...waitTime(draft.updatedAt),
        updatedAt: draft.updatedAt.toISOString(),
        createdAt: draft.createdAt.toISOString(),
      };
      const bucket = draftBucket(draft.status);
      buckets.ACTIVE_REQUESTS.push(row);
      if (bucket !== 'ACTIVE_REQUESTS') buckets[bucket].push(row);
    }

    const activeOrders = await prisma.order.findMany({
      where: { status: { in: ['pending', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'pickup'] } },
      include: {
        shop: { select: { name: true, phone: true } },
        customer: { select: { name: true, phone: true } },
        items: true,
      },
      orderBy: { updatedAt: 'asc' },
    });

    for (const order of activeOrders as Array<any>) {
      const row = {
        id: order.id,
        orderId: order.id,
        draftId: order.conversationDraftId || undefined,
        shopId: order.shopId,
        shopName: order.shop?.name || 'Shop',
        shopPhone: order.shop?.phone || '',
        customerId: order.customerId,
        customerName: order.customer?.name || 'Customer',
        customerPhone: order.customer?.phone || '',
        status: order.status,
        itemsCount: order.items.length,
        totalAmount: order.totalAmount,
        hasUnreadMessages: false,
        unreadCount: 0,
        ...waitTime(order.updatedAt),
        updatedAt: order.updatedAt.toISOString(),
        createdAt: order.createdAt.toISOString(),
      };
      buckets.ACTIVE_REQUESTS.push(row);
      if (order.status === 'ready' || order.status === 'pickup') buckets.READY.push(row);
      else buckets.PREPARING.push(row);
    }

    res.json({ success: true, data: buckets, generatedAt: new Date().toISOString() });
  } catch (err) {
    console.error('Radar active requests error:', err);
    res.status(500).json({ success: false, message: 'Failed to load radar feed' });
  }
});

// Operator escalation: recommend an alternate shop and/or prepare phone/WhatsApp merchant outreach.
router.post('/radar/:draftId/escalate', authenticateToken, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const { alternateShopId, action, note } = req.body as { alternateShopId?: string; action?: string; note?: string };
    const draft = await prisma.conversationDraft.findUnique({
      where: { id: req.params.draftId },
      include: {
        chat: {
          include: {
            customer: { select: { name: true, phone: true } },
            shop: { select: { name: true, phone: true, ownerId: true } },
          },
        },
        items: true,
      },
    });
    if (!draft) return res.status(404).json({ success: false, message: 'Draft not found' });

    const alternateShop = alternateShopId
      ? await prisma.shop.findUnique({ where: { id: alternateShopId }, select: { id: true, name: true, phone: true } })
      : null;
    const merchantPhone = draft.chat?.shop?.phone || '';
    const escalationText = note || `Chiti operator assist: request ${draft.id.slice(0, 8)} needs merchant response.`;
    const phoneLink = merchantPhone ? `tel:${merchantPhone}` : null;
    const whatsappLink = merchantPhone ? buildWhatsAppLink(merchantPhone, escalationText) : null;

    await prisma.conversationDraft.update({ where: { id: draft.id }, data: { status: 'NEEDS_OPERATOR_ASSIST' } });

    await appendChitigramMessage(
      {
        chatId: draft.chatId,
        senderId: req.userId || 'CHITI_OPERATOR',
        senderRole: 'CHITI_OPERATOR',
        type: 'BAZAAR.OPERATOR_ESCALATION',
        content: alternateShop
          ? `Chiti operator recommended alternate shop: ${alternateShop.name}`
          : `Chiti operator escalated request for merchant follow-up${action ? ` (${action})` : ''}.`,
        payload: {
          draftId: draft.id,
          action: action || 'NOTIFY_MERCHANT',
          note: escalationText,
          phoneLink,
          whatsappLink,
          alternateShop,
        },
      },
      req.app.locals.io,
    );

    if (draft.chat?.shop?.ownerId) {
      await prisma.notification.create({
        data: {
          userId: draft.chat.shop.ownerId,
          type: 'OPERATOR_ESCALATION',
          title: 'Chiti operator assist',
          body: escalationText,
          data: JSON.stringify({ draftId: draft.id, chatId: draft.chatId, alternateShopId }),
        },
      });
      req.app.locals.io?.to(`user:${draft.chat.shop.ownerId}`).emit('notification', { type: 'OPERATOR_ESCALATION', draftId: draft.id });
    }

    await queueOperationalEvent({
      eventType: 'BAZAAR.OPERATOR_ESCALATED',
      shopId: draft.shopId,
      customerId: draft.customerId,
      conversationId: draft.chatId,
      payload: {
        draftId: draft.id,
        action: action || 'NOTIFY_MERCHANT',
        alternateShopId,
        alternateShopName: alternateShop?.name,
        phoneLink,
        whatsappLink,
      },
    });

    res.json({
      success: true,
      data: {
        draftId: draft.id,
        status: 'NEEDS_OPERATOR_ASSIST',
        phoneLink,
        whatsappLink,
        alternateShop,
      },
    });
  } catch (err) {
    console.error('Radar escalation error:', err);
    res.status(500).json({ success: false, message: 'Failed to escalate request' });
  }
});

export default router;

import { Router, Request, Response } from 'express';
import { randomBytes } from 'crypto';
import { AuthRequest, authenticateToken, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { getPagination } from '../middleware/pagination';
import { createOrderSchema, updateOrderStatusSchema } from '../validators';
import { prisma } from '../lib/prisma';
import { appendChitigramMessage, CHITIGRAM_TYPES } from '../lib/chitigram';
import { queueOperationalEvent } from '../lib/operationalEvents';

const router = Router();

const STATUS_ORDER = ['pending', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'pickup', 'completed'];

function buildTimeline(status: string, createdAt: Date, updatedAt: Date) {
  const currentIndex = STATUS_ORDER.indexOf(status);
  return STATUS_ORDER.map((s, index) => ({
    status: s,
    reached: index <= currentIndex,
    timestamp:
      index === 0
        ? createdAt.toISOString()
        : index === currentIndex
          ? updatedAt.toISOString()
          : null,
  }));
}

// Create order from cart
router.post('/', authenticateToken, validate(createOrderSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { shopId } = req.body;

    const cart = await prisma.cart.findUnique({
      where: { customerId_shopId: { customerId: req.userId!, shopId } },
      include: { items: { include: { product: true } } },
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    const totalAmount = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const order = await prisma.order.create({
      data: {
        customerId: req.userId!,
        shopId,
        totalAmount,
        status: 'pending',
        publicToken: randomBytes(16).toString('hex'),
        items: {
          create: cart.items.map((item) => ({
            productId: item.productId,
            productName: item.product.name,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
      include: { items: true, shop: { select: { ownerId: true, name: true } } },
    });

    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

    // Notify vendor
    await prisma.notification.create({
      data: {
        userId: order.shop.ownerId,
        type: 'NEW_ORDER',
        title: 'Naya Order aaya!',
        body: `₹${totalAmount} ka order aaya hai`,
        data: JSON.stringify({ orderId: order.id }),
      },
    });

    const io = req.app.locals.io;
    if (io) {
      io.to(`user:${order.shop.ownerId}`).emit('notification', {
        type: 'NEW_ORDER',
        orderId: order.id,
      });
    }

    await queueOperationalEvent({
      eventType: 'BAZAAR.ORDER_REQUESTED',
      shopId,
      customerId: req.userId!,
      orderId: order.id,
      payload: { itemsCount: order.items.length, estimatedAmount: totalAmount, paymentMethod: 'CART_CHECKOUT' },
    });

    res.json({
      success: true,
      data: {
        orderId: order.id,
        status: order.status,
        totalAmount: order.totalAmount,
        publicToken: order.publicToken,
      },
    });
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ success: false, message: 'Failed to create order' });
  }
});

// Repeat order — recreate cart from a previous order
router.post('/repeat/:orderId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const prevOrder = await prisma.order.findUnique({
      where: { id: req.params.orderId },
      include: { items: true },
    });

    if (!prevOrder || prevOrder.customerId !== req.userId) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Upsert cart
    let cart = await prisma.cart.upsert({
      where: { customerId_shopId: { customerId: req.userId!, shopId: prevOrder.shopId } },
      create: { customerId: req.userId!, shopId: prevOrder.shopId },
      update: {},
    });

    // Clear existing cart items
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

    // Add items from previous order
    for (const item of prevOrder.items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (product && product.isAvailable) {
        await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId: item.productId,
            quantity: item.quantity,
            price: product.price,
          },
        });
      }
    }

    // Return the cart
    const updatedCart = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: { items: { include: { product: true } }, shop: { select: { name: true } } },
    });

    const totalAmount = updatedCart!.items.reduce((s, i) => s + i.price * i.quantity, 0);

    res.json({
      success: true,
      data: {
        cart: {
          id: updatedCart!.id,
          shopId: updatedCart!.shopId,
          shopName: updatedCart!.shop.name,
          items: updatedCart!.items.map((i) => ({
            id: i.id, cartId: i.cartId, productId: i.productId,
            product: { id: i.product.id, name: i.product.name, price: i.product.price, unit: i.product.unit, image: i.product.image, isAvailable: i.product.isAvailable },
            quantity: i.quantity, price: i.price,
          })),
          totalAmount,
        },
      },
    });
  } catch (err) {
    console.error('Repeat order error:', err);
    res.status(500).json({ success: false, message: 'Failed to repeat order' });
  }
});

// Get customer's orders
router.get('/my', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { limit, offset } = getPagination(req);
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { customerId: req.userId },
        include: { items: true, shop: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.order.count({ where: { customerId: req.userId } }),
    ]);

    const formatted = orders.map((order) => ({
      id: order.id,
      customerId: order.customerId,
      shopId: order.shopId,
      shopName: order.shop.name,
      publicToken: order.publicToken,
      items: order.items.map((item) => ({
        id: item.id, orderId: item.orderId, productId: item.productId,
        productName: item.productName, quantity: item.quantity, price: item.price,
      })),
      totalAmount: order.totalAmount,
      status: order.status,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    }));

    res.json({ success: true, data: formatted, total, limit, offset });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to get orders' });
  }
});

// Get vendor's orders
router.get('/vendor', authenticateToken, requireRole('vendor'), async (req: AuthRequest, res: Response) => {
  try {
    const shop = await prisma.shop.findUnique({ where: { ownerId: req.userId } });
    if (!shop) return res.status(404).json({ success: false, message: 'Shop not found' });

    const { limit, offset } = getPagination(req);
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { shopId: shop.id },
        include: { items: true, customer: { select: { name: true, phone: true } } },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.order.count({ where: { shopId: shop.id } }),
    ]);

    const formatted = orders.map((order) => ({
      id: order.id,
      customerId: order.customerId,
      shopId: order.shopId,
      customerName: order.customer.name,
      items: order.items.map((item) => ({
        id: item.id, orderId: item.orderId, productId: item.productId,
        productName: item.productName, quantity: item.quantity, price: item.price,
      })),
      totalAmount: order.totalAmount,
      status: order.status,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    }));

    res.json({ success: true, data: formatted, total, limit, offset });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to get orders' });
  }
});

// Vendor daily summary
router.get('/vendor/summary', authenticateToken, requireRole('vendor'), async (req: AuthRequest, res: Response) => {
  try {
    const shop = await prisma.shop.findUnique({ where: { ownerId: req.userId } });
    if (!shop) return res.status(404).json({ success: false, message: 'Shop not found' });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayOrders, allOrders] = await Promise.all([
      prisma.order.findMany({
        where: { shopId: shop.id, createdAt: { gte: today } },
        include: { items: true },
      }),
      prisma.order.findMany({
        where: { shopId: shop.id, status: 'completed' },
        include: { items: true },
      }),
    ]);

    const todayRevenue = todayOrders
      .filter((o) => o.status === 'completed')
      .reduce((s, o) => s + o.totalAmount, 0);

    const pendingCount = todayOrders.filter((o) => ['pending', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'pickup'].includes(o.status)).length;
    const completedToday = todayOrders.filter((o) => o.status === 'completed').length;

    // Top products
    const productMap = new Map<string, { name: string; qty: number; revenue: number }>();
    allOrders.flatMap((o) => o.items).forEach((item) => {
      const existing = productMap.get(item.productName) || { name: item.productName, qty: 0, revenue: 0 };
      existing.qty += item.quantity;
      existing.revenue += item.price * item.quantity;
      productMap.set(item.productName, existing);
    });

    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    const totalRevenue = allOrders.reduce((s, o) => s + o.totalAmount, 0);

    res.json({
      success: true,
      data: {
        today: { orders: todayOrders.length, revenue: todayRevenue, pending: pendingCount, completed: completedToday },
        overall: { totalOrders: allOrders.length, totalRevenue },
        topProducts,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to get summary' });
  }
});

// Public status-only lookup via the order's publicToken (used in WhatsApp
// share links). Returns no customer PII — only shop name, items and status.
router.get('/public/:publicToken', async (req: Request, res: Response) => {
  try {
    const order = await prisma.order.findUnique({
      where: { publicToken: req.params.publicToken },
      include: { items: true, shop: { select: { name: true, phone: true, upiId: true } } },
    });

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    res.json({
      success: true,
      data: {
        id: order.id,
        shopName: order.shop.name,
        shopPhone: order.shop.phone,
        upiId: order.shop.upiId,
        totalAmount: order.totalAmount,
        status: order.status,
        items: order.items.map((item) => ({
          productName: item.productName,
          quantity: item.quantity,
          price: item.price,
        })),
        timeline: buildTimeline(order.status, order.createdAt, order.updatedAt),
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to get order' });
  }
});

// Get single order with status timeline (customer / owning vendor / admin)
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        items: true,
        shop: { select: { name: true, address: true, phone: true, ownerId: true } },
        customer: { select: { name: true, phone: true } },
      },
    });

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const isCustomer = order.customerId === req.userId;
    const isVendor = order.shop.ownerId === req.userId;
    const isAdmin = req.userRole === 'admin';
    if (!isCustomer && !isVendor && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const timeline = buildTimeline(order.status, order.createdAt, order.updatedAt);

    res.json({
      success: true,
      data: {
        id: order.id,
        customerId: order.customerId,
        customerName: order.customer.name,
        shopId: order.shopId,
        shopName: order.shop.name,
        shopAddress: order.shop.address,
        shopPhone: order.shop.phone,
        publicToken: order.publicToken,
        items: order.items.map((item) => ({
          id: item.id, orderId: item.orderId, productId: item.productId,
          productName: item.productName, quantity: item.quantity, price: item.price,
        })),
        totalAmount: order.totalAmount,
        status: order.status,
        timeline,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
      },
    });
  } catch (err) {
    console.error('Get order error:', err);
    res.status(500).json({ success: false, message: 'Failed to get order' });
  }
});

// Update order status
router.patch('/:id/status', authenticateToken, requireRole('vendor'), validate(updateOrderStatusSchema), async (req: AuthRequest, res: Response) => {
  try {
    const status = String(req.body.status).toLowerCase();

    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { shop: true },
    });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.shop.ownerId !== req.userId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const updated = await prisma.order.update({
      where: { id: req.params.id },
      data: { status },
    });

    // Notify customer
    const statusMessages: Record<string, string> = {
      accepted: 'Aapka order accept ho gaya!',
      preparing: 'Aapka order ban raha hai',
      ready: 'Aapka order ready hai!',
      out_for_delivery: 'Aapka order delivery ke liye nikal gaya!',
      pickup: 'Aapka order pickup ke liye ready hai!',
      completed: 'Aapka order complete ho gaya!',
      rejected: 'Maaf kijiye, order cancel ho gaya',
    };

    if (statusMessages[status]) {
      await prisma.notification.create({
        data: {
          userId: order.customerId,
          type: 'ORDER_STATUS',
          title: 'Order Update',
          body: statusMessages[status],
          data: JSON.stringify({ orderId: order.id, status }),
        },
      });

      const io = req.app.locals.io;
      if (io) {
        io.to(`user:${order.customerId}`).emit('notification', {
          type: 'ORDER_STATUS',
          orderId: order.id,
          status,
        });
      }
    }

    const conversationDraft = order.conversationDraftId
      ? await prisma.conversationDraft.findUnique({
          where: { id: order.conversationDraftId },
          include: { items: true },
        })
      : null;

    await queueOperationalEvent({
      eventType: 'BAZAAR.ORDER_STATUS_UPDATED',
      shopId: order.shopId,
      customerId: order.customerId,
      conversationId: conversationDraft?.chatId,
      orderId: order.id,
      payload: { status, previousStatus: order.status },
    });

    if (conversationDraft) {
      await appendChitigramMessage(
        {
          chatId: conversationDraft.chatId,
          senderId: req.userId!,
          senderRole: 'MERCHANT',
          type: CHITIGRAM_TYPES.ORDER_CARD,
          content: `Order #${order.id.slice(0, 8)} status: ${status}`,
          payload: { orderId: order.id, status, items: conversationDraft.items, totalAmount: order.totalAmount },
        },
        req.app.locals.io,
      );
    }

    res.json({ success: true, data: { id: updated.id, status: updated.status } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update order' });
  }
});

export default router;

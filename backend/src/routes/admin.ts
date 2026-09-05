import { Router, Response } from 'express';
import { AuthRequest, authenticateToken, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { getPagination } from '../middleware/pagination';
import { adminToggleShopSchema } from '../validators';
import { prisma } from '../lib/prisma';

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

    const formatted = shops.map((shop) => ({
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

    const formatted = orders.map((order) => ({
      id: order.id, shopId: order.shopId, shopName: order.shop.name,
      customerName: order.customer.name,
      items: order.items.map((item) => ({
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
      .filter((o) => o.status === 'completed')
      .reduce((sum, o) => sum + o.totalAmount, 0);

    const pendingOrders = allOrders.filter((o) => o.status === 'pending').length;
    const completedOrders = allOrders.filter((o) => o.status === 'completed').length;

    // Orders per day (last 7 days)
    const dailyMap = new Map<string, { orders: number; revenue: number }>();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    allOrders
      .filter((o) => o.createdAt >= sevenDaysAgo)
      .forEach((o) => {
        const day = o.createdAt.toISOString().split('T')[0];
        const existing = dailyMap.get(day) || { orders: 0, revenue: 0 };
        existing.orders += 1;
        if (o.status === 'completed') existing.revenue += o.totalAmount;
        dailyMap.set(day, existing);
      });

    const dailyTrends = Array.from(dailyMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

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

export default router;

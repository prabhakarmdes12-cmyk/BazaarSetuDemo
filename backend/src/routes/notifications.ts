import { Router, Response } from 'express';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import { getPagination } from '../middleware/pagination';
import { prisma } from '../lib/prisma';

const router = Router();

// Get user's notifications
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { limit, offset } = getPagination(req);
    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: req.userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.notification.count({ where: { userId: req.userId } }),
    ]);

    const formatted = notifications.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      data: n.data,
      isRead: n.isRead,
      createdAt: n.createdAt.toISOString(),
    }));

    res.json({ success: true, data: formatted, total, limit, offset });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to get notifications' });
  }
});

// Get unread count
router.get('/unread-count', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const count = await prisma.notification.count({
      where: { userId: req.userId, isRead: false },
    });
    res.json({ success: true, data: { count } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to get count' });
  }
});

// Mark all as read
router.post('/mark-read', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.userId, isRead: false },
      data: { isRead: true },
    });
    res.json({ success: true, message: 'All marked as read' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to mark read' });
  }
});

// Mark single as read — IDOR fix: scoped to the requesting user.
router.patch('/:id/read', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const result = await prisma.notification.updateMany({
      where: { id: req.params.id, userId: req.userId },
      data: { isRead: true },
    });

    if (result.count === 0) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed' });
  }
});

export default router;

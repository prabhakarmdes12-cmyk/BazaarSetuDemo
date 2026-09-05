import { Router, Response } from 'express';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { getPagination } from '../middleware/pagination';
import { toggleFavoriteSchema } from '../validators';
import { prisma } from '../lib/prisma';

const router = Router();

// Toggle favorite shop
router.post('/toggle', authenticateToken, validate(toggleFavoriteSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { shopId } = req.body;

    const existing = await prisma.favoriteShop.findUnique({
      where: { userId_shopId: { userId: req.userId!, shopId } },
    });

    if (existing) {
      await prisma.favoriteShop.delete({ where: { id: existing.id } });
      return res.json({ success: true, data: { isFavorite: false } });
    }

    await prisma.favoriteShop.create({ data: { userId: req.userId!, shopId } });
    res.json({ success: true, data: { isFavorite: true } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to toggle favorite' });
  }
});

// Get user's favorite shops
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { limit, offset } = getPagination(req);
    const [favorites, total] = await Promise.all([
      prisma.favoriteShop.findMany({
        where: { userId: req.userId },
        include: { shop: true },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.favoriteShop.count({ where: { userId: req.userId } }),
    ]);

    const shops = favorites.map((f) => ({
      id: f.shop.id,
      ownerId: f.shop.ownerId,
      name: f.shop.name,
      description: f.shop.description,
      address: f.shop.address,
      phone: f.shop.phone,
      image: f.shop.image,
      lat: f.shop.lat,
      lng: f.shop.lng,
      isActive: f.shop.isActive,
      rating: f.shop.rating,
      isFavorite: true,
      createdAt: f.shop.createdAt.toISOString(),
    }));

    res.json({ success: true, data: shops, total, limit, offset });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to get favorites' });
  }
});

// Check if a shop is favorited
router.get('/check/:shopId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const fav = await prisma.favoriteShop.findUnique({
      where: { userId_shopId: { userId: req.userId!, shopId: req.params.shopId } },
    });
    res.json({ success: true, data: { isFavorite: !!fav } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to check favorite' });
  }
});

export default router;

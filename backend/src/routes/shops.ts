import { Router, Response } from 'express';
import { AuthRequest, authenticateToken, optionalAuth, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { getPagination } from '../middleware/pagination';
import { updateShopSchema } from '../validators';
import { prisma } from '../lib/prisma';

const router = Router();

// Haversine distance calculation
function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Get all active shops (with optional location sorting) — public for guest browse
router.get('/', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string) || 0;
    const lng = parseFloat(req.query.lng as string) || 0;
    const sort = (req.query.sort as string) || 'rating';
    const { limit, offset } = getPagination(req);

    const [shops, favorites, total] = await Promise.all([
      prisma.shop.findMany({
        where: { isActive: true },
        include: { owner: { select: { name: true } } },
        take: limit,
        skip: offset,
      }),
      req.userId
        ? prisma.favoriteShop.findMany({
            where: { userId: req.userId },
            select: { shopId: true },
          })
        : Promise.resolve([]),
      prisma.shop.count({ where: { isActive: true } }),
    ]);

    const favoriteSet = new Set(favorites.map((f: any) => f.shopId));

    let formattedShops = shops.map((shop: any) => ({
      id: shop.id,
      ownerId: shop.ownerId,
      ownerName: shop.owner.name,
      name: shop.name,
      description: shop.description,
      address: shop.address,
      image: shop.image,
      lat: shop.lat,
      lng: shop.lng,
      isActive: shop.isActive,
      rating: shop.rating,
      upiId: shop.upiId,
      isFavorite: favoriteSet.has(shop.id),
      distance: lat && lng && shop.lat && shop.lng
        ? getDistanceKm(lat, lng, shop.lat, shop.lng)
        : undefined,
      createdAt: shop.createdAt.toISOString(),
    }));

    if (sort === 'distance' && lat && lng) {
      formattedShops.sort((a: any, b: any) => (a.distance || 999) - (b.distance || 999));
    } else {
      formattedShops.sort((a: any, b: any) => b.rating - a.rating);
    }

    res.json({ success: true, data: formattedShops, total, limit, offset });
  } catch (err) {
    console.error('Get shops error:', err);
    res.status(500).json({ success: false, message: 'Failed to get shops' });
  }
});

// Get single shop — public
router.get('/:id', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const [shop, fav] = await Promise.all([
      prisma.shop.findUnique({
        where: { id: req.params.id },
        include: { owner: { select: { name: true } } },
      }),
      req.userId
        ? prisma.favoriteShop.findUnique({
            where: { userId_shopId: { userId: req.userId!, shopId: req.params.id } },
          })
        : Promise.resolve(null),
    ]);

    if (!shop) return res.status(404).json({ success: false, message: 'Shop not found' });

    res.json({
      success: true,
      data: {
        id: shop.id,
        ownerId: shop.ownerId,
        ownerName: shop.owner.name,
        name: shop.name,
        description: shop.description,
        address: shop.address,
        image: shop.image,
        lat: shop.lat,
        lng: shop.lng,
        isActive: shop.isActive,
        rating: shop.rating,
        upiId: shop.upiId,
        isFavorite: !!fav,
        createdAt: shop.createdAt.toISOString(),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to get shop' });
  }
});

// Get vendor's own shop
router.get('/vendor/my-shop', authenticateToken, requireRole('vendor'), async (req: AuthRequest, res: Response) => {
  try {
    const shop = await prisma.shop.findUnique({ where: { ownerId: req.userId } });
    if (!shop) return res.status(404).json({ success: false, message: 'Shop not found' });

    res.json({
      success: true,
      data: {
        id: shop.id, ownerId: shop.ownerId, name: shop.name,
        description: shop.description, address: shop.address, phone: shop.phone,
        image: shop.image, isActive: shop.isActive, rating: shop.rating,
        upiId: shop.upiId,
        createdAt: shop.createdAt.toISOString(),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to get shop' });
  }
});

// Update shop
router.put('/:id', authenticateToken, requireRole('vendor'), validate(updateShopSchema), async (req: AuthRequest, res: Response) => {
  try {
    const shop = await prisma.shop.findUnique({ where: { id: req.params.id } });
    if (!shop || shop.ownerId !== req.userId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const { name, description, address, phone, image, upiId, lat, lng } = req.body;
    const updated = await prisma.shop.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(address !== undefined && { address }),
        ...(phone !== undefined && { phone }),
        ...(image !== undefined && { image }),
        ...(upiId !== undefined && { upiId }),
        ...(lat !== undefined && { lat }),
        ...(lng !== undefined && { lng }),
      },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update shop' });
  }
});

// Get products for a shop — public
router.get('/:id/products', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      where: { shopId: req.params.id, isAvailable: true },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = products.map((p: any) => ({
      id: p.id, shopId: p.shopId, name: p.name, description: p.description,
      price: p.price, image: p.image, category: p.category, unit: p.unit,
      isAvailable: p.isAvailable, createdAt: p.createdAt.toISOString(),
    }));

    res.json({ success: true, data: formatted });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to get products' });
  }
});

export default router;

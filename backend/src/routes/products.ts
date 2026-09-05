import { Router, Response } from 'express';
import { AuthRequest, authenticateToken, optionalAuth, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { getPagination } from '../middleware/pagination';
import { createProductSchema, updateProductSchema } from '../validators';
import { prisma } from '../lib/prisma';

const router = Router();

// Get products for a shop — public
router.get('/shop/:shopId', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      where: { shopId: req.params.shopId, isAvailable: true },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = products.map((p) => ({
      id: p.id,
      shopId: p.shopId,
      name: p.name,
      description: p.description,
      price: p.price,
      image: p.image,
      category: p.category,
      unit: p.unit,
      isAvailable: p.isAvailable,
      createdAt: p.createdAt.toISOString(),
    }));

    res.json({ success: true, data: formatted });
  } catch (err) {
    console.error('Get products error:', err);
    res.status(500).json({ success: false, message: 'Failed to get products' });
  }
});

// Alias for frontend compatibility — public
router.get('/shops/:shopId/products', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      where: { shopId: req.params.shopId, isAvailable: true },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = products.map((p) => ({
      id: p.id,
      shopId: p.shopId,
      name: p.name,
      description: p.description,
      price: p.price,
      image: p.image,
      category: p.category,
      unit: p.unit,
      isAvailable: p.isAvailable,
      createdAt: p.createdAt.toISOString(),
    }));

    res.json({ success: true, data: formatted });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to get products' });
  }
});

// Get vendor's products
router.get('/vendor', authenticateToken, requireRole('vendor'), async (req: AuthRequest, res: Response) => {
  try {
    const shop = await prisma.shop.findUnique({ where: { ownerId: req.userId } });
    if (!shop) {
      return res.status(404).json({ success: false, message: 'Shop not found' });
    }

    const { limit, offset } = getPagination(req);
    const products = await prisma.product.findMany({
      where: { shopId: shop.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const formatted = products.map((p) => ({
      id: p.id,
      shopId: p.shopId,
      name: p.name,
      description: p.description,
      price: p.price,
      image: p.image,
      category: p.category,
      unit: p.unit,
      isAvailable: p.isAvailable,
      createdAt: p.createdAt.toISOString(),
    }));

    res.json({ success: true, data: formatted });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to get products' });
  }
});

// Create product
router.post('/', authenticateToken, requireRole('vendor'), validate(createProductSchema), async (req: AuthRequest, res: Response) => {
  try {
    const shop = await prisma.shop.findUnique({ where: { ownerId: req.userId } });
    if (!shop) {
      return res.status(404).json({ success: false, message: 'Shop not found' });
    }

    const { name, price, unit, description, category, image } = req.body;

    const product = await prisma.product.create({
      data: {
        shopId: shop.id,
        name,
        price,
        unit: unit || 'kg',
        description: description || '',
        category: category || 'General',
        image: image || '',
      },
    });

    res.json({
      success: true,
      data: {
        id: product.id,
        shopId: product.shopId,
        name: product.name,
        description: product.description,
        price: product.price,
        image: product.image,
        category: product.category,
        unit: product.unit,
        isAvailable: product.isAvailable,
        createdAt: product.createdAt.toISOString(),
      },
    });
  } catch (err) {
    console.error('Create product error:', err);
    res.status(500).json({ success: false, message: 'Failed to create product' });
  }
});

// Update product
router.patch('/:id', authenticateToken, requireRole('vendor'), validate(updateProductSchema), async (req: AuthRequest, res: Response) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: { shop: true },
    });

    if (!product || product.shop.ownerId !== req.userId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const { name, price, unit, description, category, image, isAvailable } = req.body;
    const updated = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(price !== undefined && { price }),
        ...(unit !== undefined && { unit }),
        ...(description !== undefined && { description }),
        ...(category !== undefined && { category }),
        ...(image !== undefined && { image }),
        ...(isAvailable !== undefined && { isAvailable }),
      },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update product' });
  }
});

export default router;

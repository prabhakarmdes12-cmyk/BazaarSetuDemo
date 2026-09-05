import { Router, Response } from 'express';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { addToCartSchema, updateCartItemSchema } from '../validators';
import { prisma } from '../lib/prisma';

const router = Router();

// Get cart for a shop
router.get('/:shopId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const cart = await prisma.cart.findUnique({
      where: {
        customerId_shopId: {
          customerId: req.userId!,
          shopId: req.params.shopId,
        },
      },
      include: {
        items: {
          include: { product: true },
        },
        shop: { select: { name: true } },
      },
    });

    if (!cart) {
      return res.json({
        success: true,
        data: { id: null, items: [], totalAmount: 0, shopName: '' },
      });
    }

    const totalAmount = cart.items.reduce((sum: any, item: any) => sum + item.price * item.quantity, 0);

    res.json({
      success: true,
      data: {
        id: cart.id,
        customerId: cart.customerId,
        shopId: cart.shopId,
        shopName: cart.shop.name,
        items: cart.items.map((item: any) => ({
          id: item.id,
          cartId: item.cartId,
          productId: item.productId,
          product: {
            id: item.product.id,
            name: item.product.name,
            price: item.product.price,
            unit: item.product.unit,
            image: item.product.image,
            isAvailable: item.product.isAvailable,
          },
          quantity: item.quantity,
          price: item.price,
        })),
        totalAmount,
        createdAt: cart.createdAt.toISOString(),
        updatedAt: cart.updatedAt.toISOString(),
      },
    });
  } catch (err) {
    console.error('Get cart error:', err);
    res.status(500).json({ success: false, message: 'Failed to get cart' });
  }
});

// Get all carts for customer
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const carts = await prisma.cart.findMany({
      where: { customerId: req.userId },
      include: {
        items: { include: { product: true } },
        shop: { select: { name: true } },
      },
    });

    // Return the first non-empty cart or empty state
    const cart = carts.find((c: any) => c.items.length > 0);
    if (!cart) {
      return res.json({
        success: true,
        data: { id: null, items: [], totalAmount: 0, shopName: '' },
      });
    }

    const totalAmount = cart.items.reduce((sum: any, item: any) => sum + item.price * item.quantity, 0);

    res.json({
      success: true,
      data: {
        id: cart.id,
        customerId: cart.customerId,
        shopId: cart.shopId,
        shopName: cart.shop.name,
        items: cart.items.map((item: any) => ({
          id: item.id,
          cartId: item.cartId,
          productId: item.productId,
          product: {
            id: item.product.id,
            name: item.product.name,
            price: item.product.price,
            unit: item.product.unit,
            image: item.product.image,
            isAvailable: item.product.isAvailable,
          },
          quantity: item.quantity,
          price: item.price,
        })),
        totalAmount,
        createdAt: cart.createdAt.toISOString(),
        updatedAt: cart.updatedAt.toISOString(),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to get cart' });
  }
});

// Add item to cart
router.post('/', authenticateToken, validate(addToCartSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { shopId, productId, quantity = 1 } = req.body;

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // IDOR fix: product must belong to the target shop, otherwise cart totals
    // and order contents can be corrupted by mixing shops.
    if (product.shopId !== shopId) {
      return res.status(400).json({ success: false, message: 'Product does not belong to this shop' });
    }

    // Find or create cart
    let cart = await prisma.cart.upsert({
      where: {
        customerId_shopId: {
          customerId: req.userId!,
          shopId,
        },
      },
      create: { customerId: req.userId!, shopId },
      update: {},
    });

    // Add or update item
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
    });

    if (existingItem) {
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
          price: product.price,
        },
      });
    }

    // Update cart timestamp
    await prisma.cart.update({
      where: { id: cart.id },
      data: { updatedAt: new Date() },
    });

    res.json({ success: true, message: 'Item added to cart' });
  } catch (err) {
    console.error('Add to cart error:', err);
    res.status(500).json({ success: false, message: 'Failed to add to cart' });
  }
});

// Update cart item quantity
router.put('/:shopId/items', authenticateToken, validate(updateCartItemSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { productId, quantity } = req.body;

    const cart = await prisma.cart.findUnique({
      where: {
        customerId_shopId: {
          customerId: req.userId!,
          shopId: req.params.shopId,
        },
      },
    });

    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    await prisma.cartItem.update({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
      data: { quantity },
    });

    res.json({ success: true, message: 'Cart updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update cart' });
  }
});

// Remove item from cart
router.delete('/:shopId/items/:productId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const cart = await prisma.cart.findUnique({
      where: {
        customerId_shopId: {
          customerId: req.userId!,
          shopId: req.params.shopId,
        },
      },
    });

    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    await prisma.cartItem.delete({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: req.params.productId,
        },
      },
    });

    res.json({ success: true, message: 'Item removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to remove item' });
  }
});

export default router;

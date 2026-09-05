'use client';

import Image from 'next/image';
import { Cart, CartItem } from '@/types';
import { Icon } from '@/components/ui';

interface CartProps {
  cart: Cart | null;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onPlaceOrder: () => void;
  isLoading?: boolean;
}

export default function CartComponent({ cart, onUpdateQuantity, onPlaceOrder, isLoading }: CartProps) {
  if (!cart || cart.items.length === 0) {
    return (
      <div className="text-center py-16">
        <Icon name="shopping_cart" size="xl" className="text-on-surface-variant mb-4" />
        <p className="text-on-surface font-semibold text-lg">Your cart is empty</p>
        <p className="text-on-surface-variant text-sm mt-1">Add items from a shop to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {cart.shopName && (
        <div className="flex items-center gap-2 text-sm text-on-surface-variant">
          <span className="truncate">{cart.shopName}</span>
        </div>
      )}

      <div className="space-y-2">
        {cart.items.map((item) => (
          <CartItemRow
            key={item.id}
            item={item}
            onUpdateQuantity={onUpdateQuantity}
          />
        ))}
      </div>

      <div className="border-t border-outline-variant pt-4 space-y-3">
        <div className="flex justify-between text-sm text-on-surface-variant">
          <span>Subtotal</span>
          <span>₹{cart.totalAmount}</span>
        </div>
        <div className="flex justify-between text-sm text-on-surface-variant">
          <span>Delivery</span>
          <span className="text-success">Free</span>
        </div>
        <div className="flex justify-between font-bold text-lg text-on-surface">
          <span>Total</span>
          <span>₹{cart.totalAmount}</span>
        </div>
      </div>

      <button
        onClick={onPlaceOrder}
        disabled={isLoading}
        className="w-full btn-success text-base"
      >
        {isLoading ? 'Placing Order...' : 'Order Karein'}
      </button>
    </div>
  );
}

function CartItemRow({ item, onUpdateQuantity }: { item: CartItem; onUpdateQuantity: (productId: string, quantity: number) => void }) {
  return (
    <div className="card !p-3 flex items-center gap-3">
      <div className="relative w-14 h-14 rounded-xl bg-primary-container flex items-center justify-center flex-shrink-0 overflow-hidden">
        {item.product.image ? (
          <Image fill sizes="56px" src={item.product.image} alt={item.product.name} className="object-cover rounded-xl" />
        ) : (
          <Icon name="shopping_cart" size="md" className="text-on-surface-variant" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-on-surface truncate">{item.product.name}</p>
        <p className="text-sm text-primary font-semibold">₹{item.price}/{item.product.unit}</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
          aria-label="Decrease quantity"
          className="w-8 h-8 rounded-lg bg-primary-container text-primary font-bold flex items-center justify-center text-lg"
        >
          −
        </button>
        <span className="text-sm font-semibold w-6 text-center">{item.quantity}</span>
        <button
          onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
          aria-label="Increase quantity"
          className="w-8 h-8 rounded-lg bg-primary text-white font-bold flex items-center justify-center text-lg"
        >
          +
        </button>
      </div>
    </div>
  );
}

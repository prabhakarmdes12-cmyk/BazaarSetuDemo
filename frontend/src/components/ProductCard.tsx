'use client';

import React from 'react';
import Image from 'next/image';
import { Product } from '@/types';
import { Icon } from '@/components/ui';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  quantity?: number;
  onUpdateQuantity?: (productId: string, quantity: number) => void;
  compact?: boolean;
}

export default function ProductCard({
  product,
  onAddToCart,
  quantity = 0,
  onUpdateQuantity,
  compact = false,
}: ProductCardProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 bg-surface-container-lowest rounded-xl active:scale-[0.98] transition-all duration-200">
        <div className="relative w-12 h-12 rounded-lg bg-primary-container flex items-center justify-center flex-shrink-0 overflow-hidden">
          {product.image ? (
            <Image fill sizes="48px" src={product.image} alt={product.name} className="object-cover rounded-lg" />
          ) : (
            <Icon name="shopping_cart" size="md" className="text-on-surface-variant" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-on-surface truncate">{product.name}</p>
          <p className="text-sm font-bold text-primary">₹{product.price}/{product.unit}</p>
        </div>
        {quantity > 0 && onUpdateQuantity ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onUpdateQuantity(product.id, quantity - 1)}
              className="w-8 h-8 rounded-lg bg-primary-container text-primary font-bold flex items-center justify-center active:scale-90 transition-transform"
            >
              −
            </button>
            <span className="text-sm font-semibold w-6 text-center">{quantity}</span>
            <button
              onClick={() => onUpdateQuantity(product.id, quantity + 1)}
              className="w-8 h-8 rounded-lg bg-primary text-white font-bold flex items-center justify-center active:scale-90 transition-transform"
            >
              +
            </button>
          </div>
        ) : onAddToCart ? (
          <button
            onClick={() => onAddToCart(product)}
            className="w-8 h-8 rounded-lg bg-primary text-white font-bold flex items-center justify-center active:scale-90 transition-transform hover:opacity-90"
          >
            +
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="bg-surface-container-lowest rounded-xl p-4 hover:shadow-md transition-all duration-300 group">
      <div className="relative w-full aspect-square rounded-xl bg-surface-container flex items-center justify-center mb-3 overflow-hidden">
        {product.image ? (
          <Image fill sizes="(max-width: 768px) 50vw, 33vw" src={product.image} alt={product.name} className="object-cover group-hover:scale-110 transition-transform duration-500" />
        ) : (
          <Icon name="shopping_cart" size="xl" className="text-on-surface-variant/30" />
        )}
      </div>
      <h3 className="font-semibold text-on-surface truncate">{product.name}</h3>
      {product.description && (
        <p className="text-xs text-on-surface-variant truncate mt-0.5">{product.description}</p>
      )}
      <div className="flex items-center justify-between mt-2">
        <p className="text-lg font-bold text-primary">₹{product.price}<span className="text-xs font-normal text-on-surface-variant">/{product.unit}</span></p>
        {quantity > 0 && onUpdateQuantity ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onUpdateQuantity(product.id, quantity - 1)}
              className="w-8 h-8 rounded-lg bg-primary-container text-primary font-bold flex items-center justify-center active:scale-90 transition-transform"
            >
              −
            </button>
            <span className="text-sm font-semibold w-6 text-center">{quantity}</span>
            <button
              onClick={() => onUpdateQuantity(product.id, quantity + 1)}
              className="w-8 h-8 rounded-lg bg-primary text-white font-bold flex items-center justify-center active:scale-90 transition-transform"
            >
              +
            </button>
          </div>
        ) : onAddToCart && product.isAvailable ? (
          <button
            onClick={() => onAddToCart(product)}
            className="bg-primary text-white font-bold py-2 px-4 text-sm rounded-lg active:scale-90 transition-all duration-200 hover:opacity-90"
          >
            Add
          </button>
        ) : !product.isAvailable ? (
          <span className="text-xs text-on-surface-variant/50">Stock khatam</span>
        ) : null}
      </div>
    </div>
  );
}

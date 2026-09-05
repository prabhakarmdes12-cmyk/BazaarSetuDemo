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

// Curated high-res grocery CDN imagery for classic Indian SKUs
const PRODUCT_IMAGE_FALLBACKS: Record<string, string> = {
  'amul milk': 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80',
  'milk': 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80',
  'tomato': 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80',
  'tamatar': 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80',
  'aashirvaad atta': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80',
  'atta': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80',
  'fortune': 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80',
  'oil': 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80',
  'mustard': 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80',
  'maggi': 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=600&auto=format&fit=crop&q=80',
  'noodles': 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=600&auto=format&fit=crop&q=80',
  'parle-g': 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&auto=format&fit=crop&q=80',
  'biscuits': 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&auto=format&fit=crop&q=80',
  'tata salt': 'https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?w=600&auto=format&fit=crop&q=80',
  'salt': 'https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?w=600&auto=format&fit=crop&q=80',
  'sugar': 'https://images.unsplash.com/photo-1581441363689-1f3c3c414635?w=600&auto=format&fit=crop&q=80',
  'chana dal': 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80',
  'masoor dal': 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80',
  'toor dal': 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80',
  'dal': 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80',
  'rice': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80',
  'basmati': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80',
  'red label': 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80',
  'tea': 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80',
  'coffee': 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
  'surf excel': 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=600&auto=format&fit=crop&q=80',
  'detergent': 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=600&auto=format&fit=crop&q=80',
  'dettol': 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=600&auto=format&fit=crop&q=80',
  'soap': 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=600&auto=format&fit=crop&q=80',
  'colgate': 'https://images.unsplash.com/photo-1559591937-e62fb330914c?w=600&auto=format&fit=crop&q=80',
  'toothpaste': 'https://images.unsplash.com/photo-1559591937-e62fb330914c?w=600&auto=format&fit=crop&q=80',
  'vim': 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=600&auto=format&fit=crop&q=80',
  'good knight': 'https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?w=600&auto=format&fit=crop&q=80',
};

function resolveProductImage(product: Product): string {
  if (product.image && product.image.trim() !== '') return product.image;
  const nameLower = product.name.toLowerCase();
  for (const [key, url] of Object.entries(PRODUCT_IMAGE_FALLBACKS)) {
    if (nameLower.includes(key)) return url;
  }
  return 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80';
}

function resolvePackUnit(product: Product): string {
  const n = product.name.toLowerCase();
  if (n.includes('milk')) return '500 ml pouch';
  if (n.includes('atta')) return '5 kg bag';
  if (n.includes('oil')) return '1 litre pouch';
  if (n.includes('maggi')) return '70 g pack';
  if (n.includes('parle-g')) return '130 g pack';
  if (n.includes('salt') || n.includes('sugar')) return '1 kg packet';
  if (n.includes('dal') || n.includes('rice')) return '1 kg packet';
  if (n.includes('tea')) return '250 g packet';
  if (n.includes('coffee')) return '50 g jar';
  if (n.includes('soap')) return '75 g bar';
  if (n.includes('toothpaste')) return '150 g tube';
  if (n.includes('surf excel')) return '1 kg pack';
  if (n.includes('vim')) return '135 g bar';
  if (n.includes('good knight')) return '45 ml refill';
  return product.unit ? `1 ${product.unit}` : '1 unit';
}

export default function ProductCard({
  product,
  onAddToCart,
  quantity = 0,
  onUpdateQuantity,
  compact = false,
}: ProductCardProps) {
  const imageUrl = resolveProductImage(product);
  const packUnit = resolvePackUnit(product);
  const mrp = Math.round(product.price * 1.22);
  const discountPercent = Math.max(10, Math.round(((mrp - product.price) / mrp) * 100));

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 bg-surface-container-low border border-white/5 rounded-2xl active:scale-[0.98] transition-all duration-200 hover:border-primary/30">
        <div className="relative w-14 h-14 rounded-xl bg-surface-container-lowest flex items-center justify-center flex-shrink-0 overflow-hidden border border-white/10">
          <Image
            fill
            sizes="56px"
            src={imageUrl}
            alt={product.name}
            className="object-cover rounded-xl"
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-on-surface truncate font-headline">{product.name}</p>
          <p className="text-[11px] text-on-surface-variant font-medium">{packUnit}</p>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-sm font-extrabold text-primary font-headline">₹{product.price}</span>
            <span className="text-[11px] text-on-surface-variant/60 line-through">₹{mrp}</span>
          </div>
        </div>
        {quantity > 0 && onUpdateQuantity ? (
          <div className="flex items-center leaf-gradient text-white rounded-xl shadow-brand-glow overflow-hidden">
            <button
              onClick={() => onUpdateQuantity(product.id, quantity - 1)}
              className="w-7 h-7 flex items-center justify-center font-black hover:bg-black/20 active:scale-90 transition-transform"
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className="text-xs font-black px-1.5 min-w-[20px] text-center font-headline">{quantity}</span>
            <button
              onClick={() => onUpdateQuantity(product.id, quantity + 1)}
              className="w-7 h-7 flex items-center justify-center font-black hover:bg-black/20 active:scale-90 transition-transform"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
        ) : onAddToCart ? (
          <button
            onClick={() => onAddToCart(product)}
            className="border-2 border-primary bg-primary/10 hover:bg-primary hover:text-white text-primary font-black text-xs px-3 py-1.5 rounded-xl active:scale-90 transition-all uppercase tracking-wider font-headline shadow-sm"
          >
            ADD
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="group bg-surface-container-low border border-white/5 hover:border-primary/30 rounded-3xl p-3.5 flex flex-col justify-between transition-all duration-300 hover:shadow-editorial-lg hover:-translate-y-1 relative overflow-hidden">
      <div>
        {/* Product Image Plate */}
        <div className="relative w-full aspect-square rounded-2xl bg-surface-container-lowest flex items-center justify-center mb-3 overflow-hidden border border-white/5">
          <Image
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
            src={imageUrl}
            alt={product.name}
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />

          {/* Blinkit-Style Floating Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
            <span className="bg-primary text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-md font-headline">
              {discountPercent}% OFF
            </span>
          </div>

          <div className="absolute top-2 right-2 z-10">
            <span className="bg-black/70 backdrop-blur-md text-emerald-400 border border-emerald-500/20 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm font-headline">
              <Icon name="bolt" size="sm" filled />
              10m
            </span>
          </div>
        </div>

        {/* Product Meta */}
        <div className="space-y-1">
          <p className="text-[11px] font-semibold text-primary uppercase tracking-wider truncate">
            {product.category || 'Grocery'}
          </p>
          <h3 className="font-bold text-on-surface text-sm leading-snug line-clamp-2 font-headline group-hover:text-primary transition-colors min-h-[2.5rem]">
            {product.name}
          </h3>
          <p className="text-xs text-on-surface-variant font-medium">
            {packUnit}
          </p>
        </div>
      </div>

      {/* Pricing & Add Stepper */}
      <div className="pt-3 mt-2 border-t border-white/5 flex items-center justify-between gap-2">
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-base sm:text-lg font-black text-on-surface font-headline tracking-tight">
              ₹{product.price}
            </span>
            <span className="text-xs text-on-surface-variant/60 line-through">
              ₹{mrp}
            </span>
          </div>
        </div>

        {quantity > 0 && onUpdateQuantity ? (
          <div className="flex items-center leaf-gradient text-white rounded-xl shadow-brand-glow overflow-hidden shrink-0">
            <button
              onClick={() => onUpdateQuantity(product.id, quantity - 1)}
              className="w-7 h-7 flex items-center justify-center font-black hover:bg-black/20 active:scale-90 transition-transform"
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className="text-xs font-black px-2 min-w-[20px] text-center font-headline">{quantity}</span>
            <button
              onClick={() => onUpdateQuantity(product.id, quantity + 1)}
              className="w-7 h-7 flex items-center justify-center font-black hover:bg-black/20 active:scale-90 transition-transform"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
        ) : onAddToCart && product.isAvailable !== false ? (
          <button
            onClick={() => onAddToCart(product)}
            className="border-2 border-primary/80 bg-primary/10 hover:bg-primary hover:text-white text-primary font-black text-xs px-3.5 py-1.5 rounded-xl active:scale-95 transition-all uppercase tracking-wider font-headline shadow-sm hover:shadow-brand-glow shrink-0"
          >
            ADD +
          </button>
        ) : (
          <span className="text-[11px] font-bold text-on-surface-variant/50 uppercase tracking-wider">Out of Stock</span>
        )}
      </div>
    </div>
  );
}

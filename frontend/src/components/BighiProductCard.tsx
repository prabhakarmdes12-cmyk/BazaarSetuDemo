'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CatalogTile from './CatalogTile';

export interface CatalogProduct {
  id: string;
  name: string;
  category?: string;
  unit: string;
  price: number;
  mrp?: number;
  icon?: string;
  from?: string;
  to?: string;
  image?: string;
}

interface BighiProductCardProps {
  product: CatalogProduct;
  quantity?: number;
  onAdd: (product: CatalogProduct) => void;
  onInc: (product: CatalogProduct) => void;
  onDec: (product: CatalogProduct) => void;
}

function discountPercent(price: number, mrp?: number): number {
  if (!mrp || mrp <= price) return 0;
  return Math.round(((mrp - price) / mrp) * 100);
}

/**
 * Quick-commerce shelf card: icon tile + name/pack/price + a morphing
 * "ADD → [− qty +]" spring stepper. Mirrors the Blinkit/Zepto interaction
 * pattern and the existing ProductCard motion, but is tailored to the
 * bundled icon-based Bighi master catalog (real MRP + pack size).
 */
export default function BighiProductCard({ product, quantity = 0, onAdd, onInc, onDec }: BighiProductCardProps) {
  const mrp = product.mrp;
  const off = discountPercent(product.price, mrp);
  const hasQty = quantity > 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
      whileHover={{ y: -3 }}
      className="group flex flex-col bg-surface-container-low border border-white/5 hover:border-primary/30 rounded-2xl p-2.5 transition-colors duration-300"
    >
      <div className="relative mb-2">
        <CatalogTile
          image={product.image}
          icon={product.icon || 'inventory_2'}
          from={product.from || '#10B981'}
          to={product.to || '#059669'}
          name={product.name}
          className="w-full aspect-square"
        />
        {off > 0 && (
          <span className="absolute top-1.5 left-1.5 z-10 bg-warning text-[#1C1503] text-[11px] font-black tracking-wide px-1.5 py-0.5 rounded-md shadow-md">
            {off}% OFF
          </span>
        )}
        <span className="absolute top-1.5 right-1.5 z-10 bg-black/70 backdrop-blur-md text-emerald-300 border border-emerald-500/20 text-[11px] font-extrabold px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
          <span className="material-symbols-outlined text-[11px] leading-none" style={{ fontVariationSettings: "'FILL' 1" }}>
            bolt
          </span>
          10m
        </span>
      </div>

      <p className="text-[11px] font-semibold text-primary uppercase tracking-wide truncate font-headline">
        {product.category || 'Grocery'}
      </p>
      <h3 className="font-bold text-on-surface text-[13px] leading-snug line-clamp-2 min-h-[2.1rem] font-headline">
        {product.name}
      </h3>
      <p className="text-[11px] text-on-surface-variant font-medium mb-1.5 truncate">{product.unit}</p>

      <div className="mt-auto flex items-center justify-between gap-1.5 pt-1.5 border-t border-white/5">
        <div className="flex flex-col leading-tight">
          <span className="text-[15px] font-black text-on-surface font-headline tabular-nums">
            ₹{product.price}
          </span>
          {mrp && mrp > product.price && (
            <span className="text-[11px] text-on-surface-variant/60 line-through tabular-nums">
              ₹{mrp}
            </span>
          )}
        </div>

        <div className="shrink-0">
          <AnimatePresence mode="wait" initial={false}>
            {hasQty ? (
              <motion.div
                key="stepper"
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.7, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                className="flex items-center leaf-gradient text-white rounded-xl shadow-brand-glow overflow-hidden"
              >
                <button
                  onClick={() => onDec(product)}
                  aria-label={`Remove one ${product.name}`}
                  className="w-8 h-8 flex items-center justify-center text-lg font-black hover:bg-black/20 active:scale-90 transition"
                >
                  −
                </button>
                <span className="text-sm font-black px-1 min-w-[22px] text-center font-headline tabular-nums">
                  {quantity}
                </span>
                <button
                  onClick={() => onInc(product)}
                  aria-label={`Add one ${product.name}`}
                  className="w-8 h-8 flex items-center justify-center text-lg font-black hover:bg-black/20 active:scale-90 transition"
                >
                  +
                </button>
              </motion.div>
            ) : (
              <motion.button
                key="add"
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.7, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onAdd(product)}
                className="border-2 border-primary/80 bg-primary/10 hover:bg-primary hover:text-white text-primary font-black text-[13px] px-4 py-1.5 rounded-xl uppercase tracking-wide font-headline shadow-sm"
              >
                ADD
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

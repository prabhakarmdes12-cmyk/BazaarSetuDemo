'use client';

import React from 'react';
import Image from 'next/image';
import Icon from './ui/Icon';

interface CatalogTileProps {
  /** Real product photo when available (remote URL or /public path). */
  image?: string;
  /** Material Symbol glyph for the icon-based catalog tile. */
  icon?: string;
  /** Gradient start (hex). */
  from?: string;
  /** Gradient end (hex). */
  to?: string;
  name?: string;
  className?: string;
  iconClassName?: string;
  rounded?: string;
}

/**
 * CatalogTile renders a product image plate. The 1,370-SKU Bighi master
 * catalog ships no per-product photos (that would be 1,300+ fragile external
 * image URLs), so each category maps to a branded, on-theme gradient plate
 * with a Material Symbol glyph — crisp at any size, zero network, never
 * broken. When a real `image` URL is provided it is used instead.
 */
export default function CatalogTile({
  image,
  icon = 'inventory_2',
  from = '#10B981',
  to = '#059669',
  name = 'Product',
  className = '',
  iconClassName = 'text-4xl',
  rounded = 'rounded-2xl',
}: CatalogTileProps) {
  if (image && image.trim() !== '') {
    return (
      <div className={`relative overflow-hidden bg-surface-container-lowest ${rounded} ${className}`}>
        <Image fill sizes="(max-width: 768px) 50vw, 25vw" alt={name} className="object-cover" src={image} />
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden flex items-center justify-center ${rounded} ${className}`}
      style={{ background: `linear-gradient(140deg, ${from}26 0%, ${to}14 55%, ${from}0d 100%)` }}
      aria-hidden="true"
    >
      {/* soft brand glow */}
      <div
        className="absolute -top-6 -right-6 w-20 h-20 rounded-full blur-2xl opacity-40"
        style={{ background: from }}
      />
      <div
        className="absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.25) 0, transparent 40%)',
        }}
      />
      <div
        className="relative w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
        style={{ background: `linear-gradient(135deg, ${from}33 0%, ${to}22 100%)` }}
      >
        <Icon name={icon} filled size="md" className={`${iconClassName} text-white drop-shadow`} />
      </div>
    </div>
  );
}

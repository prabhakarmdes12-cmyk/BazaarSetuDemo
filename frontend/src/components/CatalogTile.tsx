'use client';

import React, { useState } from 'react';
import Icon from './ui/Icon';

interface CatalogTileProps {
  /** Real product photo when available (self-hosted /public path or CDN URL). */
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
 * CatalogTile renders a product image plate.
 *
 * Photos are *self-hosted* under /public/catalog (see scripts/gen-bighi-catalog.cjs)
 * rather than hotlinked, so they can't 404, get rate-limited, or carry
 * third-party trademark risk. Categories without a shot yet simply omit
 * `image`.
 *
 * The gradient + icon plate is always rendered underneath as the base layer,
 * and the photo is layered on top. If the photo ever fails to load we flip
 * `failed` and the on-theme plate shows through — so a broken-image icon can
 * never appear, even offline or behind a strict network policy.
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
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const showPhoto = Boolean(image && image.trim() !== '') && !failed;

  return (
    <div
      className={`relative overflow-hidden flex items-center justify-center ${rounded} ${className}`}
      style={{ background: `linear-gradient(140deg, ${from}26 0%, ${to}14 55%, ${from}0d 100%)` }}
    >
      {/* --- Base layer: branded gradient plate + glyph (always present) --- */}
      <div
        className="absolute -top-6 -right-6 w-20 h-20 rounded-full blur-2xl opacity-40"
        style={{ background: from }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.25) 0, transparent 40%)',
        }}
        aria-hidden="true"
      />
      <div
        className="relative w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
        style={{ background: `linear-gradient(135deg, ${from}33 0%, ${to}22 100%)` }}
        aria-hidden="true"
      >
        <Icon name={icon} filled size="md" className={`${iconClassName} text-white drop-shadow`} />
      </div>

      {/* --- Photo layer: covers the plate once it decodes --- */}
      {showPhoto && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt={name}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
    </div>
  );
}

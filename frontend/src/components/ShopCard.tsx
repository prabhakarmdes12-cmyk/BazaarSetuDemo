'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Icon, Button, Card } from './ui';

interface ShopCardProps {
  id: string;
  name: string;
  image: string;
  rating: number;
  distance?: number;
  isOpen: boolean;
  openStatusText?: string;
  href?: string;
}

// Deterministic-looking ETA derived from distance so cards feel data-driven
// without needing a real delivery-estimate API.
function estimateEtaMinutes(distance?: number): number {
  if (distance == null) return 10;
  return Math.max(8, Math.min(25, Math.round(8 + distance * 6)));
}

export default function ShopCard({
  name,
  image,
  rating,
  distance,
  isOpen,
  openStatusText,
  href,
}: ShopCardProps) {
  const eta = estimateEtaMinutes(distance);

  const cardContent = (
    <Card className={`@container p-4 flex flex-col group-hover:shadow-leaf-glow transition-shadow duration-300 ${!isOpen ? 'opacity-80' : ''}`}>
      <div className={`relative h-48 mb-4 overflow-hidden rounded-xl ${!isOpen ? 'grayscale' : ''}`}>
        <Image
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          src={image || 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=600&auto=format&fit=crop&q=80'}
          alt={name}
          className="object-cover group-hover:scale-110 transition-transform duration-500 ease-out will-change-transform"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        <div className="absolute top-3 left-3 flex gap-2">
          {isOpen ? (
            <span className="bg-primary/90 text-white text-[11px] font-bold px-3 py-1 rounded-full backdrop-blur-md flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              Open
            </span>
          ) : (
            <span className="bg-stone-500/90 text-white text-[11px] font-bold px-3 py-1 rounded-full backdrop-blur-md">
              {openStatusText || 'Band Hai'}
            </span>
          )}
        </div>

        <div className="absolute top-3 right-3">
          <span className="bg-black/50 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
            <Icon name="bolt" size="sm" filled className="text-primary" />
            {eta} mins
          </span>
        </div>

        {distance != null && (
          <div className="absolute bottom-3 left-3">
            <span className="bg-surface-container-lowest/90 backdrop-blur text-on-surface text-[11px] font-bold px-2 py-1 rounded-md flex items-center gap-1">
              <Icon name="distance" size="sm" className="text-on-surface-variant" />
              {distance} km
            </span>
          </div>
        )}
      </div>

      <div className="flex justify-between items-start mb-2">
        <h4 className="font-headline font-bold text-lg text-on-surface @lg:text-xl">{name}</h4>
        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-lg ${
          isOpen ? 'bg-primary/15 text-primary' : 'bg-surface-container-high text-on-surface-variant'
        }`}>
          <Icon name="star" size="sm" filled />
          <span className="text-xs font-bold">{rating.toFixed(1)}</span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 mb-4 text-[11px] text-on-surface-variant">
        <Icon name="verified" size="sm" filled className="text-primary" />
        <span className="font-medium">Trusted local dukaan</span>
      </div>

      {isOpen ? (
        <Button variant="surface" className="mt-auto w-full">
          Browse Items
        </Button>
      ) : (
        <button className="mt-auto w-full bg-surface-container-high py-3 rounded-lg font-bold text-sm text-on-surface-variant/50 cursor-not-allowed">
          Band Hai
        </button>
      )}
    </Card>
  );

  if (href && isOpen) {
    return (
      <Link href={href} className="group">
        {cardContent}
      </Link>
    );
  }

  return <div className="group">{cardContent}</div>;
}

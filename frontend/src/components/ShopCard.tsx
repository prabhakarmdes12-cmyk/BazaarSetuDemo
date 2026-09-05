'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Icon, Badge, Button, Card } from './ui';

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

export default function ShopCard({
  name,
  image,
  rating,
  distance,
  isOpen,
  openStatusText,
  href,
}: ShopCardProps) {
  const cardContent = (
    <Card className={`@container p-4 flex flex-col ${!isOpen ? 'opacity-80' : ''}`}>
      <div className={`relative h-48 mb-4 overflow-hidden rounded-xl ${!isOpen ? 'grayscale' : ''}`}>
        <Image
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          src={image || '/placeholder-shop.jpg'}
          alt={name}
          className="object-cover group-hover:scale-110 transition-transform duration-500 ease-out will-change-transform"
        />
        <div className="absolute top-3 left-3 flex gap-2">
          {isOpen ? (
            <span className="bg-secondary/90 text-white text-[10px] font-bold px-3 py-1 rounded-full backdrop-blur-md flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-surface-container-lowest animate-pulse" />
              Open
            </span>
          ) : (
            <span className="bg-stone-500/90 text-white text-[10px] font-bold px-3 py-1 rounded-full backdrop-blur-md">
              {openStatusText || 'Band Hai'}
            </span>
          )}
        </div>
        {distance != null && (
          <div className="absolute bottom-3 left-3">
            <span className="bg-surface-container-lowest/90 backdrop-blur text-on-surface text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1">
              <Icon name="distance" size="sm" className="text-on-surface-variant" />
              {distance} km
            </span>
          </div>
        )}
      </div>

      <div className="flex justify-between items-start mb-2">
        <h4 className="font-headline font-bold text-lg text-on-surface @lg:text-xl">{name}</h4>
        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-lg ${
          isOpen ? 'bg-primary-fixed text-on-primary-fixed' : 'bg-surface-container-high text-on-surface-variant'
        }`}>
          <Icon name="star" size="sm" filled />
          <span className="text-xs font-bold">{rating.toFixed(1)}</span>
        </div>
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

'use client';

import React, { useRef } from 'react';
import Icon from './ui/Icon';
import { BIGHI_PROMOS } from '@/lib/bighiCatalog';

/**
 * Horizontal snap-scrolling promotional carousel for the flagship storefront:
 * Super Saver Deals · Farm Fresh Harvest · Midnight Sips & Munchies.
 * Includes edge gradient fades and arrow nudges on desktop.
 */
export default function PromoCarousels({ onSelect }: { onSelect?: (promoId: string) => void }) {
  const trackRef = useRef<HTMLDivElement>(null);

  const nudge = (dir: number) => {
    trackRef.current?.scrollBy({ left: dir * 280, behavior: 'smooth' });
  };

  return (
    <div className="relative">
      {/* edge fades */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-surface to-transparent z-10" />
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-surface to-transparent z-10" />

      <button
        aria-label="Scroll promos left"
        onClick={() => nudge(-1)}
        className="hidden sm:flex absolute -left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 items-center justify-center rounded-full bg-surface-container-highest border border-white/10 text-on-surface shadow-lg hover:border-primary/50 active:scale-90 transition"
      >
        <Icon name="chevron_left" size="sm" />
      </button>
      <button
        aria-label="Scroll promos right"
        onClick={() => nudge(1)}
        className="hidden sm:flex absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 items-center justify-center rounded-full bg-surface-container-highest border border-white/10 text-on-surface shadow-lg hover:border-primary/50 active:scale-90 transition"
      >
        <Icon name="chevron_right" size="sm" />
      </button>

      <div
        ref={trackRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-1"
      >
        {BIGHI_PROMOS.map((promo) => (
          <button
            key={promo.id}
            onClick={() => onSelect?.(promo.id)}
            className="snap-start shrink-0 w-[80vw] sm:w-[340px] text-left rounded-2xl p-5 relative overflow-hidden border border-white/10 active:scale-[0.98] transition min-h-[132px] flex flex-col justify-between"
            style={{ background: `linear-gradient(135deg, ${promo.from} 0%, ${promo.to} 100%)` }}
          >
            <div className="absolute -right-6 -bottom-8 w-28 h-28 rounded-full bg-white/15 blur-xl" />
            <div className="relative flex items-start justify-between">
              <span className="bg-black/25 text-white text-[10px] font-black tracking-wide uppercase px-2.5 py-1 rounded-full font-headline">
                {promo.tag}
              </span>
              <Icon name={promo.icon} filled size="lg" className="text-white/90" />
            </div>
            <div className="relative">
              <h4 className="text-white font-headline font-black text-lg leading-tight">{promo.title}</h4>
              <p className="text-white/85 text-xs font-medium mt-1 leading-snug line-clamp-2">{promo.subtitle}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

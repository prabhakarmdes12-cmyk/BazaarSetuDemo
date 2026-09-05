'use client';

import React from 'react';

interface ChitiBazaarLogoProps {
  /** `full` = wordmark + icon, `mark` = compact icon-only badge. */
  variant?: 'full' | 'mark';
  /** Icon/badge pixel size (the wordmark scales its text relative to this). */
  size?: number;
  className?: string;
  /** Shows the pulsing "live delivery" dot inside the mark. Defaults to true. */
  showPulse?: boolean;
}

/**
 * Chiti Bazaar brand mark — an organic leaf-sprout fused with a quick-commerce
 * spark, rendered as inline SVG so it scales crisply at any size. Pairs with
 * the "Chiti" (white) + "Bazaar" (leaf green) wordmark and a pulsing emerald
 * delivery-status dot.
 */
export default function ChitiBazaarLogo({
  variant = 'full',
  size = 40,
  className = '',
  showPulse = true,
}: ChitiBazaarLogoProps) {
  const mark = (
    <div
      className="relative shrink-0 animate-leaf-sway"
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 48 48"
        width={size}
        height={size}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="cb-leaf-grad" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#34D399" />
            <stop offset="55%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <radialGradient id="cb-glow" cx="50%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#6EE7B7" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Obsidian rounded container */}
        <rect x="0" y="0" width="48" height="48" rx="14" fill="#0B100B" />
        <rect x="0.75" y="0.75" width="46.5" height="46.5" rx="13.25" stroke="rgba(34,197,94,0.35)" strokeWidth="1.5" />

        {/* Ambient glow */}
        <circle cx="24" cy="18" r="18" fill="url(#cb-glow)" />

        {/* Leaf-sprout body: a rounded leaf shape growing from a stem */}
        <path
          d="M24 38V24"
          stroke="url(#cb-leaf-grad)"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <path
          d="M24 25C24 25 12 24 11 14C11 14 24 11 24 25Z"
          fill="url(#cb-leaf-grad)"
        />
        <path
          d="M24 21C24 21 36 18 37 9C37 9 24 8 24 21Z"
          fill="url(#cb-leaf-grad)"
          opacity="0.92"
        />

        {/* Quick-commerce spark fused into the leaf tip */}
        <path
          d="M27 6L20.5 17.5H25L23 25L31 14H26.2L27 6Z"
          fill="#FFFFFF"
          fillOpacity="0.95"
        />
      </svg>

      {showPulse && (
        <span
          className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3"
          aria-hidden="true"
        >
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-[#0B100B]" />
        </span>
      )}
    </div>
  );

  if (variant === 'mark') {
    return <div className={className}>{mark}</div>;
  }

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {mark}
      <span
        className="font-headline font-extrabold tracking-tight leading-none"
        style={{ fontSize: Math.round(size * 0.62) }}
      >
        <span className="text-white">Paas</span><span className="leaf-text-gradient">ka</span>
      </span>
    </div>
  );
}

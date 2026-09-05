'use client';

import React from 'react';
import { ChitiCard } from '@chiti/ui';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: 'default' | 'editorial' | 'flat';
  tilt?: boolean;
}

// Elevation per variant — matches Chiti shadow-card / shadow-elevated tokens.
const variantShadow: Record<'default' | 'editorial' | 'flat', React.CSSProperties> = {
  default: { boxShadow: '0 4px 24px rgba(0,0,0,0.4)' },
  editorial: { boxShadow: '0 20px 60px rgba(0,0,0,0.6)' },
  flat: { boxShadow: 'none' },
};

export default function Card({
  children,
  className = '',
  onClick,
  variant = 'default',
  tilt = false,
}: CardProps) {
  return (
    <ChitiCard
      tilt={tilt}
      onClick={onClick}
      className={`transition-all duration-300 ease-out ${onClick ? 'cursor-pointer active:scale-[0.98]' : ''} ${className}`}
      style={variantShadow[variant]}
    >
      {children}
    </ChitiCard>
  );
}

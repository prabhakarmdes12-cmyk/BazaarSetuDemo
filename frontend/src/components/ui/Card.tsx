'use client';

import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  variant?: 'default' | 'editorial' | 'flat';
  tilt?: boolean;
  style?: React.CSSProperties;
}

// Elevation per variant — matches Chiti Bazaar shadow-card / shadow-elevated tokens.
const variantShadow: Record<'default' | 'editorial' | 'flat', React.CSSProperties> = {
  default: { boxShadow: '0 4px 24px rgba(0,0,0,0.5)' },
  editorial: { boxShadow: '0 20px 60px rgba(0,0,0,0.65)' },
  flat: { boxShadow: 'none' },
};

// Obsidian glass container surface with a faint leaf-green border glow.
const obsidianSurface: React.CSSProperties = {
  background: '#121812',
  border: '1px solid rgba(34, 197, 94, 0.15)',
  borderRadius: '12px',
  padding: '24px',
  position: 'relative',
  overflow: 'hidden',
};

export default function Card({
  children,
  className = '',
  onClick,
  variant = 'default',
  tilt = false,
  style = {},
}: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`transition-all duration-300 ease-out ${onClick ? 'cursor-pointer active:scale-[0.98]' : ''} ${className}`}
      style={{
        ...obsidianSurface,
        ...variantShadow[variant],
        transition: tilt ? 'transform 0.3s ease' : 'none',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
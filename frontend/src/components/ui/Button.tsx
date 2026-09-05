'use client';

import React from 'react';
import { ChitiButton } from '@chiti/ui';

interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: 'primary' | 'secondary' | 'success' | 'ghost' | 'surface' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const sizeStyles: Record<'sm' | 'md' | 'lg', React.CSSProperties> = {
  sm: { padding: '8px 14px', fontSize: '0.8rem', borderRadius: '10px' },
  md: { padding: '12px 20px', fontSize: '0.9rem', borderRadius: '12px' },
  lg: { padding: '16px 28px', fontSize: '1rem', borderRadius: '14px' },
};

// Map Chiti Bazaar variants onto the underlying @chiti/ui button primitives —
// the visual palette is fully overridden below to the obsidian + leaf-green brand.
const variantMap: Record<string, 'cinematic' | 'glass' | 'saas' | 'error'> = {
  primary: 'cinematic',
  gradient: 'cinematic',
  secondary: 'glass',
  ghost: 'glass',
  surface: 'saas',
  success: 'cinematic',
  error: 'error',
};

// Obsidian Black + Fresh Leaf Green overrides per variant.
const variantStyleOverrides: Record<string, React.CSSProperties> = {
  primary: {
    background: 'linear-gradient(135deg, #10B981 0%, #22C55E 100%)',
    boxShadow: '0 8px 24px rgba(16, 185, 129, 0.35)',
    color: '#ffffff',
  },
  gradient: {
    background: 'linear-gradient(135deg, #10B981 0%, #22C55E 55%, #34D399 100%)',
    boxShadow: '0 8px 24px rgba(16, 185, 129, 0.35)',
    color: '#ffffff',
  },
  secondary: {
    background: 'rgba(18, 24, 18, 0.6)',
    border: '1px solid rgba(34, 197, 94, 0.25)',
    color: '#ffffff',
    backdropFilter: 'blur(12px)',
  },
  ghost: {
    background: 'transparent',
    border: '1px solid rgba(34, 197, 94, 0.25)',
    color: '#ffffff',
  },
  surface: {
    background: '#121812',
    border: '1px solid rgba(34, 197, 94, 0.15)',
    color: '#ffffff',
  },
  success: {
    background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
    boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)',
    color: '#ffffff',
  },
  error: {
    background: '#EF4444',
    color: '#ffffff',
  },
};

export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  style,
  disabled,
  ...props
}: ButtonProps) {
  const chitiVariant = variantMap[variant] ?? 'cinematic';
  return (
    <ChitiButton
      variant={chitiVariant}
      audioHapticTick={!disabled}
      disabled={disabled}
      style={{ ...sizeStyles[size], ...variantStyleOverrides[variant], ...style }}
      className={`font-bold flex items-center justify-center active:scale-[0.98] transition-all duration-200 ease-out disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      {...props}
    >
      {children}
    </ChitiButton>
  );
}

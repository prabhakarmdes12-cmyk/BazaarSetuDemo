'use client';

import React from 'react';
import { ChitiButton } from '@chiti/ui';

interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: 'primary' | 'secondary' | 'success' | 'ghost' | 'surface' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const sizeStyles: Record<'sm' | 'md' | 'lg', React.CSSProperties> = {
  sm: { padding: '8px 14px', fontSize: '0.8rem', borderRadius: '6px' },
  md: { padding: '12px 20px', fontSize: '0.9rem', borderRadius: '8px' },
  lg: { padding: '16px 28px', fontSize: '1rem', borderRadius: '10px' },
};

// Map BazaarSetu variants onto the Chiti button variants.
const variantMap: Record<string, 'cinematic' | 'glass' | 'saas' | 'error'> = {
  primary: 'cinematic',
  gradient: 'cinematic',
  secondary: 'glass',
  ghost: 'glass',
  surface: 'saas',
  success: 'cinematic',
  error: 'error',
};

const variantStyleOverrides: Record<string, React.CSSProperties> = {
  success: {
    background: 'linear-gradient(135deg, hsl(150, 80%, 45%), hsl(150, 80%, 32%))',
    boxShadow: '0 4px 12px rgba(20, 184, 102, 0.3)',
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

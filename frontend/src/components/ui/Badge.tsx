'use client';

import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'urgent' | 'new' | 'completed' | 'pending' | 'cancelled';
  className?: string;
  uppercase?: boolean;
}

// Map Chiti Bazaar badge states onto the Chiti badge variants (success | warn | error).
const variantMap: Record<string, 'success' | 'warn' | 'error'> = {
  default: 'success',
  success: 'success',
  completed: 'success',
  warning: 'warn',
  pending: 'warn',
  new: 'warn',
  info: 'warn',
  error: 'error',
  urgent: 'error',
  cancelled: 'error',
};

export default function Badge({
  children,
  variant = 'default',
  className = '',
  uppercase = true,
}: BadgeProps) {
  const chitiVariant = variantMap[variant] ?? 'success';
  return (
    <span
      className={`c-badge ${chitiVariant} backdrop-blur-md ${uppercase ? 'uppercase tracking-wider' : ''} ${className}`}
    >
      {children}
    </span>
  );
}
'use client';

import React from 'react';
import { ChitiInput } from '@chiti/ui';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
  variant?: 'default' | 'rounded' | 'pill';
  error?: boolean;
}

const variantRadius: Record<'default' | 'rounded' | 'pill', number> = {
  default: 8,
  rounded: 16,
  pill: 9999,
};

export default function Input({
  icon,
  rightElement,
  className = '',
  variant = 'default',
  error = false,
  style,
  ...props
}: InputProps) {
  return (
    <div className="relative group">
      {icon && (
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-on-surface-variant z-10">
          {icon}
        </div>
      )}
      <ChitiInput
        error={error}
        style={{ borderRadius: variantRadius[variant], ...style }}
        className={`w-full py-4 ${icon ? 'pl-12' : 'pl-4'} ${
          rightElement ? 'pr-28' : 'pr-4'
        } transition-all duration-150 text-on-surface placeholder:text-on-surface-variant/60 ${className}`}
        {...props}
      />
      {rightElement && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {rightElement}
        </div>
      )}
    </div>
  );
}

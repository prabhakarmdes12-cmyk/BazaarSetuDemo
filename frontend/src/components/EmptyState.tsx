'use client';

import React from 'react';
import { Icon } from './ui';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
}

export default function EmptyState({
  icon = 'storefront',
  title,
  description,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
      <div className="w-24 h-24 bg-surface-container-low rounded-full flex items-center justify-center mb-6">
        <Icon name={icon} size="xl" className="text-on-surface-variant" />
      </div>
      <h3 className="text-xl font-bold text-on-surface mb-2 font-headline">{title}</h3>
      <p className="text-on-surface-variant max-w-xs mx-auto">{description}</p>
    </div>
  );
}

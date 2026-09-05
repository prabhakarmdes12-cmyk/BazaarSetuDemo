'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import { Icon } from '@/components/ui';

interface FavoriteButtonProps {
  shopId: string;
  isFavorite: boolean;
  token: string | null;
  size?: 'sm' | 'md';
}

export default function FavoriteButton({ shopId, isFavorite: initialFav, token, size = 'md' }: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(initialFav);
  const [loading, setLoading] = useState(false);

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!token || loading) return;
    setLoading(true);
    try {
      const res = await api.post<{ success: boolean; data: { isFavorite: boolean } }>(
        '/api/favorites/toggle',
        { shopId },
        token
      );
      if (res.success) setIsFavorite(res.data.isFavorite);
    } catch {}
    setLoading(false);
  };

  const sizeClasses = size === 'sm' ? 'w-8 h-8 text-base' : 'w-10 h-10 text-xl';

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`${sizeClasses} flex items-center justify-center rounded-full transition-all ${
        isFavorite ? 'bg-error-container' : 'bg-surface-container-low hover:bg-surface-container-high'
      }`}
    >
      <Icon name="favorite" size="sm" filled={isFavorite} className={isFavorite ? 'text-error' : 'text-on-surface-variant'} />
    </button>
  );
}

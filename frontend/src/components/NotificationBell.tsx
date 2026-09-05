'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Icon } from '@/components/ui';

interface NotificationBellProps {
  token: string | null;
}

export default function NotificationBell({ token }: NotificationBellProps) {
  const router = useRouter();
  const [count, setCount] = useState(0);

  const loadCount = useCallback(async () => {
    try {
      const res = await api.get<{ success: boolean; data: { count: number } }>(
        '/api/notifications/unread-count',
        token || undefined
      );
      if (res.success) setCount(res.data.count);
    } catch {}
  }, [token]);

  useEffect(() => {
    if (!token) return;
    loadCount();
    const interval = setInterval(loadCount, 30000);
    return () => clearInterval(interval);
  }, [token, loadCount]);

  // Expose refresh for parent components
  (NotificationBell as unknown as { refresh: () => void }).refresh = loadCount;

  return (
    <button
      onClick={() => router.push('/customer/notifications')}
      aria-label="Notifications"
      className="relative w-10 h-10 flex items-center justify-center rounded-xl hover:bg-surface-container-high transition-colors"
    >
      <Icon name="notifications" className="text-on-surface" />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 bg-error-container text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </button>
  );
}

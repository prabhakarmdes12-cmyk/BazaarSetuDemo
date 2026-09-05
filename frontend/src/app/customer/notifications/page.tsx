'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import { Icon } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { Notification } from '@/types';
import { api } from '@/lib/api';

export default function NotificationsPage() {
  const router = useRouter();
  const { token, isLoading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    try {
      const res = await api.get<{ success: boolean; data: Notification[] }>('/api/notifications', token || undefined);
      if (res.success) setNotifications(res.data);
    } catch {}
    setLoading(false);
  }, [token]);

  useEffect(() => {
    if (!authLoading && !token) { window.location.assign('/login'); return; }
    if (token) loadNotifications();
  }, [token, authLoading, loadNotifications]);

  const markAllRead = async () => {
    try {
      await api.post('/api/notifications/mark-read', {}, token || undefined);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {}
  };

  const handleNotificationClick = (notification: Notification) => {
    if (notification.data) {
      try {
        const parsed = JSON.parse(notification.data);
        if (parsed.chatId) router.push(`/customer/shop/${parsed.chatId}`);
        else if (parsed.orderId) router.push('/customer/orders');
      } catch {}
    }
  };

  return (
    <AppShell topNavTitle="Notifications" showBack>
      <div className="space-y-3">
        {notifications.some((n) => !n.isRead) && (
          <button onClick={markAllRead} className="text-sm text-primary font-medium">
            Sab padh liya
          </button>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card animate-pulse !p-3">
                <div className="h-4 bg-surface-container-high rounded w-2/3 mb-2" />
                <div className="h-3 bg-surface-container-high rounded w-full" />
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16">
            <Icon name="notifications" size="xl" className="text-on-surface-variant mb-4" />
            <p className="text-on-surface-variant">Koi notification nahi</p>
          </div>
        ) : (
          notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => handleNotificationClick(n)}
              className={`card !p-3 w-full text-left ${!n.isRead ? 'border-l-4 border-primary' : ''}`}
            >
              <div className="flex items-start gap-3">
                <Icon name={n.type === 'NEW_ORDER' ? 'shopping_cart' : n.type === 'ORDER_STATUS' ? 'package_2' : 'chat_bubble'} />
                <div className="flex-1">
                  <p className={`text-sm ${!n.isRead ? 'font-semibold' : 'font-medium'} text-on-surface`}>
                    {n.title}
                  </p>
                  <p className="text-xs text-on-surface-variant mt-0.5">{n.body}</p>
                  <p className="text-[11px] text-on-surface-variant mt-1">
                    {new Date(n.createdAt).toLocaleString('en-IN')}
                  </p>
                </div>
                {!n.isRead && <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />}
              </div>
            </button>
          ))
        )}
      </div>
    </AppShell>
  );
}

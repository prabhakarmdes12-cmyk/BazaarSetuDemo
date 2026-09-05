'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import { Icon } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { Chat } from '@/types';
import { api } from '@/lib/api';

export default function VendorChatsPage() {
  const router = useRouter();
  const { token, isLoading: authLoading } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  const loadChats = useCallback(async () => {
    try {
      const res = await api.get<{ success: boolean; data: Chat[] }>('/api/chats/vendor', token || undefined);
      if (res.success) setChats(res.data);
    } catch (err) {
      console.error('Failed to load chats:', err);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    if (!authLoading && !token) {
      window.location.assign('/login');
      return;
    }
    if (token) loadChats();
  }, [token, authLoading, loadChats]);

  return (
    <AppShell topNavTitle="Customer Chats" role="vendor">
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card animate-pulse !p-4">
              <div className="flex gap-3">
                <div className="w-12 h-12 rounded-full bg-surface-container-high" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-surface-container-high rounded w-1/2" />
                  <div className="h-3 bg-surface-container-high rounded w-3/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : chats.length === 0 ? (
        <div className="text-center py-16">
          <Icon name="chat_bubble" size="xl" className="text-on-surface-variant mb-4" />
          <p className="text-on-surface font-semibold text-lg">Abhi koi chat nahi hai</p>
          <p className="text-on-surface-variant text-sm mt-1">Customers aapko yahan message karenge</p>
        </div>
      ) : (
        <div className="space-y-2">
          {chats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => router.push(`/vendor/chats/${chat.id}`)}
              className="card !p-4 w-full flex items-center gap-3 hover:bg-surface-container-low text-left"
            >
              <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center flex-shrink-0">
                <Icon name="person" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-on-surface truncate">{chat.customerName || 'Customer'}</h4>
                  {chat.lastMessageAt && (
                    <span className="text-[11px] text-on-surface-variant">
                      {new Date(chat.lastMessageAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
                <p className="text-sm text-on-surface-variant truncate">{chat.lastMessage || 'Abhi koi message nahi'}</p>
              </div>
              {chat.unreadCount && chat.unreadCount > 0 && (
                <span className="bg-primary text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {chat.unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </AppShell>
  );
}

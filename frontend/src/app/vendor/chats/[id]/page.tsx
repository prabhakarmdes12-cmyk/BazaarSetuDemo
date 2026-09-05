'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import ChatInterface from '@/components/ChatInterface';
import { Icon } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/hooks/useSocket';
import { Message, Product } from '@/types';
import { api } from '@/lib/api';

type BasketRequestCard = {
  requestNumber: string;
  customer: { name: string; phone?: string };
  delivery: string;
  items: Array<{
    id: string;
    requestedName: string;
    quantity: number;
    unit: string;
    availabilityStatus: string;
    quotedPrice?: number;
    catalogPrice?: number;
    actions?: string[];
  }>;
  totals: { subtotal: number; deliveryFee: number; finalTotal: number };
};

export default function VendorChatPage() {
  const params = useParams();
  const router = useRouter();
  const { token, isLoading: authLoading } = useAuth();
  const chatId = params.id as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [requestCard, setRequestCard] = useState<BasketRequestCard | null>(null);
  const [loading, setLoading] = useState(true);
  const hasJoinedRef = useRef(false);

  const { isConnected, joinChat, sendMessage, sendProductMessage, onMessage } = useSocket(token);

  const loadChat = useCallback(async () => {
    try {
      const res = await api.get<{ success: boolean; data: { messages: Message[]; customerName: string } }>(
        `/api/chats/${chatId}`,
        token || undefined
      );
      if (res.success) {
        setMessages(res.data.messages || []);
        setCustomerName(res.data.customerName || 'Customer');
      }

      try {
        const draftRes = await api.get<{ success: boolean; data: { requestCard: BasketRequestCard } }>(
          `/api/basket/draft/${chatId}`,
          token || undefined,
        );
        if (draftRes.success) setRequestCard(draftRes.data.requestCard);
      } catch {
        setRequestCard(null);
      }
    } catch (err) {
      console.error('Failed to load chat:', err);
    }
    setLoading(false);
  }, [token, chatId]);

  useEffect(() => {
    if (!authLoading && !token) {
      window.location.assign('/login');
    }
  }, [token, authLoading]);

  useEffect(() => {
    if (!token || !chatId) return;
    loadChat();
  }, [token, chatId, loadChat]);

  useEffect(() => {
    if (!chatId || !isConnected || hasJoinedRef.current) return;
    joinChat(chatId);
    hasJoinedRef.current = true;
  }, [chatId, isConnected, joinChat]);

  useEffect(() => {
    const cleanup = onMessage((message: Message) => {
      setMessages((prev) => (prev.some((existing) => existing.id === message.id) ? prev : [...prev, message]));
    });
    return cleanup;
  }, [onMessage]);

  const handleSendMessage = useCallback(
    (content: string) => {
      sendMessage(chatId, content);
    },
    [chatId, sendMessage]
  );

  const handleSendProduct = useCallback(
    (product: { name: string; price: number; unit: string; image?: string }) => {
      sendProductMessage(chatId, product);
    },
    [chatId, sendProductMessage]
  );

  if (loading) {
    return (
      <AppShell topNavTitle="Chat" showBack showNav={false}>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell topNavTitle={customerName} showBack showNav={false} role="vendor">
      <div className="flex flex-col h-[calc(100vh-60px)]">
        {requestCard && (
          <div className="mx-3 mt-3 rounded-3xl border border-primary/20 bg-primary-fixed/60 p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-primary">New order request #{requestCard.requestNumber}</p>
                <p className="font-headline text-lg font-extrabold text-on-primary-fixed">{requestCard.customer.name}</p>
                <p className="text-xs text-on-primary-fixed-variant">Delivery: {requestCard.delivery.replace('_', ' ')}</p>
              </div>
              <Icon name="shopping_bag" className="text-primary" />
            </div>
            <div className="mt-3 space-y-2">
              {requestCard.items.map((item) => (
                <div key={item.id} className="rounded-2xl bg-surface-container-lowest p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-bold text-sm text-on-surface">{item.requestedName}</p>
                      <p className="text-xs text-on-surface-variant">{item.quantity} {item.unit} · {item.availabilityStatus.replace(/_/g, ' ')}</p>
                    </div>
                    <span className="text-sm font-extrabold text-primary">
                      {item.quotedPrice || item.catalogPrice ? `₹${item.quotedPrice || item.catalogPrice}` : 'Quote'}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {(item.actions || []).slice(0, 5).map((action) => (
                      <span key={action} className="rounded-full bg-surface-container-low px-2 py-1 text-[10px] font-bold text-on-surface-variant">
                        {action.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between rounded-2xl bg-surface-container-lowest px-3 py-2 text-sm font-extrabold text-on-surface">
              <span>Total ₹{requestCard.totals.finalTotal}</span>
              <span className="text-xs text-on-surface-variant">Delivery ₹{requestCard.totals.deliveryFee}</span>
            </div>
          </div>
        )}
        <ChatInterface
          messages={messages}
          onSendMessage={handleSendMessage}
          onSendProduct={handleSendProduct}
          currentUserRole="vendor"
          isConnected={isConnected}
        />
      </div>
    </AppShell>
  );
}

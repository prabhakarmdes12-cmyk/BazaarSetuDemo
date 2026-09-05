'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon, Badge, Button } from '@/components/ui';
import { OrderSkeleton } from '@/components/Skeletons';
import { useAuth } from '@/hooks/useAuth';
import { Order } from '@/types';
import { api } from '@/lib/api';

const ORDER_FILTERS = ['Sabhi Orders', 'Active', 'Completed'];

export default function CustomerOrdersPage() {
  const router = useRouter();
  const { token, isLoading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('Sabhi Orders');
  const [repeatingId, setRepeatingId] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    try {
      const res = await api.get<{ success: boolean; data: Order[] }>('/api/orders/my', token || undefined);
      if (res.success) setOrders(res.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    if (!authLoading && !token) { window.location.assign('/login'); return; }
    if (token) loadOrders();
  }, [token, authLoading, loadOrders]);

  const handleRepeatOrder = async (orderId: string) => {
    setRepeatingId(orderId);
    try {
      const res = await api.post<{ success: boolean; data: { cart: { shopId: string } } }>(
        `/api/orders/repeat/${orderId}`, {}, token || undefined
      );
      if (res.success) router.push('/customer/cart');
    } catch (err) { console.error('Repeat order failed:', err); }
    setRepeatingId(null);
  };

  const filteredOrders = orders.filter((o) => {
    if (activeFilter === 'Active') return ['pending', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'pickup'].includes(o.status);
    if (activeFilter === 'Completed') return ['completed', 'rejected'].includes(o.status);
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge variant="success">DELIVERED</Badge>;
      case 'rejected': return <Badge variant="cancelled">CANCELLED</Badge>;
      case 'pending': return <Badge variant="warning">PENDING</Badge>;
      case 'accepted': return <Badge variant="info">ACCEPTED</Badge>;
      case 'preparing': return <Badge variant="info">PREPARING</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="text-on-surface">
      <header className="fixed top-0 w-full z-50 bg-surface-container-lowest/80 backdrop-blur-xl flex items-center justify-between px-6 py-4 shadow-top-bar">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="flex items-center justify-center p-2 rounded-full hover:bg-surface-container transition-transform active:scale-95">
            <Icon name="arrow_back" className="text-primary" />
          </button>
          <h1 className="font-headline font-bold text-xl tracking-tight text-on-surface">Aapke Orders</h1>
        </div>
      </header>

      <main className="pt-24 pb-32 px-5 max-w-2xl mx-auto min-h-screen">
        <div className="flex gap-3 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          {ORDER_FILTERS.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap active:scale-95 transition-all ${
                activeFilter === filter ? 'bg-primary-fixed text-on-primary-fixed' : 'bg-surface-container-high text-on-surface-variant'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">{[1, 2].map((i) => <OrderSkeleton key={i} />)}</div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-surface-container-low rounded-full flex items-center justify-center mx-auto mb-6">
              <Icon name="receipt_long" size="xl" className="text-on-surface-variant" />
            </div>
            <p className="text-on-surface font-semibold text-lg">Abhi koi order nahi</p>
            <p className="text-on-surface-variant text-sm mt-1">Paas ki dukaan se order karein</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className={`bg-surface-container-lowest rounded-xl p-5 shadow-sm border relative overflow-hidden ${
                  order.status === 'rejected' ? 'border-l-4 border-error' : 'border-outline-variant/15'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-surface-container flex items-center justify-center">
                      <Icon name="storefront" className="text-on-surface-variant" />
                    </div>
                    <div>
                      <h3 className="font-headline font-bold text-lg text-on-surface">{order.shopName || 'Shop'}</h3>
                      <div className="flex items-center gap-2 text-on-surface-variant text-xs mt-1">
                        <Icon name="calendar_today" size="sm" />
                        <span>{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} • {new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>
                  {getStatusBadge(order.status)}
                </div>

                <div className="flex items-center justify-between py-4 border-y border-outline-variant/10">
                  <div className="space-y-1">
                    <p className="text-on-surface-variant text-xs">Items</p>
                    <p className="font-semibold text-on-surface">{order.items.length} items</p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-on-surface-variant text-xs">Total Amount</p>
                    <p className="font-bold text-xl text-on-surface">₹{order.totalAmount}</p>
                  </div>
                </div>

                <div className="mt-5 flex gap-3">
                  <Button variant="surface" size="sm" className="flex-1" onClick={() => router.push(`/customer/orders/${order.id}`)}>
                    Details Dekhein
                  </Button>
                  {order.status !== 'rejected' && (
                    <button
                      onClick={() => handleRepeatOrder(order.id)}
                      disabled={repeatingId === order.id}
                      className="flex-[1.5] bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold py-3 rounded-xl shadow-lg shadow-primary/10 active:scale-95 transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Icon name="rebase_edit" size="sm" />
                      {repeatingId === order.id ? 'Cart mein daal rahe...' : 'Repeat karein'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-12 text-center pb-12">
          <p className="font-headline italic text-sm text-on-surface-variant/50">Apni local dukaan, ab online</p>
        </div>
      </main>
    </div>
  );
}

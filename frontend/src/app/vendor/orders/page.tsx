'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import OrderCard from '@/components/OrderCard';
import OrderProgress from '@/components/OrderProgress';
import { Icon } from '@/components/ui';
import { OrderSkeleton } from '@/components/Skeletons';
import { useAuth } from '@/hooks/useAuth';
import { Order, OrderStatus } from '@/types';
import { api } from '@/lib/api';

export default function VendorOrdersPage() {
  const router = useRouter();
  const { token, isLoading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  const loadOrders = useCallback(async () => {
    try {
      const res = await api.get<{ success: boolean; data: Order[] }>('/api/orders/vendor', token || undefined);
      if (res.success) setOrders(res.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    if (!authLoading && !token) { window.location.assign('/login'); return; }
    if (token) loadOrders();
  }, [token, authLoading, loadOrders]);

  const handleStatusUpdate = async (orderId: string, status: OrderStatus) => {
    try {
      await api.patch(`/api/orders/${orderId}/status`, { status }, token || undefined);
      await loadOrders();
    } catch (err) { console.error(err); }
  };

  const filteredOrders = orders.filter((o) => {
    if (filter === 'active') return ['pending', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'pickup'].includes(o.status);
    if (filter === 'completed') return ['completed', 'rejected'].includes(o.status);
    return true;
  });

  return (
    <AppShell topNavTitle="All Orders" role="vendor">
      <div className="space-y-4">
        <div className="flex gap-2">
          {(['all', 'active', 'completed'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                filter === f ? 'bg-primary text-white' : 'bg-surface-container-lowest text-on-surface-variant'
              }`}>{f.charAt(0).toUpperCase() + f.slice(1)}
              {f === 'active' && orders.filter((o) => ['pending', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'pickup'].includes(o.status)).length > 0 && (
                <span className="ml-1 bg-surface-container-lowest text-primary text-xs px-1.5 py-0.5 rounded-full">
                  {orders.filter((o) => ['pending', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'pickup'].includes(o.status)).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map((i) => <OrderSkeleton key={i} />)}</div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <Icon name="receipt_long" size="xl" className="text-on-surface-variant mb-3" />
            <p className="text-on-surface-variant">Koi order nahi</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div key={order.id} className="space-y-2">
                <OrderProgress status={order.status} />
                <OrderCard order={order} onStatusUpdate={handleStatusUpdate} isVendor />
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

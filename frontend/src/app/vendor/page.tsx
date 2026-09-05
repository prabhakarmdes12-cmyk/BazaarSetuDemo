'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import { Icon, Badge, Button } from '@/components/ui';
import { OrderSkeleton } from '@/components/Skeletons';
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/hooks/useSocket';
import { Order, OrderStatus, VendorSummary } from '@/types';
import { api } from '@/lib/api';

export default function VendorDashboard() {
  const router = useRouter();
  const { token, user, isLoading: authLoading } = useAuth();
  const { onNotification } = useSocket(token);
  const [orders, setOrders] = useState<Order[]>([]);
  const [summary, setSummary] = useState<VendorSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [newOrderAlert, setNewOrderAlert] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [ordersRes, summaryRes] = await Promise.all([
        api.get<{ success: boolean; data: Order[] }>('/api/orders/vendor', token || undefined),
        api.get<{ success: boolean; data: VendorSummary }>('/api/orders/vendor/summary', token || undefined),
      ]);
      if (ordersRes.success) setOrders(ordersRes.data);
      if (summaryRes.success) setSummary(summaryRes.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    if (!authLoading && !token) { window.location.assign('/login'); return; }
    if (token) loadData();
  }, [token, authLoading, loadData]);

  useEffect(() => {
    const cleanup = onNotification((data) => {
      if (data.type === 'NEW_ORDER') {
        setNewOrderAlert(true);
        loadData();
        setTimeout(() => setNewOrderAlert(false), 5000);
      }
    });
    return cleanup;
  }, [onNotification, loadData]);

  const handleStatusUpdate = async (orderId: string, status: OrderStatus) => {
    try {
      await api.patch(`/api/orders/${orderId}/status`, { status }, token || undefined);
      await loadData();
    } catch (err) { console.error(err); }
  };

    const handleRejectOrder = async (orderId: string) => {
    const reason = prompt('Order reject karne ka kaaran likhein (e.g. Out of stock, Dukaan band):', 'Out of stock');
    if (!reason) return;
    try {
      await api.patch(`/api/orders/${orderId}/status`, { status: 'rejected', reason }, token || undefined);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleVerifyPickupOtp = async (orderId: string) => {
    const otp = prompt('Customer ka 4-digit Pickup OTP darj karein:');
    if (!otp) return;
    try {
      const res = await api.patch<{ success: boolean; message?: string }>(`/api/orders/${orderId}/status`, { status: 'completed', otp: otp.trim() }, token || undefined);
      if (!res.success && res.message) {
        alert(res.message);
      }
      await loadData();
    } catch (err: any) {
      alert(err.message || 'OTP verification failed');
    }
  };

  const pendingOrders = orders.filter((o) => ['pending', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'pickup'].includes(o.status));

  const quickActions = [
    { icon: 'chat_bubble', label: 'Chats dekhein', href: '/vendor/chats' },
    { icon: 'inventory', label: 'Orders manage', href: '/vendor/orders' },
    { icon: 'storefront', label: 'Products manage', href: '/vendor/products' },
    { icon: 'add_circle', label: 'Naya Item', href: '/vendor/products' },
  ];

  return (
    <AppShell role="vendor">
      {newOrderAlert && (
        <div className="bg-primary text-white rounded-xl p-4 flex items-center gap-3 animate-pulse mb-6">
          <Icon name="notifications" />
          <div>
            <p className="font-bold">Naya Order Aaya!</p>
            <p className="text-sm opacity-90">Jaldi dekho aur accept karo</p>
          </div>
        </div>
      )}

      {/* Hero Greeting */}
      <section className="mb-10">
        <h1 className="text-4xl font-headline font-extrabold tracking-tight text-on-surface mb-2">
          Namaste, {user?.name || 'Shopkeeper'} ji <Icon name="waving_hand" size="lg" />
        </h1>
        <p className="text-on-surface-variant font-body opacity-80">
          Your store is buzzing with activity today. Here is what&apos;s happening.
        </p>
      </section>

      {/* Stats Grid */}
      {summary && (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-surface-container-lowest p-6 rounded-xl shadow-editorial-lg flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <Icon name="package_2" className="text-primary text-3xl" />
              <span className="text-secondary font-bold text-xs bg-secondary-container/20 px-2 py-1 rounded-full flex items-center gap-1">
                <Icon name="check_circle" size="sm" filled />
                {summary.today.completed} completed
              </span>
            </div>
            <div className="mt-4">
              <h3 className="text-on-surface-variant font-label text-sm font-semibold uppercase tracking-wider mb-1">Aaj ke orders</h3>
              <p className="text-4xl font-headline font-bold text-on-surface">{summary.today.orders}</p>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-xl shadow-editorial-lg flex flex-col justify-between border-l-4 border-primary">
            <div className="flex justify-between items-start">
              <Icon name="pending_actions" className="text-primary text-3xl" />
              <Badge variant="urgent">Urgent</Badge>
            </div>
            <div className="mt-4">
              <h3 className="text-on-surface-variant font-label text-sm font-semibold uppercase tracking-wider mb-1">Pending orders</h3>
              <p className="text-4xl font-headline font-bold text-on-surface">{String(summary.today.pending).padStart(2, '0')}</p>
            </div>
          </div>

          <div className="leaf-gradient p-6 rounded-xl shadow-saffron flex flex-col justify-between text-on-primary">
            <div className="flex justify-between items-start">
              <Icon name="payments" className="text-white text-3xl" filled />
              <Icon name="trending_up" className="text-white/50" />
            </div>
            <div className="mt-4">
              <h3 className="text-white/80 font-label text-sm font-semibold uppercase tracking-wider mb-1">Aaj ki kamaai</h3>
              <p className="text-4xl font-headline font-bold">₹{summary.today.revenue}</p>
            </div>
          </div>
        </section>
      )}

      {/* Quick Actions Bento */}
      <section className="mb-12">
        <h2 className="text-xl font-headline font-bold mb-6 flex items-center gap-2">
          Quick Actions
          <span className="h-1 w-12 bg-primary-container rounded-full" />
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => router.push(action.href)}
              className="flex flex-col items-center justify-center gap-3 p-6 bg-surface-container-low rounded-xl hover:bg-primary-fixed/30 transition-colors group"
            >
              <div className="w-12 h-12 rounded-full bg-surface-container-lowest flex items-center justify-center text-primary shadow-sm group-active:scale-90 transition-transform">
                <Icon name={action.icon} />
              </div>
              <span className="font-label text-sm font-bold text-on-surface-variant">{action.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Main Content: Orders + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Recent Orders */}
        <section className="lg:col-span-2">
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-xl font-headline font-bold">Recent Orders</h2>
            <button onClick={() => router.push('/vendor/orders')} className="text-primary font-bold text-sm hover:underline">View All</button>
          </div>
          {loading ? (
            <div className="space-y-3">{[1, 2].map((i) => <OrderSkeleton key={i} />)}</div>
          ) : pendingOrders.length === 0 ? (
            <div className="text-center py-8">
              <Icon name="check_circle" size="xl" className="text-secondary mb-2" />
              <p className="text-on-surface-variant text-sm">Koi active order nahi</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingOrders.slice(0, 5).map((order) => (
                <div key={order.id} className="bg-surface-container-lowest p-5 rounded-xl flex items-center gap-4 hover:shadow-md transition-shadow">
                  <div className="w-16 h-16 rounded-lg bg-surface-container-low overflow-hidden flex-shrink-0 flex items-center justify-center">
                    <Icon name="storefront" className="text-on-surface-variant" />
                  </div>
                  <div className="flex-grow">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-headline font-bold text-on-surface truncate">{order.items[0]?.productName || 'Order'}</h4>
                      <span className="font-label font-bold text-primary">₹{order.totalAmount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-on-surface-variant">Order #{order.id.slice(-5)} • {new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                      <Badge variant={order.status === 'pending' ? 'new' : order.status === 'completed' ? 'completed' : 'info'}>
                        {order.status === 'pending' ? 'New' : order.status === 'accepted' ? 'Packed' : 'Preparing'}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Sidebar */}
        <section className="lg:col-span-1 space-y-6">
          <h2 className="text-xl font-headline font-bold">Shop Performance</h2>
          <div className="bg-surface-container-low rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary-container/10 rounded-full blur-2xl" />
            <div className="relative z-10">
              <div className="mb-6">
                <p className="text-xs font-label font-bold text-on-surface-variant uppercase tracking-widest mb-1">Aaj ke Orders</p>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-headline font-bold">{summary?.today?.orders ?? 0}</span>
                </div>
                <p className="text-[11px] text-on-surface-variant mt-1">
                  Pending: {summary?.today?.pending ?? 0} &bull; Completed: {summary?.today?.completed ?? 0}
                </p>
              </div>
              <div className="space-y-5">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span>Pending Ratio</span>
                    <span className="text-secondary">
                      {summary?.today?.orders ? Math.round(((summary.today.pending) / summary.today.orders) * 100) : 0}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-surface-container-lowest rounded-full overflow-hidden">
                    <div
                      className="h-full bg-secondary"
                      style={{ width: `${summary?.today?.orders ? Math.round((summary.today.pending / summary.today.orders) * 100) : 0}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span>Aaj ka Revenue</span>
                    <span className="text-primary">₹{(summary?.today?.revenue ?? 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="h-1.5 w-full bg-surface-container-lowest rounded-full overflow-hidden">
                    <div className="h-full bg-primary-container w-full" />
                  </div>
                </div>
              </div>
              <div className="mt-8 pt-6 border-t border-white/50">
                <p className="text-xs font-medium italic text-on-surface-variant leading-relaxed">
                  &quot;Ramesh ji, your &apos;Fast Delivery&apos; badge is attracting 20% more customers this week!&quot;
                </p>
              </div>
              <button
                onClick={() => router.push('/vendor/performance')}
                className="mt-4 w-full text-primary font-bold text-xs flex items-center gap-1 justify-center active:scale-95 transition-transform"
              >
                View Full Performance
                <Icon name="arrow_forward" size="sm" />
              </button>
            </div>
          </div>

          {/* Grow your sales card */}
          <div className="p-6 bg-tertiary-fixed rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 bg-surface-container-lowest rounded-xl flex items-center justify-center text-tertiary">
              <Icon name="campaign" />
            </div>
            <div>
              <h4 className="font-headline font-bold text-on-tertiary-fixed text-sm">Grow your sales</h4>
              <p className="text-xs text-on-tertiary-fixed-variant">Start a local ad campaign today.</p>
            </div>
          </div>

          {/* Udhaar Ledger quick link */}
          <button
            onClick={() => router.push('/vendor/udhaar')}
            className="w-full p-6 bg-surface-container-lowest rounded-2xl flex items-center justify-between hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary-fixed rounded-xl flex items-center justify-center text-primary">
                <Icon name="account_balance_wallet" />
              </div>
              <span className="font-headline font-bold text-on-surface">Udhaar Ledger</span>
            </div>
            <Icon name="chevron_right" className="text-outline-variant" />
          </button>

          {/* Payouts quick link */}
          <button
            onClick={() => router.push('/vendor/payouts')}
            className="w-full p-6 bg-surface-container-lowest rounded-2xl flex items-center justify-between hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-secondary-container/20 rounded-xl flex items-center justify-center text-secondary">
                <Icon name="payments" />
              </div>
              <span className="font-headline font-bold text-on-surface">Payouts</span>
            </div>
            <Icon name="chevron_right" className="text-outline-variant" />
          </button>
        </section>
      </div>
    </AppShell>
  );
}

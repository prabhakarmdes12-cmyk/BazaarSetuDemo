'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Icon, Badge, Button } from '@/components/ui';
import AdminSideNav from '@/components/AdminSideNav';
import { useAuth } from '@/hooks/useAuth';
import { Shop, Order } from '@/types';
import { api } from '@/lib/api';

interface Analytics {
  totalShops: number;
  activeShops: number;
  totalOrders: number;
  totalUsers: number;
  totalRevenue: number;
  pendingOrders: number;
  completedOrders: number;
  customers: number;
  vendors: number;
  dailyTrends: { date: string; orders: number; revenue: number }[];
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function AdminPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, user, isLoading: authLoading } = useAuth();
  const [shops, setShops] = useState<Shop[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'shops' | 'orders'>(
    (searchParams.get('tab') as 'overview' | 'shops' | 'orders') || 'overview'
  );
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [shopsRes, ordersRes, analyticsRes] = await Promise.all([
        api.get<{ success: boolean; data: Shop[] }>('/api/admin/shops', token || undefined),
        api.get<{ success: boolean; data: Order[] }>('/api/admin/orders', token || undefined),
        api.get<{ success: boolean; data: Analytics }>('/api/admin/analytics', token || undefined),
      ]);
      if (shopsRes.success) setShops(shopsRes.data);
      if (ordersRes.success) setOrders(ordersRes.data);
      if (analyticsRes.success) setAnalytics(analyticsRes.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    if (!authLoading && !token) { window.location.assign('/login'); return; }
    if (token) loadData();
  }, [token, authLoading, loadData]);

  const toggleShop = async (shopId: string, isActive: boolean) => {
    try {
      await api.patch(`/api/admin/shops/${shopId}`, { isActive: !isActive }, token || undefined);
      setShops((prev) => prev.map((s) => (s.id === shopId ? { ...s, isActive: !isActive } : s)));
    } catch (err) { console.error(err); }
  };

  const navItems = [
    { icon: 'dashboard', label: 'Overview', tab: 'overview' as const, href: '/admin' },
    { icon: 'storefront', label: 'Shops', tab: 'shops' as const, href: '/admin/shops' },
    { icon: 'receipt_long', label: 'Orders', tab: 'orders' as const, href: '/admin/orders' },
    { icon: 'settings', label: 'Settings', tab: 'overview' as const, href: '/admin/settings' },
  ];

  return (
    <div className="bg-background text-on-background min-h-screen pb-24 md:pb-0">
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl shadow-sm shadow-black/40 flex justify-between items-center px-6 py-4">
        <div className="flex items-center gap-3">
          <Icon name="grid_view" className="text-primary text-2xl" />
          <div className="flex flex-col">
            <h1 className="font-headline font-bold tracking-tight text-xl text-on-surface">Admin Dashboard</h1>
            <span className="text-[10px] font-medium tracking-[0.1em] text-primary uppercase italic">Apni local dukaan, ab online</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 text-on-surface-variant hover:bg-primary-fixed/30 transition-colors rounded-full" aria-label="Notifications">
            <Icon name="notifications" />
          </button>
          <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center border-2 border-white shadow-sm">
            <Icon name="person" className="text-primary" />
          </div>
        </div>
      </header>

      <AdminSideNav items={navItems.map((item) => ({
        icon: item.icon,
        label: item.label,
        isActive: activeTab === item.tab && item.href !== '/admin/settings',
        onClick: () => {
          if (item.href === '/admin/settings') {
            router.push('/admin/settings');
          } else {
            setActiveTab(item.tab);
          }
        },
      }))} />

      <main className="pt-24 px-6 max-w-7xl mx-auto md:ml-20 space-y-10">
        <section className="relative grid grid-cols-1 md:grid-cols-12 gap-8 items-end">
          <div className="md:col-span-7 py-4">
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-on-surface leading-[1.1]">
              Namaste, <span className="text-primary">Admin</span>.<br />
              Everything is <span className="text-secondary italic">flowing</span> well.
            </h2>
            <p className="mt-4 text-on-surface-variant max-w-md font-medium leading-relaxed">
              Manage your marketplace ecosystem, monitor daily revenue, and support local entrepreneurs in the digital courtyard.
            </p>
          </div>
        </section>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
          </div>
        ) : (
          <>
            {activeTab === 'overview' && analytics && (
              <>
                <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between border-l-4 border-primary">
                    <div className="flex justify-between items-start">
                      <span className="bg-surface-container p-3 rounded-lg text-on-surface-variant">
                        <Icon name="shopping_bag" />
                      </span>
                      <span className="flex items-center text-secondary text-sm font-bold bg-secondary-container/20 px-2 py-1 rounded-full">
                        <Icon name="trending_up" size="sm" className="mr-1" />
                        +12.5%
                      </span>
                    </div>
                    <div className="mt-8">
                      <p className="text-on-surface-variant font-headline font-semibold text-sm uppercase tracking-wider">Total orders</p>
                      <p className="text-4xl font-extrabold text-on-surface mt-1">{analytics.totalOrders.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between border-l-4 border-secondary">
                    <div className="flex justify-between items-start">
                      <span className="bg-surface-container p-3 rounded-lg text-on-surface-variant">
                        <Icon name="storefront" />
                      </span>
                      <Badge variant="success">Live</Badge>
                    </div>
                    <div className="mt-8">
                      <p className="text-on-surface-variant font-headline font-semibold text-sm uppercase tracking-wider">Active dukaan</p>
                      <p className="text-4xl font-extrabold text-on-surface mt-1">{analytics.activeShops}</p>
                    </div>
                  </div>

                  <div className="bg-primary-container p-6 rounded-xl shadow-lg flex flex-col justify-between text-on-primary-container relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                    <div className="flex justify-between items-start relative z-10">
                      <span className="bg-black/20 p-3 rounded-lg text-on-primary-container">
                        <Icon name="payments" />
                      </span>
                      <span className="text-xs font-bold bg-black/20 px-3 py-1 rounded-full uppercase tracking-tighter">Real-time</span>
                    </div>
                    <div className="mt-8 relative z-10">
                      <p className="font-headline font-bold text-sm uppercase tracking-widest opacity-80">Aaj ka revenue</p>
                      <p className="text-4xl font-extrabold mt-1">₹{analytics.totalRevenue.toLocaleString()}</p>
                    </div>
                  </div>
                </section>

                <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
                  <div className="lg:col-span-2 bg-surface-container-lowest p-8 rounded-2xl shadow-sm">
                    <div className="flex justify-between items-center mb-10">
                      <div>
                        <h3 className="text-xl font-bold tracking-tight">Revenue Growth</h3>
                        <p className="text-on-surface-variant text-sm mt-1">Last 7 days performance</p>
                      </div>
                      <div className="flex gap-2">
                        <button className="px-4 py-1.5 rounded-full bg-surface-container text-xs font-bold text-on-surface">Daily</button>
                        <button className="px-4 py-1.5 rounded-full text-xs font-bold text-on-surface-variant hover:bg-surface-container">Weekly</button>
                      </div>
                    </div>
                    <div className="flex items-end justify-between h-64 gap-3 md:gap-6 px-4">
                      {DAYS.map((day, i) => {
                        const heights = [40, 55, 45, 75, 65, 90, 30];
                        const isToday = i === 5;
                        return (
                          <div key={day} className="flex flex-col items-center flex-1 group">
                            <div
                              className={`w-full rounded-t-lg transition-all duration-300 ${
                                isToday ? 'bg-primary-container shadow-lg shadow-primary/30' : 'bg-primary/30 group-hover:bg-primary/50'
                              }`}
                              style={{ height: `${heights[i]}%` }}
                            />
                            <span className={`text-[10px] font-bold mt-4 uppercase ${isToday ? 'text-primary' : 'text-on-surface-variant'}`}>{day}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex flex-col gap-6">
                    <h3 className="text-xl font-bold tracking-tight px-2">Quick Actions</h3>
                    <button
                      onClick={() => setActiveTab('shops')}
                      className="group w-full bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-transparent hover:border-primary/20 transition-all text-left flex items-center justify-between active:scale-95"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-primary bg-primary-fixed p-3 rounded-xl group-hover:scale-110 transition-transform">
                          <Icon name="storefront" />
                        </span>
                        <div>
                          <p className="font-bold text-on-surface">Shops enable/disable</p>
                          <p className="text-xs text-on-surface-variant">Manage seller visibility</p>
                        </div>
                      </div>
                      <Icon name="chevron_right" className="text-on-surface-variant" />
                    </button>
                    <button
                      onClick={() => setActiveTab('orders')}
                      className="group w-full bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-transparent hover:border-secondary/20 transition-all text-left flex items-center justify-between active:scale-95"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-secondary bg-secondary-container/30 p-3 rounded-xl group-hover:scale-110 transition-transform">
                          <Icon name="shopping_bag" />
                        </span>
                        <div>
                          <p className="font-bold text-on-surface">View All Orders</p>
                          <p className="text-xs text-on-surface-variant">Detailed transaction history</p>
                        </div>
                      </div>
                      <Icon name="chevron_right" className="text-on-surface-variant" />
                    </button>

                    <div className="mt-4 bg-inverse-surface text-inverse-on-surface p-6 rounded-3xl relative overflow-hidden">
                      <div className="absolute bottom-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl" />
                      <h4 className="text-lg font-bold mb-2">Merchant Highlight</h4>
                      <p className="text-sm text-inverse-on-surface/60 mb-6 leading-relaxed">Sharma Fresh Produce has seen a 40% growth in organic orders this week. Consider featuring them on the homepage.</p>
                      <button className="w-full bg-primary-container text-on-primary-container py-3 rounded-xl font-bold text-sm tracking-wide active:scale-[0.98] transition-all">Review Merchant</button>
                    </div>
                  </div>
                </section>
              </>
            )}

            {activeTab === 'shops' && (
              <div className="space-y-3 pb-20">
                {shops.map((shop) => (
                  <div key={shop.id} className="bg-surface-container-lowest flex items-center gap-4 p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-14 h-14 rounded-xl bg-primary-fixed flex items-center justify-center flex-shrink-0">
                      <Icon name="storefront" className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-on-surface truncate">{shop.name}</h4>
                      <p className="text-sm text-on-surface-variant truncate">{shop.address}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-on-surface-variant flex items-center gap-0.5">
                          <Icon name="star" size="sm" filled className="text-primary" /> {shop.rating?.toFixed(1) || '4.5'}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${shop.isActive ? 'bg-secondary-container/30 text-secondary' : 'bg-surface-container-highest text-on-surface-variant'}`}>
                          {shop.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleShop(shop.id, shop.isActive)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                        shop.isActive ? 'bg-error-container text-on-error-container hover:bg-error/20' : 'bg-secondary-container/30 text-secondary hover:bg-secondary-container/50'
                      }`}
                    >
                      {shop.isActive ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="space-y-3 pb-20">
                {orders.map((order) => (
                  <div key={order.id} className="bg-surface-container-lowest p-5 rounded-xl shadow-sm">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-bold text-sm text-on-surface truncate">{order.shopName || 'Shop'} → {order.customerName || 'Customer'}</p>
                        <p className="text-xs text-on-surface-variant">
                          {new Date(order.createdAt).toLocaleDateString('en-IN')} {new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${
                        order.status === 'completed' ? 'bg-secondary-container/30 text-secondary' :
                        order.status === 'pending' ? 'bg-primary-fixed text-on-primary-fixed-variant' :
                        order.status === 'rejected' ? 'bg-error-container text-on-error-container' :
                        'bg-tertiary-container text-on-tertiary-container'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="text-sm text-on-surface-variant">
                      {order.items.map((item) => (<span key={item.id}>{item.productName} × {item.quantity} </span>))}
                    </div>
                    <div className="mt-2 pt-2 border-t border-outline-variant/10 flex justify-between">
                      <span className="text-sm text-on-surface-variant">{order.items.length} items</span>
                      <span className="font-bold text-primary">₹{order.totalAmount}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-3 bg-surface-container-lowest/90 backdrop-blur-2xl shadow-bottom-nav rounded-t-[1.5rem] border-t border-outline-variant/10">
        {navItems.map((item) => (
          <button
            key={item.label}
            onClick={() => {
              if (item.href === '/admin/settings') {
                router.push('/admin/settings');
              } else {
                setActiveTab(item.tab);
              }
            }}
            className={`flex flex-col items-center justify-center rounded-xl px-5 py-1.5 active:scale-[0.98] transition-all ${
              (activeTab === item.tab && item.href !== '/admin/settings') ? 'bg-primary-container text-primary' : 'text-on-surface-variant hover:text-primary'
            }`}
            aria-label={item.label}
          >
            <Icon name={item.icon} filled={(activeTab === item.tab && item.href !== '/admin/settings')} />
            <span className="font-inter text-[11px] font-semibold tracking-wide uppercase mt-1">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

export default function AdminPage() {
  return (
    <React.Suspense fallback={null}>
      <AdminPanel />
    </React.Suspense>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { VendorSummary, UdhaarVendorSummary } from '@/types';
import { api } from '@/lib/api';

export default function VendorStatsPage() {
  const router = useRouter();
  const { token, isLoading: authLoading } = useAuth();
  const [summary, setSummary] = useState<VendorSummary | null>(null);
  const [udhaar, setUdhaar] = useState<UdhaarVendorSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !token) { window.location.assign('/login'); return; }
    if (token) {
      Promise.all([
        api.get<{ success: boolean; data: VendorSummary }>('/api/orders/vendor/summary', token),
        api.get<{ success: boolean; data: UdhaarVendorSummary }>('/api/udhaar/vendor/summary', token),
      ])
        .then(([ordersRes, udhaarRes]) => {
          if (ordersRes.success) setSummary(ordersRes.data);
          if (udhaarRes.success) setUdhaar(udhaarRes.data);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [token, authLoading]);

  const totalRevenue = summary?.overall?.totalRevenue || 0;

  return (
    <div className="bg-surface min-h-screen">
      {/* Top Bar */}
      <header className="fixed top-0 w-full z-50 bg-surface-container-lowest/80 backdrop-blur-xl shadow-top-bar">
        <div className="flex justify-between items-center px-6 py-4 w-full max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/vendor')}
              className="text-primary dark:text-primary active:scale-95 transition-transform duration-200 p-2 rounded-full hover:bg-primary-container"
            >
              <Icon name="arrow_back" />
            </button>
            <div>
              <h1 className="font-headline font-bold text-2xl tracking-tight text-primary dark:text-primary italic">BazaarSetu</h1>
              <p className="text-[10px] font-headline font-bold tracking-widest text-on-surface-variant italic">Apni local dukaan, ab online</p>
            </div>
          </div>
          <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-primary-container transition-colors active:scale-95">
            <Icon name="notifications" className="text-primary" />
          </button>
        </div>
      </header>

      <main className="pt-28 pb-32 px-6 max-w-5xl mx-auto">
        {/* Hero Header */}
        <section className="mb-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <span className="bg-primary-fixed text-on-primary-fixed px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 inline-block">Analytics Dashboard</span>
              <h2 className="text-4xl font-headline font-extrabold text-on-surface tracking-tight">
                Performance <span className="text-primary">Insights</span>
              </h2>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 rounded-xl bg-surface-container-highest text-on-surface font-semibold text-sm transition-all active:scale-95">Weekly</button>
              <button className="px-4 py-2 rounded-xl bg-primary-container text-primary font-bold text-sm transition-all active:scale-95 shadow-sm">Monthly</button>
            </div>
          </div>

          {/* Bento Grid Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Main Revenue Card */}
            <div className="md:col-span-2 relative overflow-hidden bg-surface-container-lowest rounded-3xl p-8 flex flex-col justify-between min-h-[280px]">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary-container/10 rounded-full -mr-20 -mt-20 blur-3xl" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <Icon name="payments" className="text-primary" />
                  <span className="font-bold text-on-surface-variant uppercase text-xs tracking-widest">Total Revenue</span>
                </div>
                <h3 className="text-5xl font-headline font-extrabold text-on-surface mb-2">₹{totalRevenue.toLocaleString('en-IN')}</h3>
                <div className="flex items-center gap-4 text-sm font-semibold">
                  <span className="text-on-surface-variant flex items-center gap-1">
                    <Icon name="today" size="sm" className="text-primary" />
                    Aaj: {summary?.today?.orders ?? 0} orders
                  </span>
                  <span className="text-on-surface-variant flex items-center gap-1">
                    <Icon name="pending_actions" size="sm" className="text-primary" />
                    Pending: {summary?.today?.pending ?? 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Customer Smiles Card */}
            <div className="bg-surface-container-lowest rounded-3xl p-8 flex flex-col justify-center items-center text-center">
              <div className="relative w-20 h-20 mb-4">
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="36" fill="transparent" stroke="#262a30" strokeWidth="8" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-black text-on-surface-variant">—</span>
                </div>
              </div>
              <h4 className="font-headline font-bold text-lg mb-1">Customer Smiles</h4>
              <p className="text-on-surface-variant text-sm px-4">Reviews abhi counted nahi hue. Order milestone ke baad rating yahan dikhegi.</p>
            </div>
          </div>
        </section>

        {/* Udhaar Summary */}
        <section className="mb-12">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-[2px] flex-grow bg-surface-container" />
            <h3 className="font-headline font-bold text-xl text-on-surface-variant italic">Future-Look: Udhaar Tracking</h3>
            <div className="h-[2px] flex-grow bg-surface-container" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-center">
            <div className="md:col-span-2">
              <h4 className="text-3xl font-headline font-extrabold mb-4 leading-tight">
                Digital Khata <br />Simplified.
              </h4>
              <p className="text-on-surface-variant mb-6">
                Keep track of pending payments from regular customers automatically. No more manual notebooks.
              </p>
              <button
                onClick={() => router.push('/vendor/udhaar')}
                className="flex items-center gap-2 text-primary font-bold hover:gap-4 transition-all group"
              >
                Manage Ledger <Icon name="arrow_forward" className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
            <div className="md:col-span-3 grid grid-cols-2 gap-4">
              <div className="bg-error-container/40 p-6 rounded-2xl border border-error/5">
                <Icon name="pending_actions" className="text-error mb-4" />
                <p className="text-xs font-bold text-on-error-container uppercase mb-1">Pending Udhaar</p>
                <p className="text-2xl font-headline font-black text-on-error-container">₹{(udhaar?.outstanding ?? 0).toLocaleString('en-IN')}</p>
                <p className="text-[10px] text-error mt-2 font-medium">{udhaar?.overdueCount ?? 0} customers overdue</p>
              </div>
              <div className="bg-secondary-container/20 p-6 rounded-2xl border border-secondary/5">
                <Icon name="check_circle" className="text-secondary mb-4" filled />
                <p className="text-xs font-bold text-on-secondary-container uppercase mb-1">Recovered (Total)</p>
                <p className="text-2xl font-headline font-black text-on-secondary-container">₹{(udhaar?.totalPaid ?? 0).toLocaleString('en-IN')}</p>
                <p className="text-[10px] text-secondary mt-2 font-medium">{udhaar?.activeCustomerCount ?? 0} active customers</p>
              </div>
            </div>
          </div>
        </section>

        {/* Top Performers */}
        <section className="mb-12">
          <h3 className="font-headline font-extrabold text-2xl mb-8 flex items-center gap-2">
            Top Performers
            <span className="w-8 h-[2px] bg-primary" />
          </h3>
          <div className="flex overflow-x-auto gap-6 hide-scrollbar pb-4 snap-x">
            {(summary?.topProducts || []).length === 0 ? (
              <div className="w-full bg-surface-container-low rounded-xl p-10 text-center">
                <Icon name="inventory_2" size="xl" className="text-on-surface-variant/40 mx-auto mb-3" />
                <p className="font-headline font-bold text-on-surface">Abhi koi products nahi beche</p>
                <p className="text-sm text-on-surface-variant mt-1">Order aane ke baad top sellers yahan dikhenge.</p>
              </div>
            ) : (summary?.topProducts || []).map((product, index) => (
              <div key={product.name} className="min-w-[280px] bg-surface-container-low rounded-xl p-4 snap-start border border-white/50">
                <div className="relative mb-4 rounded-xl overflow-hidden aspect-square bg-surface-container">
                  <Icon name="grocery" size="xl" className="absolute inset-0 m-auto text-on-surface-variant/30" />
                  {index === 0 && (
                    <div className="absolute top-2 left-2 bg-primary-dark text-white px-2 py-1 rounded-lg text-[10px] font-black uppercase">
                      #1 Best Seller
                    </div>
                  )}
                </div>
                <h5 className="font-bold text-on-surface text-lg">{product.name}</h5>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-on-surface-variant text-sm font-medium">{product.qty} kg sold</span>
                  <span className="text-secondary font-bold text-sm">₹{product.revenue.toLocaleString('en-IN')} Rev.</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

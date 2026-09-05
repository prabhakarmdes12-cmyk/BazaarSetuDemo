'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';

export default function YearlyReportPage() {
  const router = useRouter();
  const { token, isLoading: authLoading } = useAuth();
  const [year, setYear] = useState(2025);

  useEffect(() => {
    if (!authLoading && !token) { window.location.assign('/login'); }
  }, [token, authLoading]);

  return (
    <div className="bg-surface min-h-screen">
      {/* Top Bar */}
      <header className="fixed top-0 w-full z-50 bg-surface-container-lowest/80 backdrop-blur-xl shadow-top-bar">
        <div className="flex items-center justify-between px-6 h-16 w-full max-w-5xl mx-auto">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/vendor/reports')} className="active:scale-95 transition-transform p-2 rounded-full hover:bg-surface-container-high">
              <Icon name="arrow_back" className="text-primary" />
            </button>
            <h1 className="font-headline font-bold text-lg tracking-tight text-on-surface">Yearly Report</h1>
          </div>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="bg-surface-container-low border-none rounded-xl px-4 py-2 text-sm font-bold text-on-surface focus:ring-2 focus:ring-primary/30 appearance-none"
          >
            <option value={2025}>2025</option>
            <option value={2024}>2024</option>
          </select>
        </div>
      </header>

      <main className="pt-24 pb-32 px-6 max-w-5xl mx-auto">
        {/* Summary Cards */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm">
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Total Revenue</p>
            <p className="text-3xl font-headline font-extrabold text-on-surface">₹0</p>
          </div>
          <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm">
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Total Orders</p>
            <p className="text-3xl font-headline font-extrabold text-on-surface">0</p>
          </div>
          <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm">
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Avg Order Value</p>
            <p className="text-3xl font-headline font-extrabold text-on-surface">₹0</p>
          </div>
          <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm">
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Top Product</p>
            <p className="text-lg font-headline font-extrabold text-on-surface-variant">—</p>
          </div>
        </section>

        {/* Charts — no data yet */}
        <section className="mb-12">
          <h3 className="font-headline font-bold text-xl mb-6">Monthly Revenue</h3>
          <div className="bg-surface-container-lowest p-10 rounded-2xl text-center">
            <div className="w-14 h-14 bg-surface-container-high rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="bar_chart" className="text-on-surface-variant" />
            </div>
            <p className="font-headline font-bold text-on-surface">{year} ke liye abhi koi data nahi</p>
            <p className="text-sm text-on-surface-variant mt-1">Jab orders aayenge, monthly revenue aur orders yahan dikhenge.</p>
          </div>
        </section>

        {/* Download */}
        <section className="flex flex-col sm:flex-row gap-4">
          <button className="flex-1 editorial-gradient text-white py-4 rounded-xl font-headline font-bold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-saffron">
            <Icon name="download" />
            Download Annual Report (PDF)
          </button>
          <button className="flex-1 bg-surface-container-highest text-on-surface py-4 rounded-xl font-headline font-bold flex items-center justify-center gap-2 active:scale-95 transition-all">
            <Icon name="table_chart" />
            Export CSV
          </button>
        </section>
      </main>
    </div>
  );
}

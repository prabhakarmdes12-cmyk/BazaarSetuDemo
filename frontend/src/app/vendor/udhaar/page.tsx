'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon, Button } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';

interface UdhaarCustomer {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  totalDue: number;
  totalPaid: number;
  balance: number;
  creditLimit: number;
  lastRemindedAt: string | null;
  lastUpdated: string;
}

interface UdhaarSummary {
  totalDue: number;
  totalPaid: number;
  outstanding: number;
  collectionRate: number;
  customerCount: number;
  activeCustomerCount: number;
  dsoDays: number;
  overdueCount: number;
  creditUtilization: number;
}

// Starter demo entries if database has no active ledgers yet
const SAMPLE_DEMO_CUSTOMERS: UdhaarCustomer[] = [
  {
    id: 'demo-1',
    customerId: 'c-1',
    customerName: 'Vikram Sharma',
    customerPhone: '+91 98765 43210',
    totalDue: 650,
    totalPaid: 200,
    balance: 450,
    creditLimit: 2000,
    lastRemindedAt: '2026-09-03T10:30:00Z',
    lastUpdated: '2026-09-04T18:20:00Z',
  },
  {
    id: 'demo-2',
    customerId: 'c-2',
    customerName: 'Pooja Verma (Flat 204)',
    customerPhone: '+91 98123 45678',
    totalDue: 380,
    totalPaid: 200,
    balance: 180,
    creditLimit: 1500,
    lastRemindedAt: null,
    lastUpdated: '2026-09-05T09:15:00Z',
  },
];

export default function VendorUdhaarPage() {
  const router = useRouter();
  const { token, user, isLoading: authLoading } = useAuth();
  const [ledgers, setLedgers] = useState<UdhaarCustomer[]>([]);
  const [summary, setSummary] = useState<UdhaarSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDemo, setShowDemo] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'settled'>('all');

  const loadLedgers = useCallback(async () => {
    try {
      const [listRes, summaryRes] = await Promise.all([
        api.get<{ success: boolean; data: UdhaarCustomer[] }>('/api/udhaar/vendor/all', token || undefined),
        api.get<{ success: boolean; data: UdhaarSummary }>('/api/udhaar/vendor/summary', token || undefined),
      ]);
      if (listRes.success) {
        setLedgers(listRes.data);
        if (listRes.data.length === 0) setShowDemo(true);
      }
      if (summaryRes.success) setSummary(summaryRes.data);
    } catch {}
    setLoading(false);
  }, [token]);

  useEffect(() => {
    if (!authLoading && !token) {
      window.location.assign('/login');
      return;
    }
    if (token) loadLedgers();
  }, [token, authLoading, loadLedgers]);

  const displayedLedgers = ledgers.length > 0 ? ledgers : showDemo ? SAMPLE_DEMO_CUSTOMERS : [];
  const totalPending = displayedLedgers.reduce((sum, l) => sum + Math.max(0, l.balance), 0);
  const totalPaid = displayedLedgers.reduce((sum, l) => sum + l.totalPaid, 0);

  const handleSendReminder = (customer: UdhaarCustomer) => {
    const text = encodeURIComponent(
      `Namaste ${customer.customerName} ji, aapki dukaan ka bacha hua udhaar ₹${customer.balance} hai. Kripya UPI ya cash se settlement karein. Dhanyawaad - Chiti Bazaar.`
    );
    window.open(`https://wa.me/${customer.customerPhone.replace(/\D/g, '')}?text=${text}`, '_blank');
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen pb-32">
      {/* Top Header */}
      <header className="fixed top-0 w-full z-50 bg-surface/85 backdrop-blur-xl border-b border-white/5 shadow-top-bar">
        <div className="flex items-center justify-between px-6 h-16 w-full max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/vendor')}
              aria-label="Go back"
              className="active:scale-95 transition-transform text-primary p-1 rounded-lg hover:bg-primary/10"
            >
              <Icon name="arrow_back" />
            </button>
            <div>
              <h1 className="font-headline text-lg font-bold tracking-tight text-on-surface">
                Digital Khata Ledger
              </h1>
              <p className="text-[10px] text-on-surface-variant font-medium">Bacha hua Udhaar &bull; Hisaab-Kitab</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Quick Switch to Customer Storefront */}
            <button
              onClick={() => router.push('/customer')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/15 border border-primary/30 text-primary text-xs font-black uppercase tracking-wider font-headline hover:bg-primary/25 active:scale-95 transition-all"
            >
              <Icon name="shopping_cart" size="sm" filled />
              <span>Blinkit Store</span>
            </button>

            <button
              onClick={() => router.push('/vendor/udhaar/payments')}
              className="p-2 rounded-full text-on-surface-variant hover:text-primary hover:bg-primary/10 active:scale-95 transition-all"
              aria-label="Payment History"
            >
              <Icon name="history" />
            </button>
          </div>
        </div>
      </header>

      <main className="pt-24 px-6 max-w-7xl mx-auto space-y-8">
        {/* Welcome Section */}
        <section className="flex flex-wrap justify-between items-end gap-4">
          <div>
            <span className="text-xs font-black uppercase tracking-widest text-primary font-headline">
              Dukaan Management
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-on-surface mt-0.5 font-headline">
              Namaste {user?.name || 'Shopkeeper'} ji
            </h2>
            <p className="text-on-surface-variant text-xs sm:text-sm font-medium mt-1">
              Apni local dukaan ka digital hisaab &bull; Zero loss paper-free ledger
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => alert('New khata feature: Enter customer mobile number and amount to record a ledger entry.')}
              className="leaf-gradient text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-brand-glow flex items-center gap-1.5 active:scale-95 transition-all font-headline uppercase tracking-wider"
            >
              <Icon name="add" size="sm" />
              <span>+ Naya Khata Jodo</span>
            </button>
          </div>
        </section>

        {/* Luxury Obsidian Fintech Ledger Card */}
        <section className="relative overflow-hidden rounded-3xl bg-surface-container-low border border-primary/30 p-6 sm:p-8 shadow-editorial-lg">
          <div className="absolute top-0 right-0 w-80 h-80 bg-primary/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <p className="text-xs font-black uppercase tracking-widest text-primary font-headline">
                  Bacha hua Udhaar (Outstanding)
                </p>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-black tracking-tight text-on-surface font-headline">
                  ₹{totalPending}
                </span>
                <span className="inline-flex items-center text-xs font-bold text-primary bg-primary/15 px-2 py-0.5 rounded-full">
                  <Icon name="trending_up" size="sm" filled />
                  Active
                </span>
              </div>
              <p className="text-xs text-on-surface-variant font-medium">
                Pichle 30 din ka total baaki hisaab
              </p>
            </div>

            <div className="space-y-2 sm:text-right">
              <p className="text-xs font-black uppercase tracking-widest text-on-surface-variant font-headline">
                Chukaya hua (Collected)
              </p>
              <div className="flex items-baseline sm:justify-end gap-1">
                <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-emerald-400 font-headline">
                  ₹{totalPaid}
                </span>
              </div>
              <p className="text-xs text-on-surface-variant font-medium">
                Total successfully settled amount
              </p>
            </div>

            {/* Quick Action Footer */}
            <div className="col-span-1 sm:col-span-2 pt-5 border-t border-white/10 flex flex-wrap gap-3 justify-between items-center">
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3.5 py-1.5 text-xs text-on-surface-variant">
                <Icon name="verified_user" size="sm" className="text-primary" />
                <span>100% Encrypted &amp; Daily Auto-Backed Up</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.push('/vendor/payouts')}
                  className="bg-surface-container-lowest hover:bg-surface-container border border-white/10 text-on-surface font-bold px-4 py-2 rounded-xl text-xs active:scale-95 transition-all"
                >
                  Settlement Karo
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Credit Health Matrix */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg sm:text-xl font-bold tracking-tight text-on-surface flex items-center gap-2 font-headline">
              <Icon name="monitor_heart" className="text-primary" />
              Credit Health &amp; Recovery
            </h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-surface-container-low border border-white/5 rounded-2xl p-5 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-primary font-headline mb-1">
                Collection Rate
              </p>
              <p className="text-2xl font-black text-on-surface font-headline">
                {summary ? Math.round(summary.collectionRate) : '100'}%
              </p>
              <div className="w-full bg-surface-container-lowest h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-primary h-full rounded-full" style={{ width: `${summary ? Math.round(summary.collectionRate) : 100}%` }} />
              </div>
              <p className="text-[11px] text-on-surface-variant mt-1.5">Chukaya / kul udhaar</p>
            </div>

            <div className="bg-surface-container-low border border-white/5 rounded-2xl p-5 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant font-headline mb-1">
                DSO (Recovery Time)
              </p>
              <p className="text-2xl font-black text-on-surface font-headline">
                {summary ? summary.dsoDays : '0'} <span className="text-sm font-normal text-on-surface-variant">din</span>
              </p>
              <p className="text-[11px] text-on-surface-variant mt-3">Bharti wapsi ke avg din</p>
            </div>

            <div className="bg-surface-container-low border border-white/5 rounded-2xl p-5 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant font-headline mb-1">
                Credit Utilization
              </p>
              <p className="text-2xl font-black text-on-surface font-headline">
                {summary ? summary.creditUtilization : '0'}%
              </p>
              <div className="w-full bg-surface-container-lowest h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-secondary h-full rounded-full" style={{ width: `${summary ? summary.creditUtilization : 0}%` }} />
              </div>
              <p className="text-[11px] text-on-surface-variant mt-1.5">Limit ke mukable udhaar</p>
            </div>

            <div className="bg-surface-container-low border border-white/5 rounded-2xl p-5 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant font-headline mb-1">
                Overdue Khata
              </p>
              <p className="text-2xl font-black text-emerald-400 font-headline">
                {summary ? summary.overdueCount : '0'}
              </p>
              <p className="text-[11px] text-on-surface-variant mt-3">30+ din se purana</p>
            </div>
          </div>
        </section>

        {/* Customer Khata Ledger List */}
        <section className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-bold tracking-tight text-on-surface font-headline">
                Udhaar ki List ({displayedLedgers.length})
              </h3>
              <p className="text-xs text-on-surface-variant">Active customer ledger balances</p>
            </div>

            {ledgers.length === 0 && (
              <button
                onClick={() => setShowDemo(!showDemo)}
                className="text-xs font-bold text-primary bg-primary/10 border border-primary/30 px-3 py-1.5 rounded-full hover:bg-primary/20 transition-all"
              >
                {showDemo ? 'Hide Sample Entries' : 'Show Sample Customer Entries'}
              </button>
            )}
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="bg-surface-container-low rounded-2xl p-6 animate-pulse">
                  <div className="h-4 bg-surface-container rounded w-1/2 mb-2" />
                  <div className="h-6 bg-surface-container rounded w-1/3" />
                </div>
              ))}
            </div>
          ) : displayedLedgers.length === 0 ? (
            <div className="text-center py-16 bg-surface-container-low border border-white/5 rounded-3xl p-8">
              <div className="w-20 h-20 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                <Icon name="check_circle" size="xl" filled />
              </div>
              <h4 className="text-lg font-bold text-on-surface font-headline">Sab hisaab barabar hai!</h4>
              <p className="text-xs text-on-surface-variant mt-1 max-w-sm mx-auto">
                Filhaal koi pending udhaar nahi hai. Naye customer ka hisaab jodne ke liye &quot;Naya Khata Jodo&quot; par click karein.
              </p>
              <button
                onClick={() => setShowDemo(true)}
                className="mt-4 leaf-gradient text-white text-xs font-bold px-4 py-2 rounded-xl shadow-brand-glow"
              >
                Sample Khata Entries Dekhein
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {displayedLedgers.map((l) => {
                const isOverdue = l.balance > 500;
                const isCleared = l.balance <= 0;
                return (
                  <div
                    key={l.id}
                    className="bg-surface-container-low border border-white/5 hover:border-primary/30 rounded-3xl p-6 shadow-sm hover:shadow-editorial-lg transition-all duration-300"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-surface-container-lowest border border-white/10 flex items-center justify-center text-primary font-black font-headline text-lg">
                          {l.customerName[0]}
                        </div>
                        <div>
                          <h4 className="font-bold text-on-surface font-headline">{l.customerName}</h4>
                          <p className="text-xs text-on-surface-variant">{l.customerPhone}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant font-headline">
                          Baaki Balance
                        </span>
                        <p className="text-xl font-black text-primary font-headline">₹{l.balance}</p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <span className="text-on-surface-variant">
                        Kul Udhaar: <b className="text-on-surface">₹{l.totalDue}</b> &bull; Chukaya: <b className="text-emerald-400">₹{l.totalPaid}</b>
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSendReminder(l)}
                          className="flex items-center gap-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 px-3 py-1.5 rounded-xl font-bold text-xs transition-all active:scale-95"
                        >
                          <Icon name="chat" size="sm" filled />
                          <span>WhatsApp Reminder</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Security Info Card */}
        <section className="p-6 rounded-3xl bg-surface-container-low border border-white/5 flex flex-col sm:flex-row items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <Icon name="lock" size="lg" />
          </div>
          <div>
            <h4 className="font-bold text-on-surface text-sm font-headline">Safe &amp; Secure Digital Ledger</h4>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Your dukaan ledger is encrypted and backed up in real time. Never lose a paper khata diary again.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

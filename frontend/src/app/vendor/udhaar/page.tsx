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

export default function VendorUdhaarPage() {
  const router = useRouter();
  const { token, user, isLoading: authLoading } = useAuth();
  const [ledgers, setLedgers] = useState<UdhaarCustomer[]>([]);
  const [summary, setSummary] = useState<UdhaarSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const loadLedgers = useCallback(async () => {
    try {
      const [listRes, summaryRes] = await Promise.all([
        api.get<{ success: boolean; data: UdhaarCustomer[] }>('/api/udhaar/vendor/all', token || undefined),
        api.get<{ success: boolean; data: UdhaarSummary }>('/api/udhaar/vendor/summary', token || undefined),
      ]);
      if (listRes.success) setLedgers(listRes.data);
      if (summaryRes.success) setSummary(summaryRes.data);
    } catch {}
    setLoading(false);
  }, [token]);

  useEffect(() => {
    if (!authLoading && !token) { window.location.assign('/login'); return; }
    if (token) loadLedgers();
  }, [token, authLoading, loadLedgers]);

  const totalPending = ledgers.reduce((sum, l) => sum + Math.max(0, l.balance), 0);
  const totalPaid = ledgers.reduce((sum, l) => sum + l.totalPaid, 0);
  const lastUpdated = ledgers.length ? new Date(ledgers[0].lastUpdated).toLocaleString('en-IN') : '';

  return (
    <div className="bg-surface text-on-surface min-h-screen pb-32">
      <header className="fixed top-0 w-full z-50 bg-surface-container-lowest/80 backdrop-blur-xl shadow-top-bar">
        <div className="flex items-center justify-between px-6 h-16 w-full max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} aria-label="Go back" className="active:scale-95 transition-transform text-primary">
              <Icon name="arrow_back" />
            </button>
            <div className="flex flex-col">
              <h1 className="font-headline text-lg font-bold tracking-tight text-primary">Udhaar Khata</h1>
            </div>
          </div>
          <button className="active:scale-95 transition-transform text-primary" aria-label="History" onClick={() => router.push('/vendor/udhaar/payments')}>
            <Icon name="history" />
          </button>
        </div>
      </header>

      <main className="pt-24 px-6 max-w-7xl mx-auto space-y-10">
        <section className="flex justify-between items-end">
          <div className="max-w-[70%]">
            <h2 className="text-3xl font-extrabold tracking-tight text-on-surface mb-1 truncate">Namaste {user?.name || 'ji'}</h2>
            <p className="text-on-surface-variant font-medium italic">Apni local dukaan, ab online</p>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-1">Digital Khata</span>
            <div className="w-12 h-1 bg-primary-container rounded-full" />
          </div>
        </section>

        <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary to-primary-container p-8 text-on-primary shadow-2xl">
          <div className="relative z-10 grid grid-cols-2 gap-8">
            <div className="space-y-1">
              <p className="text-sm font-medium opacity-90">Bacha hua Udhaar</p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold tracking-tighter">₹{totalPending}</span>
                <Icon name="trending_up" size="sm" filled />
              </div>
            </div>
            <div className="space-y-1 text-right">
              <p className="text-sm font-medium opacity-90">Chukaya hua</p>
              <div className="flex items-baseline justify-end gap-1">
                <span className="text-2xl font-bold tracking-tight">₹{totalPaid}</span>
              </div>
            </div>
            <div className="col-span-2 pt-4 border-t border-white/20 flex justify-between items-center">
              <div className="flex items-center gap-2 bg-black/10 backdrop-blur-md rounded-full px-3 py-1 text-xs">
                <Icon name="schedule" size="sm" />
                <span>{lastUpdated ? `Last update: ${lastUpdated}` : 'Koi khata nahi'}</span>
              </div>
              <button className="bg-surface-container-lowest text-primary font-bold px-4 py-2 rounded-xl text-sm active:scale-95 transition-all">Settlement Karo</button>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold tracking-tight text-on-surface flex items-center gap-2">
              <Icon name="monitor_heart" className="text-primary" />
              Credit Health
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Collection Rate</p>
              <p className="text-2xl font-extrabold text-on-surface">{summary ? Math.round(summary.collectionRate) : '--'}%</p>
              <p className="text-xs text-on-surface-variant mt-1">Chukaya / kul udhaar</p>
            </div>
            <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">DSO</p>
              <p className="text-2xl font-extrabold text-on-surface">{summary ? summary.dsoDays : '--'}</p>
              <p className="text-xs text-on-surface-variant mt-1">Bharti wapsi ke din</p>
            </div>
            <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Credit Utilization</p>
              <p className="text-2xl font-extrabold text-on-surface">{summary ? summary.creditUtilization : '--'}%</p>
              <p className="text-xs text-on-surface-variant mt-1">Limit ke mukable udhaar</p>
            </div>
            <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Overdue khata</p>
              <p className={`text-2xl font-extrabold ${summary && summary.overdueCount > 0 ? 'text-error' : 'text-on-surface'}`}>
                {summary ? summary.overdueCount : '--'}
              </p>
              <p className="text-xs text-on-surface-variant mt-1">30+ din purana</p>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold tracking-tight text-on-surface">Udhaar ki list</h3>
            <button className="text-primary text-sm font-bold flex items-center gap-1 whitespace-nowrap">
              Filter <Icon name="tune" size="sm" />
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="bg-surface-container-lowest rounded-2xl p-6 animate-pulse">
                  <div className="h-4 bg-surface-container rounded w-1/2 mb-2" />
                  <div className="h-6 bg-surface-container rounded w-1/3" />
                </div>
              ))}
            </div>
          ) : ledgers.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-surface-container-low rounded-full flex items-center justify-center mx-auto mb-6">
                <Icon name="account_balance_wallet" size="xl" className="text-on-surface-variant" />
              </div>
              <p className="text-on-surface-variant">Koi udhaar nahi hai</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {ledgers.map((l) => {
                const isOverdue = l.balance > 500;
                const isCleared = l.balance <= 0;
                return (
                  <div
                    key={l.id}
                    className={`group bg-surface-container-lowest rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 border-l-4 ${
                      isCleared ? 'border-secondary' : isOverdue ? 'border-error' : 'border-primary-container'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex gap-4">
                        <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-inner bg-surface-container flex items-center justify-center">
                          <Icon name="person" className="text-on-surface-variant" />
                        </div>
                        <div>
                          <h4 className="font-bold text-lg text-on-surface leading-tight">{l.customerName}</h4>
                          <div className="flex items-center gap-1 mt-1">
                            <Icon name={isCleared ? 'verified_user' : 'call'} size="sm" className="text-on-surface-variant" />
                            <p className="text-[12px] font-medium text-on-surface-variant uppercase tracking-wider">
                              {isCleared ? 'Zero Balance' : l.customerPhone}
                            </p>
                          </div>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider whitespace-nowrap ${
                        isCleared ? 'bg-secondary-container text-on-secondary-container' : isOverdue ? 'bg-error-container text-on-error-container' : 'bg-primary-container text-primary'
                      }`}>
                        {isCleared ? 'Hisab clear' : isOverdue ? 'Overdue' : 'Pay soon'}
                      </span>
                    </div>
                    <div className={`flex items-center justify-between py-4 rounded-xl px-4 mb-4 ${isOverdue && !isCleared ? 'bg-error-container/30' : isCleared ? 'bg-secondary-container/20' : 'bg-surface-container-low'}`}>
                      <span className={`text-sm font-medium ${isOverdue && !isCleared ? 'text-on-error-container' : isCleared ? 'text-on-secondary-container' : 'text-on-surface-variant'}`}>Pending Balance</span>
                      <span className={`text-xl font-extrabold tracking-tight ${isCleared ? 'text-secondary' : isOverdue ? 'text-error' : 'text-primary-fixed'}`}>₹{l.balance}</span>
                    </div>
                    {l.creditLimit > 0 && (
                      <p className="text-xs text-on-surface-variant mb-4 flex items-center gap-1">
                        <Icon name="credit_card" size="sm" />
                        Credit limit: ₹{l.creditLimit}
                      </p>
                    )}
                    <Button
                      variant={isOverdue && !isCleared ? 'primary' : 'surface'}
                      className={`w-full ${isOverdue && !isCleared ? 'bg-error text-white shadow-lg shadow-error/20' : ''}`}
                      onClick={() => router.push(`/vendor/udhaar/${l.customerId}`)}
                    >
                      {isCleared ? 'History dekhein' : 'Details dekhein'}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="py-10">
          <div className="bg-surface-container-low rounded-[2rem] p-8 flex flex-col md:flex-row items-center gap-8 border border-outline-variant/15">
            <div className="flex-1 space-y-4">
              <h3 className="text-2xl font-bold text-on-surface font-headline">Safe &amp; Secure Ledger</h3>
              <p className="text-on-surface-variant text-sm leading-relaxed">Your data is encrypted and backed up daily. No more losing paper diaries or confusing calculations with local shopkeepers.</p>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <Icon name="shield" className="text-secondary" filled />
                  <span className="text-xs font-bold uppercase tracking-tight">Bank-Grade</span>
                </div>
                <div className="flex items-center gap-2">
                  <Icon name="cloud_done" className="text-secondary" filled />
                  <span className="text-xs font-bold uppercase tracking-tight">Cloud Backup</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

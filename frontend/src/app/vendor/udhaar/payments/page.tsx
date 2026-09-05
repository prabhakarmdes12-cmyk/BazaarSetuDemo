'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { UdhaarPayment } from '@/types';

const METHOD_META: Record<string, { label: string; icon: string; bg: string; iconClass: string }> = {
  upi: { label: 'UPI', icon: 'account_balance', bg: 'bg-primary-container', iconClass: 'text-primary' },
  wallet: { label: 'Wallet', icon: 'account_balance_wallet', bg: 'bg-surface-container-high', iconClass: 'text-on-surface-variant' },
  cash: { label: 'Cash', icon: 'payments', bg: 'bg-secondary-container/20', iconClass: 'text-secondary' },
};

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function PaymentHistoryPage() {
  const router = useRouter();
  const { token, isLoading: authLoading } = useAuth();
  const [payments, setPayments] = useState<UdhaarPayment[]>([]);
  const [collectedToday, setCollectedToday] = useState(0);
  const [totalCollected, setTotalCollected] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !token) { window.location.assign('/login'); return; }
    if (token) {
      api
        .get<{ success: boolean; data: { payments: UdhaarPayment[]; collectedToday: number; totalCollected: number } }>(
          '/api/udhaar/vendor/payments',
          token
        )
        .then((res) => {
          if (res.success) {
            setPayments(res.data.payments);
            setCollectedToday(res.data.collectedToday);
            setTotalCollected(res.data.totalCollected);
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [token, authLoading]);

  return (
    <div className="bg-surface min-h-screen">
      <header className="fixed top-0 w-full z-50 bg-surface-container-lowest/80 backdrop-blur-xl shadow-top-bar flex items-center justify-between px-6 h-16">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/vendor/udhaar')}
            className="text-primary dark:text-primary active:scale-95 transition-transform"
          >
            <Icon name="arrow_back" />
          </button>
          <div className="flex flex-col">
            <h1 className="font-headline text-lg font-bold tracking-tight text-primary dark:text-primary">Payment History</h1>
            <p className="text-[11px] text-on-surface-variant font-medium uppercase tracking-widest italic">Vasooli ka hisab</p>
          </div>
        </div>
      </header>

      <main className="pt-24 px-6 max-w-2xl mx-auto pb-40">
        <section className="grid grid-cols-2 gap-4 mb-8">
          <div className="leaf-gradient rounded-2xl p-5 shadow-lg text-white">
            <p className="text-[11px] font-bold uppercase tracking-widest opacity-80 mb-1">Aaj ki Vasooli</p>
            <p className="text-3xl font-extrabold tracking-tighter">₹{collectedToday}</p>
          </div>
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Kul Vasooli</p>
            <p className="text-3xl font-extrabold tracking-tighter text-on-surface">₹{totalCollected}</p>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
            <Icon name="receipt_long" className="text-primary" />
            Payments
            <span className="text-xs font-semibold text-on-surface-variant">({payments.length})</span>
          </h3>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-surface-container-lowest rounded-2xl p-5 animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-surface-container rounded-2xl" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-surface-container rounded w-1/2" />
                      <div className="h-3 bg-surface-container rounded w-1/3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-surface-container-low rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon name="payments" size="xl" className="text-on-surface-variant" />
              </div>
              <p className="text-on-surface-variant">Abhi tak koi payment record nahi hua</p>
            </div>
          ) : (
            payments.map((p) => {
              const meta = METHOD_META[p.method] || METHOD_META.cash;
              return (
                <button
                  key={p.id}
                  onClick={() => router.push(`/vendor/udhaar/${p.customerId}`)}
                  className="w-full group bg-surface-container-lowest p-4 rounded-2xl transition-all hover:shadow-md border border-transparent hover:border-outline-variant/10 flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${meta.bg}`}>
                      <Icon name={meta.icon} filled className={meta.iconClass} />
                    </div>
                    <div>
                      <p className="font-headline font-bold text-on-surface leading-tight">{p.customerName}</p>
                      <p className="text-xs font-medium text-on-surface-variant mt-0.5">
                        {meta.label} &bull; {formatDateTime(p.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-headline font-extrabold text-lg text-secondary">₹{p.amount}</p>
                  </div>
                </button>
              );
            })
          )}
        </section>
      </main>
    </div>
  );
}

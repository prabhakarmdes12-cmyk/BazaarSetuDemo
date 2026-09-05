'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';

interface BankAccount {
  id: string;
  bankName: string;
  holderName: string;
  masked: string;
  isPrimary: boolean;
}

interface PayoutRecord {
  id: string;
  amount: number;
  status: string;
  bankName: string;
  gatewayReference?: string;
  createdAt: string;
}

interface PayoutDashboard {
  totalCollected: number;
  paidOut: number;
  availableForPayout: number;
  razorpayXConfigured: boolean;
  banks: BankAccount[];
  recentPayouts: PayoutRecord[];
}

const statusLabel: Record<string, string> = {
  requested: 'Requested',
  processing: 'Processing',
  paid: 'Paid',
  failed: 'Failed',
};

export default function VendorPayoutsPage() {
  const router = useRouter();
  const { token, user, isLoading: authLoading } = useAuth();
  const [dash, setDash] = useState<PayoutDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!authLoading && !token) { window.location.assign('/login'); }
  }, [token, authLoading]);

  useEffect(() => {
    if (!token) return;
    api.get<PayoutDashboard>('/api/vendor/payouts', token)
      .then((d) => setDash({ ...d, recentPayouts: d.recentPayouts ?? [] }))
      .catch(() => setMsg('Payout data load nahi ho paya'))
      .finally(() => setLoading(false));
  }, [token]);

  const primaryBank = dash?.banks.find((b) => b.isPrimary) ?? dash?.banks[0];

  const handleRequestPayout = async () => {
    if (!dash || !primaryBank) return;
    if (dash.availableForPayout <= 0) {
      setMsg('Payout ke liye available balance nahi hai');
      return;
    }
    setRequesting(true);
    setMsg('');
    try {
      const res = await api.post<{ success: boolean; data?: { payoutId: string; status: string } }>(
        '/api/vendor/payouts/request',
        { amount: dash.availableForPayout, bankAccountId: primaryBank.id },
        token || undefined
      );
      if (res.success && res.data) {
        setMsg('Payout request submit ho gaya!');
        const fresh = await api.get<PayoutDashboard>('/api/vendor/payouts', token || undefined);
        setDash(fresh);
      }
    } catch (err: unknown) {
      const e = err as { message?: string; status?: number };
      if (e.status === 503) {
        setMsg('Settlement service abhi enabled nahi hai — jald aayega');
      } else {
        setMsg(e.message || 'Payout request fail ho gaya');
      }
    }
    setRequesting(false);
  };

  return (
    <div className="bg-surface min-h-screen">
      {/* Top Bar */}
      <header className="fixed top-0 w-full z-50 bg-surface-container-lowest/80 backdrop-blur-xl shadow-top-bar">
        <div className="flex items-center justify-between px-6 h-16 w-full max-w-2xl mx-auto">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/vendor')}
              className="text-on-surface-variant hover:bg-surface-container-high transition-colors p-2 rounded-full active:scale-95"
            >
              <Icon name="arrow_back" />
            </button>
            <h1 className="font-headline font-bold text-lg tracking-tight text-primary dark:text-primary">Mera Payout</h1>
          </div>
          <Icon name="account_balance_wallet" className="text-on-surface-variant" />
        </div>
      </header>

      <main className="pt-20 px-4 max-w-2xl mx-auto space-y-6 pb-32">
        {/* Welcome */}
        <section className="mt-4">
          <h2 className="font-headline text-2xl font-extrabold tracking-tight text-on-surface">Namaste, {user?.name || 'Ravi'}!</h2>
          <p className="text-on-surface-variant text-sm italic font-medium mt-1">Apni local dukaan, ab online</p>
        </section>

        {/* Balance Card */}
        <section className="bg-surface-container-lowest rounded-xl p-6 shadow-editorial-xl overflow-hidden relative group">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary-container/20 rounded-full blur-3xl group-hover:bg-primary-container/30 transition-colors" />
          <div className="flex flex-col gap-1 mb-6 relative z-10">
            <span className="text-on-surface-variant font-medium text-sm flex items-center gap-2">
              <Icon name="payments" size="sm" />
              Available Balance
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-headline font-extrabold text-on-surface">
                ₹{loading ? '...' : (dash?.availableForPayout ?? 0).toFixed(2)}
              </span>
            </div>
            <span className="text-on-surface-variant text-xs font-medium flex items-center gap-1 mt-1">
              <Icon name="info" size="sm" />
              {loading ? 'Loading...' : `Platform se total ₹${(dash?.totalCollected ?? 0).toFixed(2)} collect hua`}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 relative z-10">
            <button
              onClick={() => router.push('/vendor/payouts/link-bank')}
              className="flex-1 editorial-gradient text-on-primary font-headline font-bold py-4 px-6 rounded-xl shadow-saffron active:scale-95 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Icon name="account_balance" />
              Bank mein bhejein
            </button>
            <button
              onClick={handleRequestPayout}
              disabled={requesting || !primaryBank || (dash?.availableForPayout ?? 0) <= 0}
              className="flex-1 bg-surface-container-low text-on-surface-variant font-headline font-semibold py-4 px-6 rounded-xl active:scale-95 transition-all border border-outline-variant/10 disabled:opacity-40"
            >
              {requesting ? 'Bhej rahe...' : primaryBank ? 'Payout Request' : 'Pehle bank link karein'}
            </button>
          </div>
        </section>

        {msg && (
          <p className="text-sm text-secondary bg-secondary-container/30 px-4 py-3 rounded-xl">{msg}</p>
        )}

        {/* Trust Section */}
        <section className="bg-surface-container-low rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-surface-container-lowest rounded-full flex items-center justify-center shadow-sm">
              <Icon name="verified_user" filled className="text-primary" />
            </div>
            <div>
              <p className="font-headline font-bold text-sm text-on-surface">Bank-Grade Security</p>
              <p className="text-on-surface-variant text-xs">Aapka paisa safe hai</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Linked Account</p>
            <p className="font-mono text-sm font-bold text-on-surface-variant">
              {primaryBank ? `${primaryBank.bankName} ${primaryBank.masked}` : 'Abhi koi account linked nahi'}
            </p>
          </div>
        </section>

        {/* Payout History */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-headline font-bold text-lg text-on-surface">Pichle Payouts</h3>
          </div>
          <div className="space-y-3">
            {dash?.recentPayouts.length ? (
              dash.recentPayouts.map((p) => (
                <div key={p.id} className="bg-surface-container-low rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="font-headline font-bold text-sm text-on-surface">₹{p.amount.toFixed(2)}</p>
                    <p className="text-on-surface-variant text-xs">{p.bankName} · {new Date(p.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className="text-xs font-bold text-primary uppercase tracking-wide">{statusLabel[p.status] ?? p.status}</span>
                </div>
              ))
            ) : (
              <div className="bg-surface-container-low p-6 rounded-xl text-center">
                <div className="w-12 h-12 bg-surface-container-lowest rounded-full flex items-center justify-center mx-auto mb-3">
                  <Icon name="receipt_long" className="text-on-surface-variant" />
                </div>
                <p className="font-headline font-bold text-sm text-on-surface">Abhi koi payout nahi hua</p>
                <p className="text-on-surface-variant text-xs mt-1">Jab pehla payout hoga, yahan dikhega.</p>
              </div>
            )}
          </div>
        </section>

        {/* Support Card */}
        <section className="flex gap-4 items-stretch h-32 mt-8">
          <div className="flex-1 bg-tertiary/5 rounded-xl p-4 flex flex-col justify-between border border-tertiary/10">
            <Icon name="help" className="text-tertiary" />
            <p className="text-xs font-bold text-tertiary uppercase tracking-widest">Sahayata</p>
          </div>
          <div className="flex-[2] bg-surface-container-high rounded-xl p-4 flex flex-col justify-between">
            <p className="font-headline font-bold text-sm text-on-surface leading-snug">Payout delay ho raha hai? Humse baat karein.</p>
            <button className="text-primary text-xs font-extrabold flex items-center gap-1 self-start">
              CHAT NOW
              <Icon name="open_in_new" size="sm" />
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

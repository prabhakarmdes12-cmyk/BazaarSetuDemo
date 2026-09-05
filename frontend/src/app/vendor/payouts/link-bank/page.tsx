'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';

export default function LinkBankPage() {
  const router = useRouter();
  const { token, isLoading: authLoading } = useAuth();
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [form, setForm] = useState({ name: '', bank: '', ifsc: '', account: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [linked, setLinked] = useState<{ bankName: string; masked: string } | null>(null);

  useEffect(() => {
    if (!authLoading && !token) { window.location.assign('/login'); }
  }, [token, authLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post<{ success: boolean; data?: { bankName: string; masked: string } }>(
        '/api/vendor/payouts/link-bank',
        {
          accountNumber: form.account,
          ifsc: form.ifsc,
          bankName: form.bank,
          holderName: form.name,
        },
        token || undefined
      );
      if (res.success && res.data) {
        setLinked({ bankName: res.data.bankName, masked: res.data.masked });
        setStep('success');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Bank account link nahi ho paya');
    }
    setLoading(false);
  };

  if (step === 'success') {
    return (
      <div className="bg-surface min-h-screen">
        <header className="fixed top-0 w-full z-50 bg-surface-container-lowest/80 backdrop-blur-xl shadow-top-bar">
          <div className="flex items-center px-6 h-16 w-full max-w-md mx-auto">
            <button onClick={() => router.push('/vendor/payouts')} className="mr-4 p-2 rounded-full hover:bg-surface-container-high transition-all active:scale-95 text-primary">
              <Icon name="arrow_back" />
            </button>
            <h1 className="font-headline font-bold text-lg tracking-tight text-primary">Link Bank Account</h1>
          </div>
        </header>

        <main className="pt-24 pb-32 px-6 max-w-md mx-auto min-h-screen flex flex-col items-center justify-center">
          {/* Success Icon */}
          <div className="relative mb-12 flex items-center justify-center">
            <div className="absolute inset-0 bg-primary-container/20 rounded-full scale-150 blur-xl" />
            <div className="relative w-32 h-32 bg-primary-container rounded-full flex items-center justify-center shadow-brand-glow-lg">
              <Icon name="check_circle" size="xl" className="text-white text-6xl" filled />
            </div>
          </div>

          <div className="text-center space-y-4 mb-10">
            <h2 className="font-headline font-extrabold text-3xl text-on-surface leading-tight">
              Account Link Ho Gaya!
            </h2>
            <p className="text-on-surface-variant text-base leading-relaxed max-w-[280px] mx-auto opacity-90">
              Ab aap apne payouts seedha bank mein le sakte hain
            </p>
          </div>

          {/* Bank Details Card */}
          <div className="w-full bg-surface-container-lowest rounded-xl p-6 shadow-editorial relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/5 rounded-full -mr-8 -mt-8" />
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-lg bg-surface-container-low flex items-center justify-center text-primary">
                  <Icon name="account_balance" className="text-3xl" />
                </div>
                <div>
                  <p className="font-headline font-bold text-lg text-on-surface">{linked?.bankName || form.bank || 'SBI'} {linked?.masked || `•••• ${form.account.slice(-4) || '5678'}`}</p>
                  <p className="font-label text-xs text-on-surface-variant tracking-wider uppercase">Savings Account</p>
                </div>
              </div>
              <div className="flex items-center space-x-1.5 bg-secondary/10 px-3 py-1 rounded-full border border-secondary/20">
                <Icon name="verified" size="sm" filled className="text-secondary" />
                <span className="text-secondary font-headline font-bold text-xs uppercase tracking-tight">Verified</span>
              </div>
            </div>
            <div className="pt-4 border-t border-outline-variant/15 flex items-center justify-between">
              <span className="text-on-surface-variant text-sm font-medium">Link Status</span>
              <span className="text-on-secondary-container text-sm font-bold">Active &amp; Linked</span>
            </div>
          </div>

          {/* Tagline */}
          <div className="mt-8 self-start ml-2">
            <div className="inline-flex items-center space-x-2 bg-surface-container px-4 py-2 rounded-lg italic">
              <Icon name="info" className="text-primary" />
              <p className="font-label text-xs text-on-surface-variant italic leading-tight">
                &apos;Apni local dukaan, ab online&apos;
              </p>
            </div>
          </div>

          {/* CTAs */}
          <div className="mt-16 w-full space-y-4">
            <button
              onClick={() => router.push('/vendor/payouts')}
              className="w-full editorial-gradient text-white py-4 px-6 rounded-xl font-headline font-bold text-base shadow-saffron active:scale-95 transition-all flex items-center justify-center space-x-2"
            >
              <span>Payouts Dekhein</span>
              <Icon name="payments" />
            </button>
            <button
              onClick={() => router.push('/vendor')}
              className="w-full bg-surface-container-highest text-on-primary-container py-4 px-6 rounded-xl font-headline font-semibold text-base active:scale-95 transition-all"
            >
              Home Par Jayein
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-surface min-h-screen">
      {/* Top Bar */}
      <header className="fixed top-0 w-full z-50 bg-surface-container-lowest/80 backdrop-blur-xl shadow-top-bar">
        <div className="flex items-center px-6 h-16 w-full max-w-md mx-auto">
          <button onClick={() => router.push('/vendor/payouts')} className="active:scale-95 hover:bg-surface-container-high p-2 rounded-full transition-all mr-4">
            <Icon name="arrow_back" className="text-primary" />
          </button>
          <h1 className="font-headline font-bold text-lg tracking-tight text-on-surface">Link Bank Account</h1>
        </div>
      </header>

      <main className="pt-24 pb-32 px-6 max-w-md mx-auto min-h-screen">
        {/* Hero */}
        <section className="mb-12">
          <div className="relative">
            <div className="absolute -right-4 top-0 w-24 h-24 bg-primary-container/10 rounded-full blur-3xl" />
            <h2 className="font-headline font-extrabold text-3xl text-on-surface leading-tight tracking-tight mb-2">
              Bank Account Jodein
            </h2>
            <p className="font-label italic text-sm text-on-surface-variant opacity-80">
              Apni local dukaan, ab online
            </p>
          </div>
          {/* Trust Badge */}
          <div className="mt-8 p-4 bg-surface-container-low rounded-xl flex items-center gap-4">
            <div className="w-12 h-12 flex items-center justify-center bg-surface-container-lowest rounded-lg shadow-sm">
              <Icon name="verified_user" filled className="text-secondary text-3xl" />
            </div>
            <div>
              <p className="text-xs font-bold text-secondary uppercase tracking-wider">Secured by Paaska</p>
              <p className="text-[11px] text-on-surface-variant leading-relaxed">Your banking details are encrypted and 100% safe with us.</p>
            </div>
          </div>
        </section>

        {/* Form */}
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="group">
            <label className="block font-label font-medium text-on-surface-variant text-sm mb-2 ml-1">Account Holder Name</label>
            <div className="relative bg-surface-container-low rounded-xl transition-all group-focus-within:ring-2 group-focus-within:ring-primary/30">
              <input
                className="w-full bg-transparent border-none focus:ring-0 px-5 py-4 text-on-surface placeholder:text-on-surface-variant/40"
                placeholder="Enter full name as per bank"
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <Icon name="person" className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/30" />
            </div>
          </div>

          <div className="group">
            <label className="block font-label font-medium text-on-surface-variant text-sm mb-2 ml-1">Bank Name</label>
            <div className="relative bg-surface-container-low rounded-xl transition-all group-focus-within:ring-2 group-focus-within:ring-primary/30">
              <input
                className="w-full bg-transparent border-none focus:ring-0 px-5 py-4 text-on-surface placeholder:text-on-surface-variant/40"
                placeholder="e.g. State Bank of India"
                type="text"
                value={form.bank}
                onChange={(e) => setForm({ ...form, bank: e.target.value })}
                required
              />
              <Icon name="account_balance" className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/30" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div className="group">
              <label className="block font-label font-medium text-on-surface-variant text-sm mb-2 ml-1">IFSC Code</label>
              <div className="relative bg-surface-container-low rounded-xl transition-all group-focus-within:ring-2 group-focus-within:ring-primary/30">
                <input
                  className="w-full bg-transparent border-none focus:ring-0 px-5 py-4 text-on-surface placeholder:text-on-surface-variant/40 uppercase"
                  placeholder="SBIN0001234"
                  type="text"
                  value={form.ifsc}
                  onChange={(e) => setForm({ ...form, ifsc: e.target.value.toUpperCase() })}
                  required
                />
                <Icon name="password" className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/30" />
              </div>
            </div>
            <div className="group">
              <label className="block font-label font-medium text-on-surface-variant text-sm mb-2 ml-1">Account Number</label>
              <div className="relative bg-surface-container-low rounded-xl transition-all group-focus-within:ring-2 group-focus-within:ring-primary/30">
                <input
                  className="w-full bg-transparent border-none focus:ring-0 px-5 py-4 text-on-surface placeholder:text-on-surface-variant/40"
                  placeholder="•••• •••• ••••"
                  type="password"
                  value={form.account}
                  onChange={(e) => setForm({ ...form, account: e.target.value })}
                  required
                />
                <Icon name="lock" className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/30" />
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 px-1 py-2">
            <Icon name="info" size="sm" className="text-on-surface-variant/60 mt-0.5" />
            <p className="text-[11px] text-on-surface-variant leading-normal">
              We will deposit ₹1 to verify your account. This information is only used for automated vendor payouts.
            </p>
          </div>

          <div className="pt-6">
            {error && (
              <p className="text-sm text-secondary bg-secondary-container/30 px-4 py-3 rounded-xl mb-4">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="digital-courtyard-gradient w-full py-4 rounded-xl shadow-saffron active:scale-95 transition-transform text-white font-headline font-bold text-lg disabled:opacity-50"
            >
              {loading ? 'Verify ho raha hai...' : 'Details Verify Karein'}
            </button>
          </div>
        </form>

        {/* Decorative */}
        <div className="mt-16 relative overflow-hidden rounded-2xl h-48 bg-surface-container-low flex items-center justify-center">
          <div className="relative z-10 flex flex-col items-center text-center px-8">
            <Icon name="shield" filled className="text-primary text-5xl mb-3" />
            <p className="text-sm font-medium text-on-surface">End-to-End Encrypted Verification</p>
            <p className="text-[11px] text-on-surface-variant">Your privacy is our priority</p>
          </div>
        </div>
      </main>
    </div>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Icon, Badge } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { UdharEntry } from '@/types';

type PaymentMethod = 'upi' | 'wallet' | 'cash';

const METHODS: { id: PaymentMethod; icon: string; label: string; subtitle: string; bgClass: string; iconClass: string }[] = [
  { id: 'upi', icon: 'account_balance', label: 'UPI Transfer', subtitle: 'GPay, PhonePe, Paytm', bgClass: 'bg-primary-container', iconClass: 'text-primary' },
  { id: 'wallet', icon: 'account_balance_wallet', label: 'BazaarSetu Wallet', subtitle: 'Pay via wallet', bgClass: 'bg-surface-container-high', iconClass: 'text-on-surface-variant' },
  { id: 'cash', icon: 'payments', label: 'Cash at Shop', subtitle: 'Record cash payment manually', bgClass: 'bg-surface-container-high', iconClass: 'text-on-surface-variant' },
];

export default function MakePaymentPage() {
  const params = useParams();
  const router = useRouter();
  const { token, isLoading: authLoading } = useAuth();
  const shopId = params.shopId as string;
  const [selected, setSelected] = useState<PaymentMethod>('upi');
  const [loading, setLoading] = useState(false);
  const [ledger, setLedger] = useState<{ balance: number; customerName?: string; entries: UdharEntry[] } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !token) { window.location.assign('/login'); return; }
    if (token && shopId) {
      api
        .get<{ success: boolean; data: { balance: number; customerName?: string; entries: UdharEntry[] } }>(
          `/api/udhaar/vendor/${shopId}`,
          token
        )
        .then((res) => { if (res.success) setLedger(res.data); })
        .catch(console.error);
    }
  }, [token, authLoading, shopId]);

  const customerName = ledger?.customerName || 'Khata';
  const balance = ledger?.balance ?? 0;
  const lastEntry = ledger?.entries?.[0];

  const handlePay = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post<{ success: boolean; data: { paymentId: string } }>(
        `/api/udhaar/vendor/${shopId}/pay`,
        { amount: balance, method: selected },
        token!
      );
      router.push(
        `/vendor/udhaar/${shopId}/pay/success?amount=${balance}&paymentId=${res.data.paymentId}&method=${selected}&name=${encodeURIComponent(customerName)}`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment record karne mein problem hui');
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface min-h-screen">
      {/* Top Bar */}
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl">
        <div className="flex items-center justify-between px-6 h-16 w-full max-w-md mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(`/vendor/udhaar/${shopId}`)}
              className="hover:bg-surface-container-high transition-colors active:scale-95 p-2 rounded-full"
            >
              <Icon name="arrow_back" className="text-primary dark:text-primary" />
            </button>
            <div className="flex flex-col">
              <h1 className="font-headline font-bold text-lg tracking-tight text-primary dark:text-primary">{customerName}</h1>
              <div className="flex items-center gap-1">
                <Icon name="verified" size="sm" filled className="text-secondary" />
                <span className="text-[10px] font-semibold text-secondary uppercase tracking-wider">Verified Merchant</span>
              </div>
            </div>
          </div>
          <button className="hover:bg-surface-container-high transition-colors active:scale-95 p-2 rounded-full">
            <Icon name="info" className="text-on-surface-variant" />
          </button>
        </div>
      </header>

      <main className="pt-20 pb-32 max-w-md mx-auto px-6">
        {/* Balance Section */}
        <section className="mb-10">
          <h2 className="font-headline text-2xl font-extrabold text-on-surface mb-1">Make Payment</h2>
          <p className="text-on-surface-variant text-sm italic">Apni local dukaan, ab online</p>
          <div className="mt-6 relative overflow-hidden rounded-2xl editorial-gradient p-6 text-white digital-courtyard-shadow">
            <div className="relative z-10">
              <p className="font-label text-xs font-bold uppercase tracking-widest opacity-80 mb-1">Payable Balance</p>
              <h3 className="font-headline text-4xl font-extrabold mb-4">₹{balance}</h3>
              <div className="flex flex-col gap-2 border-t border-white/20 pt-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="opacity-80">Pichla Udhaar</span>
                  <span className="font-bold text-lg">₹{balance}.00</span>
                </div>
                <div className="flex justify-between items-center text-xs opacity-70 italic">
                  <span>{lastEntry ? `Last: ${new Date(lastEntry.createdAt).toLocaleDateString('en-IN')}` : 'Koi transaction nahi'}</span>
                  <span>Pichla Udhaar: ₹{balance}</span>
                </div>
              </div>
            </div>
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-black/10 rounded-full blur-2xl" />
          </div>
        </section>

        {/* Payment Methods */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-headline font-bold text-lg">Payment Method Chunein</h4>
            <span className="text-[10px] font-bold text-primary bg-primary-fixed px-2 py-1 rounded-full uppercase">Secure</span>
          </div>
          <div className="space-y-4">
            {METHODS.map((method) => {
              const isSelected = selected === method.id;
              return (
                <button
                  key={method.id}
                  onClick={() => setSelected(method.id)}
                  className={`w-full bg-surface-container-lowest rounded-xl p-4 digital-courtyard-shadow text-left transition-all ${
                    isSelected ? 'border-2 border-primary-container' : 'border-2 border-transparent hover:bg-surface-container-low'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 ${method.bgClass} rounded-lg flex items-center justify-center`}>
                        <Icon name={method.icon} filled className={method.iconClass} />
                      </div>
                      <div>
                        <p className="font-bold text-on-surface">{method.label}</p>
                        <p className="text-xs text-on-surface-variant">{method.subtitle}</p>
                      </div>
                    </div>
                    <Icon
                      name={isSelected ? 'radio_button_checked' : 'radio_button_unchecked'}
                      className={isSelected ? 'text-primary' : 'text-outline-variant'}
                    />
                  </div>
                  {method.id === 'upi' && isSelected && (
                    <div className="mt-4 flex gap-3 pt-4 border-t border-surface-container">
                      {['GPay', 'PhonePe', 'Paytm'].map((name) => (
                        <div key={name} className="bg-surface-container-lowest p-2 rounded-lg shadow-sm border border-outline-variant/20">
                          <span className="text-[10px] font-bold text-on-surface-variant">{name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* Trust Badges */}
        <section className="flex flex-col items-center gap-4 py-6 border-t border-surface-container-high">
          <div className="flex items-center gap-2 text-on-surface-variant">
            <Icon name="verified_user" />
            <span className="text-xs font-semibold uppercase tracking-widest">Bank-Grade Encryption</span>
          </div>
          <div className="flex gap-6 opacity-40 grayscale">
            <Icon name="security" />
            <Icon name="lock" />
            <Icon name="account_balance" />
          </div>
        </section>
      </main>

      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-0 left-0 w-full z-50">
        <div className="max-w-md mx-auto px-6 mb-4">
          {error && (
            <p className="text-xs font-semibold text-error bg-error-container/60 px-4 py-2 rounded-lg mb-2">
              {error}
            </p>
          )}
          <button
            onClick={handlePay}
            disabled={loading || balance <= 0}
            className="w-full editorial-gradient py-4 rounded-xl text-white font-headline font-bold text-lg digital-courtyard-shadow active:scale-95 transition-transform duration-150 flex items-center justify-center gap-3 disabled:opacity-50"
          >
            <span>{loading ? 'Payment ho raha hai...' : balance <= 0 ? 'Koi balance nahi' : 'Paisa Chukayein'}</span>
            <Icon name="arrow_forward" />
          </button>
        </div>
        {/* Bottom Nav */}
        <nav className="bg-surface-container-lowest/80 backdrop-blur-xl rounded-t-[2rem] shadow-bottom-nav">
          <div className="max-w-md mx-auto flex justify-around items-center px-4 pb-6 pt-3">
            <button onClick={() => router.push('/vendor')} className="flex flex-col items-center justify-center text-on-surface-variant px-5 py-2 opacity-70 hover:text-primary transition-colors">
              <Icon name="home" />
              <span className="font-inter text-[10px] font-semibold tracking-wide uppercase mt-1">Home</span>
            </button>
            <button className="flex flex-col items-center justify-center bg-primary-container dark:bg-primary-container text-primary-fixed rounded-2xl px-5 py-2 scale-105 active:scale-90 transition-transform">
              <Icon name="account_balance_wallet" filled />
              <span className="font-inter text-[10px] font-semibold tracking-wide uppercase mt-1">Udhaar</span>
            </button>
            <button onClick={() => router.push('/vendor/orders')} className="flex flex-col items-center justify-center text-on-surface-variant px-5 py-2 opacity-70 hover:text-primary transition-colors">
              <Icon name="receipt_long" />
              <span className="font-inter text-[10px] font-semibold tracking-wide uppercase mt-1">Orders</span>
            </button>
            <button onClick={() => router.push('/vendor')} className="flex flex-col items-center justify-center text-on-surface-variant px-5 py-2 opacity-70 hover:text-primary transition-colors">
              <Icon name="person" />
              <span className="font-inter text-[10px] font-semibold tracking-wide uppercase mt-1">Profile</span>
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
}

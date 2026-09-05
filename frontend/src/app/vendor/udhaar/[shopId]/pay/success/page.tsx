'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Icon, Badge } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';

export default function PaymentSuccessPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, isLoading: authLoading } = useAuth();
  const shopId = params.shopId as string;
  const [showToast, setShowToast] = useState(true);
  const amount = Number(searchParams.get('amount') || 0);
  const paymentId = searchParams.get('paymentId') || `BSTU-${Math.random().toString().slice(2, 11)}`;
  const method = searchParams.get('method') || 'wallet';
  const customerName = searchParams.get('name') || 'Khata';

  useEffect(() => {
    if (!authLoading && !token) { window.location.assign('/login'); }
  }, [token, authLoading]);

  const METHOD_LABELS: Record<string, string> = { upi: 'UPI Transfer', wallet: 'Bazaar Wallet', cash: 'Cash at Shop' };
  const METHOD_ICONS: Record<string, string> = { upi: 'account_balance', wallet: 'account_balance_wallet', cash: 'payments' };
  const methodLabel = METHOD_LABELS[method] || 'Bazaar Wallet';
  const methodIcon = METHOD_ICONS[method] || 'account_balance_wallet';
  const timestamp = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) + ', ' + new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="bg-surface min-h-screen flex flex-col">
      {/* Top Bar */}
      <header className="fixed top-0 w-full z-50 bg-surface-container-lowest/80 backdrop-blur-xl flex items-center justify-between px-6 h-16">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/vendor/udhaar')}
            className="active:scale-95 transition-transform inline-flex items-center justify-center cursor-pointer"
          >
            <Icon name="arrow_back" className="text-primary dark:text-primary" />
          </button>
          <h1 className="font-headline font-bold text-lg text-on-surface">Payment Status</h1>
        </div>
        <div className="w-10" />
      </header>

      <main className="flex-grow pt-24 pb-32 px-6 max-w-lg mx-auto w-full">
        {/* Success Hero */}
        <section className="flex flex-col items-center text-center space-y-6 mb-12">
          <div className="relative">
            <div className="w-32 h-32 rounded-full bg-primary-container flex items-center justify-center shadow-brand-glow">
              <Icon name="check_circle" size="xl" className="text-white text-6xl" filled />
            </div>
            {/* Decorative sparkles */}
            <Icon name="celebration" className="absolute -top-2 -right-2 text-primary-container text-2xl" />
            <Icon name="stars" className="absolute bottom-2 -left-4 text-secondary text-xl" />
          </div>
          <div className="space-y-2">
            <h2 className="font-headline font-extrabold text-3xl tracking-tight text-on-surface">Paisa chuka diya!</h2>
            <p className="font-label text-on-surface-variant italic text-sm">Apni local dukaan, ab online</p>
          </div>
        </section>

        {/* Transaction Details Card */}
        <div className="bg-surface-container-lowest rounded-xl p-8 shadow-editorial space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-container/5 rounded-full -mr-16 -mt-16" />
          <div className="flex flex-col items-center gap-1">
            <span className="font-label text-on-surface-variant text-sm uppercase tracking-widest font-semibold">Total Amount Paid</span>
            <span className="font-headline font-extrabold text-5xl text-primary">₹{amount.toFixed(2)}</span>
          </div>
          <div className="space-y-6">
            {/* Customer Info */}
            <div className="flex items-center justify-between py-4 border-b border-outline-variant/15">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center">
                  <Icon name="person" className="text-on-surface-variant" />
                </div>
                <div>
                  <p className="font-label text-xs text-on-surface-variant">Customer</p>
                  <p className="font-headline font-bold text-on-surface">{customerName}</p>
                </div>
              </div>
              <Icon name="verified" filled className="text-secondary" />
            </div>
            {/* Transaction Metadata */}
            <div className="grid grid-cols-2 gap-y-6 pt-2">
              <div>
                <p className="font-label text-xs text-on-surface-variant mb-1">Payment ID</p>
                <p className="font-body font-semibold text-sm text-on-surface select-all">{paymentId}</p>
              </div>
              <div className="text-right">
                <p className="font-label text-xs text-on-surface-variant mb-1">Timestamp</p>
                <p className="font-body font-semibold text-sm text-on-surface">{timestamp}</p>
              </div>
              <div>
                <p className="font-label text-xs text-on-surface-variant mb-1">Method</p>
                <div className="flex items-center gap-1">
                  <Icon name={methodIcon} size="sm" />
                  <p className="font-body font-semibold text-sm text-on-surface">{methodLabel}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-label text-xs text-on-surface-variant mb-1">Status</p>
                <Badge variant="completed">Settled</Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Action Section */}
        <div className="mt-10 space-y-4">
          <button className="w-full editorial-gradient text-white font-headline font-bold py-4 rounded-xl shadow-saffron active:scale-[0.98] transition-all flex items-center justify-center gap-2">
            <Icon name="download" />
            Receipt Download Karein
          </button>
          <button
            onClick={() => router.push('/vendor/udhaar')}
            className="w-full bg-surface-container-highest text-on-primary-container font-headline font-bold py-4 rounded-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Icon name="menu_book" />
            Udhaar Khata Dekhein
          </button>
        </div>

        {/* Success Toast */}
        {showToast && (
          <div className="mt-12 bg-on-surface text-surface py-3 px-6 rounded-full flex items-center justify-between shadow-xl">
            <div className="flex items-center gap-3">
              <Icon name="check_circle" filled className="text-secondary-container" />
              <p className="text-sm font-medium">Payment message sent to {customerName.split(' ')[0]} Ji</p>
            </div>
            <button onClick={() => setShowToast(false)}>
              <Icon name="close" className="text-surface-variant cursor-pointer" />
            </button>
          </div>
        )}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 w-full flex justify-around items-center px-4 pb-6 pt-3 bg-surface-container-lowest/80 backdrop-blur-xl z-50 rounded-t-3xl shadow-bottom-nav">
        <button onClick={() => router.push('/vendor')} className="flex flex-col items-center justify-center text-on-surface-variant px-5 py-2 hover:text-primary transition-colors active:scale-90">
          <Icon name="home" />
          <span className="font-inter text-[11px] font-medium tracking-wide">Home</span>
        </button>
        <button className="flex flex-col items-center justify-center bg-primary-container dark:bg-primary-container text-primary dark:text-primary-fixed rounded-2xl px-5 py-2 active:scale-90 transition-all">
          <Icon name="account_balance_wallet" filled />
          <span className="font-inter text-[11px] font-medium tracking-wide">Udhaar</span>
        </button>
        <button onClick={() => router.push('/vendor/orders')} className="flex flex-col items-center justify-center text-on-surface-variant px-5 py-2 hover:text-primary transition-colors active:scale-90">
          <Icon name="receipt_long" />
          <span className="font-inter text-[11px] font-medium tracking-wide">Orders</span>
        </button>
        <button onClick={() => router.push('/vendor')} className="flex flex-col items-center justify-center text-on-surface-variant px-5 py-2 hover:text-primary transition-colors active:scale-90">
          <Icon name="person" />
          <span className="font-inter text-[11px] font-medium tracking-wide">Profile</span>
        </button>
      </nav>
    </div>
  );
}

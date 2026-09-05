'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Icon } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { api, ApiError } from '@/lib/api';
import { buildUpiCollectLink } from '@/lib/whatsapp';
import { track } from '@/lib/analytics';

interface LedgerEntry {
  id: string;
  type: 'CREDIT' | 'PAYMENT';
  amount: number;
  note: string;
  createdAt: string;
}

interface LedgerData {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  totalDue: number;
  totalPaid: number;
  balance: number;
  creditLimit: number;
  lastRemindedAt: string | null;
  dsoDays: number;
  oldestCreditAgeDays: number;
  entries: LedgerEntry[];
}

interface VendorShop {
  id: string;
  name: string;
  upiId: string;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function ShopLedgerPage() {
  const params = useParams();
  const router = useRouter();
  const { token, isLoading: authLoading } = useAuth();
  const customerId = params.shopId as string;

  const [ledger, setLedger] = useState<LedgerData | null>(null);
  const [shop, setShop] = useState<VendorShop | null>(null);
  const [loading, setLoading] = useState(true);
  const [limitInput, setLimitInput] = useState('');
  const [savingLimit, setSavingLimit] = useState(false);
  const [reminding, setReminding] = useState(false);
  const [remindMsg, setRemindMsg] = useState('');
  const [creatingLink, setCreatingLink] = useState(false);
  const [paylinkMsg, setPaylinkMsg] = useState('');

  const loadLedger = useCallback(async () => {
    if (!token || !customerId) return;
    try {
      const [ledgerRes, shopRes] = await Promise.all([
        api.get<{ success: boolean; data: LedgerData }>(`/api/udhaar/vendor/${customerId}`, token),
        api.get<{ success: boolean; data: VendorShop }>('/api/shops/vendor/my-shop', token),
      ]);
      if (ledgerRes.success) {
        setLedger(ledgerRes.data);
        setLimitInput(ledgerRes.data.creditLimit ? String(ledgerRes.data.creditLimit) : '');
      }
      if (shopRes.success) setShop(shopRes.data);
    } catch {}
    setLoading(false);
  }, [token, customerId]);

  useEffect(() => {
    if (!authLoading && !token) { window.location.assign('/login'); return; }
    if (token && customerId) loadLedger();
  }, [token, authLoading, customerId, loadLedger]);

  const handleSetLimit = async () => {
    if (!ledger || !limitInput) return;
    setSavingLimit(true);
    setRemindMsg('');
    try {
      const res = await api.post<{ success: boolean }>(
        `/api/udhaar/vendor/${customerId}/limit`,
        { creditLimit: Math.max(0, Number(limitInput)) },
        token || undefined,
      );
      if (res.success) {
        setLedger((prev) => (prev ? { ...prev, creditLimit: Number(limitInput) } : prev));
        setRemindMsg('Credit limit set ho gaya');
      }
    } catch (err: unknown) {
      setRemindMsg(err instanceof Error ? err.message : 'Limit set nahi hua');
    }
    setSavingLimit(false);
  };

  const handleRemind = async () => {
    if (!ledger) return;
    setReminding(true);
    setRemindMsg('');
    try {
      const res = await api.post<{ success: boolean; data?: { sentAt: string; link?: string }; message?: string }>(
        `/api/udhaar/vendor/${customerId}/remind`,
        {},
        token || undefined
      );
      if (res.success) {
        track({ type: 'udhaar_remind', customerId });
        setLedger((prev) => (prev ? { ...prev, lastRemindedAt: res.data?.sentAt || new Date().toISOString() } : prev));
        if (res.data?.link) window.open(res.data.link, '_blank');
      }
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 429) {
        const data = err.data as { nextRemindAt?: string } | null;
        const next = data?.nextRemindAt ? formatDateTime(data.nextRemindAt) : '';
        setRemindMsg(`Reminder pehle bhej chuke hain${next ? ` — ${next} ke baad phir se` : ''}`);
      } else {
        setRemindMsg(err instanceof Error ? err.message : 'Reminder bhej nahi paye');
      }
    }
    setReminding(false);
  };

  const handleUpiCollect = () => {
    if (!ledger || !shop?.upiId) return;
    const link = buildUpiCollectLink(shop.upiId, ledger.customerName, ledger.balance, `Udhaar payment for ${shop.name}`);
    window.open(link, '_blank');
  };

  const handlePayLink = async () => {
    if (!ledger) return;
    setCreatingLink(true);
    setPaylinkMsg('');
    try {
      const res = await api.post<{ success: boolean; data?: { linkUrl: string }; message?: string }>(
        `/api/udhaar/vendor/${customerId}/paylink`,
        {},
        token || undefined
      );
      if (res.success && res.data?.linkUrl) {
        track({ type: 'udhaar_paylink', customerId });
        window.open(res.data.linkUrl, '_blank');
        setPaylinkMsg('Payment link ban gaya — customer ko WhatsApp par bhejein');
      }
    } catch (err: unknown) {
      setPaylinkMsg(err instanceof Error ? err.message : 'Pay link nahi ban paya');
    }
    setCreatingLink(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!ledger) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-6 text-center space-y-4">
        <div className="w-20 h-20 bg-surface-container-low rounded-full flex items-center justify-center">
          <Icon name="person_off" size="xl" className="text-on-surface-variant" />
        </div>
        <h1 className="font-headline font-bold text-on-surface text-xl">Khata nahi mila</h1>
        <button
          onClick={() => router.push('/vendor/udhaar')}
          className="mt-4 leaf-gradient text-on-primary font-headline font-bold px-8 py-3 rounded-xl active:scale-95 transition-all"
        >
          Wapas udhaar par
        </button>
      </div>
    );
  }

  const isCleared = ledger.balance <= 0;
  const lastPayment = [...ledger.entries].find((e) => e.type === 'PAYMENT');
  const lastCredit = [...ledger.entries].find((e) => e.type === 'CREDIT');

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
            <h1 className="font-headline text-lg font-bold tracking-tight text-primary dark:text-primary">{ledger.customerName}</h1>
            <p className="text-[11px] text-on-surface-variant font-medium uppercase tracking-widest italic">Detailed Khata</p>
          </div>
        </div>
      </header>

      <main className="pt-24 px-6 max-w-2xl mx-auto pb-40">
        <section className="relative mb-6">
          <div className="absolute -right-4 -top-4 w-32 h-32 bg-primary-container/20 rounded-full blur-3xl" />
          <div className="relative leaf-gradient p-8 rounded-[2rem] shadow-lg overflow-hidden text-white">
            <div className="absolute top-0 right-0 w-32 h-32 bg-black/10 rounded-bl-[100px]" />
            <div className="flex flex-col gap-1 relative z-10">
              <span className="text-white/80 font-headline font-semibold text-sm tracking-wide uppercase">Kul Baaki (Balance)</span>
              <h2 className="text-white font-headline text-5xl font-extrabold tracking-tighter">₹{ledger.balance}</h2>
              <div className="mt-4 flex items-center gap-2 bg-black/20 backdrop-blur-md self-start px-4 py-1.5 rounded-full border border-white/10">
                <Icon name="schedule" size="sm" className="text-white" />
                <span className="text-white text-xs font-medium">
                  {ledger.dsoDays > 0 ? `Avg payment: ${ledger.dsoDays} din` : 'Koi payment nahi'}
                </span>
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-white/10 flex justify-between items-end relative z-10">
              <div>
                <p className="text-white/60 text-[11px] font-bold uppercase tracking-widest mb-1">Aakhri Payment</p>
                {lastPayment ? (
                  <p className="text-white font-headline font-medium">
                    ₹{lastPayment.amount} <span className="text-white/60 text-xs ml-1">&bull; {formatDate(lastPayment.createdAt)}</span>
                  </p>
                ) : (
                  <p className="text-white/60 text-xs">Abhi tak koi payment nahi</p>
                )}
              </div>
              <Icon name="receipt_long" className="text-white/40 text-4xl" />
            </div>
          </div>
        </section>

        <section className="mb-8 grid grid-cols-2 gap-4">
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Credit Limit</p>
            <p className="text-2xl font-extrabold text-on-surface">{ledger.creditLimit > 0 ? `₹${ledger.creditLimit}` : 'Set karein'}</p>
            {ledger.creditLimit > 0 && ledger.balance > ledger.creditLimit && (
              <p className="text-xs text-error mt-1">Limit cross ho gayi!</p>
            )}
          </div>
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Purana Udhaar</p>
            <p className="text-2xl font-extrabold text-on-surface">{Math.round(ledger.oldestCreditAgeDays)} din</p>
            <p className="text-xs text-on-surface-variant mt-1">Sabse purana khata</p>
          </div>
        </section>

        <section className="mb-8 space-y-4">
          <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
            <Icon name="credit_card" className="text-primary" />
            Credit limit set karein
          </h3>
          <div className="flex gap-3">
            <input
              type="number"
              min={0}
              placeholder="5000"
              value={limitInput}
              onChange={(e) => setLimitInput(e.target.value)}
              className="flex-1 bg-surface-container-low rounded-xl px-4 py-3 text-on-surface placeholder:text-outline/60 focus:ring-2 focus:ring-primary/30 border-none"
            />
            <button
              onClick={handleSetLimit}
              disabled={savingLimit || !limitInput}
              className="bg-primary text-on-primary font-headline font-bold px-6 py-3 rounded-xl active:scale-95 transition-all disabled:opacity-50"
            >
              {savingLimit ? 'Setting...' : 'Save'}
            </button>
          </div>
        </section>

        <section className="mb-8 grid grid-cols-3 gap-3">
          <button
            onClick={handleRemind}
            disabled={reminding || isCleared}
            className="flex flex-col items-center gap-1 bg-[#25D366] text-white font-headline font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all disabled:opacity-40"
          >
            <Icon name="chat" filled className="text-white" />
            {reminding ? 'Bhej rahe...' : 'Reminder'}
          </button>
          <button
            onClick={handlePayLink}
            disabled={creatingLink || isCleared}
            className="flex flex-col items-center gap-1 bg-primary text-on-primary font-headline font-bold py-4 rounded-xl active:scale-95 transition-all disabled:opacity-40"
          >
            <Icon name="link" />
            {creatingLink ? 'Bana rahe...' : 'Pay Link'}
          </button>
          <button
            onClick={handleUpiCollect}
            disabled={!shop?.upiId || isCleared}
            className="flex flex-col items-center gap-1 bg-surface-container-highest text-on-surface font-headline font-bold py-4 rounded-xl active:scale-95 transition-all disabled:opacity-40"
          >
            <Icon name="qr_code_2" />
            UPI Collect
          </button>
        </section>

        {remindMsg && (
          <p className="mb-8 text-sm text-primary bg-primary-fixed px-4 py-3 rounded-xl">{remindMsg}</p>
        )}

        {paylinkMsg && (
          <p className="mb-8 text-sm text-secondary bg-secondary-container/30 px-4 py-3 rounded-xl">{paylinkMsg}</p>
        )}

        <section className="space-y-10">
          {ledger.entries.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-surface-container-low rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon name="receipt_long" size="xl" className="text-on-surface-variant" />
              </div>
              <p className="text-on-surface-variant">Abhi tak koi entry nahi hai</p>
            </div>
          ) : (
            ledger.entries.map((entry) => (
              <div
                key={entry.id}
                className="group bg-surface-container-lowest p-5 rounded-3xl transition-all hover:shadow-md border border-transparent hover:border-outline-variant/10 flex items-center justify-between"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    entry.type === 'CREDIT'
                      ? 'bg-primary-container text-primary'
                      : 'bg-secondary-container/20 text-secondary'
                  }`}>
                    <Icon name={entry.type === 'CREDIT' ? 'shopping_bag' : 'payments'} filled />
                  </div>
                  <div>
                    <p className="font-headline font-bold text-on-surface">{entry.note || (entry.type === 'CREDIT' ? 'Udhaar' : 'Payment')}</p>
                    <p className={`text-xs font-medium mt-0.5 italic ${
                      entry.type === 'CREDIT' ? 'text-on-surface-variant' : 'text-secondary'
                    }`}>
                      {entry.type === 'CREDIT' ? 'Udhaar (Purchase)' : 'Chukaya (Payment)'} &bull; {formatDateTime(entry.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-headline font-extrabold text-lg ${
                    entry.type === 'CREDIT' ? 'text-primary' : 'text-secondary'
                  }`}>
                    {entry.type === 'CREDIT' ? '+' : '-'}₹{entry.amount}
                  </p>
                </div>
              </div>
            ))
          )}
        </section>

        <div className="h-24" />
      </main>
    </div>
  );
}

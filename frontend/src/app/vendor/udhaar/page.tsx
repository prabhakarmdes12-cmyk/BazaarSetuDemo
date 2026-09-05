'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@/components/ui';
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

const SAMPLE_DEMO_CUSTOMERS: UdhaarCustomer[] = [
  {
    id: 'demo-1',
    customerId: 'c-1',
    customerName: 'Vikram Sharma (Flat 302)',
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
    customerName: 'Pooja Verma (House 12)',
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

  // "+ Naya Khata Jodo" Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [khataAmount, setKhataAmount] = useState('');
  const [khataNotes, setKhataNotes] = useState('');

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

  const handleCreateKhata = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone || !khataAmount) return;

    const amt = parseFloat(khataAmount) || 0;
    const newEntry: UdhaarCustomer = {
      id: `manual-${Date.now()}`,
      customerId: `c-${Date.now()}`,
      customerName,
      customerPhone,
      totalDue: amt,
      totalPaid: 0,
      balance: amt,
      creditLimit: amt * 2,
      lastRemindedAt: null,
      lastUpdated: new Date().toISOString(),
    };

    setLedgers((prev) => [newEntry, ...prev]);
    setShowDemo(false);
    setIsModalOpen(false);

    const text = encodeURIComponent(
      `Namaste ${customerName} ji, aapka dukaan khata Chiti Bazaar par open ho gaya hai. Bacha hua balance ₹${amt} hai. Dhanyawaad!`
    );
    window.open(`https://wa.me/${customerPhone.replace(/\D/g, '')}?text=${text}`, '_blank');

    setCustomerName('');
    setCustomerPhone('');
    setKhataAmount('');
    setKhataNotes('');
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
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsModalOpen(true)}
              className="leaf-gradient text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-brand-glow flex items-center gap-1.5 font-headline uppercase tracking-wider"
            >
              <Icon name="person_add" size="sm" />
              <span>+ Naya Khata Jodo</span>
            </motion.button>
          </div>
        </section>

        {/* Luxury Obsidian Fintech Ledger Card */}
        <section className="relative overflow-hidden rounded-3xl bg-surface-container-low border border-primary/30 p-6 sm:p-8 shadow-editorial-lg">
          <div className="absolute top-0 right-0 w-80 h-80 bg-primary/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
                <p className="text-xs font-black uppercase tracking-widest text-primary font-headline">
                  Bacha hua Udhaar (Outstanding)
                </p>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-black tracking-tight text-on-surface font-headline tabular-nums">
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
                <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-emerald-400 font-headline tabular-nums">
                  ₹{totalPaid}
                </span>
              </div>
              <p className="text-xs text-on-surface-variant font-medium">
                Total successfully settled amount
              </p>
            </div>

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
                  Settlement Statement
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
              <p className="text-2xl font-black text-on-surface font-headline tabular-nums">
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
              <p className="text-2xl font-black text-on-surface font-headline tabular-nums">
                {summary ? summary.dsoDays : '0'} <span className="text-sm font-normal text-on-surface-variant">din</span>
              </p>
              <p className="text-[11px] text-on-surface-variant mt-3">Bharti wapsi ke avg din</p>
            </div>

            <div className="bg-surface-container-low border border-white/5 rounded-2xl p-5 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant font-headline mb-1">
                Credit Utilization
              </p>
              <p className="text-2xl font-black text-on-surface font-headline tabular-nums">
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
              <p className="text-2xl font-black text-emerald-400 font-headline tabular-nums">
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
            <div className="text-center py-16 bg-surface-container-low border border-white/5 rounded-3xl p-8 relative overflow-hidden">
              <div className="absolute inset-0 leaf-ambient-glow pointer-events-none" />
              <div className="relative z-10">
                <div className="w-20 h-20 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                  <Icon name="check_circle" size="xl" filled />
                </div>
                <h4 className="text-lg font-bold text-on-surface font-headline">Sab hisaab barabar hai!</h4>
                <p className="text-xs text-on-surface-variant mt-1 max-w-sm mx-auto">
                  Filhaal koi pending udhaar nahi hai. Naye customer ka hisaab jodne ke liye &quot;Naya Khata Jodo&quot; par click karein.
                </p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="mt-5 leaf-gradient text-white text-xs font-black px-5 py-2.5 rounded-xl shadow-brand-glow font-headline uppercase tracking-wider"
                >
                  + Naya Khata Jodo
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {displayedLedgers.map((l) => {
                const isOverdue = l.balance > 500;
                return (
                  <div
                    key={l.id}
                    className="group bg-gradient-to-br from-emerald-500/20 via-white/5 to-transparent p-[1px] rounded-3xl transition-all duration-300 hover:shadow-editorial-lg"
                  >
                    <div className="bg-surface-container-low rounded-3xl p-6 h-full flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-surface-container-lowest border border-white/10 flex items-center justify-center text-primary font-black font-headline text-lg">
                              {l.customerName[0]}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-on-surface font-headline">{l.customerName}</h4>
                                <span className="relative flex h-2 w-2">
                                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isOverdue ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                                  <span className={`relative inline-flex rounded-full h-2 w-2 ${isOverdue ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                                </span>
                              </div>
                              <p className="text-xs text-on-surface-variant">{l.customerPhone}</p>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant font-headline">
                              Baaki Balance
                            </span>
                            <p className="text-xl font-black text-primary font-headline tabular-nums">₹{l.balance}</p>
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <span className="text-on-surface-variant">
                          Kul: <b className="text-on-surface tabular-nums">₹{l.totalDue}</b> &bull; Paid: <b className="text-emerald-400 tabular-nums">₹{l.totalPaid}</b>
                        </span>

                        <motion.button
                          whileTap={{ scale: 0.92 }}
                          onClick={() => handleSendReminder(l)}
                          className="flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 px-3 py-1.5 rounded-xl font-bold text-xs transition-all shadow-sm"
                        >
                          <Icon name="chat" size="sm" filled />
                          <span>WhatsApp Reminder</span>
                        </motion.button>
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

      {/* "+ Naya Khata Jodo" Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="w-full max-w-md bg-surface-container-low border border-primary/30 rounded-3xl p-6 shadow-editorial-lg relative"
            >
              <div className="flex justify-between items-center mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl leaf-gradient flex items-center justify-center text-white">
                    <Icon name="person_add" size="sm" />
                  </div>
                  <h3 className="font-headline font-black text-lg text-on-surface">Naya Khata Jodo</h3>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-on-surface-variant hover:text-primary p-1"
                >
                  <Icon name="close" size="sm" />
                </button>
              </div>

              <form onSubmit={handleCreateKhata} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Ramesh ji (Flat 302)"
                    className="w-full bg-surface-container-lowest border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                    WhatsApp / Mobile Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full bg-surface-container-lowest border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                    Initial Udhaar Amount (₹)
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={khataAmount}
                    onChange={(e) => setKhataAmount(e.target.value)}
                    placeholder="e.g. 350"
                    className="w-full bg-surface-container-lowest border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary font-headline"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                    Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={khataNotes}
                    onChange={(e) => setKhataNotes(e.target.value)}
                    placeholder="e.g. Daily morning milk"
                    className="w-full bg-surface-container-lowest border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border border-white/10 text-xs font-bold text-on-surface-variant hover:bg-white/5"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 leaf-gradient text-white py-2.5 rounded-xl text-xs font-black shadow-brand-glow font-headline uppercase tracking-wider"
                  >
                    Record &amp; Invite
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

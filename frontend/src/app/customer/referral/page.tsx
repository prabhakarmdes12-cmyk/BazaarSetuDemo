'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { buildInviteLink } from '@/lib/whatsapp';
import { track } from '@/lib/analytics';

interface ReferralInfo {
  code: string;
  totalCount: number;
  joinedCount: number;
  pendingCount: number;
  rewardedCount: number;
  rewardAmount: number;
}

export default function ReferralPage() {
  const router = useRouter();
  const { token, user, isLoading: authLoading } = useAuth();
  const [info, setInfo] = useState<ReferralInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const res = await api.get<{ success: boolean; data: ReferralInfo }>('/api/referrals/mine', token);
      if (res.success) setInfo(res.data);
    } catch {}
    setLoading(false);
  }, [token]);

  useEffect(() => {
    if (!authLoading && !token) { window.location.assign('/login'); return; }
    if (token) load();
  }, [token, authLoading, load]);

  const handleShare = () => {
    if (!info?.code) return;
    track({ type: 'referral_shared', code: info.code });
    window.open(buildInviteLink(user?.phone || '', info.code, `${window.location.origin}/login`), '_blank');
  };

  const handleCopy = async () => {
    if (!info?.code) return;
    try {
      await navigator.clipboard.writeText(info.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <div className="bg-background text-on-surface font-body antialiased min-h-screen pb-28">
      <nav className="fixed top-0 w-full z-50 bg-surface-container-lowest/80 backdrop-blur-md shadow-top-bar">
        <div className="flex items-center px-6 h-16 w-full max-w-screen-xl mx-auto">
          <button onClick={() => router.push('/customer/profile')} aria-label="Go back" className="mr-4 text-primary active:scale-95 transition-transform duration-200">
            <Icon name="arrow_back" />
          </button>
          <h1 className="font-headline font-bold text-xl tracking-tight text-primary">Dosto ko bulao</h1>
        </div>
      </nav>

      <main className="pt-24 px-6 max-w-screen-md mx-auto space-y-8">
        <section className="relative overflow-hidden rounded-[2rem] leaf-gradient p-8 text-on-primary shadow-lg">
          <div className="absolute -right-6 -top-6 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          <div className="relative z-10 space-y-2">
            <p className="text-sm font-medium opacity-90">Aapka referral code</p>
            {loading ? (
              <div className="h-12 bg-white/20 rounded-xl animate-pulse" />
            ) : (
              <div className="flex items-center justify-between bg-black/10 backdrop-blur-md rounded-xl px-5 py-4 border border-white/10">
                <span className="font-headline font-extrabold text-3xl tracking-[0.2em]">{info?.code || '------'}</span>
                <button onClick={handleCopy} className="bg-white text-primary font-bold px-4 py-2 rounded-lg text-sm active:scale-95 transition-all flex items-center gap-1.5">
                  <Icon name={copied ? 'check' : 'content_copy'} size="sm" />
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            )}
            <p className="text-xs opacity-80">Dost apna number register karte waqt ye code use karein</p>
          </div>
        </section>

        <section className="grid grid-cols-3 gap-4">
          <div className="bg-surface-container-low rounded-2xl p-5 text-center">
            <p className="text-2xl font-extrabold text-on-surface">{info?.joinedCount ?? '--'}</p>
            <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mt-1">Jude</p>
          </div>
          <div className="bg-surface-container-low rounded-2xl p-5 text-center">
            <p className="text-2xl font-extrabold text-on-surface">{info?.pendingCount ?? '--'}</p>
            <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mt-1">Pending</p>
          </div>
          <div className="bg-surface-container-low rounded-2xl p-5 text-center">
            <p className="text-2xl font-extrabold text-primary">₹{info?.rewardAmount ?? 0}</p>
            <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mt-1">Reward</p>
          </div>
        </section>

        <button
          onClick={handleShare}
          disabled={!info?.code}
          className="w-full py-4 rounded-xl bg-[#25D366] text-white font-headline font-bold text-lg shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-40"
        >
          <Icon name="chat" filled className="text-white" />
          WhatsApp par invite bhejein
        </button>

        <section className="bg-surface-container-low rounded-2xl p-6 space-y-4">
          <h3 className="font-headline font-bold text-lg text-on-surface flex items-center gap-2">
            <Icon name="card_giftcard" className="text-primary" />
            Kaise kaam karta hai
          </h3>
          <div className="space-y-3 text-sm text-on-surface-variant">
            <p className="flex gap-3"><span className="text-primary font-bold">1.</span> Apna referral code share karein</p>
            <p className="flex gap-3"><span className="text-primary font-bold">2.</span> Dost Chiti Bazaar par register karein</p>
            <p className="flex gap-3"><span className="text-primary font-bold">3.</span> Har joined dost par reward paayein</p>
          </div>
        </section>
      </main>
    </div>
  );
}

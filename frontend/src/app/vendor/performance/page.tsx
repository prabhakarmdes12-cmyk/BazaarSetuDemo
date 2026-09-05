'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';

export default function PerformancePage() {
  const router = useRouter();
  const { token, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !token) { window.location.assign('/login'); }
  }, [token, authLoading]);

  return (
    <div className="bg-surface min-h-screen">
      {/* Top Bar */}
      <header className="bg-surface-container-lowest/80 backdrop-blur-xl fixed top-0 w-full z-50 shadow-top-bar">
        <div className="flex items-center w-full px-6 py-4 max-w-7xl mx-auto">
          <button
            onClick={() => router.push('/vendor')}
            className="active:scale-95 transition-transform text-primary p-2 rounded-full hover:bg-primary-container mr-4"
          >
            <Icon name="arrow_back" />
          </button>
          <h1 className="font-headline font-bold text-lg tracking-tight text-on-surface">Shop Performance</h1>
        </div>
      </header>

      <main className="pt-24 pb-32 px-6 max-w-5xl mx-auto">
        {/* Rating Hero */}
        <section className="relative overflow-hidden bg-surface-container-low rounded-3xl p-8 mb-12">
          <div className="absolute -right-8 -top-8 w-48 h-48 bg-primary-container/10 rounded-full blur-3xl" />
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            <div className="flex flex-col items-center">
              <div className="relative w-28 h-28 mb-4">
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 112 112">
                  <circle cx="56" cy="56" r="50" fill="transparent" stroke="#262a30" strokeWidth="10" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-4xl font-black text-on-surface-variant">—</span>
                </div>
              </div>
              <p className="text-xs text-on-surface-variant">Rating abhi available nahi</p>
            </div>
            <div className="flex-1 text-center md:text-left">
              <h2 className="font-headline font-extrabold text-3xl text-on-surface mb-2">Performance data abhi available nahi</h2>
              <p className="text-on-surface-variant leading-relaxed">
                Jab aapke orders aane lagenge, rating, reviews aur shop metrics yahan dikhenge.
              </p>
            </div>
          </div>
        </section>

        {/* Metrics Grid */}
        <section className="mb-12">
          <h3 className="font-headline font-bold text-xl mb-6">Detailed Metrics</h3>
          <div className="bg-surface-container-lowest p-10 rounded-2xl text-center">
            <div className="w-14 h-14 bg-surface-container-high rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="insights" className="text-on-surface-variant" />
            </div>
            <p className="font-headline font-bold text-on-surface">Abhi koi metrics nahi hain</p>
            <p className="text-sm text-on-surface-variant mt-1">Inventory, delivery aur response metrics orders ke baad yahan aaenge.</p>
          </div>
        </section>

        {/* Tips */}
        <section>
          <h3 className="font-headline font-bold text-xl mb-6">Rating improve karne ke liye</h3>
          <div className="space-y-4">
            <div className="bg-surface-container-low p-6 rounded-2xl flex items-start gap-4">
              <div className="w-12 h-12 bg-primary-container/20 rounded-xl flex items-center justify-center shrink-0">
                <Icon name="inventory_2" className="text-primary" />
              </div>
              <div>
                <h4 className="font-headline font-bold text-on-surface mb-1">Popular items stock mein rakhein</h4>
                <p className="text-sm text-on-surface-variant">Bikne wale items hamesha available rakkhein taaki customers ko order cancel na karna pade.</p>
              </div>
            </div>
            <div className="bg-surface-container-low p-6 rounded-2xl flex items-start gap-4">
              <div className="w-12 h-12 bg-secondary-container/20 rounded-xl flex items-center justify-center shrink-0">
                <Icon name="speed" className="text-secondary" />
              </div>
              <div>
                <h4 className="font-headline font-bold text-on-surface mb-1">Orders jaldi process karein</h4>
                <p className="text-sm text-on-surface-variant">Order aate hi confirm karein taaki delivery mein deri na ho.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

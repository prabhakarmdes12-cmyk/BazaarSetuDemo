'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Icon } from '@/components/ui';
import ChitiBazaarLogo from '@/components/ChitiBazaarLogo';

export default function SplashPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('chitibazaar_token');
    const role = localStorage.getItem('chitibazaar_role');

    if (token) {
      if (role === 'vendor') router.replace('/vendor');
      else if (role === 'admin') router.replace('/admin');
      else router.replace('/customer');
    }
  }, [router]);

  const handleContinue = () => {
    const token = localStorage.getItem('chitibazaar_token');
    const role = localStorage.getItem('chitibazaar_role');

    if (token) {
      if (role === 'vendor') router.push('/vendor');
      else if (role === 'admin') router.push('/admin');
      else router.push('/customer');
    } else {
      router.push('/customer');
    }
  };

  return (
    <div className="bg-surface min-h-screen flex flex-col items-center justify-center p-4 py-8 relative overflow-y-auto">
      {/* Background decorative elements */}
      <div className="fixed top-0 left-0 w-full h-full -z-10 bg-surface overflow-hidden pointer-events-none">
        <div className="absolute inset-0 leaf-ambient-glow" />
        <div className="absolute top-[10%] -left-[5%] w-[40%] aspect-square rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-[10%] -right-[5%] w-[30%] aspect-square rounded-full bg-secondary/10 blur-[100px]" />
      </div>

      {/* Main splash canvas */}
      <div className="relative w-full max-w-md bg-surface-container-lowest mx-auto rounded-[2.5rem] shadow-editorial-xl flex flex-col border border-primary/20 overflow-hidden my-auto">
        {/* Hero Section */}
        <section className="relative w-full p-6 pt-8 flex flex-col items-center">
          <div className="relative w-full aspect-[4/3] max-h-64 group">
            <div className="absolute inset-0 bg-primary/25 blur-[40px] rounded-full scale-75 group-hover:scale-100 transition-transform duration-700" />
            <Image
              fill
              priority
              sizes="(max-width: 768px) 100vw, 384px"
              alt="Fresh vegetables and kirana staples"
              className="object-cover rounded-3xl shadow-xl relative z-10 border border-primary/20"
              src="/hero-splash.jpg"
            />
            {/* Floating badge */}
            <div className="absolute -bottom-3 -left-2 glass-panel px-3.5 py-2.5 rounded-xl shadow-lg z-20 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full leaf-gradient flex items-center justify-center text-white">
                <Icon name="storefront" size="sm" />
              </div>
              <div>
                <p className="text-[9px] font-bold text-primary tracking-widest uppercase">Verified Shop</p>
                <p className="text-xs font-semibold text-on-surface">Local Merchant</p>
              </div>
            </div>
          </div>
        </section>

        {/* Branding */}
        <section className="flex-1 flex flex-col items-center justify-between p-8 pt-4 text-center">
          <div className="space-y-3">
            <div className="flex flex-col items-center">
              <ChitiBazaarLogo size={48} />
              <p className="font-headline italic text-sm font-semibold text-on-surface-variant mt-2">
                Fresh Veggies &amp; Kirana in 10 mins
              </p>
            </div>
            <div className="pt-3">
              <p className="text-on-surface-variant font-medium text-base leading-relaxed max-w-[260px] mx-auto">
                Dukaan se seedha baat karke order karein
              </p>
            </div>
          </div>

          {/* Action */}
          <div className="w-full space-y-5 pt-6">
            <button
              onClick={handleContinue}
              className="w-full leaf-gradient text-white font-headline font-bold py-4 rounded-xl shadow-brand-glow active:scale-95 transition-all duration-200 text-base flex items-center justify-center cursor-pointer"
            >
              Aage Badhein
            </button>
            {/* Progress dots */}
            <div className="flex justify-center gap-2">
              <div className="w-8 h-1.5 rounded-full bg-primary" />
              <div className="w-1.5 h-1.5 rounded-full bg-surface-container-highest" />
              <div className="w-1.5 h-1.5 rounded-full bg-surface-container-highest" />
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="pb-6 text-center">
          <p className="text-[10px] font-label font-medium text-on-surface-variant/60 tracking-widest uppercase">
            Vocal for Local &bull; Made in Bharat
          </p>
        </footer>
      </div>
    </div>
  );
}

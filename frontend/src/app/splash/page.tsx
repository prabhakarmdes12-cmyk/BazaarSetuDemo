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
      router.push('/login');
    }
  };

  return (
    <div className="bg-surface min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Background decorative elements */}
      <div className="fixed top-0 left-0 w-full h-full -z-10 bg-surface overflow-hidden">
        <div className="absolute inset-0 leaf-ambient-glow" />
        <div className="absolute top-[10%] -left-[5%] w-[40%] aspect-square rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-[10%] -right-[5%] w-[30%] aspect-square rounded-full bg-secondary/10 blur-[100px]" />
      </div>

      {/* Main splash canvas */}
      <div className="relative w-full max-w-md h-[795px] bg-surface-container-lowest mx-auto rounded-[3rem] shadow-editorial-xl overflow-hidden flex flex-col border border-primary/10">
        {/* Hero Section */}
        <section className="relative h-[55%] w-full overflow-hidden">
          <div className="h-full w-full p-8 flex flex-col justify-end items-center relative z-10">
            {/* Hero image */}
            <div className="relative w-full aspect-square max-h-72 group">
              {/* Ambient glow */}
              <div className="absolute inset-0 bg-primary/25 blur-[40px] rounded-full scale-75 group-hover:scale-100 transition-transform duration-700" />
              <Image
                fill
                sizes="(max-width: 768px) 100vw, 384px"
                alt="Fresh vegetables and kirana staples"
                className="object-cover rounded-[2.5rem] shadow-xl relative z-10 border border-primary/20"
                src="/hero-splash.jpg"
              />
              {/* Floating badge */}
              <div className="absolute -bottom-4 -left-4 glass-panel p-4 rounded-2xl shadow-lg z-20 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full leaf-gradient flex items-center justify-center text-white">
                  <Icon name="storefront" size="md" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-primary tracking-widest uppercase">Verified Shop</p>
                  <p className="text-xs font-semibold text-on-surface">Local Merchant</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Branding */}
        <section className="flex-1 flex flex-col items-center justify-between p-10 text-center">
          <div className="space-y-4">
            <div className="flex flex-col items-center">
              <ChitiBazaarLogo size={56} />
              <p className="font-headline italic text-sm font-semibold text-on-surface-variant mt-3">
                Fresh Veggies &amp; Kirana in 10 mins
              </p>
            </div>
            <div className="pt-6">
              <p className="text-on-surface-variant font-medium text-lg leading-relaxed max-w-[240px] mx-auto">
                Dukaan se seedha baat karke order karein
              </p>
            </div>
          </div>

          {/* Action */}
          <div className="w-full space-y-6">
            <button
              onClick={handleContinue}
              className="w-full leaf-gradient text-white font-headline font-bold py-5 rounded-xl shadow-brand-glow active:scale-95 transition-all duration-200 text-lg flex items-center justify-center"
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
        <footer className="pb-8 text-center">
          <p className="text-[11px] font-label font-medium text-on-surface-variant/60 tracking-widest uppercase">
            Vocal for Local &bull; Made in Bharat
          </p>
        </footer>
      </div>
    </div>
  );
}

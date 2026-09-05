'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Icon } from '@/components/ui';

export default function SplashPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('bazaarsetu_token');
    const role = localStorage.getItem('bazaarsetu_role');

    if (token) {
      if (role === 'vendor') router.replace('/vendor');
      else if (role === 'admin') router.replace('/admin');
      else router.replace('/customer');
    }
  }, [router]);

  const handleContinue = () => {
    const token = localStorage.getItem('bazaarsetu_token');
    const role = localStorage.getItem('bazaarsetu_role');

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
        <div className="absolute top-[10%] -left-[5%] w-[40%] aspect-square rounded-full bg-primary-container/5 blur-[120px]" />
        <div className="absolute bottom-[10%] -right-[5%] w-[30%] aspect-square rounded-full bg-secondary-container/5 blur-[100px]" />
      </div>

      {/* Main splash canvas */}
      <div className="relative w-full max-w-md h-[795px] bg-surface-container-lowest mx-auto rounded-[3rem] shadow-editorial-xl overflow-hidden flex flex-col">
        {/* Hero Section */}
        <section className="relative h-[55%] w-full overflow-hidden">
          {/* Asymmetric background element */}
          <div className="absolute -top-20 -right-20 w-80 h-80 organic-shape editorial-gradient opacity-10" />
          <div className="h-full w-full p-8 flex flex-col justify-end items-center relative z-10">
            {/* Hero image */}
            <div className="relative w-full aspect-square max-h-72 group">
              {/* Ambient glow */}
              <div className="absolute inset-0 bg-primary-container/20 blur-[40px] rounded-full scale-75 group-hover:scale-100 transition-transform duration-700" />
              <Image
                fill
                sizes="(max-width: 768px) 100vw, 384px"
                alt="Local Indian Marketplace"
                className="object-cover rounded-[2.5rem] shadow-xl relative z-10 border border-white/20"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBW89uY2tshh3nz-x3iYdmHzqrJeIfVCYyI4_i_DpeiUA3UvN9u_vqDCgcNz2ls2uxyUHhwbN-2fih3_lzTyr2dZB3bBg_eREzgLGnkTPmfK4xYddmeNO--p7S80Xfz4Y7FYsSWOS5elqGjPp6TNvlfhtZaHLg3HdEDVkjR6WzTgRWDcSI8cz4OojMQv4M8lDZDeYVmHBooTZt-fWT7dZlvoKgCxLIe7238dK3OtE6NvZFOJx2SeirfWkfAMk4-4-v92ObgOAyJbwU"
              />
              {/* Floating badge */}
              <div className="absolute -bottom-4 -left-4 bg-surface-container-lowest/90 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-outline-variant/20 z-20 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full editorial-gradient flex items-center justify-center text-white">
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
              <h1 className="font-headline font-black text-5xl tracking-tighter text-primary italic">
                BazaarSetu
              </h1>
              <p className="font-headline italic text-sm font-semibold text-primary mt-2">
                &apos;Apni local dukaan, ab online&apos;
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
              className="w-full editorial-gradient text-white font-headline font-bold py-5 rounded-xl shadow-saffron active:scale-95 transition-all duration-200 text-lg flex items-center justify-center"
            >
              Aage Badhein
            </button>
            {/* Progress dots */}
            <div className="flex justify-center gap-2">
              <div className="w-8 h-1.5 rounded-full bg-primary-container" />
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

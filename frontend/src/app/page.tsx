'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ChitiBazaarLogo from '@/components/ChitiBazaarLogo';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('chitibazaar_token');
    const role = localStorage.getItem('chitibazaar_role');

    if (token && role === 'vendor') {
      router.replace('/vendor');
    } else if (token && role === 'admin') {
      router.replace('/admin');
    } else if (token) {
      router.replace('/customer');
    } else {
      router.replace('/splash');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface gap-6 relative overflow-hidden">
      <div className="absolute inset-0 leaf-ambient-glow pointer-events-none" />
      <ChitiBazaarLogo size={72} />
      <p className="relative text-on-surface-variant font-headline italic text-sm font-semibold tracking-wide">
        Fresh Veggies &amp; Kirana in 10 mins
      </p>
      <div className="relative mt-2 h-1.5 w-40 overflow-hidden rounded-full bg-surface-container">
        <div className="h-full w-1/2 rounded-full leaf-gradient animate-pulse-ring" />
      </div>
    </div>
  );
}

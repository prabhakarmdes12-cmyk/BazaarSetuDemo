'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/ui';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('bazaarsetu_token');
    const role = localStorage.getItem('bazaarsetu_role');

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
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface gap-6">
      <h1 className="text-5xl font-black text-primary italic tracking-tight font-headline">BazaarSetu</h1>
      <p className="text-on-surface-variant font-headline italic text-sm font-semibold">&apos;Apni local dukaan, ab online&apos;</p>
      <div className="mt-4 animate-pulse">
        <Icon name="progress_activity" className="text-primary text-4xl" />
      </div>
    </div>
  );
}

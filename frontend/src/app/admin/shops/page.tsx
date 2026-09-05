'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminShopsRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/admin?tab=shops'); }, [router]);
  return null;
}

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Icon } from '@/components/ui';

interface RequireAuthProps {
  children: React.ReactNode;
  role?: 'customer' | 'vendor' | 'admin';
}

const roleHome: Record<string, string> = {
  customer: '/customer',
  vendor: '/vendor',
  admin: '/admin',
};

export default function RequireAuth({ children, role }: RequireAuthProps) {
  const router = useRouter();
  const { user, token, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || !token) {
      router.replace('/login');
      return;
    }
    // Role gate — a vendor must not access customer/admin routes and vice versa.
    if (role && user && user.role !== role) {
      router.replace(roleHome[user.role] ?? '/login');
    }
  }, [isLoading, isAuthenticated, token, user, role, router]);

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-surface gap-4">
        <Icon name="progress_activity" className="text-primary text-4xl animate-spin" />
        <p className="text-sm text-on-surface-variant font-headline italic">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated || !token) return null;
  if (role && user && user.role !== role) return null;

  return <>{children}</>;
}

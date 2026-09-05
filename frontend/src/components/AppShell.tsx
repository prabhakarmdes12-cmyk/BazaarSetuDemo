'use client';

import React from 'react';
import TopNav from './TopNav';
import BottomNavBar from './BottomNavBar';
import FloatingActionButton from './FloatingActionButton';
import RequireAuth from './RequireAuth';

interface AppShellProps {
  children: React.ReactNode;
  role?: 'customer' | 'vendor' | 'admin';
  guest?: boolean;
  showNav?: boolean;
  showTopNav?: boolean;
  showFab?: boolean;
  fabCount?: number;
  fabHref?: string;
  onFabClick?: () => void;
  onMenuClick?: () => void;
  notificationCount?: number;
  topNavTitle?: string;
  topNavSubtitle?: string;
  showBack?: boolean;
  backHref?: string;
}

const customerNavItems = [
  { href: '/customer', label: 'Discovery', icon: 'home' },
  { href: '/customer/orders', label: 'Orders', icon: 'shopping_bag' },
  { href: '/customer/chats', label: 'Chat', icon: 'chat' },
  { href: '/customer/profile', label: 'Profile', icon: 'person' },
];

const vendorNavItems = [
  { href: '/vendor', label: 'Home', icon: 'dashboard' },
  { href: '/vendor/orders', label: 'Orders', icon: 'package_2' },
  { href: '/vendor/stats', label: 'Stats', icon: 'analytics' },
  { href: '/vendor/chats', label: 'Chats', icon: 'chat_bubble' },
];

const adminNavItems = [
  { href: '/admin', label: 'Overview', icon: 'dashboard' },
  { href: '/admin/shops', label: 'Shops', icon: 'storefront' },
  { href: '/admin/orders', label: 'Orders', icon: 'receipt_long' },
  { href: '/admin/settings', label: 'Settings', icon: 'settings' },
];

export default function AppShell({
  children,
  role = 'customer',
  guest = false,
  showNav = true,
  showTopNav = true,
  showFab = false,
  fabCount,
  fabHref,
  onFabClick,
  onMenuClick,
  notificationCount,
  topNavTitle,
  topNavSubtitle,
  showBack = false,
  backHref,
}: AppShellProps) {
  const navItems = role === 'vendor'
    ? vendorNavItems
    : role === 'admin'
      ? adminNavItems
      : customerNavItems;

  // Guest mode: browse without an account; a login CTA replaces the nav bar.
  if (guest) {
    return (
      <div className="min-h-screen bg-surface text-on-surface">
        {showTopNav && (
          <TopNav
            onMenuClick={onMenuClick}
            notificationCount={notificationCount}
            title={topNavTitle}
            subtitle={topNavSubtitle}
            showBack={showBack}
            backHref={backHref}
          />
        )}
        <main className="max-w-7xl mx-auto px-6 pb-32">
          {children}
        </main>
        {showFab && (
          <FloatingActionButton count={fabCount} href={fabHref} onClick={onFabClick} />
        )}
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-surface-container-lowest/90 backdrop-blur-xl border-t border-outline-variant/10 px-6 pt-4 pb-6">
          <a
            href="/login"
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary to-primary-container text-on-primary font-headline font-bold text-center block shadow-lg active:scale-[0.98] transition-all"
          >
            Login karke order karein
          </a>
        </div>
      </div>
    );
  }

  return (
    <RequireAuth role={role}>
    <div className="min-h-screen bg-surface text-on-surface">
      {showTopNav && (
        <TopNav
          onMenuClick={onMenuClick}
          notificationCount={notificationCount}
          title={topNavTitle}
          subtitle={topNavSubtitle}
          showBack={showBack}
          backHref={backHref}
        />
      )}
      <main className="max-w-7xl mx-auto px-6 pb-32">
        {children}
      </main>
      {showNav && <BottomNavBar items={navItems} />}
      {showFab && (
        <FloatingActionButton count={fabCount} href={fabHref} onClick={onFabClick} />
      )}
    </div>
    </RequireAuth>
  );
}

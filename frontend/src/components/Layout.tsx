'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '@/components/ui';
import RequireAuth from './RequireAuth';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  showBack?: boolean;
  backHref?: string;
  showNav?: boolean;
  role?: 'customer' | 'vendor' | 'admin';
}

export default function Layout({ children, title, showBack = false, backHref, showNav = true, role = 'customer' }: LayoutProps) {
  const pathname = usePathname();

  const customerNav = [
    { href: '/customer', label: 'Discovery', icon: 'home' },
    { href: '/customer/orders', label: 'Orders', icon: 'shopping_bag' },
    { href: '/customer/chats', label: 'Chat', icon: 'chat' },
    { href: '/customer/profile', label: 'Profile', icon: 'person' },
  ];

  const vendorNav = [
    { href: '/vendor', label: 'Home', icon: 'dashboard' },
    { href: '/vendor/orders', label: 'Orders', icon: 'package_2' },
    { href: '/vendor/stats', label: 'Stats', icon: 'analytics' },
    { href: '/vendor/chats', label: 'Chats', icon: 'chat_bubble' },
  ];

  const adminNav = [
    { href: '/admin', label: 'Overview', icon: 'dashboard' },
    { href: '/admin/shops', label: 'Shops', icon: 'storefront' },
    { href: '/admin/orders', label: 'Orders', icon: 'receipt_long' },
    { href: '/admin/settings', label: 'Settings', icon: 'settings' },
  ];

  const navItems = role === 'vendor' ? vendorNav : role === 'admin' ? adminNav : customerNav;

  return (
    <RequireAuth role={role}>
    <div className="min-h-screen bg-surface text-on-surface flex flex-col">
      {title && (
        <header className="bg-surface-container-lowest/80 backdrop-blur-xl sticky top-0 z-40 shadow-top-bar">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
            {showBack && (
              <Link
                href={backHref || '#'}
                className="text-on-surface-variant active:scale-95 transition-transform duration-200"
              >
                <Icon name="arrow_back" />
              </Link>
            )}
            <h1 className="text-lg font-bold font-headline text-on-surface truncate">{title}</h1>
          </div>
        </header>
      )}

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-4 pb-32">
        {children}
      </main>

      {showNav && (
        <nav className="fixed bottom-0 left-0 w-full z-50 bg-surface-container-lowest/80 backdrop-blur-xl rounded-t-[24px] border-t border-outline-variant shadow-bottom-nav">
          <div className="flex justify-around items-center px-4 pb-6 pt-3 max-w-7xl mx-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/customer' && item.href !== '/vendor' && item.href !== '/admin' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center justify-center rounded-xl px-5 py-2 active:scale-90 transition-all duration-200 ease-out ${
                    isActive
                      ? 'bg-primary-container dark:bg-primary-container text-primary dark:text-primary-fixed'
                      : 'text-on-surface-variant dark:text-on-surface-variant hover:text-primary dark:hover:text-primary-fixed'
                  }`}
                >
                  <Icon name={item.icon} filled={isActive} />
                  <span className="font-inter text-[11px] font-medium tracking-wide mt-1">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
    </RequireAuth>
  );
}

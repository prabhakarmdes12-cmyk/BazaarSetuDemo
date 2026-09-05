'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from './ui';
import ChitiBazaarLogo from './ChitiBazaarLogo';

interface TopNavProps {
  onMenuClick?: () => void;
  notificationCount?: number;
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  backHref?: string;
}

export default function TopNav({
  onMenuClick,
  notificationCount,
  title,
  subtitle,
  showBack = false,
  backHref,
}: TopNavProps) {
  const pathname = usePathname();
  const isVendor = pathname.startsWith('/vendor');

  return (
    <header className="glass-panel bg-surface/90 backdrop-blur-xl sticky top-0 z-50 shadow-top-bar border-b border-white/5">
      <div className="flex justify-between items-center w-full px-4 sm:px-6 py-3.5 max-w-7xl mx-auto gap-4">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          {showBack ? (
            <Link
              href={backHref || '#'}
              className="text-on-surface-variant hover:text-primary active:scale-95 transition-all duration-200"
            >
              <Icon name="arrow_back" />
            </Link>
          ) : (
            <button
              onClick={onMenuClick}
              aria-label="Open menu"
              className="text-primary active:scale-95 transition-transform duration-200"
            >
              <Icon name="menu" />
            </button>
          )}
          {title ? (
            <div className="flex flex-col min-w-0">
              <h1 className="font-headline font-bold text-base sm:text-lg tracking-tight text-on-surface truncate">
                {title}
              </h1>
              {subtitle && (
                <span className="text-[10px] italic font-medium text-on-surface-variant tracking-wider truncate">
                  {subtitle}
                </span>
              )}
            </div>
          ) : (
            <Link href="/customer" className="min-w-0">
              <ChitiBazaarLogo size={30} />
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* 10 Mins Delivery Speed Badge */}
          <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            <span className="text-xs font-bold text-primary whitespace-nowrap">⚡ 10 mins</span>
          </div>

          {/* Quick Experience Switcher */}
          {isVendor ? (
            <Link
              href="/customer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/15 border border-primary/30 text-primary text-xs font-black uppercase tracking-wider font-headline hover:bg-primary/25 active:scale-95 transition-all"
            >
              <Icon name="shopping_cart" size="sm" filled />
              <span className="hidden xs:inline">Customer Store</span>
            </Link>
          ) : (
            <Link
              href="/vendor"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-low border border-white/10 hover:border-primary/40 text-xs font-bold text-on-surface-variant hover:text-primary transition-all active:scale-95"
            >
              <Icon name="storefront" size="sm" />
              <span className="hidden xs:inline">Dukaan Partner</span>
            </Link>
          )}

          <Link
            href="/customer/notifications"
            aria-label="Notifications"
            className="relative p-2 rounded-full hover:bg-primary/10 transition-colors duration-150 text-on-surface-variant hover:text-primary"
          >
            <Icon name="notifications" />
            {notificationCount != null && notificationCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-error text-on-error text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}

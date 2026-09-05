'use client';

import React from 'react';
import Link from 'next/link';
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
  return (
    <header className="glass-panel bg-surface/85 backdrop-blur-xl sticky top-0 z-50 shadow-top-bar">
      <div className="flex justify-between items-center w-full px-6 py-3.5 max-w-7xl mx-auto gap-4">
        <div className="flex items-center gap-4 min-w-0">
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
              <h1 className="font-headline font-bold text-lg tracking-tight text-on-surface truncate">
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
          {/* Delivery speed badge — pulsing emerald status ring */}
          <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            <span className="text-xs font-bold text-primary whitespace-nowrap">⚡ 10 mins</span>
          </div>

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

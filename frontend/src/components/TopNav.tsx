'use client';

import React from 'react';
import Link from 'next/link';
import { Icon } from './ui';

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
    <header className="bg-surface-container-lowest/80 backdrop-blur-xl sticky top-0 z-50 shadow-top-bar">
      <div className="flex justify-between items-center w-full px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          {showBack ? (
            <Link
              href={backHref || '#'}
              className="text-on-surface-variant active:scale-95 transition-transform duration-200"
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
            <div className="flex flex-col">
              <h1 className="font-headline font-bold text-lg tracking-tight text-on-surface">
                {title}
              </h1>
              {subtitle && (
                <span className="text-[10px] italic font-medium text-on-surface-variant tracking-wider">
                  {subtitle}
                </span>
              )}
            </div>
          ) : (
            <div className="flex flex-col min-w-0">
              <span className="text-2xl font-black text-primary italic font-headline">
                BazaarSetu
              </span>
              <span className="text-[10px] italic font-medium text-on-surface-variant tracking-wider">
                &apos;Apni local dukaan, ab online&apos;
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/customer/notifications"
            aria-label="Notifications"
            className="relative p-2 rounded-full hover:bg-primary-fixed/50 transition-colors duration-150 text-primary"
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

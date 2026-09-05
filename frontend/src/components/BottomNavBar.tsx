'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from './ui';

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

interface BottomNavBarProps {
  items: NavItem[];
}

export default function BottomNavBar({ items }: BottomNavBarProps) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 pointer-events-none">
      <div className="max-w-7xl mx-auto px-4 pb-[calc(env(safe-area-inset-bottom,0px)+16px)] pt-2 flex justify-center">
        <div className="glass-panel pointer-events-auto flex items-center gap-1 rounded-[28px] px-3 py-2 shadow-bottom-nav">
          {items.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/customer' && item.href !== '/vendor' && item.href !== '/admin' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex flex-col items-center justify-center rounded-2xl px-4 py-2 active:scale-90 transition-all duration-200 ease-out ${
                  isActive
                    ? 'text-primary'
                    : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                {isActive && (
                  <span className="absolute inset-0 rounded-2xl bg-primary/12 shadow-leaf-glow" aria-hidden="true" />
                )}
                <span className="relative">
                  <Icon name={item.icon} filled={isActive} />
                </span>
                <span className="relative font-label text-[11px] font-semibold tracking-wide mt-0.5">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

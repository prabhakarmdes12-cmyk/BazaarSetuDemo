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
    <nav className="fixed bottom-0 left-0 w-full z-50 bg-surface-container-lowest/80 backdrop-blur-xl rounded-t-[24px] border-t border-outline-variant shadow-bottom-nav">
      <div className="flex justify-around items-center px-4 pb-6 pt-3 max-w-7xl mx-auto">
        {items.map((item) => {
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
  );
}

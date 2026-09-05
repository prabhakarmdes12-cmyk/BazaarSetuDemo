'use client';

import React from 'react';
import { Icon } from './ui';

interface AdminSideNavItem {
  icon: string;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

interface AdminSideNavProps {
  items: AdminSideNavItem[];
}

export default function AdminSideNav({ items }: AdminSideNavProps) {
  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-full w-20 flex-col items-center py-8 gap-10 bg-surface shadow-xl z-40 pt-24">
      {items.map((item) => (
        <button
          key={item.label}
          onClick={item.onClick}
          className={`p-3 rounded-2xl transition-all cursor-pointer ${
            item.isActive
              ? 'bg-primary-container text-on-primary-container shadow-lg'
              : 'text-on-surface-variant hover:bg-primary-container hover:text-primary'
          }`}
          aria-label={item.label}
        >
          <Icon name={item.icon} size="lg" filled={item.isActive} />
        </button>
      ))}
    </aside>
  );
}

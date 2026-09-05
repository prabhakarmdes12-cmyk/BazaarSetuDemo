'use client';

import React from 'react';
import { Icon, Input } from './ui';

interface SearchBarProps {
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearch?: () => void;
  placeholder?: string;
}

export default function SearchBar({
  value,
  onChange,
  onSearch,
  placeholder = 'Kya chahiye? (milk, bread...)',
}: SearchBarProps) {
  return (
    <section className="mb-8">
      <div className="relative group">
        <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
          <Icon name="search" className="text-on-surface-variant/60" />
        </div>
        <input
          className="w-full bg-surface-container-low border-none rounded-2xl py-5 pl-14 pr-6 text-on-surface focus:ring-2 focus:ring-primary/30 placeholder:text-on-surface-variant/50 transition-all shadow-sm"
          placeholder={placeholder}
          type="text"
          value={value}
          onChange={onChange}
          onKeyDown={(e) => { if (e.key === 'Enter' && onSearch) onSearch(); }}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <button
            onClick={onSearch}
            className="bg-primary-container text-on-primary-container px-4 py-2 rounded-lg font-bold text-sm active:scale-95 transition-transform"
          >
            Search
          </button>
        </div>
      </div>
    </section>
  );
}

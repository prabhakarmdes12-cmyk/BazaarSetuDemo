'use client';

import React from 'react';
import { Icon } from './ui';

interface CategoryFilterProps {
  categories: string[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  Sab: 'apps',
  Dairy: 'water_drop',
  Grains: 'grain',
  Oil: 'opacity',
  Snacks: 'cookie',
  Beverages: 'local_cafe',
  'Home Care': 'cleaning_services',
  'Personal Care': 'soap',
  Vegetables: 'grass',
  Fruits: 'nutrition',
};

export default function CategoryFilter({
  categories,
  activeCategory,
  onCategoryChange,
}: CategoryFilterProps) {
  return (
    <section className="mb-10 relative">
      <div className="pointer-events-none absolute left-0 top-0 bottom-4 w-6 bg-gradient-to-r from-surface to-transparent z-10 hidden xs:block" />
      <div className="pointer-events-none absolute right-0 top-0 bottom-4 w-6 bg-gradient-to-l from-surface to-transparent z-10 hidden xs:block" />

      <div className="flex overflow-x-auto gap-4 sm:gap-5 pb-4 no-scrollbar snap-x snap-mandatory px-1">
        {categories.map((category) => {
          const isActive = category === activeCategory;
          return (
            <button
              key={category}
              onClick={() => onCategoryChange(category)}
              className="flex flex-col items-center gap-2 shrink-0 snap-start active:scale-95 transition-transform duration-200"
            >
              <span
                className={`flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full transition-all duration-300 ease-out ${
                  isActive
                    ? 'leaf-gradient text-white shadow-brand-glow scale-105'
                    : 'bg-surface-container-low border border-white/10 text-on-surface-variant hover:border-primary/40 hover:text-primary hover:shadow-leaf-glow'
                }`}
              >
                <Icon name={CATEGORY_ICONS[category] || 'category'} size="lg" filled={isActive} />
              </span>
              <span
                className={`whitespace-nowrap text-[11px] sm:text-xs font-semibold transition-colors duration-200 font-headline ${
                  isActive ? 'text-primary' : 'text-on-surface-variant'
                }`}
              >
                {category}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

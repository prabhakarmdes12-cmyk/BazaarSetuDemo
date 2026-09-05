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
  Grocery: 'shopping_basket',
  'Daily use': 'home',
  Vegetables: 'grass',
  Fruits: 'nutrition',
  Dairy: 'water_drop',
};

export default function CategoryFilter({
  categories,
  activeCategory,
  onCategoryChange,
}: CategoryFilterProps) {
  return (
    <section className="mb-10">
      <div className="flex overflow-x-auto gap-5 pb-4 no-scrollbar">
        {categories.map((category) => {
          const isActive = category === activeCategory;
          return (
            <button
              key={category}
              onClick={() => onCategoryChange(category)}
              className="flex flex-col items-center gap-2 shrink-0 active:scale-95 transition-transform duration-200"
            >
              <span
                className={`flex items-center justify-center w-16 h-16 rounded-full transition-all duration-300 ease-out ${
                  isActive
                    ? 'leaf-gradient text-white shadow-brand-glow scale-105'
                    : 'bg-surface-container-low border border-outline-variant/40 text-on-surface-variant hover:border-primary/40 hover:text-primary hover:shadow-leaf-glow'
                }`}
              >
                <Icon name={CATEGORY_ICONS[category] || 'category'} size="lg" filled={isActive} />
              </span>
              <span
                className={`whitespace-nowrap text-xs font-semibold transition-colors duration-200 ${
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

'use client';

import React from 'react';

interface CategoryFilterProps {
  categories: string[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

export default function CategoryFilter({
  categories,
  activeCategory,
  onCategoryChange,
}: CategoryFilterProps) {
  return (
    <section className="mb-10">
      <div className="flex overflow-x-auto gap-3 pb-4 no-scrollbar">
        {categories.map((category) => {
          const isActive = category === activeCategory;
          return (
            <button
              key={category}
              onClick={() => onCategoryChange(category)}
              className={`whitespace-nowrap px-6 py-2.5 rounded-full font-semibold transition-all duration-200 ease-out active:scale-95 ${
                isActive
                  ? 'bg-primary-dark text-white shadow-md'
                  : 'bg-surface-container-lowest border border-outline-variant/30 text-on-surface-variant font-medium hover:bg-surface-container-low'
              }`}
            >
              {category}
            </button>
          );
        })}
      </div>
    </section>
  );
}

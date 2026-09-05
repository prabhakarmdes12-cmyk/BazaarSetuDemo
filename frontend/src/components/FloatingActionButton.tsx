'use client';

import React from 'react';
import Link from 'next/link';
import { Icon } from './ui';

interface FloatingActionButtonProps {
  icon?: string;
  count?: number;
  href?: string;
  onClick?: () => void;
}

export default function FloatingActionButton({
  icon = 'shopping_cart',
  count,
  href,
  onClick,
}: FloatingActionButtonProps) {
  const content = (
    <>
      <Icon name={icon} />
      {count != null && count > 0 && (
        <span className="absolute -top-1 -right-1 bg-error text-on-error text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </>
  );

  const className =
    'fixed bottom-28 right-6 w-14 h-14 bg-gradient-to-br from-primary to-primary-container text-white rounded-full shadow-saffron flex items-center justify-center z-40 active:scale-90 transition-transform duration-150 ease-out will-change-transform';

  if (href) {
    return (
      <Link href={href} className={className} aria-label="Shopping cart">
        {content}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={className} aria-label="Shopping cart">
      {content}
    </button>
  );
}

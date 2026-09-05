'use client';

import React, { useState } from 'react';
import { Icon } from './ui';

interface ChitiAssistantButtonProps {
  onClick?: () => void;
}

/**
 * Floating "Chiti Assistant" AI entry point — purely a UI affordance that sits
 * above the bottom dock. It does not implement any conversational logic itself;
 * shop-level chat still goes through the existing Shop Bot (ChatInterface +
 * /api/shop-bot) so no business logic changes. Tapping it, by default, simply
 * nudges the user toward the nearest shop's chat tab.
 */
export default function ChitiAssistantButton({ onClick }: ChitiAssistantButtonProps) {
  const [open, setOpen] = useState(false);

  const handleClick = () => {
    setOpen((v) => !v);
    onClick?.();
  };

  return (
    <div className="fixed bottom-48 right-6 z-40 flex flex-col items-end gap-2">
      {open && (
        <div className="glass-panel animate-slide-up rounded-2xl px-4 py-3 max-w-[220px] shadow-elevated">
          <p className="text-xs font-semibold text-on-surface">Chiti Assistant</p>
          <p className="text-[11px] text-on-surface-variant mt-0.5 leading-relaxed">
            Open any dukaan&apos;s chat to order with just your voice or text — try &quot;2kg aloo aur ek doodh&quot;.
          </p>
        </div>
      )}
      <button
        onClick={handleClick}
        aria-label="Chiti Assistant"
        className="pulse-ring-emerald relative flex items-center justify-center w-14 h-14 rounded-full leaf-gradient text-white shadow-brand-glow-lg active:scale-90 transition-transform duration-150 animate-float"
      >
        <Icon name="auto_awesome" filled />
      </button>
    </div>
  );
}

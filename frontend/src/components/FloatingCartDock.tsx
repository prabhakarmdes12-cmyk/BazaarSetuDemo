'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from './ui/Icon';

interface FloatingCartDockProps {
  count: number;
  total: number;
  onClick: () => void;
  label?: string;
  ctaLabel?: string;
  /** Lift above a `BottomNavBar` (default). Set false on pages without one. */
  offsetForNav?: boolean;
}

/**
 * Persistent bottom cart dock that springs in whenever the cart has items.
 * `[🛒 N items · ₹total] .......................... [View Cart →]`
 *
 * Layout note: pages rendered inside `AppShell` also show `BottomNavBar`,
 * which is `fixed bottom-0` and ~72px tall including the safe-area inset.
 * The dock therefore sits *above* the nav rather than at `bottom-4`, where it
 * was previously rendering underneath the primary conversion CTA. Pages
 * without a bottom nav pass `offsetForNav={false}` to sit low again.
 */
export default function FloatingCartDock({
  count,
  total,
  onClick,
  label = 'items',
  ctaLabel = 'View Cart',
  offsetForNav = true,
}: FloatingCartDockProps) {
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ y: 90, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 90, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 420, damping: 34 }}
          className="fixed left-0 right-0 z-40 px-4 pointer-events-none"
          style={{
            bottom: offsetForNav
              ? 'calc(env(safe-area-inset-bottom, 0px) + 88px)'
              : 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
          }}
        >
          <div className="max-w-2xl mx-auto pointer-events-auto">
            <button
              onClick={onClick}
              className="w-full leaf-gradient text-white rounded-2xl px-5 py-3.5 shadow-brand-glow-lg flex items-center justify-between border border-emerald-300/30 active:scale-[0.98] transition"
            >
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-black/25 flex items-center justify-center">
                  <Icon name="shopping_cart" filled size="md" className="text-white" />
                </span>
                <span className="text-left leading-tight">
                  <span className="block text-sm font-black font-headline tracking-tight tabular-nums">
                    {count} {count === 1 ? label.replace(/s$/, '') : label} · ₹{total}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-white/85 font-semibold">
                    <Icon name="bolt" size="sm" filled />
                    Delivery in 10 mins
                  </span>
                </span>
              </div>
              <span className="flex items-center gap-1 bg-white text-emerald-950 font-black px-4 py-2.5 rounded-xl text-xs uppercase tracking-wide font-headline">
                {ctaLabel}
                <Icon name="arrow_forward" size="sm" />
              </span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

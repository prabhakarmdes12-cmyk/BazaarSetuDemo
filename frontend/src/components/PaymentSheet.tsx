'use client';

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from './ui';
import { PAYMENT_OPTIONS, PaymentMethod } from '@/lib/payment';

interface PaymentSheetProps {
  open: boolean;
  onClose: () => void;
  amount: number;
  selected: PaymentMethod;
  onSelect: (method: PaymentMethod) => void;
  /** Confirm + place the order with the chosen method. */
  onConfirm: (method: PaymentMethod) => void;
  placing?: boolean;
  /** Narrow the list — mirrors the backend's pilot checkout allow-list. */
  available?: PaymentMethod[];
}

/**
 * Payment method bottom-sheet.
 *
 * UPI sits first because it is the default payment mental model in India, and
 * DIRECT_UPI settles straight to the shopkeeper's VPA with no gateway cut.
 * UDHAAR is a first-class tender rather than an afterthought — the khaata is
 * how a kirana actually serves its regulars, and the backend already models it.
 */
export default function PaymentSheet({
  open,
  onClose,
  amount,
  selected,
  onSelect,
  onConfirm,
  placing = false,
  available,
}: PaymentSheetProps) {
  const [choice, setChoice] = useState<PaymentMethod>(selected);

  useEffect(() => {
    if (open) setChoice(selected);
  }, [open, selected]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const options = available
    ? PAYMENT_OPTIONS.filter((o) => available.includes(o.method))
    : PAYMENT_OPTIONS;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={placing ? undefined : onClose}
            className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Payment method"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            className="fixed bottom-0 left-0 right-0 z-[61] max-h-[88vh] overflow-y-auto bg-surface-container rounded-t-3xl border-t border-white/10 shadow-elevated"
          >
            <div className="sticky top-0 bg-surface-container/95 backdrop-blur-md px-5 pt-3 pb-3 border-b border-white/5 z-10">
              <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-3" aria-hidden="true" />
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-headline font-black text-lg text-on-surface">Payment ka tareeka</h2>
                  <p className="text-[13px] text-on-surface-variant">
                    Dena hai{' '}
                    <span className="font-black text-on-surface tabular-nums">₹{amount}</span>
                  </p>
                </div>
                <button
                  onClick={onClose}
                  disabled={placing}
                  aria-label="Band karein"
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-white/5 transition disabled:opacity-40"
                >
                  <Icon name="close" />
                </button>
              </div>
            </div>

            <div className="px-5 pt-4 pb-3 space-y-2.5">
              {options.map((o) => {
                const active = choice === o.method;
                return (
                  <button
                    key={o.method}
                    onClick={() => {
                      setChoice(o.method);
                      onSelect(o.method);
                    }}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border text-left transition min-h-[44px] ${
                      active
                        ? 'border-primary/60 bg-primary/10'
                        : 'border-white/5 bg-surface-container-low hover:border-white/15'
                    }`}
                  >
                    <span
                      className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                        active ? 'bg-primary/20' : 'bg-surface-container-high'
                      }`}
                    >
                      <Icon
                        name={o.icon}
                        filled={active}
                        className={active ? 'text-primary' : 'text-on-surface-variant'}
                      />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-on-surface font-headline">{o.title}</span>
                        {o.tag && (
                          <span
                            className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
                              o.recommended
                                ? 'bg-primary/20 text-primary'
                                : 'bg-surface-container-high text-on-surface-variant'
                            }`}
                          >
                            {o.tag}
                          </span>
                        )}
                      </span>
                      <span className="block text-[13px] text-on-surface-variant leading-snug mt-0.5">
                        {o.subtitle}
                      </span>
                    </span>
                    <span
                      className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center ${
                        active ? 'border-primary bg-primary' : 'border-white/25'
                      }`}
                      aria-hidden="true"
                    >
                      {active && <Icon name="check" size="sm" className="text-white !text-[13px]" />}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="sticky bottom-0 bg-surface-container/95 backdrop-blur-md px-5 pt-3 pb-[calc(env(safe-area-inset-bottom,0px)+20px)] border-t border-white/5">
              <div className="flex items-center gap-1.5 justify-center mb-2.5 text-[11px] text-on-surface-variant">
                <Icon name="lock" size="sm" filled className="text-primary" />
                Aapki payment surakshit hai
              </div>
              <button
                onClick={() => onConfirm(choice)}
                disabled={placing}
                className="w-full py-4 rounded-xl leaf-gradient text-white font-black text-base shadow-brand-glow active:scale-[0.98] transition flex items-center justify-center gap-2 disabled:opacity-60 min-h-[44px]"
              >
                {placing ? (
                  <>
                    <Icon name="progress_activity" size="sm" className="animate-spin" />
                    Order ho raha hai…
                  </>
                ) : (
                  <>
                    ₹{amount} — Order pakka karein
                    <Icon name="arrow_forward" size="sm" />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

'use client';

import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from './ui';
import CatalogTile from './CatalogTile';
import type { CatalogProduct } from './BighiProductCard';

interface ProductDetailSheetProps {
  product: CatalogProduct | null;
  open: boolean;
  onClose: () => void;
  quantity: number;
  onAdd: (p: CatalogProduct) => void;
  onInc: (p: CatalogProduct) => void;
  onDec: (p: CatalogProduct) => void;
}

/**
 * Product detail as a BOTTOM SHEET, not a route.
 *
 * Blinkit and Zepto deliberately suppress full product pages so the one-tap
 * add path stays intact, and that is right for milk. It is not right for a
 * paracetamol strip, a meat cut or an infant formula, where the shopper needs
 * dosage, cut and age-band information before committing. A sheet gives that
 * detail without ever navigating away from the shelf.
 *
 * Category-specific advisories below are driven by categoryId so pharma, meat
 * and baby care each surface the disclosure that category actually requires.
 */

/** Parse "500 g pouch" / "1.25 L" / "6 pcs" into a comparable base unit. */
function unitEconomics(unit: string, price: number): string | null {
  const m = unit.match(/([\d.]+)\s*(kg|g|l|ml|pcs|pc)/i);
  if (!m) return null;
  const qty = parseFloat(m[1]);
  if (!Number.isFinite(qty) || qty <= 0) return null;
  const u = m[2].toLowerCase();

  if (u === 'kg') return `₹${Math.round(price / qty)}/kg`;
  if (u === 'g') return `₹${Math.round((price / qty) * 1000)}/kg`;
  if (u === 'l') return `₹${Math.round(price / qty)}/L`;
  if (u === 'ml') return `₹${Math.round((price / qty) * 1000)}/L`;
  if (u === 'pcs' || u === 'pc') return `₹${(price / qty).toFixed(1)}/piece`;
  return null;
}

/** Disclosures that a given category genuinely needs before purchase. */
function categoryAdvisory(categoryId?: string): { icon: string; title: string; body: string } | null {
  switch (categoryId) {
    case 'pharma':
      return {
        icon: 'medical_information',
        title: 'Dawa surakshit roop se lein',
        body: 'Sirf OTC dawaayein. Doctor ki parchi wali dawa hum nahi bechte. Dose lene se pehle packet par likhi jaankari zaroor padhein.',
      };
    case 'meat':
      return {
        icon: 'ac_unit',
        title: 'Taaza aur cold-chain mein',
        body: 'Roz subah kaata gaya. Cold chain mein delivery. Ghar pahunchte hi fridge mein rakhein aur 24 ghante mein pakayein.',
      };
    case 'baby':
      return {
        icon: 'child_care',
        title: 'Bachche ki umar dekh kar chunein',
        body: 'Packet par di gayi umar (age band) zaroor dekhein. Infant formula ke liye doctor ki salah lein.',
      };
    case 'frozen':
      return {
        icon: 'severe_cold',
        title: 'Frozen item',
        body: 'Delivery ke turant baad freezer mein rakhein. Ek baar pighalne ke baad dobara freeze na karein.',
      };
    case 'pooja':
      return {
        icon: 'local_fire_department',
        title: 'Pooja samagri',
        body: 'Shuddhata ka poora dhyan rakha gaya hai. Diya aur agarbatti jalate samay saavdhani rakhein.',
      };
    default:
      return null;
  }
}

export default function ProductDetailSheet({
  product,
  open,
  onClose,
  quantity,
  onAdd,
  onInc,
  onDec,
}: ProductDetailSheetProps) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!product) return null;

  const mrp = product.mrp;
  const off = mrp && mrp > product.price ? Math.round(((mrp - product.price) / mrp) * 100) : 0;
  const perUnit = unitEconomics(product.unit, product.price);
  const advisory = categoryAdvisory(product.categoryId);
  const saving = mrp && mrp > product.price ? mrp - product.price : 0;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={product.name}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            className="fixed bottom-0 left-0 right-0 z-[61] max-h-[90vh] overflow-y-auto bg-surface-container rounded-t-3xl border-t border-white/10 shadow-elevated"
          >
            <div className="sticky top-0 z-10 bg-surface-container/95 backdrop-blur-md pt-3 pb-2 px-5 flex items-start justify-between border-b border-white/5">
              <div className="w-10 h-1 rounded-full bg-white/20 absolute left-1/2 -translate-x-1/2 top-3" aria-hidden="true" />
              <span className="text-[11px] font-bold text-primary uppercase tracking-wide font-headline pt-3">
                {product.category || 'Grocery'}
              </span>
              <button
                onClick={onClose}
                aria-label="Band karein"
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-white/5 transition"
              >
                <Icon name="close" />
              </button>
            </div>

            <div className="px-5 pb-40 pt-3 max-w-2xl mx-auto">
              <div className="relative">
                <CatalogTile
                  image={product.image}
                  icon={product.icon}
                  from={product.from}
                  to={product.to}
                  name={product.name}
                  className="w-full aspect-square max-h-72 mx-auto"
                  iconClassName="text-6xl"
                />
                {off > 0 && (
                  <span className="absolute top-3 left-3 bg-warning text-[#1C1503] text-[13px] font-black px-2.5 py-1 rounded-lg shadow-md">
                    {off}% OFF
                  </span>
                )}
                <span className="absolute top-3 right-3 bg-black/70 backdrop-blur-md text-emerald-300 border border-emerald-500/20 text-[11px] font-extrabold px-2.5 py-1 rounded-lg flex items-center gap-1">
                  <Icon name="bolt" size="sm" filled />
                  10 min
                </span>
              </div>

              <h2 className="font-headline font-black text-xl text-on-surface leading-tight mt-4">
                {product.name}
              </h2>
              <p className="text-sm text-on-surface-variant mt-1">{product.unit}</p>

              <div className="flex items-end gap-3 mt-3 flex-wrap">
                <span className="text-3xl font-black text-on-surface font-headline tabular-nums">
                  ₹{product.price}
                </span>
                {mrp && mrp > product.price && (
                  <span className="text-base text-on-surface-variant/70 line-through tabular-nums mb-1">
                    ₹{mrp}
                  </span>
                )}
                {perUnit && (
                  <span className="mb-1.5 text-[13px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md tabular-nums">
                    {perUnit}
                  </span>
                )}
              </div>
              {saving > 0 && (
                <p className="text-[13px] text-primary font-semibold mt-1">
                  Aap ₹{saving} bacha rahe hain
                </p>
              )}

              {/* Trust strip */}
              <div className="grid grid-cols-3 gap-2 mt-5">
                {[
                  { icon: 'verified', label: 'Asli saamaan' },
                  { icon: 'bolt', label: '10 min delivery' },
                  { icon: 'currency_rupee', label: 'Poora daam saaf' },
                ].map((t) => (
                  <div
                    key={t.label}
                    className="flex flex-col items-center gap-1.5 bg-surface-container-low rounded-xl py-3 px-2 border border-white/5"
                  >
                    <Icon name={t.icon} size="sm" filled className="text-primary" />
                    <span className="text-[11px] font-semibold text-on-surface-variant text-center leading-tight">
                      {t.label}
                    </span>
                  </div>
                ))}
              </div>

              {advisory && (
                <div className="mt-5 flex gap-3 p-3.5 rounded-2xl bg-warning/[0.08] border border-warning/25">
                  <Icon name={advisory.icon} filled className="text-warning shrink-0" />
                  <div>
                    <p className="font-bold text-[13px] text-on-surface font-headline">{advisory.title}</p>
                    <p className="text-[13px] text-on-surface-variant leading-snug mt-0.5">{advisory.body}</p>
                  </div>
                </div>
              )}

              <div className="mt-5">
                <h3 className="font-bold text-sm text-on-surface font-headline mb-2">Jaankari</h3>
                <dl className="text-[13px] rounded-2xl overflow-hidden border border-white/5">
                  {[
                    ['Pack size', product.unit],
                    ['Category', product.category || '—'],
                    ['MRP', mrp ? `₹${mrp}` : '—'],
                    ['Aapka daam', `₹${product.price}`],
                    ...(perUnit ? [['Per unit', perUnit]] : []),
                  ].map(([k, v], i) => (
                    <div
                      key={k}
                      className={`flex justify-between gap-4 px-3.5 py-2.5 ${
                        i % 2 === 0 ? 'bg-surface-container-low' : 'bg-surface-container-lowest'
                      }`}
                    >
                      <dt className="text-on-surface-variant">{k}</dt>
                      <dd className="font-semibold text-on-surface text-right tabular-nums">{v}</dd>
                    </div>
                  ))}
                </dl>
                <p className="text-[11px] text-on-surface-variant/70 leading-snug mt-2.5">
                  Saaman ki jaankari packet par likhi jaankari se milaayein. Brand ke naam sirf pehchaan
                  ke liye hain.
                </p>
              </div>
            </div>

            {/* Sticky add bar */}
            <div className="fixed bottom-0 left-0 right-0 z-[62] bg-surface-container/95 backdrop-blur-xl border-t border-white/10 px-5 pt-3 pb-[calc(env(safe-area-inset-bottom,0px)+16px)]">
              <div className="max-w-2xl mx-auto flex items-center gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] text-on-surface-variant font-semibold uppercase tracking-wide">
                    Kul daam
                  </p>
                  <p className="text-xl font-black text-on-surface font-headline tabular-nums">
                    ₹{product.price * Math.max(1, quantity)}
                  </p>
                </div>
                {quantity > 0 ? (
                  <div className="flex-1 flex items-center justify-between leaf-gradient rounded-xl overflow-hidden">
                    <button
                      onClick={() => onDec(product)}
                      aria-label="Kam karein"
                      className="min-w-[52px] min-h-[52px] flex items-center justify-center text-white hover:bg-black/15 transition"
                    >
                      <Icon name="remove" />
                    </button>
                    <span className="text-white font-black text-lg tabular-nums font-headline">
                      {quantity}
                    </span>
                    <button
                      onClick={() => onInc(product)}
                      aria-label="Zyada karein"
                      className="min-w-[52px] min-h-[52px] flex items-center justify-center text-white hover:bg-black/15 transition"
                    >
                      <Icon name="add" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => onAdd(product)}
                    className="flex-1 min-h-[52px] leaf-gradient text-white font-black rounded-xl shadow-brand-glow active:scale-[0.98] transition flex items-center justify-center gap-2"
                  >
                    <Icon name="add_shopping_cart" size="sm" />
                    Cart mein daalein
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

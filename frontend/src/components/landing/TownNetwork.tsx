'use client';

import { useState } from 'react';

/**
 * Town Network section — Paaska's real scale story.
 *
 * Bighi Brothers is the anchor dukaan, but the value prop is the network:
 * every onboarded shop in Dhanbad becomes part of one shared shelf. A
 * shopper can order from any shop in their town — the largest combined
 * repository of products — and "scan" what's available in their ward.
 *
 * The interactive ward picker demonstrates exactly that: pick your area,
 * see its shops, product depth, delivery time, and sample in-stock items
 * with the shop that will pack them.
 */

type Ward = {
  name: string;
  shops: number;
  products: number;
  eta: number;
  items: Array<{ emoji: string; name: string; shop: string; eta: number }>;
};

const WARDS: Ward[] = [
  {
    name: 'Bank More',
    shops: 8,
    products: 5200,
    eta: 8,
    items: [
      { emoji: '🥛', name: 'Amul Taza Milk 500ml', shop: 'Bighi Brothers', eta: 8 },
      { emoji: '🍞', name: 'White Bread 400g', shop: 'Sharma Kirana', eta: 6 },
      { emoji: '🧅', name: 'Pyaaz 1kg (local)', shop: 'Verma Bhandar', eta: 7 },
    ],
  },
  {
    name: 'Madhupur',
    shops: 5,
    products: 3100,
    eta: 10,
    items: [
      { emoji: '🍜', name: 'Maggi 2 packet', shop: 'Gupta Stores', eta: 10 },
      { emoji: '🥔', name: 'Aloo 2kg', shop: 'Madhupur Kirana', eta: 9 },
      { emoji: '🧂', name: 'Toor daal 500g', shop: 'Gupta Stores', eta: 10 },
    ],
  },
  {
    name: 'Sardar Nagar',
    shops: 4,
    products: 2400,
    eta: 11,
    items: [
      { emoji: '🥚', name: 'Desi ande 1 dozen', shop: 'Nagrath Stores', eta: 11 },
      { emoji: '🌶️', name: 'Hari mirchi 100g', shop: 'Nagar Sabzi Stall', eta: 10 },
      { emoji: '🫙', name: 'Haldi powder 100g', shop: 'Nagrath Stores', eta: 11 },
    ],
  },
  {
    name: 'Kadma',
    shops: 2,
    products: 900,
    eta: 12,
    items: [
      { emoji: '🌾', name: 'Chakki ka aata 1kg', shop: 'Kadma Dukaan', eta: 12 },
      { emoji: '🧈', name: 'Makhan 200g', shop: 'Kadma Dukaan', eta: 12 },
      { emoji: '🍯', name: 'Shahad 500g', shop: 'Kadma Bhandar', eta: 14 },
    ],
  },
  {
    name: 'Bistupur',
    shops: 4,
    products: 1800,
    eta: 10,
    items: [
      { emoji: '☕', name: 'Chai patti 250g', shop: 'Bistupur Bhandar', eta: 10 },
      { emoji: '🍪', name: 'Biscuit assorted 400g', shop: 'Bistupur Bhandar', eta: 10 },
      { emoji: '🧴', name: 'Detergent 1kg', shop: 'Bistupur General', eta: 11 },
    ],
  },
];

const TOTAL_SHOPS = WARDS.reduce((s, w) => s + w.shops, 0); // 23
const TOTAL_PRODUCTS = WARDS.reduce((s, w) => s + w.products, 0); // 13,400 → "12,000+"

interface TownNetworkProps {
  onMerchantClick: () => void;
}

export default function TownNetwork({ onMerchantClick }: TownNetworkProps) {
  const [ward, setWard] = useState<Ward>(WARDS[0]);

  return (
    <section className="relative border-t border-[rgba(255,255,255,0.06)] py-14 sm:py-20">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-[1.05fr_1fr]">
        {/* Story + street visual */}
        <div className="land-rise min-w-0">
          <p className="land-mono text-[11px] font-bold uppercase tracking-[0.22em] text-[#22C55E]">
            City Network · Dhanbad
          </p>
          <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl">
            Bighi Brothers se shuru — <span className="leaf-text-gradient">ab poora shehar</span>
          </h2>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-[rgba(248,250,252,0.7)]">
            Jitni dukaan onboard hoti hai, utni badi aapki shelf ban jaati hai.{' '}
            <strong className="text-white">{TOTAL_SHOPS} dukaan = 12,000+ products</strong> ek app mein —
            jo paas ki dukaan mein hai, wahi 10 minute mein aapke ghar. Koi badi store ka dependency nahi,
            sirf apne shehar ki dukaani bharosa.
          </p>

          {/* Dusk street illustration with live shop pins */}
          <div className="relative mt-6">
            <div className="overflow-hidden rounded-3xl border border-[rgba(255,255,255,0.1)] shadow-[0_30px_80px_rgba(2,6,23,0.5)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/landing/street-dhanbad.jpg"
                alt="Dhanbad ki kirana street — dukaan, shoppers aur Paaska delivery scooter"
                className="h-52 w-full object-cover sm:h-64"
                loading="lazy"
              />
            </div>

            {/* Shop pins */}
            <div className="land-float absolute left-3 top-3 flex items-center gap-1.5 rounded-full border border-[rgba(34,197,94,0.4)] bg-[rgba(11,19,43,0.88)] px-3 py-1.5 backdrop-blur-sm">
              <span aria-hidden>🏪</span>
              <div className="leading-tight">
                <p className="text-[11px] font-bold text-white">Bighi Brothers</p>
                <p className="land-mono text-[9px] text-[#22C55E]">anchor dukaan</p>
              </div>
            </div>
            <div
              className="land-float absolute right-3 top-1/2 hidden items-center gap-1.5 rounded-full border border-[rgba(255,255,255,0.16)] bg-[rgba(11,19,43,0.88)] px-3 py-1.5 backdrop-blur-sm sm:flex"
              style={{ animationDelay: '1.4s' }}
            >
              <span aria-hidden>🛒</span>
              <p className="text-[11px] font-bold text-white">Sharma Kirana</p>
            </div>
            <div
              className="land-float absolute bottom-14 right-6 hidden items-center gap-1.5 rounded-full border border-[rgba(255,255,255,0.16)] bg-[rgba(11,19,43,0.88)] px-3 py-1.5 backdrop-blur-sm sm:flex"
              style={{ animationDelay: '2.6s' }}
            >
              <span aria-hidden>🪧</span>
              <p className="text-[11px] font-bold text-white">Verma Bhandar</p>
            </div>

            {/* Network stat badge */}
            <div className="absolute -bottom-4 left-4 rounded-2xl border border-[rgba(34,197,94,0.4)] bg-[#0B132B] px-4 py-2.5 shadow-[0_16px_40px_rgba(2,6,23,0.6)]">
              <p className="land-mono text-[11px] font-bold uppercase tracking-wider text-[#22C55E]">
                {TOTAL_SHOPS} dukaan online
              </p>
              <p className="text-[11px] font-semibold text-[rgba(248,250,252,0.7)]">
                12,000+ products · 5 wards · 10 min
              </p>
            </div>
          </div>
        </div>

        {/* Ward stock scan demo */}
        <div className="land-rise land-rise-2 min-w-0">
          <div className="land-card p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="land-mono text-[10.5px] font-bold uppercase tracking-[0.2em] text-[#22C55E]">
                  Town Stock Scan · Live Demo
                </p>
                <h3 className="mt-1.5 text-lg font-extrabold leading-tight">
                  Aapke area mein kya available hai
                </h3>
              </div>
              <span className="land-pill hidden !py-1 !text-[10px] sm:inline-flex">
                <span className="land-dot" aria-hidden /> Live
              </span>
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-[rgba(248,250,252,0.62)]">
              Ward chunein — us area ki dukaan, stock aur delivery time turant. Yahi cheez app mein har order
              se pehle hoti hai.
            </p>

            {/* Ward picker */}
            <div className="mt-4 flex flex-wrap gap-2">
              {WARDS.map((w) => (
                <button
                  key={w.name}
                  type="button"
                  onClick={() => setWard(w)}
                  aria-pressed={ward.name === w.name}
                  className={`land-chip !py-1.5 !text-[12px] ${
                    ward.name === w.name ? '!border-[rgba(34,197,94,0.55)] !bg-[rgba(34,197,94,0.14)]' : ''
                  }`}
                >
                  {w.name}
                </button>
              ))}
            </div>

            {/* Ward stats */}
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                [String(ward.shops), 'dukaan online'],
                [`${ward.products.toLocaleString('en-IN')}+`, 'products'],
                [`~${ward.eta} min`, 'delivery'],
              ].map(([num, label]) => (
                <div key={label} className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(11,19,43,0.5)] px-3 py-2.5 text-center">
                  <p className="land-mono text-[15px] font-bold text-white">{num}</p>
                  <p className="text-[10.5px] text-[rgba(248,250,252,0.6)]">{label}</p>
                </div>
              ))}
            </div>

            {/* In-stock items with shop routing */}
            <div className="mt-3 divide-y divide-[rgba(255,255,255,0.06)] rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(11,19,43,0.5)]">
              {ward.items.map((item) => (
                <div key={item.name} className="flex items-center gap-3 px-3.5 py-2.5">
                  <span className="text-lg" aria-hidden>
                    {item.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold">{item.name}</p>
                    <p className="land-mono text-[10px] text-[rgba(248,250,252,0.6)]">
                      {item.shop} · {item.eta} min
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-[rgba(34,197,94,0.14)] px-2 py-0.5 text-[10px] font-bold text-[#22C55E]">
                    In stock
                  </span>
                </div>
              ))}
            </div>

            {/* Merchant pull */}
            <button
              type="button"
              onClick={onMerchantClick}
              className="land-btn land-btn-ghost mt-4 w-full !whitespace-normal !py-3 text-center text-[13px]"
            >
              🏪 Dukaan owner? Network mein aayein →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

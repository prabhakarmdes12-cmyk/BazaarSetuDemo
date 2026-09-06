'use client';

import { useRouter } from 'next/navigation';
import VoiceParchiSandbox from '@/components/landing/VoiceParchiSandbox';
import MerchantOnboardBox from '@/components/landing/MerchantOnboardBox';
import type { LandingAudience } from '@/components/landing/LandingHeader';

/** Live Dhanbad order ticker — the "city is ordering right now" pulse. */
const TICKER_ORDERS = [
  '🥛 2 packet Amul milk · Bank More · 8 min',
  '🍞 White bread 400g · Madhupur · 10 min',
  '🧅 1kg pyaaz + haldi · Sardar Nagar · 9 min',
  '🍜 Maggi 2 packet · Bank More · 7 min',
  '🥔 2kg aloo · Kadma · 12 min',
  '🧂 Toor daal 500g · Bistupur · 10 min',
  '🥚 Desi ande 1 dozen · Sardar Nagar · 11 min',
  '☕ Chai patti 250g · Bistupur · 10 min',
];

function LiveTicker() {
  const items = [...TICKER_ORDERS, ...TICKER_ORDERS];
  return (
    <div className="land-ticker relative mt-10 border-y border-[rgba(255,255,255,0.06)] bg-[rgba(11,19,43,0.4)] py-2.5">
      <div className="land-ticker-track" aria-hidden>
        {items.map((o, i) => (
          <span key={i} className="land-mono flex shrink-0 items-center gap-2 px-5 text-[11px] text-[rgba(248,250,252,0.6)]">
            <span className="land-dot !h-1.5 !w-1.5" />
            {o}
          </span>
        ))}
      </div>
      <span className="sr-only">
        Haal ke Paaska orders: {TICKER_ORDERS.join(', ')}
      </span>
    </div>
  );
}

/** Floating fresh-product cards that give the hero its produce-counter feel. */
const FRESH_CARDS = [
  {
    img: '/images/landing/prod-doodh.jpg',
    alt: 'Taaza doodh packet',
    name: 'Taaza doodh',
    meta: 'Bank More · 8 min',
    cls: '-top-11 -right-4 z-20 w-28 rotate-2',
    delay: '0s',
  },
  {
    img: '/images/landing/prod-roti.jpg',
    alt: 'Garam buttered bread',
    name: 'Hot bread',
    meta: 'Madhupur · 7 min',
    cls: '-bottom-8 -right-2 z-20 w-28 rotate-[-2deg]',
    delay: '2.8s',
  },
];

function FreshFloats() {
  return (
    <div className="pointer-events-none absolute inset-0 hidden lg:block" aria-hidden>
      {FRESH_CARDS.map((c) => (
        <div
          key={c.name}
          className={`land-float absolute rounded-2xl border border-[rgba(255,255,255,0.12)] bg-[rgba(11,19,43,0.9)] p-2 shadow-[0_18px_50px_rgba(2,6,23,0.55)] backdrop-blur-sm ${c.cls}`}
          style={{ animationDelay: c.delay }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={c.img} alt="" className="h-16 w-16 rounded-xl object-cover" loading="lazy" />
          <p className="mt-1.5 text-[10.5px] font-bold leading-tight text-white">{c.name}</p>
          <p className="land-mono text-[8.5px] text-[#22C55E]">{c.meta}</p>
        </div>
      ))}
    </div>
  );
}

/** "Aaj taaza" strip — what the town's shops are serving right now. */
const FRESH_STRIP = [
  { img: '/images/landing/prod-doodh.jpg', alt: 'Taaza doodh', name: 'Doodh' },
  { img: '/images/landing/prod-sabzi.jpg', alt: 'Ghar ki sabzi', name: 'Sabzi' },
  { img: '/images/landing/prod-roti.jpg', alt: 'Fresh bread', name: 'Bread' },
];

function AajTaazaStrip() {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2.5">
      <span className="land-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#22C55E]">
        Aaj taaza
      </span>
      {FRESH_STRIP.map((f) => (
        <span
          key={f.name}
          className="flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] py-1 pl-1 pr-3"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={f.img} alt={f.alt} className="h-8 w-8 rounded-full object-cover" loading="lazy" />
          <span className="text-[12px] font-semibold text-[rgba(248,250,252,0.85)]">{f.name}</span>
        </span>
      ))}
      <span className="text-[11px] text-[rgba(248,250,252,0.6)]">shehar ki dukaan se</span>
    </div>
  );
}

interface LandingHeroProps {
  audience: LandingAudience;
  onOpenDownload: () => void;
}

/**
 * Audience-aware hero.
 *
 * Shopper: the prescriptive Dhanbad headline + the interactive Voice Parchi
 * Sandbox with dual CTAs. Merchant: the zero-commission headline + the
 * 60-second onboarding box with the four merchant metrics.
 */
export default function LandingHero({ audience, onOpenDownload }: LandingHeroProps) {
  const router = useRouter();

  if (audience === 'merchant') {
    return (
      <section className="land-hero-sky">
        <div className="land-grid-lines" aria-hidden />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.15fr_1fr] lg:items-center">
          <div className="land-rise min-w-0">
            <span className="land-pill mb-5">
              <span className="land-dot" aria-hidden /> Dhanbad ke kirana owners ke liye
            </span>
            <h1 className="text-[2.1rem] font-extrabold leading-[1.08] sm:text-5xl">
              Apni Kirana Dukaan Ko Banayein{' '}
              <span className="leaf-text-gradient">
                <span className="whitespace-nowrap">10-Minute</span> Superstore
              </span>
            </h1>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-[rgba(248,250,252,0.72)] sm:text-base">
              0% Commission. Seedha aapke UPI Soundbox par paisa. 60 second mein online aao aur poore Dhanbad mein
              becho.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {[
                ['0% Platform Fee', '✂️'],
                ['Direct UPI to Soundbox', '📟'],
                ['Digital Udhaar Khata', '📒'],
                ['Free Counter QR Standee', '🪧'],
              ].map(([label, icon]) => (
                <span key={label} className="land-chip !cursor-default">
                  <span aria-hidden>{icon}</span> {label}
                </span>
              ))}
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a href="#merchant-onboard" className="land-btn land-btn-leaf">
                🏪 60 Second Mein Shuru Karein
              </a>
              <button type="button" className="land-btn land-btn-ghost" onClick={onOpenDownload}>
                📲 Paaska Merchant App
              </button>
            </div>

            <div className="mt-6 flex items-center gap-5 text-[12px] text-[rgba(248,250,252,0.6)]">
              <span>
                <strong className="land-mono text-[15px] text-white">23</strong> dukaans live · Bank More
              </span>
              <span className="hidden h-4 w-px bg-[rgba(255,255,255,0.14)] sm:block" aria-hidden />
              <span>
                <strong className="land-mono text-[15px] text-white">₹11.4L</strong> is hafte aam dukanon tak
              </span>
            </div>
          </div>

          <div className="land-rise land-rise-2 min-w-0 scroll-mt-28" id="merchant-onboard">
            <MerchantOnboardBox />
          </div>
        </div>
        <LiveTicker />
      </section>
    );
  }

  return (
    <section className="land-hero-sky">
      <div className="land-grid-lines" aria-hidden />
      <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.15fr_1fr] lg:items-center">
        <div className="land-rise min-w-0">
          <span className="land-pill mb-5">
            <span className="land-dot" aria-hidden /> 10-Min Delivery · Dhanbad
          </span>
          <h1 className="text-[2.1rem] font-extrabold leading-[1.08] sm:text-5xl">
            Dhanbad Ki Apni Dukaan, <span className="leaf-text-gradient">Ab 10 Minute Mein</span> Aapke Ghar
          </h1>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-[rgba(248,250,252,0.72)] sm:text-base">
            Bighi Brothers aur aapke nazdeeki kirana store se taaza doodh, sabzi aur ration — bina kisi extra delivery
            charge ke.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button type="button" className="land-btn land-btn-leaf" onClick={() => router.push('/customer')}>
              ⚡ Order Online Now
            </button>
            <button type="button" className="land-btn land-btn-ghost" onClick={onOpenDownload}>
              📲 Install App (2 MB)
            </button>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-[rgba(248,250,252,0.6)]">
            <span>
              <strong className="land-mono text-[15px] text-white">10 min</strong> average delivery
            </span>
            <span className="hidden h-4 w-px bg-[rgba(255,255,255,0.14)] sm:block" aria-hidden />
            <span>
              <strong className="land-mono text-[15px] text-white">₹0</strong> delivery charge
            </span>
            <span className="hidden h-4 w-px bg-[rgba(255,255,255,0.14)] sm:block" aria-hidden />
            <span>
              <strong className="land-mono text-[15px] text-white">23</strong> dukaans · Bank More
            </span>
          </div>
        </div>

        <div className="land-rise land-rise-2 relative min-w-0">
          <FreshFloats />
          <VoiceParchiSandbox />
          <AajTaazaStrip />
        </div>
      </div>
      <LiveTicker />
    </section>
  );
}

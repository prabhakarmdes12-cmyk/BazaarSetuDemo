'use client';

import { useRouter } from 'next/navigation';
import VoiceParchiSandbox from '@/components/landing/VoiceParchiSandbox';
import MerchantOnboardBox from '@/components/landing/MerchantOnboardBox';
import type { LandingAudience } from '@/components/landing/LandingHeader';

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
          <div className="land-rise">
            <span className="land-pill mb-5">
              <span className="land-dot" aria-hidden /> Dhanbad ke kirana owners ke liye
            </span>
            <h1 className="text-[2.1rem] font-extrabold leading-[1.08] sm:text-5xl">
              Apni Kirana Dukaan Ko Banayein <span className="leaf-text-gradient">10-Minute Superstore</span>
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

            <div className="mt-6 flex items-center gap-5 text-[12px] text-[rgba(248,250,252,0.55)]">
              <span>
                <strong className="land-mono text-[15px] text-white">23</strong> dukaans live · Bank More
              </span>
              <span className="h-4 w-px bg-[rgba(255,255,255,0.14)]" aria-hidden />
              <span>
                <strong className="land-mono text-[15px] text-white">₹11.4L</strong> is hafte aam dukanon tak
              </span>
            </div>
          </div>

          <div className="land-rise land-rise-2" id="merchant-onboard">
            <MerchantOnboardBox />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="land-hero-sky">
      <div className="land-grid-lines" aria-hidden />
      <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.15fr_1fr] lg:items-center">
        <div className="land-rise">
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

          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-[rgba(248,250,252,0.55)]">
            <span>
              <strong className="land-mono text-[15px] text-white">10 min</strong> average delivery
            </span>
            <span className="h-4 w-px bg-[rgba(255,255,255,0.14)]" aria-hidden />
            <span>
              <strong className="land-mono text-[15px] text-white">₹0</strong> delivery charge
            </span>
            <span className="h-4 w-px bg-[rgba(255,255,255,0.14)]" aria-hidden />
            <span>
              <strong className="land-mono text-[15px] text-white">23</strong> dukaans · Bank More
            </span>
          </div>
        </div>

        <div className="land-rise land-rise-2">
          <VoiceParchiSandbox />
        </div>
      </div>
    </section>
  );
}

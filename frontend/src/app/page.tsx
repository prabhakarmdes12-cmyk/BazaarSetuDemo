'use client';

import { useCallback, useState } from 'react';
import '@/styles/landing.css';
import LandingHeader, { type LandingAudience } from '@/components/landing/LandingHeader';
import LandingHero from '@/components/landing/LandingHero';
import FeatureShowcase from '@/components/landing/FeatureShowcase';
import StandeePreview from '@/components/landing/StandeePreview';
import DownloadModal from '@/components/landing/DownloadModal';
import LandingFooter from '@/components/landing/LandingFooter';

/**
 * Paaska flagship landing — Dhanbad.
 *
 * Converts both audiences on one page: shoppers get the 10-minute promise
 * with the interactive Voice Parchi Sandbox; dukaan owners get the 0%-fee
 * story with a 60-second onboarding box. The PWA Download Modal (deferred
 * `beforeinstallprompt` on Android Chrome, 2-step coach on iOS, QR on
 * desktop) is reachable from the header and every hero CTA, and lives in
 * full at /download.
 */
export default function Home() {
  const [audience, setAudience] = useState<LandingAudience>('shopper');
  const [downloadOpen, setDownloadOpen] = useState(false);

  const openDownload = useCallback(() => setDownloadOpen(true), []);
  const closeDownload = useCallback(() => setDownloadOpen(false), []);

  return (
    <div className="land min-h-screen" id="top">
      <LandingHeader audience={audience} onAudienceChange={setAudience} onOpenDownload={openDownload} />

      <main>
        <LandingHero audience={audience} onOpenDownload={openDownload} />
        <FeatureShowcase />
        <StandeePreview />

        {/* Closing CTA band */}
        <section className="land-hero-sky border-t border-[rgba(255,255,255,0.06)]">
          <div className="land-grid-lines" aria-hidden />
          <div className="relative mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-20">
            <h2 className="land-rise text-3xl font-extrabold sm:text-4xl">
              {audience === 'merchant' ? (
                <>
                  Aaj raat tak, <span className="leaf-text-gradient">online dukaan</span>
                </>
              ) : (
                <>
                  Aaj ka agla order, <span className="leaf-text-gradient">10 minute mein</span>
                </>
              )}
            </h2>
            <p className="land-rise land-rise-1 mx-auto mt-3 max-w-md text-[14.5px] text-[rgba(248,250,252,0.66)]">
              {audience === 'merchant'
                ? '60 second ka onboarding, 0% commission, aur counter par aapka QR.'
                : 'Bighi Brothers aur aapke nazdeeki kirana se — bina kisi extra delivery charge ke.'}
            </p>
            <div className="land-rise land-rise-2 mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              {audience === 'merchant' ? (
                <>
                  <a href="#merchant-onboard" className="land-btn land-btn-leaf">
                    🏪 Apni Dukaan Register Karein
                  </a>
                  <button type="button" className="land-btn land-btn-ghost" onClick={openDownload}>
                    📲 Install App
                  </button>
                </>
              ) : (
                <>
                  <a href="/customer" className="land-btn land-btn-leaf">
                    ⚡ Order Online Now
                  </a>
                  <button type="button" className="land-btn land-btn-ghost" onClick={openDownload}>
                    📲 Install App (2 MB)
                  </button>
                </>
              )}
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
      <DownloadModal open={downloadOpen} onClose={closeDownload} />
    </div>
  );
}

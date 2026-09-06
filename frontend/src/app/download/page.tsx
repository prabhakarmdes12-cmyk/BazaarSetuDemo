import type { Metadata } from 'next';
import '@/styles/landing.css';
import ChitiBazaarLogo from '@/components/ChitiBazaarLogo';
import PwaInstallCoach from '@/components/landing/PwaInstallCoach';
import LandingFooter from '@/components/landing/LandingFooter';

export const metadata: Metadata = {
  title: 'Paaska App Install karein — 2 MB, app jaisa | Paaska Dhanbad',
  description:
    'Paaska PWA ko apne home screen par laayein: Android Chrome par 1-tap install, iPhone par 2-step, desktop par QR scan. 2 MB se kam, instant launch, voice orders.',
};

/**
 * PWA Download & Install Coach — the full-page version of the header modal.
 * Server component wrapper; the coach itself is a client component that
 * OS-detects and renders the Android / iOS / desktop path.
 */
export default function DownloadPage() {
  return (
    <div className="land min-h-screen bg-[#0B132B]">
      <header className="land-glass sticky top-0 z-40 !rounded-none !border-x-0 !border-t-0">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <ChitiBazaarLogo size={36} variant="full" />
          <a
            href="/"
            className="land-btn land-btn-ghost !px-4 !py-2.5 text-[13px]"
          >
            ← Wapas Home
          </a>
        </div>
      </header>

      <main className="land-hero-sky">
        <div className="land-grid-lines" aria-hidden />
        <div className="relative mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="land-rise mb-8 text-center">
            <p className="land-mono text-[11px] font-bold uppercase tracking-[0.22em] text-[#22C55E]">
              PWA Download &amp; Install Coach
            </p>
            <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">
              Paaska, <span className="leaf-text-gradient">app jaisa</span> — bina store download
            </h1>
            <p className="mx-auto mt-3 max-w-md text-[14px] text-[rgba(248,250,252,0.66)]">
              Neeche aapke phone ke liye sabse chhota raasta dikhaya gaya hai. 2 MB se kam — sirf ek home-screen icon.
            </p>
          </div>
          <div className="land-rise land-rise-2 land-glass p-6 sm:p-10">
            <PwaInstallCoach />
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}

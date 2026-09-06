'use client';

import { useMemo, useState } from 'react';
import { qrEncode, qrToSvgPath } from '@/lib/qr';
import { usePwaInstall, isStandalonePWA } from '@/hooks/usePwaInstall';

/**
 * PWA Download & Install Coach.
 *
 * OS-detects the visitor and renders the shortest path to a home-screen Paaska:
 *  • Android Chrome — 1-tap install via the deferred `beforeinstallprompt`.
 *  • iOS Safari     — 2-step graphic (Share ⎋ → Add to Home Screen ➕).
 *  • Desktop        — QR code pointing at the install URL (scan with a phone).
 */

const INSTALL_URL = 'https://paaska.app';

const BENEFITS: Array<{ icon: string; title: string; sub: string }> = [
  { icon: '⚡', title: 'Instant launch, < 2 MB', sub: 'Koi store download nahi — home-screen icon se seedha khulta hai.' },
  { icon: '📴', title: 'Offline ready', sub: 'Slow network par bhi aapki parchi queue mein rehti hai.' },
  { icon: '💾', title: 'Zero storage clutter', sub: 'Phone ka 2 MB nahi, bas ek quick-commerce habit.' },
  { icon: '🎙️', title: 'Instant voice orders', sub: 'Mic dabao, "2 packet Amul milk" bolo — cart ready.' },
];

function QrTile({ value, label }: { value: string; label: string }) {
  const matrix = useMemo(() => {
    try {
      return qrEncode(value);
    } catch {
      return null;
    }
  }, [value]);
  if (!matrix) return null;
  const path = qrToSvgPath(matrix);
  return (
    <div className="land-mono flex flex-col items-center gap-2">
      <div
        className="land-sheen relative overflow-hidden rounded-2xl bg-[#F8FAFC] p-3"
        style={{ boxShadow: '0 16px 40px rgba(2, 6, 23, 0.5)' }}
      >
        <svg
          viewBox={`0 0 ${matrix.size} ${matrix.size}`}
          width={148}
          height={148}
          shapeRendering="crispEdges"
          role="img"
          aria-label={label}
        >
          <path d={path} fill="#0B132B" />
        </svg>
      </div>
      <span className="text-[11px] tracking-wide text-[rgba(248,250,252,0.6)]">{label}</span>
    </div>
  );
}

function AndroidSteps({ onPrompt, canInstall }: { onPrompt: () => void; canInstall: boolean }) {
  return (
    <div className="flex flex-col items-center gap-5">
      <button type="button" className="land-btn land-btn-leaf w-full max-w-xs text-base" onClick={onPrompt}>
        📲 Install Paaska App
      </button>
      {!canInstall && (
        <p className="max-w-xs text-center text-xs leading-relaxed text-[rgba(248,250,252,0.6)]">
          1-tap sheet abhi available nahi hai — Chrome menu (⋮) → <span className="text-[#BBF7D0]">“Add to Home screen”</span>{' '}
          chunein. 2 MB se kam, 10 second.
        </p>
      )}
      <div className="land-card w-full max-w-sm p-4">
        <p className="text-xs leading-relaxed text-[rgba(248,250,252,0.7)]">
          <span className="land-mono text-[#22C55E]">Android Chrome</span> par Paaska ek proper app jaisa feel karta hai —
          full-screen, apna icon, aur voice parchi ke liye mic permission sirf ek baar.
        </p>
      </div>
    </div>
  );
}

function IosSteps() {
  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-4">
      {/* Step 1 — Share */}
      <div className="land-card w-full p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[rgba(255,255,255,0.07)] text-lg">
            ⎋
          </div>
          <div>
            <p className="text-sm font-semibold">Step 1 — Safari mein Share button dabayein</p>
            <p className="text-xs text-[rgba(248,250,252,0.6)]">Bottom bar ke square-arrow icon ⎋ par tap karein</p>
          </div>
        </div>
      </div>
      <div className="land-step-hint text-2xl text-[#22C55E]" aria-hidden>
        ↓
      </div>
      {/* Step 2 — Add to Home Screen */}
      <div className="land-card w-full p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[rgba(255,255,255,0.07)] text-lg">
            ➕
          </div>
          <div>
            <p className="text-sm font-semibold">Step 2 — “Add to Home Screen” chunein</p>
            <p className="text-xs text-[rgba(248,250,252,0.6)]">List mein neeche scroll → Add, aur Paaska ready</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PwaInstallCoach({ subheading = false }: { subheading?: boolean }) {
  const { os, canInstall, promptInstall } = usePwaInstall();
  const [notice, setNotice] = useState<string | null>(null);

  const handlePrompt = () => {
    void promptInstall().then((outcome) => {
      if (outcome === 'accepted') setNotice('🎉 Paaska install ho raha hai — home screen par milenge!');
      else if (outcome === 'dismissed') setNotice('Koi baat nahi — jab bhi dena ho, yahi button hai.');
    });
  };

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="land-mono text-[11px] font-bold uppercase tracking-[0.22em] text-[#22C55E]">
          {os === 'android' ? 'Android Chrome detected' : os === 'ios' ? 'iPhone / iPad Safari detected' : 'Desktop detected'}
        </p>
        <h3
          className={
            subheading
              ? 'text-base font-semibold text-[rgba(248,250,252,0.85)]'
              : 'text-xl font-extrabold sm:text-2xl'
          }
        >
          {os === 'ios'
            ? '2 step mein app jaisa Paaska'
            : os === 'android'
              ? '1 tap mein Paaska, app jaisa'
              : 'Phone se scan karo, app jaisa Paaska'}
        </h3>
      </div>

      {isStandalonePWA() ? (
        <div className="land-card w-full max-w-sm p-5 text-center">
          <p className="text-sm font-semibold">Aap Paaska app ke andar hain ✅</p>
          <p className="mt-1 text-xs text-[rgba(248,250,252,0.6)]">Home screen par aapka Paaska icon pehle se hai.</p>
        </div>
      ) : os === 'android' ? (
        <AndroidSteps onPrompt={handlePrompt} canInstall={canInstall} />
      ) : os === 'ios' ? (
        <IosSteps />
      ) : (
        <div className="flex flex-col items-center gap-3">
          <QrTile value={INSTALL_URL} label={`Scan karein · ${INSTALL_URL}`} />
          <p className="max-w-xs text-center text-xs leading-relaxed text-[rgba(248,250,252,0.6)]">
            Phone ki camera se scan karein — Android par 1-tap install, iPhone par 2-step.
          </p>
        </div>
      )}

      {notice && (
        <p className="land-pop max-w-xs text-center text-sm font-semibold text-[#BBF7D0]">{notice}</p>
      )}

      {/* Benefits */}
      <div className="grid w-full max-w-md grid-cols-1 gap-2.5 sm:grid-cols-2">
        {BENEFITS.map((b) => (
          <div key={b.title} className="land-card flex items-start gap-2.5 p-3.5">
            <span className="text-lg" aria-hidden>
              {b.icon}
            </span>
            <div>
              <p className="text-[13px] font-bold leading-tight">{b.title}</p>
              <p className="mt-0.5 text-[11.5px] leading-snug text-[rgba(248,250,252,0.6)]">{b.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

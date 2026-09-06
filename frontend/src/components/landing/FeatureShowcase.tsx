'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import ChitiConnectVisualizer from '@/components/ChitiConnectVisualizer';

/**
 * Feature Showcase — the three proofs behind the promise:
 *  1. 10-Min Hyperlocal Radar (Bighi Brothers Mart, Bank More radius).
 *  2. Chiti Connect encrypted 1-tap WebRTC call demo [📞 Call Dukaan].
 *  3. Digital Udhaar Khata explanation.
 */

type CallState = 'idle' | 'ringing' | 'live' | 'ended';

function CallDemo() {
  const [state, setState] = useState<CallState>('idle');
  const [seconds, setSeconds] = useState(0);
  const timersRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const startCall = () => {
    if (state === 'ringing' || state === 'live') return;
    clearTimers();
    setSeconds(0);
    setState('ringing');
    // IDLE → RINGING 2.2s → LIVE ~6s → ENDED (demo invite INV_002).
    timersRef.current.push(setTimeout(() => setState('live'), 2200));
    timersRef.current.push(setTimeout(() => setSeconds(3), 3200));
    timersRef.current.push(setTimeout(() => setSeconds(6), 5800));
    timersRef.current.push(setTimeout(() => setState('ended'), 8600));
    timersRef.current.push(setTimeout(() => setState('idle'), 12400));
  };

  const statusLine =
    state === 'idle'
      ? 'Ek tap — dukaan se seedha voice, bina number jhooke.'
      : state === 'ringing'
        ? 'Bighi Brothers ko dial ho raha hai…'
        : state === 'live'
          ? `Line live · ${seconds}s · E2E encrypted`
          : 'Call khatam · INV_002 · transcript aapke order se jud gayi';

  return (
    <div className="land-card flex h-full flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="land-mono text-[10.5px] font-bold uppercase tracking-[0.2em] text-[#22C55E]">Chiti Connect</p>
          <h3 className="mt-1.5 text-lg font-extrabold leading-tight">Dukaan se 1-tap Voice Call</h3>
        </div>
        <span
          className={`land-pill !py-1 !text-[10px] ${
            state === 'live' ? '' : '!border-[rgba(255,255,255,0.16)] !bg-transparent text-[rgba(248,250,252,0.6)]'
          }`}
        >
          {state === 'live' ? (
            <span className="land-dot" aria-hidden />
          ) : (
            <span className="h-1.5 w-1.5 rounded-full bg-[rgba(255,255,255,0.3)]" aria-hidden />
          )}
          {state === 'live' ? 'LIVE · WebRTC' : 'WebRTC P2P'}
        </span>
      </div>

      <p className="mt-2 text-[13px] leading-relaxed text-[rgba(248,250,252,0.62)]">
        “Bhaiya, 2 packet Amul milk ho gayi na?” — number reveal nahi, call log nahi. Sirf aap aur dukaan.
      </p>

      <div className="mt-4 flex items-center gap-4">
        <button
          type="button"
          onClick={startCall}
          disabled={state === 'ringing' || state === 'live'}
          aria-label={state === 'live' ? 'Call live — demo chal raha hai' : 'Call Dukaan demo'}
          className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-2xl transition-transform hover:scale-105 active:scale-95 disabled:cursor-not-allowed ${
            state === 'live'
              ? 'land-mic-live bg-[#1F2937]'
              : state === 'ringing'
                ? 'land-mic-idle land-btn-leaf !p-0 opacity-60'
                : 'land-mic-idle land-btn-leaf !p-0'
          }`}
        >
          <span
            className={`inline-block transition-transform duration-300 ${
              state === 'ringing' ? 'land-ring-shake' : ''
            } ${state === 'live' ? 'rotate-[135deg]' : ''}`}
            aria-hidden
          >
            📞
          </span>
        </button>
        <div className="min-w-0 flex-1">
          <ChitiConnectVisualizer
            bars={21}
            height={40}
            active={state !== 'idle'}
            tone={state === 'ringing' ? 'ringing' : state === 'live' ? 'live' : state === 'ended' ? 'ended' : 'idle'}
            amplitude={state === 'live' ? 0.5 : 0}
            label="Chiti Connect call waveform"
          />
          <p className="land-mono mt-2 text-[11px] leading-snug text-[rgba(248,250,252,0.6)]" aria-live="polite">
            {statusLine}
          </p>
        </div>
      </div>

      <div className="mt-auto pt-4">
        <div className="flex flex-wrap gap-1.5">
          {['🔒 end-to-end encrypted', '📵 bina phone number', '🧾 order ke saath transcript'].map((t) => (
            <span key={t} className="rounded-full border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] px-2.5 py-1 text-[10.5px] font-semibold text-[rgba(248,250,252,0.65)]">
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function RadarMap() {
  return (
    <div className="land-card flex h-full flex-col p-5">
      <p className="land-mono text-[10.5px] font-bold uppercase tracking-[0.2em] text-[#22C55E]">Hyperlocal Radar</p>
      <h3 className="mt-1.5 text-lg font-extrabold leading-tight">Bank More se 10-Minute Radius</h3>
      <p className="mt-2 text-[13px] leading-relaxed text-[rgba(248,250,252,0.62)]">
        Har order sirf aapke aas-paas ki dukaanon se banta hai — Bighi Brothers Mart ke gharon tak, chawk par
        ruk-ruk kar nahi.
      </p>

      <div className="relative mx-auto mt-4 flex h-52 w-full max-w-xs items-center justify-center">
        {/* Radius rings */}
        <div className="absolute h-48 w-48 rounded-full border border-[rgba(34,197,94,0.3)]" aria-hidden />
        <div className="absolute h-32 w-32 rounded-full border border-[rgba(34,197,94,0.4)]" aria-hidden />
        <div className="absolute h-48 w-48" aria-hidden>
          <span className="land-radar-ring" />
          <span className="land-radar-ring" />
          <span className="land-radar-ring" />
        </div>

        {/* You */}
        <div className="relative z-10 flex flex-col items-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0B132B] text-xl shadow-lg ring-2 ring-[#22C55E]">
            🏠
          </span>
          <span className="land-mono mt-1.5 text-[9.5px] font-bold uppercase tracking-wider text-[#22C55E]">You</span>
        </div>

        {/* Bighi Brothers Mart */}
        <div className="land-float absolute right-1 top-2 z-10 flex items-center gap-1.5 rounded-full border border-[rgba(255,255,255,0.14)] bg-[rgba(28,37,65,0.9)] px-2.5 py-1.5">
          <span aria-hidden>🏪</span>
          <div className="leading-tight">
            <p className="text-[10px] font-bold">Bighi Brothers</p>
            <p className="land-mono text-[8.5px] text-[rgba(248,250,252,0.6)]">2.1 km · ~8 min</p>
          </div>
        </div>

        {/* Nearby dukaan */}
        <div className="land-float absolute bottom-4 left-0 z-10 flex items-center gap-1.5 rounded-full border border-[rgba(255,255,255,0.14)] bg-[rgba(28,37,65,0.9)] px-2.5 py-1.5" style={{ animationDelay: '1.2s' }}>
          <span aria-hidden>🛒</span>
          <div className="leading-tight">
            <p className="text-[10px] font-bold">Nazdeeki Kirana</p>
            <p className="land-mono text-[8.5px] text-[rgba(248,250,252,0.6)]">0.8 km · ~5 min</p>
          </div>
        </div>
      </div>

      <p className="land-mono mt-1 text-center text-[10.5px] text-[rgba(248,250,252,0.6)]">
        23 dukaans active · Dhanbad 826001
      </p>
    </div>
  );
}

function UdhaarKhata() {
  return (
    <div className="land-card flex h-full flex-col p-5">
      <p className="land-mono text-[10.5px] font-bold uppercase tracking-[0.2em] text-[#22C55E]">Digital Udhaar Khata</p>
      <h3 className="mt-1.5 text-lg font-extrabold leading-tight">Sahi Yaad, Bina Jhagde</h3>
      <p className="mt-2 text-[13px] leading-relaxed text-[rgba(248,250,252,0.62)]">
        Purani khata kitab ab phone mein — dukaan ko pata kya chaya, aapko pata kab dena hai. Transparent, respect ke
        saath.
      </p>

      <div className="mt-4 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(11,19,43,0.5)] p-3.5">
        <div className="flex items-center justify-between text-[11px] text-[rgba(248,250,252,0.6)]">
          <span className="land-mono font-bold uppercase tracking-wider">Khata · Sharma Ji</span>
          <span className="land-mono">is mahine</span>
        </div>
        <div className="mt-2 space-y-1.5">
          {[
            ['Doodh + bread', '12:41', '₹73'],
            ['1kg Pyaaz + namak', '19:03', '₹66'],
            ['Toor daal 500g', '20:55', '₹82'],
          ].map(([item, time, amt]) => (
            <div key={item} className="flex items-center justify-between gap-2 text-[12px]">
              <span className="truncate text-[rgba(248,250,252,0.8)]">{item}</span>
              <span className="land-mono shrink-0 text-[rgba(248,250,252,0.6)]">{time}</span>
              <span className="land-mono shrink-0 font-bold text-[#BBF7D0]">{amt}</span>
            </div>
          ))}
        </div>
        <div className="mt-2.5 flex items-center justify-between border-t border-[rgba(255,255,255,0.08)] pt-2.5">
          <span className="text-[12px] font-semibold text-[rgba(248,250,252,0.7)]">Kul udhaar</span>
          <span className="land-mono text-sm font-bold text-white">₹221</span>
        </div>
      </div>

      <p className="mt-auto pt-3 text-[11px] leading-relaxed text-[rgba(248,250,252,0.6)]">
        Dukaan ki taraf se bhi ek hi raqam dikhti hai — do taraf, ek sach.
      </p>
    </div>
  );
}

export default function FeatureShowcase() {
  return (
    <section className="relative py-14 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="land-rise mb-10 max-w-2xl">
          <p className="land-mono text-[11px] font-bold uppercase tracking-[0.22em] text-[#22C55E]">Paaska kya hai</p>
          <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl">
            Quick-commerce ki speed, <span className="leaf-text-gradient">apni dukaan ki bharosa</span>
          </h2>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          <div className="land-rise land-rise-1">
            <RadarMap />
          </div>
          <div className="land-rise land-rise-2">
            <CallDemo />
          </div>
          <div className="land-rise land-rise-3">
            <UdhaarKhata />
          </div>
        </div>
      </div>
    </section>
  );
}

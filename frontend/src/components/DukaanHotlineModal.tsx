'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from './ui';
import ChitiConnectVisualizer from './ChitiConnectVisualizer';
import type { ChitiCallStatus, ChitiCallTransport } from '@/hooks/useChitiConnectCall';

interface DukaanHotlineModalProps {
  open: boolean;
  onClose: () => void;
  status: ChitiCallStatus;
  callerName: string;
  shopName: string;
  shopLocality?: string;
  liveAt?: Date | null;
  isMuted?: boolean;
  isSpeakerOn?: boolean;
  transport?: ChitiCallTransport;
  localStream?: MediaStream | null;
  remoteStream?: MediaStream | null;
  onToggleMute?: () => void;
  onToggleSpeaker?: () => void;
  onHangUp: () => void;
}

const STATUS_COPY: Record<ChitiCallStatus, { label: string; hint: string }> = {
  IDLE: { label: 'READY', hint: 'Dukaan se baat karne ke liye tayyar' },
  RINGING: { label: 'RINGING', hint: 'Dukaandaar ko ghanti ja rahi hai…' },
  LIVE: { label: 'CONNECTED', hint: 'Encrypted call chalu hai' },
  ENDED: { label: 'ENDED', hint: 'Call khatam ho gayi' },
  NO_ANSWER: { label: 'ENDED', hint: 'Dukaandaar ne call nahi uthayi' },
};

const TRANSPORT_COPY: Record<ChitiCallTransport, string> = {
  WEBRTC_P2P: 'Peer-to-peer · DTLS/SRTP encrypted',
  WEBRTC_RELAY: 'Secure relay · DTLS/SRTP encrypted',
  MASKED_VOIP_FALLBACK: 'Masked VoIP routing',
  UNKNOWN: 'Secure channel',
};

function formatDuration(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Chiti Connect — the live dukaan hotline.
 *
 * Blinkit hides the store behind a support-ticket bot. Paaska does the opposite:
 * one tap and the shopper is talking to the human who is packing their order.
 *
 * Privacy (VOICE_INV_007 / DPDP 2023): this surface deliberately renders names
 * and locality only. No mobile number for either party is passed in, held in
 * state, or displayed — the call is addressed by conversation id alone.
 */
export default function DukaanHotlineModal({
  open,
  onClose,
  status,
  callerName,
  shopName,
  shopLocality,
  liveAt,
  isMuted = false,
  isSpeakerOn = false,
  transport = 'UNKNOWN',
  localStream = null,
  remoteStream = null,
  onToggleMute,
  onToggleSpeaker,
  onHangUp,
}: DukaanHotlineModalProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (status !== 'LIVE' || !liveAt) {
      setElapsed(0);
      return;
    }
    const tick = () => setElapsed(Math.max(0, Math.floor((Date.now() - liveAt.getTime()) / 1000)));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [status, liveAt]);

  // The call ending should dismiss the sheet without the shopper hunting for X.
  useEffect(() => {
    if (!open) return;
    if (status === 'ENDED' || status === 'NO_ANSWER') {
      const timer = setTimeout(onClose, 1600);
      return () => clearTimeout(timer);
    }
  }, [open, status, onClose]);

  const tone = useMemo(() => {
    if (status === 'LIVE') return 'live' as const;
    if (status === 'RINGING') return 'ringing' as const;
    if (status === 'ENDED' || status === 'NO_ANSWER') return 'ended' as const;
    return 'idle' as const;
  }, [status]);

  const copy = STATUS_COPY[status];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="hotline-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[95] bg-black/85 backdrop-blur-md"
          />

          <motion.div
            key="hotline-sheet"
            role="dialog"
            aria-modal="true"
            aria-label={`Chiti Connect call with ${shopName}`}
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.96 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 sm:inset-0 sm:m-auto sm:h-fit sm:max-w-md z-[100] rounded-t-3xl sm:rounded-3xl glass-panel bg-surface-container-lowest/95 border border-primary/25 shadow-editorial-xl overflow-hidden"
          >
            <div className="relative px-6 pt-6 pb-7">
              {/* Ambient leaf glow behind the call head */}
              <div className="absolute inset-x-0 top-0 h-40 leaf-ambient-glow pointer-events-none" />

              <div className="relative">
                {/* Status chip */}
                <div className="flex items-center justify-between gap-3">
                  <div
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
                      status === 'LIVE'
                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/30'
                        : status === 'RINGING'
                          ? 'bg-warning-container text-on-warning-container border border-warning/30'
                          : 'bg-surface-container-high text-on-surface-variant border border-white/10'
                    }`}
                  >
                    {status === 'LIVE' && (
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      </span>
                    )}
                    {copy.label}
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                    <Icon name="lock" size="sm" />
                    Chiti Connect
                  </span>
                </div>

                {/* Callee identity — name + locality ONLY, never a number */}
                <div className="mt-6 flex flex-col items-center text-center">
                  <div className="relative">
                    <div
                      className={`w-24 h-24 rounded-3xl leaf-gradient flex items-center justify-center shadow-brand-glow-lg ${
                        status === 'RINGING' ? 'animate-pulse' : ''
                      }`}
                    >
                      <Icon name="storefront" filled size="xl" className="text-white" />
                    </div>
                    {status === 'RINGING' && (
                      <span className="absolute inset-0 rounded-3xl border-2 border-emerald-300/50 animate-pulse-ring-slow pointer-events-none" />
                    )}
                  </div>

                  <h2 className="mt-5 font-headline font-black text-2xl leading-tight text-on-surface">
                    {shopName}
                  </h2>
                  {shopLocality && (
                    <p className="mt-0.5 text-xs font-semibold text-on-surface-variant flex items-center gap-1">
                      <Icon name="location_on" size="sm" />
                      {shopLocality}
                    </p>
                  )}

                  <p className="mt-3 text-xs font-medium text-on-surface-variant">
                    {status === 'LIVE' ? (
                      <span className="font-mono text-lg font-black text-emerald-300 tabular-nums">
                        {formatDuration(elapsed)}
                      </span>
                    ) : (
                      copy.hint
                    )}
                  </p>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant/70">
                    {callerName} · {TRANSPORT_COPY[transport]}
                  </p>
                </div>

                {/* Waveform */}
                <div className="mt-7 rounded-2xl bg-surface-container/60 border border-white/5 px-4 py-5">
                  <ChitiConnectVisualizer
                    stream={status === 'LIVE' ? remoteStream || localStream : null}
                    active={status === 'LIVE' || status === 'RINGING'}
                    tone={tone}
                    height={68}
                    label="Chiti Connect call audio"
                  />
                </div>

                {/* Privacy assurance — the actual moat, said out loud */}
                <p className="mt-4 text-center text-[10px] leading-relaxed text-on-surface-variant/70 px-2">
                  Aapka aur dukaandaar ka mobile number dono ek doosre ko nahi dikhta. Call
                  end-to-end encrypted hai.
                </p>

                {/* Controls */}
                <div className="mt-6 flex items-center justify-center gap-5">
                  <button
                    onClick={onToggleMute}
                    disabled={status !== 'LIVE'}
                    aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
                    aria-pressed={isMuted}
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center active:scale-90 transition disabled:opacity-40 ${
                      isMuted
                        ? 'bg-white text-emerald-950'
                        : 'bg-surface-container-high text-on-surface hover:text-primary border border-white/5'
                    }`}
                  >
                    <Icon name={isMuted ? 'mic_off' : 'mic'} filled={isMuted} />
                  </button>

                  <button
                    onClick={onHangUp}
                    aria-label="End call"
                    className="w-20 h-20 rounded-full bg-error text-white flex items-center justify-center shadow-editorial-lg active:scale-90 transition hover:brightness-110"
                  >
                    <Icon name="call_end" filled size="lg" />
                  </button>

                  <button
                    onClick={onToggleSpeaker}
                    disabled={status !== 'LIVE'}
                    aria-label={isSpeakerOn ? 'Turn speaker off' : 'Turn speaker on'}
                    aria-pressed={isSpeakerOn}
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center active:scale-90 transition disabled:opacity-40 ${
                      isSpeakerOn
                        ? 'leaf-gradient text-white shadow-brand-glow'
                        : 'bg-surface-container-high text-on-surface hover:text-primary border border-white/5'
                    }`}
                  >
                    <Icon name={isSpeakerOn ? 'volume_up' : 'volume_down'} filled={isSpeakerOn} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

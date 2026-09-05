'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';

export type VisualizerTone = 'live' | 'ringing' | 'idle' | 'ended';

interface ChitiConnectVisualizerProps {
  /** Live 0..1 amplitude. When omitted the bars idle on a synthetic breath. */
  amplitude?: number;
  /** Live audio stream to meter directly (takes priority over `amplitude`). */
  stream?: MediaStream | null;
  active?: boolean;
  tone?: VisualizerTone;
  bars?: number;
  className?: string;
  /** Bar container height in px. */
  height?: number;
  label?: string;
}

const DEFAULT_BARS = 21;

/**
 * Chiti Connect 21-bar audio visualizer.
 *
 * Ported from the Cosmic Tantra wave meter and re-skinned in Paaska's leaf-green
 * gradient (`from-emerald-600 via-teal-400 to-emerald-200`) over obsidian. The
 * centre bars react hardest so the wave reads as a voice, not a equaliser: an
 * envelope weights each bar by its distance from the middle.
 */
export default function ChitiConnectVisualizer({
  amplitude = 0,
  stream = null,
  active = true,
  tone = 'live',
  bars = DEFAULT_BARS,
  className = '',
  height = 64,
  label,
}: ChitiConnectVisualizerProps) {
  const [levels, setLevels] = useState<number[]>(() => new Array(bars).fill(0.12));
  const rafRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const phaseRef = useRef(0);

  // Bars nearest the centre swing widest — a voice envelope, not a spectrum.
  const envelope = useMemo(() => {
    const mid = (bars - 1) / 2;
    return Array.from({ length: bars }, (_, i) => {
      const distance = Math.abs(i - mid) / mid;
      return 0.35 + 0.65 * Math.cos((distance * Math.PI) / 2) ** 1.5;
    });
  }, [bars]);

  // Meter a live MediaStream when one is supplied (the real in-call path).
  useEffect(() => {
    if (!stream || !active) return;
    const Ctx: typeof AudioContext | undefined =
      typeof window !== 'undefined'
        ? window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
        : undefined;
    if (!Ctx) return;

    let cancelled = false;
    try {
      const context = new Ctx();
      const source = context.createMediaStreamSource(stream);
      const analyser = context.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.7;
      source.connect(analyser);
      contextRef.current = context;
      analyserRef.current = analyser;
    } catch {
      return;
    }

    return () => {
      cancelled = true;
      analyserRef.current = null;
      const context = contextRef.current;
      contextRef.current = null;
      if (context && context.state !== 'closed') void context.close().catch(() => undefined);
      if (cancelled && rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [stream, active]);

  useEffect(() => {
    if (!active) {
      setLevels(new Array(bars).fill(0.08));
      return;
    }

    const buffer = new Uint8Array(128);
    const tick = () => {
      phaseRef.current += 0.09;

      let energy = amplitude;
      const analyser = analyserRef.current;
      if (analyser) {
        analyser.getByteTimeDomainData(buffer);
        let sum = 0;
        for (let i = 0; i < buffer.length; i += 1) {
          const centered = (buffer[i] - 128) / 128;
          sum += centered * centered;
        }
        energy = Math.min(1, Math.sqrt(sum / buffer.length) * 3.2);
      }

      // While ringing there is no far-end audio yet, so breathe a calm pulse
      // instead of flatlining — the shopper needs to see the line is alive.
      const floor = tone === 'ringing' ? 0.18 + 0.12 * Math.sin(phaseRef.current * 1.4) : 0.06;
      const drive = Math.max(floor, energy);

      setLevels(
        envelope.map((weight, index) => {
          const wobble = 0.72 + 0.28 * Math.sin(phaseRef.current * 1.7 + index * 0.55);
          return Math.max(0.06, Math.min(1, drive * weight * wobble + floor * 0.35));
        }),
      );

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [active, amplitude, bars, envelope, tone]);

  const toneClass =
    tone === 'ended'
      ? 'from-neutral-600 via-neutral-500 to-neutral-400'
      : tone === 'ringing'
        ? 'from-emerald-700 via-emerald-500 to-teal-300'
        : tone === 'idle'
          ? 'from-emerald-900 via-emerald-700 to-emerald-500'
          : 'from-emerald-600 via-teal-400 to-emerald-200';

  return (
    <div className={`w-full ${className}`}>
      <div
        className="flex items-end justify-center gap-[3px] sm:gap-1"
        style={{ height }}
        role="img"
        aria-label={label || 'Call audio activity'}
      >
        {levels.map((level, index) => (
          <div
            key={index}
            className={`w-1.5 sm:w-2 rounded-full bg-gradient-to-t ${toneClass} transition-[height,opacity] duration-100 ease-out`}
            style={{
              height: `${Math.round(level * 100)}%`,
              opacity: active ? 0.55 + level * 0.45 : 0.25,
              boxShadow: active && level > 0.6 ? '0 0 12px rgba(52,211,153,0.55)' : undefined,
            }}
          />
        ))}
      </div>
    </div>
  );
}

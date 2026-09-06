'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import ChitiConnectVisualizer from '@/components/ChitiConnectVisualizer';
import useVoiceRecorder from '@/hooks/useVoiceRecorder';
import { parseVoiceParchi, VOICE_CHIPS, type VoiceParseResult } from '@/lib/demoCatalog';

/**
 * Interactive Voice Parchi Sandbox.
 *
 * Shopper taps the mic (or a preset chip), speaks Hinglish, and watches an
 * instant sample cart materialise — the exact journey the installed PWA gives.
 *
 *  • Real mic: `useVoiceRecorder` amplitude drives the 21-bar leaf-green
 *    waveform; the on-device Web Speech transcript (when the browser has it)
 *    is matched against the demo catalog.
 *  • Chips: a synthetic envelope + typewriter replay the same flow without
 *    touching the microphone, so the demo works everywhere.
 */

type Phase = 'idle' | 'recording' | 'thinking' | 'cart' | 'empty';

export default function VoiceParchiSandbox() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('idle');
  const [transcript, setTranscript] = useState('');
  const [typedChars, setTypedChars] = useState(0);
  const [result, setResult] = useState<VoiceParseResult | null>(null);
  const [cartVisible, setCartVisible] = useState(false);

  const typewriterRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const thinkingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cartRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    isRecording,
    amplitude,
    startRecording,
    stopRecording,
    cancelRecording,
  } = useVoiceRecorder({
    locale: 'hi-IN',
    maxDurationMs: 12000,
  });

  const clearTimers = useCallback(() => {
    if (typewriterRef.current) clearInterval(typewriterRef.current);
    if (thinkingRef.current) clearTimeout(thinkingRef.current);
    if (cartRef.current) clearTimeout(cartRef.current);
    typewriterRef.current = null;
    thinkingRef.current = null;
    cartRef.current = null;
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  /** Run the parse + typewriter + cart reveal for a transcript. */
  const playTranscript = useCallback(
    (text: string) => {
      clearTimers();
      setTranscript(text);
      setCartVisible(false);
      setPhase('thinking');
      setTypedChars(0);

      // Typewriter reveal of what we "heard".
      let i = 0;
      typewriterRef.current = setInterval(() => {
        i += 1;
        setTypedChars(i);
        if (i >= text.length && typewriterRef.current) clearInterval(typewriterRef.current);
      }, 26);

      thinkingRef.current = setTimeout(() => {
        const parsed = parseVoiceParchi(text);
        setResult(parsed);
        setPhase(parsed.found ? 'cart' : 'empty');
        if (parsed.found) {
          cartRef.current = setTimeout(() => setCartVisible(true), 180);
        }
      }, Math.max(900, text.length * 26 + 350));
    },
    [clearTimers],
  );

  const onMicTap = useCallback(async () => {
    if (isRecording) {
      const rec = await stopRecording();
      const heard = rec?.webSpeechTranscript?.trim() ?? '';
      if (heard) {
        playTranscript(heard);
      } else {
        // No on-device transcript — show the canonical parchi so the demo
        // still lands (the installed app routes audio to Whisper).
        playTranscript('2 packet Amul milk aur bread');
      }
      return;
    }
    setTranscript('');
    setResult(null);
    setCartVisible(false);
    const ok = await startRecording();
    if (ok) setPhase('recording');
  }, [isRecording, playTranscript, startRecording, stopRecording]);

  const onCancel = useCallback(() => {
    cancelRecording();
    clearTimers();
    setPhase('idle');
    setTranscript('');
    setResult(null);
    setCartVisible(false);
  }, [cancelRecording, clearTimers]);

  const onChip = useCallback(
    (phrase: string) => {
      if (isRecording) cancelRecording();
      playTranscript(phrase);
    },
    [cancelRecording, isRecording, playTranscript],
  );

  const lines = result?.lines ?? [];
  const total = lines.reduce((sum, l) => sum + l.product.price * l.qty, 0);
  const shownTranscript = transcript.slice(0, typedChars);

  return (
    <div className="land-glass relative w-full overflow-hidden p-5 sm:p-6" id="voice-sandbox">
      {/* Header row */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="land-mono text-[10.5px] font-bold uppercase tracking-[0.2em] text-[#22C55E]">
            Voice Parchi · Try Now
          </p>
          <p className="mt-1 text-sm font-semibold text-[rgba(248,250,252,0.85)]">
            Bolein, hum samjhein ge — Bighi Brothers par order
          </p>
        </div>
        <span className="land-pill hidden sm:inline-flex">
          <span className="land-dot" aria-hidden /> Live demo
        </span>
      </div>

      {/* Mic + waveform */}
      <div className="flex items-center gap-4 sm:gap-5">
        <button
          type="button"
          onClick={onMicTap}
          aria-label={isRecording ? 'Recording — tap to stop' : 'Tap the mic and speak your order'}
          className={`relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-2xl transition-transform hover:scale-105 active:scale-95 ${
            isRecording ? 'land-mic-live bg-[#1F2937]' : 'land-mic-idle land-btn-leaf !p-0'
          }`}
        >
          <span aria-hidden>{isRecording ? '⏹️' : '🎙️'}</span>
        </button>

        <div className="min-w-0 flex-1">
          <ChitiConnectVisualizer
            bars={21}
            height={44}
            active={isRecording || phase === 'thinking' || phase === 'cart'}
            amplitude={isRecording ? amplitude : phase === 'thinking' ? 0.55 : 0.22}
            tone={isRecording ? 'live' : phase === 'recording' ? 'live' : 'idle'}
            label="Paaska voice waveform"
          />
          <p className="mt-2 text-[13px] leading-snug text-[rgba(248,250,252,0.7)]" aria-live="polite">
            {phase === 'idle' && (
              <span className="text-[rgba(248,250,252,0.6)]">
                Mic dabayein ya neeche se kuch chunein — jaise <em>“2 packet Amul milk aur bread”</em>
              </span>
            )}
            {phase === 'recording' && (
              <span className="font-semibold text-[#FCA5A5]">Sun rahe hain… phir se dabayein rokne ke liye</span>
            )}
            {phase === 'thinking' && (
              <>
                “{shownTranscript}
                <span className="land-caret" aria-hidden />
                ”
              </>
            )}
            {(phase === 'cart' || phase === 'empty') && <span>“{shownTranscript}”</span>}
          </p>
        </div>
      </div>

      {/* Chips */}
      {phase !== 'recording' && (
        <div className="mt-4 flex flex-wrap gap-2">
          {VOICE_CHIPS.map((chip) => (
            <button key={chip.label} type="button" className="land-chip" onClick={() => onChip(chip.phrase)}>
              <span aria-hidden>🗣️</span> “{chip.label}”
            </button>
          ))}
          {phase !== 'idle' && (
            <button
              type="button"
              className="land-chip !border-transparent !bg-transparent text-[rgba(248,250,252,0.6)]"
              onClick={onCancel}
            >
              ✕ Reset
            </button>
          )}
        </div>
      )}

      {/* Instant sample cart */}
      {phase === 'cart' && result && cartVisible && (
        <div className="land-pop land-card mt-4 overflow-hidden">
          <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] bg-[rgba(34,197,94,0.08)] px-4 py-2.5">
            <p className="text-[12.5px] font-bold">
              <span aria-hidden>🧺</span> Aapki parchi samajh aayi
            </p>
            <span className="land-mono text-[10.5px] font-bold uppercase tracking-wider text-[#22C55E]">
              Bighi Brothers · Bank More
            </span>
          </div>
          <div className="divide-y divide-[rgba(255,255,255,0.06)]">
            {lines.map((line) => (
              <div key={line.product.id} className="flex items-center gap-3 px-4 py-2.5">
                <span className="text-xl" aria-hidden>
                  {line.product.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-semibold">{line.product.name}</p>
                  <p className="land-mono text-[10.5px] text-[rgba(248,250,252,0.6)]">
                    {line.qty} × {line.product.unit} ({line.product.unitLabel})
                  </p>
                </div>
                <p className="land-mono text-[13px] font-bold text-[#BBF7D0]">₹{line.product.price * line.qty}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-[rgba(255,255,255,0.08)] bg-[rgba(11,19,43,0.5)] px-4 py-3">
            <div>
              <p className="text-[12px] font-semibold text-[rgba(248,250,252,0.7)]">Kul (free delivery)</p>
              <p className="land-mono text-lg font-bold text-white">₹{total}</p>
            </div>
            <button type="button" className="land-btn land-btn-leaf !px-5 !py-3 text-sm" onClick={() => router.push('/customer')}>
              ⚡ Order Online Now
            </button>
          </div>
        </div>
      )}

      {phase === 'empty' && (
        <div className="land-pop land-card mt-4 px-4 py-4 text-center">
          <p className="text-sm font-semibold text-[rgba(248,250,252,0.85)]">
            Hmm, ye item abhi demo shelf par nahi hai 🙏
          </p>
          <p className="mt-1 text-xs text-[rgba(248,250,252,0.6)]">
            Chip try karein — “2 packet Amul milk aur bread” hamesha kaam karta hai.
          </p>
        </div>
      )}
    </div>
  );
}

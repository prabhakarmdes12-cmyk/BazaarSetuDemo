'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from './ui';
import ChitiConnectVisualizer from './ChitiConnectVisualizer';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export interface VoiceBasketItem {
  productId: string;
  productName: string;
  unit: string;
  price: number;
  quantity: number;
  matchConfidence: number;
  image: string;
  requestedName?: string;
  availabilityStatus?: string;
  lineTotal?: number;
}

export interface VoiceBasket {
  items: VoiceBasketItem[];
  unmatchedItems: string[];
  subtotal: number;
  estimatedDeliveryMinutes: number;
}

export interface VoiceOrderResult {
  transcript: string;
  detectedLanguage: 'hi' | 'en' | 'hinglish';
  basket: VoiceBasket;
}

interface VoiceParchiModalProps {
  open: boolean;
  onClose: () => void;
  shopId: string;
  shopName?: string;
  customerId?: string | null;
  conversationId?: string | null;
  token?: string | null;
  /** Push the reviewed parchi into the cart. */
  onAddToCart: (items: VoiceBasketItem[]) => void | Promise<void>;
  /** ⚡ 1-Tap Checkout — add and go straight to payment. */
  onInstantCheckout?: (items: VoiceBasketItem[]) => void | Promise<void>;
  /** Raised for permission denials so the host can focus the text search bar. */
  onPermissionDenied?: (message: string) => void;
  locale?: string;
}

type Phase = 'listening' | 'processing' | 'review' | 'error';

const LANGUAGE_LABEL: Record<string, string> = {
  hi: 'हिन्दी',
  en: 'English',
  hinglish: 'Hinglish',
};

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * Paaska Sahayak — the Voice Parchi review sheet.
 *
 * A shopper in Bank More does not browse 2,176 catalog cards on a 6-inch phone;
 * they read out a parchi. This bottom sheet captures that speech, sends it to
 * `/api/shop-bot/voice-order`, and renders the synthesized parchi back with
 * matched SKU photos, `[+] / [-]` quantity controls, and a running subtotal —
 * so the shopper confirms a list they recognise before any money moves.
 */
export default function VoiceParchiModal({
  open,
  onClose,
  shopId,
  shopName = 'aapki dukaan',
  customerId,
  conversationId,
  token,
  onAddToCart,
  onInstantCheckout,
  onPermissionDenied,
  locale = 'hi-IN',
}: VoiceParchiModalProps) {
  const [phase, setPhase] = useState<Phase>('listening');
  const [result, setResult] = useState<VoiceOrderResult | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const startedRef = useRef(false);

  const recorder = useVoiceRecorder({
    locale,
    onError: (message) => {
      setErrorMessage(message);
      setPhase('error');
      onPermissionDenied?.(message);
    },
  });

  const { startRecording, stopRecording, cancelRecording, isRecording, recordingDuration, amplitude, permission } =
    recorder;

  const resetState = useCallback(() => {
    startedRef.current = false;
    setPhase('listening');
    setResult(null);
    setQuantities({});
    setErrorMessage(null);
    setSubmitting(false);
  }, []);

  const handleClose = useCallback(() => {
    cancelRecording();
    resetState();
    onClose();
  }, [cancelRecording, onClose, resetState]);

  const uploadVoiceOrder = useCallback(
    async (audio: Blob, meta: { mimeType: string; durationMs: number; webSpeechTranscript?: string; webSpeechConfidence?: number }) => {
      if (!customerId || !conversationId || !token) {
        // Guests can still speak — we just cannot persist a draft for them, so
        // we ask them to sign in rather than silently dropping the parchi.
        setErrorMessage('Voice parchi bhejne ke liye kripya login karein.');
        setPhase('error');
        return;
      }

      const form = new FormData();
      form.append('customerId', customerId);
      form.append('shopId', shopId);
      form.append('conversationId', conversationId);
      form.append('locale', locale.startsWith('hi') ? 'hinglish' : 'en-IN');
      form.append('durationMs', String(meta.durationMs));
      form.append('clientActionId', `${conversationId}:voice:${Date.now()}`);
      // DPDP 2023 / VOICE_INV_007 — the recording is a transport, not a record.
      form.append('ephemeralAudio', 'true');
      if (meta.webSpeechTranscript) {
        form.append('webSpeechTranscript', meta.webSpeechTranscript);
        if (meta.webSpeechConfidence) form.append('webSpeechConfidence', String(meta.webSpeechConfidence));
      }
      const extension = meta.mimeType.includes('ogg') ? 'ogg' : meta.mimeType.includes('mp4') ? 'm4a' : 'webm';
      form.append('audio', audio, `voice-parchi-${Date.now()}.${extension}`);

      const response = await fetch(`${API_URL}/api/shop-bot/voice-order`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body?.success) {
        throw new Error(body?.message || 'Voice parchi process nahi ho paayi.');
      }

      const data = (body.data || body) as VoiceOrderResult;
      const basket: VoiceBasket = data.basket || { items: [], unmatchedItems: [], subtotal: 0, estimatedDeliveryMinutes: 10 };
      setResult({
        transcript: data.transcript || '',
        detectedLanguage: data.detectedLanguage || 'hinglish',
        basket,
      });
      setQuantities(
        basket.items.reduce<Record<string, number>>((acc, item) => {
          acc[item.productId] = item.quantity;
          return acc;
        }, {}),
      );
      setPhase('review');
    },
    [conversationId, customerId, locale, shopId, token],
  );

  const handleStop = useCallback(async () => {
    const capture = await stopRecording();
    if (!capture || capture.blob.size === 0) {
      setErrorMessage('Koi awaaz record nahi hui. Kripya dobara boliye.');
      setPhase('error');
      return;
    }
    setPhase('processing');
    try {
      await uploadVoiceOrder(capture.blob, capture);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Voice parchi process nahi ho paayi.');
      setPhase('error');
    }
  }, [stopRecording, uploadVoiceOrder]);

  // Open the sheet straight into listening — the shopper already tapped the mic.
  useEffect(() => {
    if (!open) {
      startedRef.current = false;
      return;
    }
    if (startedRef.current) return;
    startedRef.current = true;
    resetState();
    startedRef.current = true;
    void startRecording();
  }, [open, resetState, startRecording]);

  // Escape closes; it must also stop the microphone.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, handleClose]);

  const reviewedItems = useMemo(() => {
    if (!result) return [] as VoiceBasketItem[];
    return result.basket.items
      .map((item) => ({ ...item, quantity: quantities[item.productId] ?? item.quantity }))
      .filter((item) => item.quantity > 0);
  }, [result, quantities]);

  const subtotal = useMemo(
    () => Number(reviewedItems.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)),
    [reviewedItems],
  );

  const adjust = useCallback((productId: string, delta: number) => {
    setQuantities((prev) => {
      const next = Math.max(0, Math.min(99, (prev[productId] ?? 0) + delta));
      return { ...prev, [productId]: next };
    });
  }, []);

  const runAction = useCallback(
    async (action?: (items: VoiceBasketItem[]) => void | Promise<void>) => {
      if (!action || reviewedItems.length === 0) return;
      setSubmitting(true);
      try {
        await action(reviewedItems);
        handleClose();
      } finally {
        setSubmitting(false);
      }
    },
    [handleClose, reviewedItems],
  );

  const etaMinutes = result?.basket.estimatedDeliveryMinutes ?? 10;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="voice-parchi-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
            className="fixed inset-0 z-[90] bg-black/75 backdrop-blur-sm"
          />

          <motion.div
            key="voice-parchi-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Paaska Sahayak voice parchi"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            className="fixed inset-x-0 bottom-0 z-[95] max-h-[92vh] overflow-hidden rounded-t-3xl glass-panel bg-surface-container-lowest/95 border-t border-primary/25 shadow-editorial-xl"
          >
            <div className="mx-auto max-w-2xl flex flex-col max-h-[92vh]">
              {/* Grab handle + header */}
              <div className="shrink-0 px-5 pt-3 pb-4 border-b border-white/5">
                <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-white/15" />
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-2xl leaf-gradient flex items-center justify-center shadow-brand-glow shrink-0">
                      <Icon name="graphic_eq" filled className="text-white" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="font-headline font-black text-lg leading-tight text-on-surface truncate">
                        Paaska Sahayak
                      </h2>
                      <p className="text-[11px] font-semibold text-on-surface-variant truncate">
                        {phase === 'review'
                          ? `Aapki parchi &bull; ${shopName}`.replace('&bull;', '·')
                          : `Boliye — jaise dukaan par bolte hain · ${shopName}`}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleClose}
                    aria-label="Close voice parchi"
                    className="shrink-0 w-9 h-9 rounded-full bg-surface-container-high text-on-surface-variant hover:text-on-surface active:scale-90 transition flex items-center justify-center"
                  >
                    <Icon name="close" size="sm" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-5">
                {/* ---------------- LISTENING ---------------- */}
                {phase === 'listening' && (
                  <div className="flex flex-col items-center text-center py-4">
                    <div className="w-full rounded-2xl bg-surface-container/70 border border-emerald-500/15 px-4 py-6">
                      <ChitiConnectVisualizer
                        amplitude={amplitude}
                        active={isRecording}
                        tone={isRecording ? 'live' : 'idle'}
                        height={72}
                        label="Voice parchi recording"
                      />
                      <div className="mt-4 flex items-center justify-center gap-2">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                        </span>
                        <span className="font-mono text-sm font-bold text-emerald-300 tabular-nums">
                          {formatDuration(recordingDuration)}
                        </span>
                      </div>
                    </div>

                    <p className="mt-5 text-sm font-semibold text-on-surface">
                      &ldquo;Bhaiya, do packet Amul Taaza doodh, ek brown bread…&rdquo;
                    </p>
                    <p className="mt-1 text-xs text-on-surface-variant">
                      Hindi, Hinglish ya English — jo aasaan lage.
                    </p>

                    <button
                      onClick={handleStop}
                      disabled={!isRecording}
                      className="mt-7 w-full max-w-xs leaf-gradient text-white font-headline font-black uppercase tracking-wider text-sm px-6 py-4 rounded-2xl shadow-brand-glow active:scale-95 transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <Icon name="stop_circle" filled size="sm" />
                      Ho gaya, parchi banao
                    </button>
                  </div>
                )}

                {/* ---------------- PROCESSING ---------------- */}
                {phase === 'processing' && (
                  <div className="flex flex-col items-center text-center py-12">
                    <div className="w-16 h-16 rounded-full border-2 border-emerald-500/30 border-t-emerald-400 animate-spin" />
                    <p className="mt-6 font-headline font-black text-on-surface">Parchi ban rahi hai…</p>
                    <p className="mt-1 text-xs text-on-surface-variant">
                      Aapki awaaz ko {shopName} ke catalog se milaya ja raha hai.
                    </p>
                  </div>
                )}

                {/* ---------------- ERROR ---------------- */}
                {phase === 'error' && (
                  <div className="flex flex-col items-center text-center py-10">
                    <div className="w-14 h-14 rounded-2xl bg-error-container flex items-center justify-center">
                      <Icon name={permission === 'denied' ? 'mic_off' : 'error'} className="text-on-error-container" />
                    </div>
                    <p className="mt-5 font-headline font-bold text-on-surface">
                      {permission === 'denied' ? 'Microphone band hai' : 'Parchi nahi ban paayi'}
                    </p>
                    <p className="mt-1.5 text-xs text-on-surface-variant max-w-sm">
                      {errorMessage || 'Kuch gadbad ho gayi. Kripya dobara koshish karein.'}
                    </p>
                    <div className="mt-6 flex items-center gap-3">
                      <button
                        onClick={handleClose}
                        className="px-5 py-3 rounded-xl bg-surface-container-high text-on-surface text-xs font-bold uppercase tracking-wider active:scale-95 transition"
                      >
                        Type karke search karein
                      </button>
                      {permission !== 'denied' && (
                        <button
                          onClick={() => {
                            resetState();
                            void startRecording();
                          }}
                          className="px-5 py-3 rounded-xl leaf-gradient text-white text-xs font-black uppercase tracking-wider active:scale-95 transition shadow-brand-glow"
                        >
                          Dobara boliye
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* ---------------- REVIEW ---------------- */}
                {phase === 'review' && result && (
                  <div className="space-y-4">
                    {/* Transcript */}
                    <div className="rounded-2xl bg-surface-container/70 border border-white/5 p-4">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300">
                          Aapne kaha
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded-full">
                          {LANGUAGE_LABEL[result.detectedLanguage] || result.detectedLanguage}
                        </span>
                      </div>
                      <p className="text-sm text-on-surface italic leading-relaxed">
                        {result.transcript
                          ? `&ldquo;${result.transcript}&rdquo;`.replace(/&ldquo;|&rdquo;/g, '"')
                          : 'Transcript nahi mila — dukaandaar khud check karenge.'}
                      </p>
                    </div>

                    {/* Matched items */}
                    {reviewedItems.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center">
                        <Icon name="receipt_long" className="text-on-surface-variant" />
                        <p className="mt-2 text-sm font-bold text-on-surface">Koi item match nahi hua</p>
                        <p className="mt-1 text-xs text-on-surface-variant">
                          Kripya dobara boliye ya search bar se add karein.
                        </p>
                      </div>
                    ) : (
                      <ul className="space-y-2.5">
                        {result.basket.items.map((item) => {
                          const quantity = quantities[item.productId] ?? item.quantity;
                          if (quantity <= 0) return null;
                          return (
                            <li
                              key={item.productId}
                              className="flex items-center gap-3 rounded-2xl bg-surface-container-low border border-white/5 p-3"
                            >
                              <div className="w-14 h-14 rounded-xl overflow-hidden bg-surface-container-high shrink-0 flex items-center justify-center">
                                {item.image ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={item.image}
                                    alt={item.productName}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <Icon name="shopping_basket" className="text-on-surface-variant" />
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-on-surface leading-tight line-clamp-2">
                                  {item.productName}
                                </p>
                                <div className="mt-0.5 flex items-center gap-2 flex-wrap">
                                  <span className="text-[11px] font-semibold text-on-surface-variant">{item.unit}</span>
                                  <span className="text-[11px] font-black text-primary">₹{item.price}</span>
                                  {item.matchConfidence > 0 && item.matchConfidence < 0.8 && (
                                    <span className="text-[10px] font-bold uppercase tracking-wide text-warning bg-warning-container px-1.5 py-0.5 rounded">
                                      Confirm karein
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0 rounded-xl bg-surface-container-high p-1">
                                <button
                                  onClick={() => adjust(item.productId, -1)}
                                  aria-label={`Kam karein ${item.productName}`}
                                  className="w-8 h-8 rounded-lg text-on-surface hover:text-primary active:scale-90 transition flex items-center justify-center"
                                >
                                  <Icon name="remove" size="sm" />
                                </button>
                                <span className="w-6 text-center text-sm font-black text-on-surface tabular-nums">
                                  {quantity}
                                </span>
                                <button
                                  onClick={() => adjust(item.productId, 1)}
                                  aria-label={`Zyada karein ${item.productName}`}
                                  className="w-8 h-8 rounded-lg leaf-gradient text-white active:scale-90 transition flex items-center justify-center"
                                >
                                  <Icon name="add" size="sm" />
                                </button>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}

                    {/* Unmatched — merchant will confirm these by hand */}
                    {result.basket.unmatchedItems.length > 0 && (
                      <div className="rounded-2xl bg-warning-container/40 border border-warning/25 p-4">
                        <div className="flex items-center gap-2">
                          <Icon name="help" size="sm" className="text-warning" />
                          <span className="text-[11px] font-black uppercase tracking-widest text-on-warning-container">
                            Dukaandaar se confirm hoga
                          </span>
                        </div>
                        <p className="mt-1.5 text-xs text-on-warning-container/90">
                          {result.basket.unmatchedItems.join(', ')}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ---------------- ACTION BAR ---------------- */}
              {phase === 'review' && reviewedItems.length > 0 && (
                <div className="shrink-0 border-t border-white/5 bg-surface-container-lowest/95 px-5 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                        Subtotal
                      </p>
                      <p className="font-headline font-black text-xl text-on-surface tabular-nums">₹{subtotal}</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-300">
                      <Icon name="bolt" size="sm" filled />
                      Delivery in {etaMinutes} mins
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => runAction(onAddToCart)}
                      disabled={submitting}
                      className="flex-1 rounded-2xl bg-surface-container-high text-on-surface font-headline font-black uppercase tracking-wider text-xs px-4 py-4 active:scale-95 transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <Icon name="add_shopping_cart" size="sm" />
                      Add to Cart
                    </button>
                    <button
                      onClick={() => runAction(onInstantCheckout || onAddToCart)}
                      disabled={submitting}
                      className="flex-[1.4] rounded-2xl leaf-gradient text-white font-headline font-black uppercase tracking-wider text-xs px-4 py-4 shadow-brand-glow active:scale-95 transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <Icon name="bolt" size="sm" filled />
                      ⚡ 1-Tap Checkout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

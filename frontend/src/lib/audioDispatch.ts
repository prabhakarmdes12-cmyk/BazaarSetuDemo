/**
 * Merchant audio dispatch (WP4).
 *
 * A kirana owner is almost never looking at the tablet — he is weighing atta,
 * arguing about change, or halfway down the lane on the scooter. A silent
 * toast is a missed order, and a missed order in a 10-minute promise is a lost
 * customer. So a new order announces itself: a two-note urgency earcon that
 * cuts through shop noise, then a spoken Hinglish summary of who ordered, how
 * many items, how much, and which locality it is going to.
 *
 * Everything here degrades gracefully:
 *   speechSynthesis missing / no voice  -> chime only
 *   Web Audio blocked (no user gesture) -> silent no-op, never throws
 */

export interface OrderAnnouncement {
  customerName: string;
  itemCount: number;
  totalAmount: number;
  locality?: string;
}

type Urgency = 'high' | 'normal';

let audioCtx: AudioContext | null = null;
let unlocked = false;

/** Browsers gate audio behind a user gesture; resolve/att lazily and cache. */
function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    if (!audioCtx || audioCtx.state === 'closed') audioCtx = new Ctor();
    if (audioCtx.state === 'suspended') void audioCtx.resume();
    return audioCtx;
  } catch {
    return null;
  }
}

/**
 * Call once from a click/tap handler (e.g. the vendor dashboard mount after
 * any interaction) so later autonomous alerts are allowed to make noise.
 */
export function primeAudioDispatch(): void {
  if (unlocked) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  unlocked = true;
  // Zero-gain blip: unlocks the context on iOS Safari without being audible.
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    gain.gain.value = 0;
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.01);
  } catch {
    /* non-fatal */
  }
}

/**
 * Oscillator earcon. High urgency = rising two-tone "ta-daa" at a piercing
 * 880/1320 Hz that survives a noisy shopfront; normal = a single soft ping.
 */
export function playOrderChime(urgency: Urgency = 'high'): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const notes: Array<{ freq: number; at: number; dur: number; peak: number }> =
    urgency === 'high'
      ? [
          { freq: 880, at: 0, dur: 0.16, peak: 0.32 },
          { freq: 1320, at: 0.18, dur: 0.26, peak: 0.28 },
          { freq: 1760, at: 0.44, dur: 0.2, peak: 0.2 },
        ]
      : [{ freq: 660, at: 0, dur: 0.22, peak: 0.18 }];

  const now = ctx.currentTime;
  for (const note of notes) {
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.freq, now + note.at);
      // Short attack, exponential tail — reads as a bell, not a buzzer.
      gain.gain.setValueAtTime(0.0001, now + note.at);
      gain.gain.exponentialRampToValueAtTime(note.peak, now + note.at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + note.at + note.dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + note.at);
      osc.stop(now + note.at + note.dur + 0.02);
    } catch {
      /* one bad note should never break the alert */
    }
  }
}

function pickVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices() || [];
  if (!voices.length) return null;
  const byLang = (tag: string) =>
    voices.find((v) => v.lang?.toLowerCase().replace('_', '-') === tag);
  return (
    byLang('hi-in') ||
    byLang('en-in') ||
    voices.find((v) => v.lang?.toLowerCase().startsWith('hi')) ||
    voices.find((v) => v.lang?.toLowerCase().startsWith('en-in')) ||
    voices.find((v) => v.lang?.toLowerCase().startsWith('en')) ||
    voices[0] ||
    null
  );
}

/** Voice lists load async in Chrome; wait briefly rather than speaking mute. */
function whenVoicesReady(timeoutMs = 1200): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return resolve();
    if ((window.speechSynthesis.getVoices() || []).length) return resolve();
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      window.speechSynthesis.onvoiceschanged = null;
      resolve();
    };
    window.speechSynthesis.onvoiceschanged = finish;
    setTimeout(finish, timeoutMs);
  });
}

function formatAmount(amount: number): string {
  const rounded = Math.round(amount);
  return `${rounded} rupaye`;
}

export function buildOrderSpeech({
  customerName,
  itemCount,
  totalAmount,
  locality,
}: OrderAnnouncement): string {
  const name = (customerName || '').trim() || 'Ek grahak';
  const items = Math.max(1, Math.round(itemCount));
  const where = locality?.trim() ? ` ${locality.trim()} ke liye.` : '';
  return `Naya order! ${name} ne ${items} ${items === 1 ? 'item' : 'items'} mangwaye hain. Total ${formatAmount(totalAmount)}.${where}`;
}

/**
 * Speak the order summary in Hinglish. Resolves once speech ends (or
 * immediately if TTS is unavailable) so callers can chain without blocking.
 */
export async function speakOrderNotification(
  customerName: string,
  itemCount: number,
  totalAmount: number,
  locality?: string,
): Promise<boolean> {
  if (typeof window === 'undefined' || !window.speechSynthesis) return false;

  const text = buildOrderSpeech({ customerName, itemCount, totalAmount, locality });

  try {
    await whenVoicesReady();
    const voice = pickVoice();
    const utterance = new SpeechSynthesisUtterance(text);
    if (voice) utterance.voice = voice;
    utterance.lang = voice?.lang || 'hi-IN';
    utterance.rate = 0.98; // Hinglish numerals garble above ~1.1x.
    utterance.pitch = 1.02;
    utterance.volume = 1;

    // Never stack announcements — the newest order is the one that matters.
    window.speechSynthesis.cancel();

    return await new Promise<boolean>((resolve) => {
      let settled = false;
      const settle = (ok: boolean) => {
        if (settled) return;
        settled = true;
        resolve(ok);
      };
      utterance.onend = () => settle(true);
      utterance.onerror = () => settle(false);
      window.speechSynthesis.speak(utterance);
      // Chrome can silently drop long utterances; bound the wait.
      setTimeout(() => settle(true), 12000);
    });
  } catch {
    return false;
  }
}

/**
 * The full new-order alert: urgency earcon first, then the spoken summary
 * after the chime tail clears so the two do not talk over each other.
 */
export async function announceNewOrder(
  announcement: OrderAnnouncement,
  options: { urgency?: Urgency; speak?: boolean } = {},
): Promise<void> {
  const { urgency = 'high', speak = true } = options;
  playOrderChime(urgency);
  if (!speak) return;
  await new Promise((r) => setTimeout(r, urgency === 'high' ? 700 : 300));
  await speakOrderNotification(
    announcement.customerName,
    announcement.itemCount,
    announcement.totalAmount,
    announcement.locality,
  );
}

/** Stop any in-flight announcement (e.g. the merchant opened the order). */
export function stopAudioDispatch(): void {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

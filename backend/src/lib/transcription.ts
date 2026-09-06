import fs from 'fs/promises';

export interface TranscriptionInput {
  audioPath: string;
  audioBuffer: Buffer;
  mimeType: string;
  fields?: Record<string, string>;
}

export type DetectedLanguage = 'hi' | 'en' | 'hinglish';

export interface TranscriptionResult {
  transcript: string;
  confidence: number;
  provider: string;
  requiresManualReview: boolean;
  detectedLanguage: DetectedLanguage;
}

function normalizeTranscript(value: string | undefined): string {
  return (value || '').replace(/\s+/g, ' ').trim();
}

// Romanised Hindi markers that appear in Hinglish kirana speech. These are the
// words Bharat shoppers actually use ("do packet doodh bhej dena"), so a
// transcript containing them is Hinglish even though every glyph is Latin.
const HINGLISH_MARKERS = [
  'bhaiya', 'bhaiyya', 'bhai', 'dena', 'bhejo', 'bhej', 'chahiye', 'chaiye', 'kitna', 'kitne',
  'doodh', 'dudh', 'atta', 'aata', 'chawal', 'cheeni', 'chini', 'namak', 'tel', 'dal', 'daal',
  'packet', 'kilo', 'aadha', 'adha', 'thoda', 'wala', 'wali', 'wale', 'rupaye', 'rupay', 'rupees',
  'ek', 'do', 'teen', 'char', 'chaar', 'paanch', 'das', 'jaldi', 'ghar', 'dukaan', 'nahi', 'nahin',
  'accha', 'acha', 'sasta', 'lena', 'de', 'do',
];

/**
 * Classify the transcript language for the Paaska Sahayak review sheet.
 * Devanagari => 'hi'; Latin script carrying romanised Hindi markers =>
 * 'hinglish'; otherwise 'en'.
 */
export function detectTranscriptLanguage(transcript: string): DetectedLanguage {
  const value = normalizeTranscript(transcript);
  if (!value) return 'hinglish';

  const devanagari = (value.match(/[\u0900-\u097F]/g) || []).length;
  const latin = (value.match(/[A-Za-z]/g) || []).length;
  if (devanagari > 0 && devanagari >= latin) return 'hi';

  const tokens = value.toLowerCase().split(/[^a-z0-9\u0900-\u097F]+/).filter(Boolean);
  if (tokens.length === 0) return devanagari > 0 ? 'hi' : 'en';

  const markerHits = tokens.filter((token) => HINGLISH_MARKERS.includes(token)).length;
  if (devanagari > 0 || markerHits > 0) return 'hinglish';
  return 'en';
}

async function transcribeWithHttpAdapter(input: TranscriptionInput, provider: 'whisper' | 'ollama'): Promise<TranscriptionResult | undefined> {
  const endpoint = provider === 'whisper' ? process.env.WHISPER_TRANSCRIPTION_URL : process.env.OLLAMA_TRANSCRIPTION_URL;
  if (!endpoint) return undefined;

  const formData = new FormData();
  const bytes = new Uint8Array(input.audioBuffer);
  formData.append('audio', new Blob([bytes], { type: input.mimeType }), input.audioPath.split('/').pop() || 'voice-order.webm');

  const response = await fetch(endpoint, { method: 'POST', body: formData });
  if (!response.ok) throw new Error(`${provider} transcription failed with HTTP ${response.status}`);
  const data = await response.json().catch(() => ({})) as {
    transcript?: string;
    text?: string;
    confidence?: number;
    language?: string;
  };
  const transcript = normalizeTranscript(data.transcript || data.text);
  return {
    transcript,
    confidence: typeof data.confidence === 'number' ? data.confidence : transcript ? 0.85 : 0,
    provider,
    requiresManualReview: !transcript,
    detectedLanguage: normalizeLanguageHint(data.language) || detectTranscriptLanguage(transcript),
  };
}

function normalizeLanguageHint(hint: string | undefined): DetectedLanguage | undefined {
  if (!hint) return undefined;
  const value = hint.toLowerCase();
  if (value.startsWith('hinglish')) return 'hinglish';
  if (value.startsWith('hi')) return 'hi';
  if (value.startsWith('en')) return 'en';
  return undefined;
}

/**
 * Audio transcription adapter. Resolution order:
 *  1. `mockTranscript` / `transcript` multipart fields (tests + deterministic dev).
 *  2. `webSpeechTranscript` — the browser Web Speech API result the Paaska
 *     Sahayak modal captured on-device alongside the audio blob. Free, instant,
 *     and works offline of any GPU box.
 *  3. A Whisper / Ollama-compatible HTTP endpoint (`TRANSCRIPTION_PROVIDER`).
 *  4. Manual merchant review, preserving the audio.
 */
export async function transcribeVoiceOrder(input: TranscriptionInput): Promise<TranscriptionResult> {
  const mocked = normalizeTranscript(
    input.fields?.mockTranscript ||
      input.fields?.transcript ||
      process.env.SHOPBOT_MOCK_TRANSCRIPT,
  );
  if (mocked) {
    return {
      transcript: mocked,
      confidence: 0.99,
      provider: 'mock',
      requiresManualReview: false,
      detectedLanguage: normalizeLanguageHint(input.fields?.locale) || detectTranscriptLanguage(mocked),
    };
  }

  const webSpeech = normalizeTranscript(input.fields?.webSpeechTranscript);
  if (webSpeech) {
    const parsedConfidence = Number(input.fields?.webSpeechConfidence);
    return {
      transcript: webSpeech,
      confidence: Number.isFinite(parsedConfidence) && parsedConfidence > 0 ? Math.min(1, parsedConfidence) : 0.8,
      provider: 'web-speech',
      requiresManualReview: false,
      detectedLanguage: normalizeLanguageHint(input.fields?.locale) || detectTranscriptLanguage(webSpeech),
    };
  }

  const provider = (process.env.TRANSCRIPTION_PROVIDER || '').toLowerCase();
  if (provider === 'whisper' || provider === 'ollama') {
    const result = await transcribeWithHttpAdapter(input, provider);
    if (result) return result;
  }

  // No adapter configured: keep commerce resilient by preserving the raw audio
  // and asking the merchant/operator to review it, instead of pretending a SKU.
  await fs.access(input.audioPath);
  return {
    transcript: '',
    confidence: 0,
    provider: 'none',
    requiresManualReview: true,
    detectedLanguage: normalizeLanguageHint(input.fields?.locale) || 'hinglish',
  };
}

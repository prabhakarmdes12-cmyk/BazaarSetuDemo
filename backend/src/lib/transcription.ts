import fs from 'fs/promises';

export interface TranscriptionInput {
  audioPath: string;
  audioBuffer: Buffer;
  mimeType: string;
  fields?: Record<string, string>;
}

export interface TranscriptionResult {
  transcript: string;
  confidence: number;
  provider: string;
  requiresManualReview: boolean;
}

function normalizeTranscript(value: string | undefined): string {
  return (value || '').replace(/\s+/g, ' ').trim();
}

async function transcribeWithHttpAdapter(input: TranscriptionInput, provider: 'whisper' | 'ollama'): Promise<TranscriptionResult | undefined> {
  const endpoint = provider === 'whisper' ? process.env.WHISPER_TRANSCRIPTION_URL : process.env.OLLAMA_TRANSCRIPTION_URL;
  if (!endpoint) return undefined;

  const formData = new FormData();
  const bytes = new Uint8Array(input.audioBuffer);
  formData.append('audio', new Blob([bytes], { type: input.mimeType }), input.audioPath.split('/').pop() || 'voice-order.webm');

  const response = await fetch(endpoint, { method: 'POST', body: formData });
  if (!response.ok) throw new Error(`${provider} transcription failed with HTTP ${response.status}`);
  const data = await response.json().catch(() => ({})) as { transcript?: string; text?: string; confidence?: number };
  const transcript = normalizeTranscript(data.transcript || data.text);
  return {
    transcript,
    confidence: typeof data.confidence === 'number' ? data.confidence : transcript ? 0.85 : 0,
    provider,
    requiresManualReview: !transcript,
  };
}

/**
 * Audio transcription adapter. In tests/dev, callers can pass `mockTranscript`
 * or `transcript` multipart fields for deterministic behavior. Production can
 * opt into a Whisper/Ollama-compatible HTTP endpoint without changing routes.
 */
export async function transcribeVoiceOrder(input: TranscriptionInput): Promise<TranscriptionResult> {
  const mocked = normalizeTranscript(
    input.fields?.mockTranscript ||
      input.fields?.transcript ||
      process.env.SHOPBOT_MOCK_TRANSCRIPT,
  );
  if (mocked) {
    return { transcript: mocked, confidence: 0.99, provider: 'mock', requiresManualReview: false };
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
  };
}

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type VoicePermissionState = 'idle' | 'prompt' | 'granted' | 'denied' | 'unsupported';

export interface VoiceRecorderResult {
  blob: Blob;
  mimeType: string;
  durationMs: number;
  /**
   * On-device Web Speech transcript captured in parallel with the audio, when
   * the browser supports it. Sent alongside the blob so the backend can skip a
   * round-trip to Whisper for the common case.
   */
  webSpeechTranscript?: string;
  webSpeechConfidence?: number;
}

interface UseVoiceRecorderOptions {
  /** Target sample rate for the capture graph. Whisper-friendly default. */
  sampleRate?: number;
  /** Hard stop so a pocket-dial never records forever. */
  maxDurationMs?: number;
  /** BCP-47 locale for the parallel Web Speech recognition pass. */
  locale?: string;
  /** Surfaced to the caller so it can raise a non-blocking toast. */
  onError?: (message: string) => void;
}

// The Web Speech API is still vendor-prefixed in Chromium and absent in Firefox,
// so it is treated strictly as a bonus signal — never a requirement.
type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
};

function getSpeechRecognition(): (new () => SpeechRecognitionLike) | undefined {
  if (typeof window === 'undefined') return undefined;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition;
}

function pickMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return 'audio/webm';
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4',
  ];
  for (const type of candidates) {
    if (MediaRecorder.isTypeSupported?.(type)) return type;
  }
  return 'audio/webm';
}

/**
 * Paaska Sahayak microphone capture.
 *
 * Owns the `MediaRecorder` lifecycle for a 16 kHz mono voice parchi, exposes a
 * live amplitude signal for the waveform, and degrades gracefully when the
 * shopper denies microphone permission (the caller shows a toast and focuses
 * the text search bar instead of blocking the journey).
 */
export function useVoiceRecorder(options: UseVoiceRecorderOptions = {}) {
  const { sampleRate = 16000, maxDurationMs = 30000, locale = 'hi-IN', onError } = options;

  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [permission, setPermission] = useState<VoicePermissionState>('idle');
  const [amplitude, setAmplitude] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const autoStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const speechTranscriptRef = useRef('');
  const speechConfidenceRef = useRef(0);
  const stopResolveRef = useRef<((result: VoiceRecorderResult | null) => void) | null>(null);

  const raise = useCallback((message: string) => {
    setError(message);
    onError?.(message);
  }, [onError]);

  const teardown = useCallback(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = null;
    if (autoStopRef.current) clearTimeout(autoStopRef.current);
    autoStopRef.current = null;
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;

    try {
      recognitionRef.current?.stop();
    } catch {
      /* recognition may already be stopped */
    }
    recognitionRef.current = null;

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    analyserRef.current = null;
    const context = audioContextRef.current;
    audioContextRef.current = null;
    if (context && context.state !== 'closed') void context.close().catch(() => undefined);

    setAmplitude(0);
  }, []);

  useEffect(() => () => teardown(), [teardown]);

  const startMeter = useCallback((stream: MediaStream) => {
    const Ctx: typeof AudioContext | undefined =
      typeof window !== 'undefined'
        ? window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
        : undefined;
    if (!Ctx) return;

    try {
      const context = new Ctx();
      const source = context.createMediaStreamSource(stream);
      const analyser = context.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.75;
      source.connect(analyser);
      audioContextRef.current = context;
      analyserRef.current = analyser;

      const buffer = new Uint8Array(analyser.frequencyBinCount);
      const loop = () => {
        const node = analyserRef.current;
        if (!node) return;
        node.getByteTimeDomainData(buffer);
        let sumSquares = 0;
        for (let i = 0; i < buffer.length; i += 1) {
          const centered = (buffer[i] - 128) / 128;
          sumSquares += centered * centered;
        }
        const rms = Math.sqrt(sumSquares / buffer.length);
        // Gentle curve so quiet Hindi speech still moves the bars visibly.
        setAmplitude(Math.min(1, rms * 3.2));
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
    } catch {
      /* Visualiser is decorative — never block recording on it. */
    }
  }, []);

  const startSpeechRecognition = useCallback(() => {
    const Recognition = getSpeechRecognition();
    if (!Recognition) return;
    try {
      const recognition = new Recognition();
      recognition.lang = locale;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      speechTranscriptRef.current = '';
      speechConfidenceRef.current = 0;

      recognition.onresult = (event: any) => {
        let finalText = '';
        let confidence = 0;
        for (let i = 0; i < event.results.length; i += 1) {
          const result = event.results[i];
          if (result.isFinal) {
            finalText += `${result[0].transcript} `;
            confidence = Math.max(confidence, result[0].confidence || 0);
          }
        }
        if (finalText.trim()) {
          speechTranscriptRef.current = finalText.replace(/\s+/g, ' ').trim();
          speechConfidenceRef.current = confidence;
        }
      };
      recognition.onerror = () => undefined;
      recognition.onend = () => undefined;
      recognition.start();
      recognitionRef.current = recognition;
    } catch {
      /* Speech recognition is opportunistic; Whisper handles the rest. */
    }
  }, [locale]);

  const startRecording = useCallback(async (): Promise<boolean> => {
    if (isRecording) return true;
    setError(null);

    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === 'undefined'
    ) {
      setPermission('unsupported');
      raise('Is browser mein voice recording available nahi hai. Kripya search bar use karein.');
      return false;
    }

    setPermission('prompt');
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
    } catch (err) {
      const name = (err as { name?: string })?.name;
      setPermission(name === 'NotAllowedError' || name === 'SecurityError' ? 'denied' : 'unsupported');
      raise(
        name === 'NotAllowedError' || name === 'SecurityError'
          ? 'Microphone ki permission nahi mili. Aap type karke bhi search kar sakte hain.'
          : 'Microphone shuru nahi ho paaya. Kripya search bar use karein.',
      );
      return false;
    }

    setPermission('granted');
    streamRef.current = stream;
    chunksRef.current = [];

    const mimeType = pickMimeType();
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 32000 });
    } catch {
      recorder = new MediaRecorder(stream);
    }
    recorderRef.current = recorder;

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) chunksRef.current.push(event.data);
    };

    recorder.onstop = () => {
      const durationMs = Date.now() - startedAtRef.current;
      const type = recorder.mimeType || mimeType;
      const blob = new Blob(chunksRef.current, { type });
      const transcript = speechTranscriptRef.current;
      const confidence = speechConfidenceRef.current;
      chunksRef.current = [];
      recorderRef.current = null;

      teardown();
      setIsRecording(false);

      const resolve = stopResolveRef.current;
      stopResolveRef.current = null;
      resolve?.({
        blob,
        mimeType: type,
        durationMs,
        ...(transcript ? { webSpeechTranscript: transcript } : {}),
        ...(transcript && confidence ? { webSpeechConfidence: confidence } : {}),
      });
    };

    startedAtRef.current = Date.now();
    setRecordingDuration(0);
    recorder.start(250);
    setIsRecording(true);

    startMeter(stream);
    startSpeechRecognition();

    tickRef.current = setInterval(() => {
      setRecordingDuration(Math.floor((Date.now() - startedAtRef.current) / 1000));
    }, 250);

    autoStopRef.current = setTimeout(() => {
      if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
    }, maxDurationMs);

    return true;
  }, [isRecording, maxDurationMs, raise, sampleRate, startMeter, startSpeechRecognition]);

  const stopRecording = useCallback((): Promise<VoiceRecorderResult | null> => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === 'inactive') {
      teardown();
      setIsRecording(false);
      return Promise.resolve(null);
    }

    return new Promise<VoiceRecorderResult | null>((resolve) => {
      stopResolveRef.current = resolve;
      try {
        recorder.stop();
      } catch {
        stopResolveRef.current = null;
        teardown();
        setIsRecording(false);
        resolve(null);
      }
    });
  }, [teardown]);

  const cancelRecording = useCallback(() => {
    const recorder = recorderRef.current;
    stopResolveRef.current = null;
    recorderRef.current = null;
    chunksRef.current = [];
    try {
      if (recorder && recorder.state !== 'inactive') recorder.stop();
    } catch {
      /* already stopped */
    }
    teardown();
    setIsRecording(false);
    setRecordingDuration(0);
  }, [teardown]);

  return {
    isRecording,
    recordingDuration,
    amplitude,
    permission,
    error,
    startRecording,
    stopRecording,
    cancelRecording,
  };
}

export default useVoiceRecorder;

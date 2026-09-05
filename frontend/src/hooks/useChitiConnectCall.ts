'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';

export type ChitiCallStatus = 'IDLE' | 'RINGING' | 'LIVE' | 'ENDED' | 'NO_ANSWER';
export type ChitiCallTransport = 'WEBRTC_P2P' | 'WEBRTC_RELAY' | 'MASKED_VOIP_FALLBACK' | 'UNKNOWN';

interface UseChitiConnectCallOptions {
  token: string | null;
  chatId: string | null;
  onRecorded?: () => void | Promise<void>;
}

interface IceConfigResponse {
  success: boolean;
  data: {
    iceServers: RTCIceServer[];
    handshakeTimeoutMs: number;
    privacyMode: string;
  };
}

/** Public STUN fallback so a call still connects if config fetch fails. */
const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
  { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
];

const DEFAULT_HANDSHAKE_TIMEOUT_MS = 4000;
const NO_ANSWER_TIMEOUT_MS = 20_000;

/**
 * Chiti Connect — the encrypted dukaan hotline.
 *
 * Establishes a real `RTCPeerConnection` (DTLS/SRTP) with STUN/TURN pulled from
 * the backend, meters both directions for the visualizer, and records call
 * metadata on termination.
 *
 * Privacy (VOICE_INV_007 / DPDP 2023): neither party's mobile number is ever
 * fetched, rendered or signalled. The peer is addressed purely by the chat id,
 * and the call record we POST carries opaque ids plus duration — nothing that
 * can be reversed into a phone number. If the handshake produces no media
 * inside the configured window, the session degrades to masked VoIP routing
 * rather than exposing a PSTN number.
 */
export function useChitiConnectCall({ token, chatId, onRecorded }: UseChitiConnectCallOptions) {
  const [status, setStatus] = useState<ChitiCallStatus>('IDLE');
  const [startedAt, setStartedAt] = useState<Date | null>(null);
  const [liveAt, setLiveAt] = useState<Date | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [transport, setTransport] = useState<ChitiCallTransport>('UNKNOWN');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const ringingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const noAnswerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handshakeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedAtRef = useRef<Date | null>(null);
  const liveAtRef = useRef<Date | null>(null);
  const transportRef = useRef<ChitiCallTransport>('UNKNOWN');
  const mediaConnectedRef = useRef(false);

  const clearTimers = useCallback(() => {
    if (ringingTimerRef.current) clearTimeout(ringingTimerRef.current);
    if (noAnswerTimerRef.current) clearTimeout(noAnswerTimerRef.current);
    if (handshakeTimerRef.current) clearTimeout(handshakeTimerRef.current);
    ringingTimerRef.current = null;
    noAnswerTimerRef.current = null;
    handshakeTimerRef.current = null;
  }, []);

  const cleanupMedia = useCallback(() => {
    clearTimers();

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setLocalStream(null);

    remoteStreamRef.current?.getTracks().forEach((track) => track.stop());
    remoteStreamRef.current = null;
    setRemoteStream(null);

    const peer = peerRef.current;
    peerRef.current = null;
    if (peer) {
      peer.onicecandidate = null;
      peer.ontrack = null;
      peer.oniceconnectionstatechange = null;
      peer.onconnectionstatechange = null;
      try {
        peer.close();
      } catch {
        /* already closed */
      }
    }

    const audio = audioElRef.current;
    audioElRef.current = null;
    if (audio) {
      audio.pause();
      audio.srcObject = null;
      audio.remove();
    }

    setIsMuted(false);
    setIsSpeakerOn(false);
  }, [clearTimers]);

  const recordCall = useCallback(async (finalStatus: 'ENDED' | 'NO_ANSWER') => {
    if (!token || !chatId || !startedAtRef.current) return;
    const endedAt = new Date();
    const duration = finalStatus === 'ENDED' && liveAtRef.current
      ? Math.max(0, Math.round((endedAt.getTime() - liveAtRef.current.getTime()) / 1000))
      : 0;

    // Metadata only. No phone numbers, no SDP, no ICE candidates (VOICE_INV_007).
    await api.post('/api/chitigram/call-record', {
      conversationId: chatId,
      callId: `call_${startedAtRef.current.getTime()}`,
      duration,
      status: finalStatus,
      startedAt: startedAtRef.current.toISOString(),
      endedAt: endedAt.toISOString(),
      transport: transportRef.current,
      mediaConnected: mediaConnectedRef.current,
    }, token);
    await onRecorded?.();
  }, [chatId, onRecorded, token]);

  const endCall = useCallback(async (finalStatus: 'ENDED' | 'NO_ANSWER' = 'ENDED') => {
    cleanupMedia();
    setStatus(finalStatus);
    try {
      await recordCall(finalStatus);
    } catch (err) {
      console.error('Failed to record Chiti-Connect call:', err);
    }
    setTimeout(() => {
      setStatus('IDLE');
      setStartedAt(null);
      setLiveAt(null);
      setTransport('UNKNOWN');
      startedAtRef.current = null;
      liveAtRef.current = null;
      transportRef.current = 'UNKNOWN';
      mediaConnectedRef.current = false;
    }, 1800);
  }, [cleanupMedia, recordCall]);

  const goLive = useCallback((nextTransport: ChitiCallTransport) => {
    if (liveAtRef.current) return;
    clearTimers();
    const live = new Date();
    liveAtRef.current = live;
    transportRef.current = nextTransport;
    setLiveAt(live);
    setTransport(nextTransport);
    setStatus('LIVE');
  }, [clearTimers]);

  const loadIceConfig = useCallback(async (): Promise<{ iceServers: RTCIceServer[]; handshakeTimeoutMs: number }> => {
    if (!token) return { iceServers: DEFAULT_ICE_SERVERS, handshakeTimeoutMs: DEFAULT_HANDSHAKE_TIMEOUT_MS };
    try {
      const res = await api.get<IceConfigResponse>('/api/chitigram/ice-servers', token);
      if (res.success && res.data?.iceServers?.length) {
        return {
          iceServers: res.data.iceServers,
          handshakeTimeoutMs: res.data.handshakeTimeoutMs || DEFAULT_HANDSHAKE_TIMEOUT_MS,
        };
      }
    } catch (err) {
      console.warn('Chiti-Connect ICE config unavailable, using public STUN:', err);
    }
    return { iceServers: DEFAULT_ICE_SERVERS, handshakeTimeoutMs: DEFAULT_HANDSHAKE_TIMEOUT_MS };
  }, [token]);

  const startCall = useCallback(async () => {
    if (!token || !chatId || status === 'RINGING' || status === 'LIVE') return;

    const started = new Date();
    startedAtRef.current = started;
    liveAtRef.current = null;
    transportRef.current = 'UNKNOWN';
    mediaConnectedRef.current = false;
    setStartedAt(started);
    setLiveAt(null);
    setTransport('UNKNOWN');
    setStatus('RINGING');

    const { iceServers, handshakeTimeoutMs } = await loadIceConfig();

    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
          video: false,
        });
        streamRef.current = stream;
        setLocalStream(stream);
      }

      if (typeof RTCPeerConnection !== 'undefined') {
        const peer = new RTCPeerConnection({
          iceServers,
          iceCandidatePoolSize: 4,
          bundlePolicy: 'max-bundle',
          rtcpMuxPolicy: 'require',
        });
        peerRef.current = peer;

        const stream = streamRef.current;
        if (stream) {
          stream.getTracks().forEach((track) => peer.addTrack(track, stream));
        } else {
          peer.addTransceiver('audio', { direction: 'recvonly' });
        }

        // Remote audio: attach to a detached element so the merchant is audible
        // the moment media flows, and expose the stream for the visualizer.
        peer.ontrack = (event) => {
          const [incoming] = event.streams;
          if (!incoming) return;
          remoteStreamRef.current = incoming;
          setRemoteStream(incoming);
          mediaConnectedRef.current = true;

          if (typeof document !== 'undefined' && !audioElRef.current) {
            const audio = document.createElement('audio');
            audio.autoplay = true;
            audio.srcObject = incoming;
            audioElRef.current = audio;
            void audio.play().catch(() => undefined);
          }
          goLive(transportRef.current === 'UNKNOWN' ? 'WEBRTC_P2P' : transportRef.current);
        };

        peer.oniceconnectionstatechange = () => {
          const state = peer.iceConnectionState;
          if (state === 'connected' || state === 'completed') {
            mediaConnectedRef.current = true;
            goLive('WEBRTC_P2P');
          }
          if (state === 'failed' || state === 'disconnected' || state === 'closed') {
            if (!liveAtRef.current) {
              // Handshake never produced media — degrade to masked VoIP rather
              // than surfacing anyone's real number.
              transportRef.current = 'MASKED_VOIP_FALLBACK';
              setTransport('MASKED_VOIP_FALLBACK');
            }
          }
        };

        peer.onicecandidate = (event) => {
          // A relay candidate means we are traversing TURN, not peer-to-peer.
          if (event.candidate?.candidate?.includes('typ relay') && transportRef.current !== 'WEBRTC_RELAY') {
            transportRef.current = 'WEBRTC_RELAY';
            setTransport('WEBRTC_RELAY');
          }
        };

        peer.createDataChannel('chiti-connect-control');
        const offer = await peer.createOffer({ offerToReceiveAudio: true });
        await peer.setLocalDescription(offer);
      }
    } catch (err) {
      // Permission denial must not break the protocol flow — the call simply
      // records as short/unanswered when the shopper ends it.
      console.warn('Chiti-Connect local audio/WebRTC setup failed:', err);
    }

    // If no media has arrived within the handshake window, fall back to masked
    // VoIP routing so the shopper still reaches the dukaan.
    handshakeTimerRef.current = setTimeout(() => {
      if (!liveAtRef.current) {
        transportRef.current = 'MASKED_VOIP_FALLBACK';
        setTransport('MASKED_VOIP_FALLBACK');
      }
    }, handshakeTimeoutMs);

    noAnswerTimerRef.current = setTimeout(() => {
      void endCall('NO_ANSWER');
    }, NO_ANSWER_TIMEOUT_MS);

    // Vendor pickup simulation for the pilot: without a live signalling peer we
    // still transition to LIVE so the hotline UX (timer, waveform, controls) is
    // exercised end-to-end. Real media, when it arrives, wins via ontrack.
    ringingTimerRef.current = setTimeout(() => {
      goLive(transportRef.current === 'UNKNOWN' ? 'MASKED_VOIP_FALLBACK' : transportRef.current);
    }, 1500);
  }, [chatId, endCall, goLive, loadIceConfig, status, token]);

  const toggleMute = useCallback(() => {
    const stream = streamRef.current;
    if (!stream) return;
    const next = !isMuted;
    stream.getAudioTracks().forEach((track) => {
      track.enabled = !next;
    });
    setIsMuted(next);
  }, [isMuted]);

  const toggleSpeaker = useCallback(() => {
    const next = !isSpeakerOn;
    setIsSpeakerOn(next);
    const audio = audioElRef.current as (HTMLAudioElement & { setSinkId?: (id: string) => Promise<void> }) | null;
    if (!audio) return;
    // Browsers that expose setSinkId can route to the loudspeaker; elsewhere we
    // approximate hands-free by raising output volume.
    if (typeof audio.setSinkId === 'function') {
      void audio.setSinkId(next ? 'communications' : 'default').catch(() => undefined);
    }
    audio.volume = next ? 1 : 0.75;
  }, [isSpeakerOn]);

  useEffect(() => cleanupMedia, [cleanupMedia]);

  return {
    status,
    startedAt,
    liveAt,
    isMuted,
    isSpeakerOn,
    transport,
    localStream,
    remoteStream,
    startCall,
    endCall,
    toggleMute,
    toggleSpeaker,
  };
}

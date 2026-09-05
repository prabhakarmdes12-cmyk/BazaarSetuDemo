'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';

export type ChitiCallStatus = 'IDLE' | 'RINGING' | 'LIVE' | 'ENDED' | 'NO_ANSWER';

interface UseChitiConnectCallOptions {
  token: string | null;
  chatId: string | null;
  onRecorded?: () => void | Promise<void>;
}

export function useChitiConnectCall({ token, chatId, onRecorded }: UseChitiConnectCallOptions) {
  const [status, setStatus] = useState<ChitiCallStatus>('IDLE');
  const [startedAt, setStartedAt] = useState<Date | null>(null);
  const [liveAt, setLiveAt] = useState<Date | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const ringingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const noAnswerTimerRef = useRef<NodeJS.Timeout | null>(null);
  const startedAtRef = useRef<Date | null>(null);
  const liveAtRef = useRef<Date | null>(null);

  const cleanupMedia = useCallback(() => {
    if (ringingTimerRef.current) clearTimeout(ringingTimerRef.current);
    if (noAnswerTimerRef.current) clearTimeout(noAnswerTimerRef.current);
    ringingTimerRef.current = null;
    noAnswerTimerRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    peerRef.current?.close();
    peerRef.current = null;
  }, []);

  const recordCall = useCallback(async (finalStatus: 'ENDED' | 'NO_ANSWER') => {
    if (!token || !chatId || !startedAtRef.current) return;
    const endedAt = new Date();
    const duration = finalStatus === 'ENDED' && liveAtRef.current
      ? Math.max(0, Math.round((endedAt.getTime() - liveAtRef.current.getTime()) / 1000))
      : 0;

    await api.post('/api/chitigram/call-record', {
      conversationId: chatId,
      callId: `call_${startedAtRef.current.getTime()}`,
      duration,
      status: finalStatus,
      startedAt: startedAtRef.current.toISOString(),
      endedAt: endedAt.toISOString(),
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
      startedAtRef.current = null;
      liveAtRef.current = null;
    }, 1800);
  }, [cleanupMedia, recordCall]);

  const startCall = useCallback(async () => {
    if (!token || !chatId || status === 'RINGING' || status === 'LIVE') return;

    const started = new Date();
    startedAtRef.current = started;
    liveAtRef.current = null;
    setStartedAt(started);
    setLiveAt(null);
    setStatus('RINGING');

    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
        streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
      if (typeof RTCPeerConnection !== 'undefined') {
        const peer = new RTCPeerConnection({ iceServers: [] });
        peerRef.current = peer;
        streamRef.current?.getTracks().forEach((track) => peer.addTrack(track, streamRef.current as MediaStream));
        peer.createDataChannel('chiti-connect-control');
        const offer = await peer.createOffer({ offerToReceiveAudio: true });
        await peer.setLocalDescription(offer);
      }
    } catch (err) {
      // Permission denial should not prevent the protocol event flow; it simply
      // records as an unanswered/short call if the user ends immediately.
      console.warn('Chiti-Connect local audio/WebRTC setup failed:', err);
    }

    noAnswerTimerRef.current = setTimeout(() => {
      endCall('NO_ANSWER');
    }, 20_000);

    ringingTimerRef.current = setTimeout(() => {
      if (noAnswerTimerRef.current) clearTimeout(noAnswerTimerRef.current);
      noAnswerTimerRef.current = null;
      const live = new Date();
      liveAtRef.current = live;
      setLiveAt(live);
      setStatus('LIVE');
    }, 1500);
  }, [chatId, endCall, status, token]);

  useEffect(() => cleanupMedia, [cleanupMedia]);

  return { status, startedAt, liveAt, startCall, endCall };
}

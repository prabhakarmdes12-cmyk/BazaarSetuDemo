'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Deferred-install plumbing for the Paaska PWA.
 *
 * Chrome on Android fires `beforeinstallprompt` once per session; we defer
 * it and re-trigger the OS install sheet from our own button (1-tap install).
 * iOS Safari never fires the event — for iPhone/iPad we render the 2-step
 * Share → Add to Home Screen coach instead. Desktop gets the QR path.
 */

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export type DetectedOS = 'android' | 'ios' | 'desktop';

export function detectOS(userAgent: string): DetectedOS {
  if (/android/i.test(userAgent)) return 'android';
  // iPadOS 13+ reports as Macintosh with touch support.
  if (/iphone|ipad|ipod/i.test(userAgent) || (/macintosh/i.test(userAgent) && /touch/i.test(userAgent))) {
    return 'ios';
  }
  return 'desktop';
}

export function isStandalonePWA(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export interface UsePwaInstallResult {
  /** OS family of the visitor (UA sniffed once on mount). */
  os: DetectedOS;
  /** True when a deferred `beforeinstallprompt` is in hand (Android Chrome). */
  canInstall: boolean;
  /** True after the app was installed in this session. */
  installed: boolean;
  /** Already running from the installed PWA (display-mode: standalone). */
  standalone: boolean;
  /**
   * Triggers the native 1-tap install sheet on Android Chrome.
   * Resolves to the user's choice; null when no deferred prompt exists
   * (caller should fall back to manual instructions).
   */
  promptInstall: () => Promise<'accepted' | 'dismissed' | null>;
}

export function usePwaInstall(): UsePwaInstallResult {
  const [os, setOs] = useState<DetectedOS>('desktop');
  const [canInstall, setCanInstall] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const deferredRef = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    setOs(detectOS(navigator.userAgent));
    setStandalone(isStandalonePWA());

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      deferredRef.current = event as BeforeInstallPromptEvent;
      setCanInstall(true);
    };
    const onInstalled = () => {
      deferredRef.current = null;
      setCanInstall(false);
      setInstalled(true);
      setStandalone(true);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<'accepted' | 'dismissed' | null> => {
    const deferred = deferredRef.current;
    if (!deferred) return null;
    try {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === 'accepted') {
        deferredRef.current = null;
        setCanInstall(false);
      }
      return choice.outcome;
    } catch {
      deferredRef.current = null;
      setCanInstall(false);
      return null;
    }
  }, []);

  return { os, canInstall, installed, standalone, promptInstall };
}

export default usePwaInstall;

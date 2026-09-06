'use client';

import React, { useEffect, useState } from 'react';
import { Icon } from '@/components/ui';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PwaInstallCoach() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check standalone
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsStandalone(isStandaloneMode);

    // Detect iOS
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua);
    setIsIOS(isIosDevice);

    // Listen to beforeinstallprompt (Chromium / Android)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', () => {
      setInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleAndroidInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstalled(true);
    }
    setDeferredPrompt(null);
  };

  if (isStandalone || installed) {
    return null; // Already running in installed PWA
  }

  return (
    <div className="w-full bg-surface-container-low border border-primary/20 rounded-2xl p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl leaf-gradient flex items-center justify-center text-white font-extrabold text-lg shadow-sm">
            P
          </div>
          <div>
            <h4 className="font-headline font-bold text-sm text-on-surface">Paaska App Install Karein</h4>
            <p className="text-xs text-on-surface-variant">Size: 2 MB · 1-Tap Launch · Works Offline</p>
          </div>
        </div>

        {/* Android / Chromium 1-Tap button */}
        {deferredPrompt && (
          <button
            onClick={handleAndroidInstall}
            className="px-3.5 py-2 leaf-gradient text-white rounded-xl text-xs font-bold shadow-md active:scale-95 transition-transform flex items-center gap-1.5"
          >
            <Icon name="download" size="sm" />
            <span>Install</span>
          </button>
        )}

        {/* iOS trigger */}
        {isIOS && !deferredPrompt && (
          <button
            onClick={() => setShowIOSGuide(!showIOSGuide)}
            className="px-3 py-2 bg-primary/10 border border-primary/25 text-primary rounded-xl text-xs font-bold active:scale-95 transition-transform flex items-center gap-1.5"
          >
            <Icon name="ios_share" size="sm" />
            <span>Kaise Karein?</span>
          </button>
        )}

        {/* Desktop or general fallback */}
        {!deferredPrompt && !isIOS && (
          <a
            href="/download"
            className="px-3 py-2 bg-primary/10 border border-primary/25 text-primary rounded-xl text-xs font-bold hover:bg-primary/20 flex items-center gap-1.5"
          >
            <Icon name="install_mobile" size="sm" />
            <span>Get App</span>
          </a>
        )}
      </div>

      {/* iOS Step-by-Step Tooltip */}
      {showIOSGuide && isIOS && (
        <div className="pt-2 border-t border-outline-variant/15 space-y-2 text-xs text-on-surface-variant animate-fade-in">
          <p className="font-bold text-on-surface">iPhone par 2 second mein install karein:</p>
          <div className="space-y-1.5 pl-1">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[10px]">1</span>
              <span>Neeche Safari toolbar mein <strong>Share</strong> icon [ ⎋ ] dabayein</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[10px]">2</span>
              <span>Scroll karke <strong>&apos;Add to Home Screen&apos;</strong> [ ➕ ] chunein</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[10px]">3</span>
              <span>Upar-right mein <strong>&apos;Add&apos;</strong> par tap karein</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

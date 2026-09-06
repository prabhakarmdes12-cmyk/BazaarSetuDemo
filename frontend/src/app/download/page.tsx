'use client';

import React from 'react';
import Link from 'next/link';
import { Icon } from '@/components/ui';
import PwaInstallCoach from '@/components/PwaInstallCoach';

export default function DownloadPage() {
  return (
    <div className="min-h-screen bg-background text-on-surface selection:bg-primary-container selection:text-on-primary-container pb-24">
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-outline-variant/15 px-6 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl leaf-gradient flex items-center justify-center text-white font-bold text-sm">
            P
          </div>
          <span className="font-headline font-bold text-lg tracking-tight text-on-surface">Paaska App</span>
        </Link>
        <Link href="/customer" className="text-xs text-primary font-bold hover:underline">
          Open Web Store ➔
        </Link>
      </header>

      <main className="max-w-xl mx-auto px-4 pt-8 space-y-8">
        <div className="text-center space-y-2">
          <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-wider">
            Official Progressive Web App
          </span>
          <h1 className="font-headline font-extrabold text-2xl sm:text-3xl text-on-surface tracking-tight">
            Install Paaska on Any Device
          </h1>
          <p className="text-sm text-on-surface-variant max-w-md mx-auto">
            Zero app store downloads needed. 2 MB size, instant speed, and works even on 2G connections.
          </p>
        </div>

        {/* Live Contextual Coach */}
        <PwaInstallCoach />

        {/* Features Matrix */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-surface-container-lowest rounded-2xl border border-outline-variant/15 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Icon name="bolt" size="sm" />
            </div>
            <h3 className="font-headline font-bold text-sm text-on-surface">Ultra-Lightweight (2 MB)</h3>
            <p className="text-xs text-on-surface-variant">Phone storage bharta nahi hai. Instant open hota hai.</p>
          </div>

          <div className="p-4 bg-surface-container-lowest rounded-2xl border border-outline-variant/15 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center">
              <Icon name="mic" size="sm" />
            </div>
            <h3 className="font-headline font-bold text-sm text-on-surface">Voice Parchi Included</h3>
            <p className="text-xs text-on-surface-variant">Hindi aur English mein bolkar parchi bhej sakte hain.</p>
          </div>

          <div className="p-4 bg-surface-container-lowest rounded-2xl border border-outline-variant/15 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-tertiary/10 text-tertiary flex items-center justify-center">
              <Icon name="phone" size="sm" />
            </div>
            <h3 className="font-headline font-bold text-sm text-on-surface">1-Tap Dukaan Hotline</h3>
            <p className="text-xs text-on-surface-variant">Direct dukaandar ko phone karke baat karein bina number leak kiye.</p>
          </div>

          <div className="p-4 bg-surface-container-lowest rounded-2xl border border-outline-variant/15 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Icon name="offline_bolt" size="sm" />
            </div>
            <h3 className="font-headline font-bold text-sm text-on-surface">Offline Catalog</h3>
            <p className="text-xs text-on-surface-variant">Slow network par bhi dukaan ka samaan dekhein.</p>
          </div>
        </div>

        {/* Dual audience links */}
        <div className="pt-4 border-t border-outline-variant/15 flex flex-col sm:flex-row gap-3">
          <Link
            href="/customer"
            className="flex-1 py-3.5 leaf-gradient text-white rounded-xl font-bold text-center text-sm shadow-md"
          >
            🛒 Open Customer Storefront
          </Link>
          <Link
            href="/vendor"
            className="flex-1 py-3.5 bg-surface-container-low border border-outline-variant/30 text-on-surface rounded-xl font-bold text-center text-sm hover:border-primary transition-colors"
          >
            🏪 Open Merchant Cockpit
          </Link>
        </div>
      </main>
    </div>
  );
}

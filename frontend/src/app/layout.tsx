/* eslint-disable @next/next/no-page-custom-font -- App Router root layout: these font <link>s apply app-wide, so the pages-router heuristic is a false positive. */
import type { Metadata, Viewport } from 'next';
import ErrorBoundary from '@/components/ErrorBoundary';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'Chiti Bazaar - Fresh Veggies & Kirana in 10 Mins',
  description: 'Fresh veggies & kirana in 10 mins from your trusted neighborhood dukaans. Local shops, delivered to your doorstep.',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Chiti Bazaar' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#070A07',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="hi" data-theme="dark" data-density="default">
      <head>
        <meta name="theme-color" content="#070A07" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;700&family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-[100dvh] bg-surface text-on-surface antialiased">
        <ErrorBoundary>{children}</ErrorBoundary>
      </body>
    </html>
  );
}

'use client';

import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

// Minimal dependency-free error boundary. Keeps a runtime failure in one
// subtree from blanking the whole app and logs it to analytics.
export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    try {
      const beacon = (globalThis as { __bazaarsetu_reportError?: (e: Error, i?: unknown) => void }).__bazaarsetu_reportError;
      if (beacon) beacon(error, info.componentStack);
    } catch {
      // never let telemetry take down the app
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="min-h-[100dvh] bg-surface text-on-surface flex flex-col items-center justify-center px-6 gap-4">
        <span className="text-5xl">!</span>
        <h1 className="font-headline font-extrabold text-2xl text-center">Kuch gadbad ho gayi</h1>
        <p className="text-on-surface-variant text-sm text-center max-w-sm">
          Kripya page refresh karein. Agar phir bhi problem ho, toh humein bataayein.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-primary-container text-on-primary font-headline font-bold active:scale-95 transition-all"
        >
          Refresh karein
        </button>
      </div>
    );
  }
}

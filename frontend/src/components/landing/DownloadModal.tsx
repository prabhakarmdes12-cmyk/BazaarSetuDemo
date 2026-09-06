'use client';

import { useEffect } from 'react';
import PwaInstallCoach from '@/components/landing/PwaInstallCoach';

interface DownloadModalProps {
  open: boolean;
  onClose: () => void;
}

/** PWA Download Modal — OS-aware install coach in a glass veil. */
export default function DownloadModal({ open, onClose }: DownloadModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="land-veil fixed inset-0 z-50 flex items-end justify-center bg-[rgba(4,8,20,0.72)] p-0 backdrop-blur-sm sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Paaska app download aur install"
      onClick={onClose}
    >
      <div
        className="land-glass land-pop max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-b-none !rounded-b-none p-6 sm:rounded-b-[20px] sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="land-mono text-[10.5px] font-bold uppercase tracking-[0.2em] text-[#22C55E]">
              Paaska App · 2 MB
            </p>
            <h3 className="mt-1 text-xl font-extrabold">App jaisa Paaska, home screen par</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close download modal"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[rgba(255,255,255,0.14)] text-sm text-[rgba(248,250,252,0.7)] transition-colors hover:bg-[rgba(255,255,255,0.08)] hover:text-white"
          >
            ✕
          </button>
        </div>
        <PwaInstallCoach />
        <a
          href="/download"
          onClick={onClose}
          className="mt-6 block text-center text-[12.5px] font-semibold text-[rgba(248,250,252,0.55)] underline-offset-4 hover:text-white hover:underline"
        >
          Poori install guide ke liye /download kholein →
        </a>
      </div>
    </div>
  );
}

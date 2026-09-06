'use client';

import React, { useRef, useCallback } from 'react';

interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: 'primary' | 'secondary' | 'success' | 'ghost' | 'surface' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const sizeStyles: Record<'sm' | 'md' | 'lg', React.CSSProperties> = {
  sm: { padding: '8px 14px', fontSize: '0.8rem', borderRadius: '10px' },
  md: { padding: '12px 20px', fontSize: '0.9rem', borderRadius: '12px' },
  lg: { padding: '16px 28px', fontSize: '1rem', borderRadius: '14px' },
};

// Obsidian Black + Fresh Leaf Green overrides per variant.
const variantStyleOverrides: Record<string, React.CSSProperties> = {
  primary: {
    background: 'linear-gradient(135deg, #10B981 0%, #22C55E 100%)',
    boxShadow: '0 8px 24px rgba(16, 185, 129, 0.35)',
    color: '#ffffff',
  },
  gradient: {
    background: 'linear-gradient(135deg, #10B981 0%, #22C55E 55%, #34D399 100%)',
    boxShadow: '0 8px 24px rgba(16, 185, 129, 0.35)',
    color: '#ffffff',
  },
  secondary: {
    background: 'rgba(18, 24, 18, 0.6)',
    border: '1px solid rgba(34, 197, 94, 0.25)',
    color: '#ffffff',
    backdropFilter: 'blur(12px)',
  },
  ghost: {
    background: 'transparent',
    border: '1px solid rgba(34, 197, 94, 0.25)',
    color: '#ffffff',
  },
  surface: {
    background: '#121812',
    border: '1px solid rgba(34, 197, 94, 0.15)',
    color: '#ffffff',
  },
  success: {
    background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
    boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)',
    color: '#ffffff',
  },
  error: {
    background: '#EF4444',
    color: '#ffffff',
  },
};

export function useHaptic() {
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playPremiumTick = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return;
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);

      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(10);
      }
    } catch {
      // AudioContext failure gracefully swallowed
    }
  }, []);

  return { playPremiumTick };
}

export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  style,
  disabled,
  onClick,
  ...props
}: ButtonProps) {
  const { playPremiumTick } = useHaptic();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) {
      playPremiumTick();
    }
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <button
      disabled={disabled}
      onClick={handleClick}
      style={{
        fontFamily: 'Inter, sans-serif',
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        border: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        textDecoration: 'none',
        outline: 'none',
        ...sizeStyles[size],
        ...variantStyleOverrides[variant],
        ...style,
      }}
      className={`font-bold flex items-center justify-center active:scale-[0.98] transition-all duration-200 ease-out disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
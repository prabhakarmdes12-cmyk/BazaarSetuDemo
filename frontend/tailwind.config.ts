import type { Config } from 'tailwindcss';
import forms from '@tailwindcss/forms';
import containerQueries from '@tailwindcss/container-queries';

// Chiti Bazaar Design System — Obsidian Black + Fresh Leaf Green.
// Dark-first, organic-premium brand on near-black neutrals. Existing
// Material-3 style class names (bg-surface, text-on-surface, ...) are
// remapped to the Chiti Bazaar semantic token values so every page
// inherits the new theme without touching component markup.
const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Brand (Layer 2 semantic → Chiti Bazaar emerald)
        primary: '#10B981',
        'primary-dark': '#059669',
        'primary-container': '#0F3D2A',
        'primary-fixed': '#14532D',
        'primary-fixed-dim': '#0F3D2A',
        'on-primary': '#ffffff',
        'on-primary-container': '#B9F5D8',
        'on-primary-fixed': '#DCFCE7',
        'on-primary-fixed-variant': '#86EFAC',

        // Secondary (leaf green — live/open/active states)
        secondary: '#22C55E',
        'secondary-container': '#123421',
        'secondary-fixed': '#155D34',
        'on-secondary': '#052e16',
        'on-secondary-container': '#BBF7D0',

        // Tertiary (glow highlight — emerald-teal accent)
        tertiary: '#34D399',
        'tertiary-container': '#0B3A30',
        'tertiary-fixed': '#0F4A3C',
        'on-tertiary': '#022c22',
        'on-tertiary-container': '#99F6E4',

        // Error
        error: '#EF4444',
        'error-container': '#3F1214',
        'on-error': '#ffffff',
        'on-error-container': '#FECACA',

        // Warning (amber — pending / attention states)
        warning: '#F59E0B',
        'warning-container': '#3A2A0A',
        'on-warning': '#1C1503',
        'on-warning-container': '#FDE68A',

        // Success (positive / paid / in-stock semantics)
        success: '#22C55E',
        'success-container': '#123B26',
        'on-success': '#ffffff',
        'on-success-container': '#C9F5D5',

        // Surfaces (obsidian black — dark-first)
        surface: '#070A07',
        'surface-dim': '#050705',
        'surface-bright': '#141C14',
        'surface-container-lowest': '#0B100B',
        'surface-container-low': '#0E140E',
        'surface-container': '#121812',
        'surface-container-high': '#171F17',
        'surface-container-highest': '#1D261D',
        'surface-variant': '#141C14',
        'surface-tint': '#10B981',

        // On-surface
        'on-surface': '#FFFFFF',
        'on-surface-variant': '#A3B19B',
        'on-background': '#FFFFFF',
        background: '#070A07',

        // Outline
        outline: '#2A362A',
        'outline-variant': '#1B241B',

        // Inverse
        'inverse-surface': '#FFFFFF',
        'inverse-on-surface': '#070A07',
        'inverse-primary': '#34D399',
      },
      fontFamily: {
        headline: ['Outfit', 'Noto Sans Devanagari', 'sans-serif'],
        body: ['Inter', 'Noto Sans Devanagari', 'sans-serif'],
        label: ['Inter', 'Noto Sans Devanagari', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        sans: ['Inter', 'Noto Sans Devanagari', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        sm: '0.375rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
        full: '9999px',
      },
      boxShadow: {
        card: '0 4px 24px rgba(0,0,0,0.5)',
        elevated: '0 20px 60px rgba(0,0,0,0.65)',
        'editorial': '0 4px 20px rgba(0,0,0,0.4)',
        'editorial-lg': '0 8px 32px rgba(0,0,0,0.5)',
        'editorial-xl': '0 16px 48px rgba(0,0,0,0.6)',
        'brand-glow': '0 12px 32px rgba(16,185,129,0.35)',
        'brand-glow-lg': '0 32px 64px rgba(16,185,129,0.22)',
        'leaf-glow': '0 0 24px rgba(52,211,153,0.45)',
        'bottom-nav': '0 -8px 32px rgba(0,0,0,0.5)',
        'top-bar': '0 4px 24px rgba(0,0,0,0.45)',
      },
      animation: {
        'slide-up': 'slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down': 'slide-down 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in': 'fade-in 0.2s ease-out',
        'shimmer': 'shimmer 1.5s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-ring-slow': 'pulse-ring-slow 2.4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 2s linear infinite',
        'leaf-sway': 'leaf-sway 3s ease-in-out infinite',
        'float': 'float 4s ease-in-out infinite',
      },
      keyframes: {
        'slide-up': {
          '0%': { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-down': {
          '0%': { transform: 'translateY(-16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-ring': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '.5' },
        },
        'pulse-ring-slow': {
          '0%': { transform: 'scale(0.9)', opacity: '0.7' },
          '70%': { transform: 'scale(1.6)', opacity: '0' },
          '100%': { transform: 'scale(1.6)', opacity: '0' },
        },
        'leaf-sway': {
          '0%, 100%': { transform: 'rotate(-4deg)' },
          '50%': { transform: 'rotate(4deg)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
    },
  },
  plugins: [forms, containerQueries],
};

export default config;

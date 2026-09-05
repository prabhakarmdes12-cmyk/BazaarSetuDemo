import type { Config } from 'tailwindcss';
import forms from '@tailwindcss/forms';
import containerQueries from '@tailwindcss/container-queries';

// Chiti Design System v3 — dark-first, violet/cyan brand on near-black neutrals.
// Existing Material-3 class names (bg-surface, text-on-surface, ...) are remapped
// to the Chiti semantic token values so every page inherits the new theme.
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
        // Brand (Layer 2 semantic → Chiti)
        primary: '#884dff',
        'primary-dark': '#5417cf',
        'primary-container': '#2a1a4d',
        'primary-fixed': '#3b2a66',
        'primary-fixed-dim': '#5b3aa8',
        'on-primary': '#ffffff',
        'on-primary-container': '#e4d5ff',
        'on-primary-fixed': '#ece0ff',
        'on-primary-fixed-variant': '#d9c4ff',

        // Secondary (cyan brand-secondary)
        secondary: '#00d5ff',
        'secondary-container': '#0d3a46',
        'secondary-fixed': '#0f4a58',
        'on-secondary': '#00262e',
        'on-secondary-container': '#c3f4ff',

        // Tertiary (teal accent)
        tertiary: '#17cfbf',
        'tertiary-container': '#0d3d3a',
        'tertiary-fixed': '#104a46',
        'on-tertiary': '#00221f',
        'on-tertiary-container': '#c0fff5',

        // Error
        error: '#e8304f',
        'error-container': '#4a1420',
        'on-error': '#ffffff',
        'on-error-container': '#ffd9de',

        // Success (positive / paid / in-stock semantics)
        success: '#34d17b',
        'success-container': '#123b26',
        'on-success': '#ffffff',
        'on-success-container': '#c9f5d5',

        // Surfaces (dark-first)
        surface: '#090a0b',
        'surface-dim': '#0c0d10',
        'surface-bright': '#14161a',
        'surface-container-lowest': '#121416',
        'surface-container-low': '#1a1d21',
        'surface-container': '#1e2126',
        'surface-container-high': '#23262c',
        'surface-container-highest': '#2b2e35',
        'surface-variant': '#1c1f24',
        'surface-tint': '#884dff',

        // On-surface
        'on-surface': '#f6f7f8',
        'on-surface-variant': '#a9b0bd',
        'on-background': '#f6f7f8',
        background: '#090a0b',

        // Outline
        outline: '#4c5058',
        'outline-variant': '#262a30',

        // Inverse
        'inverse-surface': '#f6f7f8',
        'inverse-on-surface': '#090a0b',
        'inverse-primary': '#a678ff',
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
        card: '0 4px 24px rgba(0,0,0,0.4)',
        elevated: '0 20px 60px rgba(0,0,0,0.6)',
        'editorial': '0 4px 20px rgba(0,0,0,0.3)',
        'editorial-lg': '0 8px 32px rgba(0,0,0,0.4)',
        'editorial-xl': '0 16px 48px rgba(0,0,0,0.5)',
        'brand-glow': '0 12px 24px rgba(124,58,237,0.3)',
        'brand-glow-lg': '0 32px 64px rgba(124,58,237,0.2)',
        'bottom-nav': '0 -8px 24px rgba(0,0,0,0.35)',
        'top-bar': '0 4px 24px rgba(0,0,0,0.35)',
      },
      animation: {
        'slide-up': 'slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down': 'slide-down 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in': 'fade-in 0.2s ease-out',
        'shimmer': 'shimmer 1.5s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 2s linear infinite',
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
      },
    },
  },
  plugins: [forms, containerQueries],
};

export default config;

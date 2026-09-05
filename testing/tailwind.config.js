/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#8f4e00',
        'primary-container': '#ff9933',
        'primary-fixed': '#ffdcc2',
        'primary-fixed-dim': '#ffb77a',
        'on-primary': '#ffffff',
        'on-primary-container': '#693800',
        surface: '#f9f9f9',
        'surface-container': '#eeeeee',
        'on-surface': '#1a1c1c',
        'on-surface-variant': '#554336',
        outline: '#887364',
        'outline-variant': '#dbc2b0',
        error: '#ba1a1a',
        'on-error': '#ffffff',
      },
      fontFamily: {
        headline: ['"Plus Jakarta Sans"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        editorial: '0 4px 20px rgba(0,0,0,0.03)',
        'editorial-lg': '0 8px 32px rgba(85,67,54,0.04)',
        saffron: '0 12px 24px rgba(143,78,0,0.2)',
      },
      animation: {
        'slide-up': 'slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in': 'fade-in 0.2s ease-out',
      },
      keyframes: {
        'slide-up': {
          '0%': { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};

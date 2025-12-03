import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#000000',
        text: '#FFFFFF',
        'text-muted': '#737373',
        'trend-down': '#4ADE80',
        'trend-up': '#F87171',
        'trend-flat': '#737373',
        'dot-empty': '#333333',
        'dot-filled': '#FFFFFF',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      fontSize: {
        'weight': ['clamp(120px, 40vw, 200px)', { lineHeight: '1', letterSpacing: '-0.02em', fontWeight: '700' }],
        'trend': ['24px', { lineHeight: '1.2', fontWeight: '500' }],
      },
      animation: {
        'fade-in': 'fadeIn 200ms ease-out',
        'fade-in-delay': 'fadeIn 200ms ease-out 100ms both',
        'fade-in-delay-2': 'fadeIn 200ms ease-out 200ms both',
        'dot-fill': 'dotFill 300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        'dot-pulse': 'dotPulse 300ms ease-out',
        'number-pulse': 'numberPulse 300ms ease-out',
        'slide-up': 'slideUp 300ms cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down': 'slideDown 300ms cubic-bezier(0.16, 1, 0.3, 1)',
        'all-complete': 'allComplete 400ms ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        dotFill: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.3)' },
          '100%': { transform: 'scale(1)' },
        },
        dotPulse: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.1)', opacity: '0.8' },
        },
        numberPulse: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.02)' },
          '100%': { transform: 'scale(1)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(100%)' },
        },
        allComplete: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;

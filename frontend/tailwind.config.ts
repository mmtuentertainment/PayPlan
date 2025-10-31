import type { Config } from 'tailwindcss'
import { FADE_IN_DURATION } from './src/constants/animations'

export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      colors: {
        gamification: {
          streak: {
            bg: '#fff7ed',      // orange-50
            border: '#fed7aa',  // orange-200
            text: '#ea580c',    // orange-600
          },
          positive: {
            bg: '#f0fdf4',      // green-50
            border: '#bbf7d0',  // green-200
            text: '#16a34a',    // green-600
          },
          negative: {
            bg: '#fef2f2',      // red-50
            border: '#fecaca',  // red-200
            text: '#dc2626',    // red-600
          },
          neutral: {
            bg: '#f9fafb',      // gray-50
            border: '#e5e7eb',  // gray-200
            text: '#4b5563',    // gray-600
          },
          win: {
            bg: '#eff6ff',      // blue-50
            border: '#bfdbfe',  // blue-200
            text: '#2563eb',    // blue-600
          },
        },
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-in-up': {
          '0%': {
            opacity: '0',
            transform: 'translateY(10px)'
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)'
          }
        },
        'slide-down': {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': `fade-in ${FADE_IN_DURATION}ms ease-out`,
        'fade-in-up': 'fade-in-up 400ms ease-out',
        'slide-down': 'slide-down 300ms ease-out',
      },
    }
  },
  plugins: [],
} satisfies Config
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0a0a0f',
        surface: '#13131a',
        card: '#1a1a24',
        border: '#2a2a3a',
        accent: '#7c5cfc',
        'accent-light': '#9b7ffe',
        'accent-glow': 'rgba(124, 92, 252, 0.15)',
        success: '#22d3a5',
        danger: '#ff5f7e',
        warning: '#fbbf24',
        muted: '#4a4a6a',
        text: '#e2e2f0',
        'text-muted': '#8888aa',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 30px rgba(124, 92, 252, 0.2)',
        'glow-sm': '0 0 15px rgba(124, 92, 252, 0.15)',
        card: '0 4px 24px rgba(0,0,0,0.4)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
}

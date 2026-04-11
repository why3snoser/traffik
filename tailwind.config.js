/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#080617',
        surface: '#0e0b22',
        card: '#141030',
        border: 'rgba(255,255,255,0.07)',
        accent: '#7c3aed',
        'accent-light': '#a78bfa',
        'accent-glow': 'rgba(124, 58, 237, 0.18)',
        pink: '#ec4899',
        success: '#10d9a0',
        danger: '#f43f5e',
        warning: '#f59e0b',
        text: '#ede9fe',
        'text-muted': '#7c6fa0',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-accent': 'linear-gradient(135deg, #7c3aed, #ec4899)',
        'gradient-card': 'linear-gradient(135deg, rgba(124,58,237,0.25), rgba(236,72,153,0.15))',
        'gradient-success': 'linear-gradient(135deg, #10d9a0, #3b82f6)',
      },
      boxShadow: {
        glow: '0 0 40px rgba(124, 58, 237, 0.25)',
        'glow-sm': '0 0 20px rgba(124, 58, 237, 0.18)',
        'glow-pink': '0 0 30px rgba(236, 72, 153, 0.2)',
        card: '0 8px 32px rgba(0,0,0,0.5)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0', transform: 'translateY(4px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
}

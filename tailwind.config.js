/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#060b16',
        surface: '#0a1322',
        card: '#0b1626',
        border: 'rgba(148,184,255,0.14)',
        accent: '#0A84FF',
        'accent-light': '#64B5FF',
        'accent-glow': 'rgba(10,132,255,0.16)',
        pink: '#007AFF',
        success: '#0A84FF',
        danger: '#ff453a',
        warning: '#ffd60a',
        text: '#EEF3FF',
        'text-muted': 'rgba(190,210,255,0.5)',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-accent': 'linear-gradient(135deg, #0A84FF, #007AFF)',
        'gradient-card': 'linear-gradient(135deg, rgba(10,132,255,0.14), rgba(0,122,255,0.06))',
        'gradient-success': 'linear-gradient(135deg, #0A84FF, #5AC8FA)',
      },
      boxShadow: {
        glow: '0 0 40px rgba(10,132,255,0.25)',
        'glow-sm': '0 0 16px rgba(10,132,255,0.18)',
        card: '0 8px 32px rgba(0,0,0,0.55)',
        glass: 'inset 0 1px 1px rgba(255,255,255,0.12), inset 0 -1px 0 rgba(255,255,255,0.05), 0 12px 32px rgba(0,0,0,0.45)',
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
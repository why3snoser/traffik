/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0A0A0D',
        surface: '#101013',
        card: '#141418',
        border: 'rgba(255,255,255,0.07)',
        accent: '#C09FE6',
        'accent-light': '#DCC2F2',
        'accent-glow': 'rgba(192,159,230,0.13)',
        pink: '#DCC2F2',
        success: '#CDB4EC',
        danger: '#F0647A',
        warning: '#E5C878',
        text: '#F2F1F5',
        'text-muted': 'rgba(162,160,173,0.65)',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-accent': 'linear-gradient(135deg, #DCC2F2, #C09FE6)',
        'gradient-card': 'linear-gradient(135deg, rgba(192,159,230,0.10), rgba(120,90,160,0.04))',
        'gradient-success': 'linear-gradient(135deg, #DCC2F2, #EADCF7)',
      },
      boxShadow: {
        glow: '0 0 32px rgba(192,159,230,0.16)',
        'glow-sm': '0 0 14px rgba(192,159,230,0.12)',
        card: '0 6px 24px rgba(0,0,0,0.45)',
        glass: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 8px 24px rgba(0,0,0,0.4)',
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
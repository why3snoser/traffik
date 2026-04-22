/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#060c08',
        surface: '#0c1610',
        card: '#0f1a12',
        border: 'rgba(0,230,118,0.10)',
        accent: '#00e676',
        'accent-light': '#69f0ae',
        'accent-glow': 'rgba(0,230,118,0.15)',
        pink: '#00c853',
        success: '#00e676',
        danger: '#ff4d6d',
        warning: '#ffb300',
        text: '#e8f5e9',
        'text-muted': 'rgba(200,230,201,0.45)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-accent': 'linear-gradient(135deg, #00e676, #00c853)',
        'gradient-card': 'linear-gradient(135deg, rgba(0,230,118,0.12), rgba(0,200,83,0.06))',
        'gradient-success': 'linear-gradient(135deg, #00e676, #00bfa5)',
      },
      boxShadow: {
        glow: '0 0 40px rgba(0,230,118,0.2)',
        'glow-sm': '0 0 16px rgba(0,230,118,0.15)',
        card: '0 8px 32px rgba(0,0,0,0.6)',
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

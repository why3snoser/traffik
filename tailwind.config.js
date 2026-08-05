/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0D0D11',
        surface: '#121017',
        card: '#1A1822',
        border: 'rgba(216,210,245,0.10)',
        accent: '#8B7DCC',
        'accent-light': '#A596E8',
        'accent-glow': 'rgba(139,125,204,0.16)',
        pink: '#A596E8',
        success: '#A596E8',
        danger: '#FF5B6E',
        warning: '#E8C06A',
        text: '#F4F4F7',
        'text-muted': 'rgba(164,164,179,0.6)',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-accent': 'linear-gradient(135deg, #A596E8, #8B7DCC)',
        'gradient-card': 'linear-gradient(135deg, rgba(139,125,204,0.14), rgba(90,80,150,0.06))',
        'gradient-success': 'linear-gradient(135deg, #A596E8, #C3BCEA)',
      },
      boxShadow: {
        glow: '0 0 40px rgba(139,125,204,0.20)',
        'glow-sm': '0 0 16px rgba(139,125,204,0.14)',
        card: '0 8px 32px rgba(0,0,0,0.55)',
        glass: 'inset 0 1px 1px rgba(255,255,255,0.08), inset 0 -1px 0 rgba(255,255,255,0.03), 0 12px 32px rgba(0,0,0,0.5)',
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
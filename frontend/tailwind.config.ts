import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Refined institutional palette — softer, more sophisticated
        bg: {
          DEFAULT: '#06080f',
          deep: '#04060c',
          panel: 'rgba(15, 20, 33, 0.65)',
          raised: 'rgba(22, 28, 44, 0.7)',
          solid: '#0a0e1a',
          muted: '#171c2a',
          hover: 'rgba(36, 44, 66, 0.5)',
          glow: 'rgba(45, 212, 191, 0.04)',
        },
        border: {
          DEFAULT: 'rgba(148, 163, 184, 0.08)',
          strong: 'rgba(148, 163, 184, 0.16)',
          accent: 'rgba(34, 211, 238, 0.25)',
          glow: 'rgba(34, 211, 238, 0.5)',
        },
        text: {
          DEFAULT: '#f1f5f9',
          muted: '#94a3b8',
          dim: '#64748b',
          faint: '#475569',
        },
        accent: {
          cyan: '#22d3ee',
          violet: '#a78bfa',
          amber: '#fbbf24',
          green: '#10b981',
          rose: '#f43f5e',
          blue: '#60a5fa',
          fuchsia: '#e879f9',
        },
        bias: {
          bull: '#10b981',
          'bull-soft': 'rgba(16, 185, 129, 0.15)',
          bear: '#f43f5e',
          'bear-soft': 'rgba(244, 63, 94, 0.15)',
          neutral: '#94a3b8',
          'neutral-soft': 'rgba(148, 163, 184, 0.12)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'IBM Plex Mono', 'SFMono-Regular', 'Menlo', 'monospace'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['10px', { lineHeight: '14px' }],
      },
      backgroundImage: {
        'aurora': 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(34, 211, 238, 0.15), transparent 70%), radial-gradient(ellipse 60% 50% at 80% 50%, rgba(167, 139, 250, 0.1), transparent 70%), radial-gradient(ellipse 60% 50% at 20% 80%, rgba(244, 63, 94, 0.06), transparent 70%)',
        'gradient-cyan': 'linear-gradient(135deg, #22d3ee 0%, #818cf8 100%)',
        'gradient-bull': 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
        'gradient-bear': 'linear-gradient(135deg, #f43f5e 0%, #f59e0b 100%)',
        'gradient-violet': 'linear-gradient(135deg, #a78bfa 0%, #e879f9 100%)',
        'panel-glow': 'linear-gradient(180deg, rgba(34, 211, 238, 0.04) 0%, transparent 60%)',
        'shimmer': 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.04), transparent)',
        'grid-faint': 'linear-gradient(rgba(148, 163, 184, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(148, 163, 184, 0.04) 1px, transparent 1px)',
      },
      backgroundSize: {
        'grid': '32px 32px',
      },
      boxShadow: {
        'panel': '0 0 0 1px rgba(148, 163, 184, 0.06), 0 8px 32px -8px rgba(0, 0, 0, 0.4)',
        'panel-hover': '0 0 0 1px rgba(34, 211, 238, 0.2), 0 12px 40px -8px rgba(34, 211, 238, 0.1)',
        'glow-cyan': '0 0 30px -8px rgba(34, 211, 238, 0.5), 0 0 60px -16px rgba(34, 211, 238, 0.3)',
        'glow-violet': '0 0 30px -8px rgba(167, 139, 250, 0.5)',
        'glow-bull': '0 0 30px -8px rgba(16, 185, 129, 0.4)',
        'glow-bear': '0 0 30px -8px rgba(244, 63, 94, 0.4)',
        'inset-glow': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.04)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 300ms ease-out',
        'slide-up': 'slideUp 350ms cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-right': 'slideInRight 350ms cubic-bezier(0.16, 1, 0.3, 1)',
        'shimmer': 'shimmer 2.5s ease-in-out infinite',
        'sweep': 'sweep 6s ease-in-out infinite',
        'aurora-shift': 'auroraShift 18s ease-in-out infinite',
        'orbit': 'orbit 20s linear infinite',
        'glow-pulse': 'glowPulse 2.5s ease-in-out infinite',
        'spin-slow': 'spin 12s linear infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: {
          '0%': { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(16px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        sweep: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '1' },
        },
        auroraShift: {
          '0%, 100%': { transform: 'translate(0%, 0%) rotate(0deg)' },
          '33%': { transform: 'translate(-3%, 2%) rotate(0.5deg)' },
          '66%': { transform: 'translate(2%, -3%) rotate(-0.5deg)' },
        },
        orbit: {
          '0%': { transform: 'rotate(0deg) translateX(40px) rotate(0deg)' },
          '100%': { transform: 'rotate(360deg) translateX(40px) rotate(-360deg)' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.02)' },
        },
      },
      backdropBlur: {
        'xs': '2px',
      },
    },
  },
  plugins: [],
};

export default config;

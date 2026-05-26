import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Bloomberg-inspired terminal palette
        bg: {
          DEFAULT: '#05070d',
          panel: '#0a0e16',
          raised: '#0f1421',
          muted: '#171c2a',
          hover: '#1c2233',
        },
        border: {
          DEFAULT: '#1c2233',
          strong: '#252b3d',
        },
        text: {
          DEFAULT: '#e6ebf5',
          muted: '#7a8499',
          dim: '#52596d',
        },
        accent: {
          amber: '#ffb028',
          cyan: '#00d3ff',
          violet: '#a48dff',
          green: '#22c55e',
          red: '#ef4444',
          blue: '#3b82f6',
        },
        bias: {
          bull: '#22c55e',
          bear: '#ef4444',
          neutral: '#94a3b8',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'IBM Plex Mono', 'SFMono-Regular', 'Menlo', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['10px', { lineHeight: '14px' }],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 200ms ease-out',
        'slide-up': 'slideUp 220ms ease-out',
        'ticker': 'ticker 60s linear infinite',
        'sweep': 'sweep 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        ticker: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        sweep: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;

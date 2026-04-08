import type { Config } from 'tailwindcss'

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Verde agro como color primario
        primary: {
          50:  '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        // Naranja para alertas / acciones secundarias
        accent: {
          50:  '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
      },
      // Tipografía grande para uso en campo
      fontSize: {
        'field-sm':  ['0.9375rem', { lineHeight: '1.5rem' }],   // 15px
        'field-base':['1.0625rem', { lineHeight: '1.75rem' }],  // 17px
        'field-lg':  ['1.1875rem', { lineHeight: '1.75rem' }],  // 19px
      },
      // Botones táctiles cómodos (mínimo 48px)
      minHeight: {
        'touch': '3rem',   // 48px
        'touch-lg': '3.5rem', // 56px
      },
      minWidth: {
        'touch': '3rem',
      },
    },
    keyframes: {
      'slide-up': {
        '0%': { transform: 'translateY(100%)', opacity: '0' },
        '100%': { transform: 'translateY(0)', opacity: '1' },
      },
    },
    animation: {
      'slide-up': 'slide-up 0.3s ease-out',
    },
  },
  plugins: [],
} satisfies Config

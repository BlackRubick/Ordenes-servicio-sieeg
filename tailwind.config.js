/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2176BE',
          50:  '#EBF4FF',
          100: '#D6E9FF',
          200: '#AECFE8',
          300: '#7DAFE6',
          400: '#4F8FD0',
          500: '#2176BE',
          600: '#1A5FA8',
          700: '#0D4A8C',
          800: '#083870',
          900: '#052A55',
          dark:   '#1A5FA8',
          darker: '#0D4A8C',
        },
        secondary: {
          DEFAULT: '#E8611A',
          200: '#FBBF99',
          500: '#E8611A',
          600: '#C24E10',
        },
        background: '#F4F7FC',
        card: '#FFFFFF',
        sidebar: '#0B1F3A',
        navbar: '#FFFFFF',
        text: {
          main:      '#1A1A2E',
          secondary: '#6B7A99',
        },
        border: '#E2E8F0',
        muted:  '#6B7A99',
        state: {
          pending:   '#94A3B8',
          review:    '#2176BE',
          repair:    '#E8611A',
          completed: '#2E7D32',
          cancelled: '#D32F2F',
        },
        success: '#2E7D32',
        warning: '#E8611A',
        error:   '#D32F2F',
        info:    '#2176BE',
        dark:    '#1A1A2E',
      },
      borderRadius: {
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        soft: '0 2px 8px 0 rgba(33, 118, 190, 0.08)',
        card: '0 4px 16px 0 rgba(33, 118, 190, 0.10)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      transitionProperty: {
        spacing: 'margin, padding',
      },
      backdropBlur: {
        xs: '2px',
      },
      keyframes: {
        'fade-in': {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.4s ease both',
      },
    },
  },
  plugins: [],
}

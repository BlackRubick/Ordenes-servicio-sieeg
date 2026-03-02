/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          500: '#1976F3', // Azul principal (logo)
          600: '#1565C0', // Hover
          700: '#0D47A1', // Activo
          DEFAULT: '#1976F3',
        },
        secondary: {
          500: '#42A5F5', // Azul secundario
          DEFAULT: '#42A5F5',
        },
        background: '#F4F7FC', // Fondo general
        card: '#FFFFFF', // Fondo de cards
        sidebar: '#0B1F3A', // Sidebar azul marino profundo
        navbar: '#FFFFFF', // Navbar claro
        text: {
          main: '#0F172A',
          secondary: '#64748B',
        },
        border: '#E2E8F0',
        muted: '#E2E8F0',
        // Estados del sistema
        state: {
          pending: '#94A3B8',
          review: '#1E88E5',
          repair: '#FB8C00',
          completed: '#2E7D32',
          cancelled: '#D32F2F',
        },
        // Legacy/compatibilidad
        success: '#2E7D32',
        warning: '#FB8C00',
        error: '#D32F2F',
        info: '#1E88E5',
        dark: '#0F172A',
      },
      borderRadius: {
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        'soft': '0 4px 32px 0 rgba(60, 72, 100, 0.10)',
        'card': '0 2px 16px 0 rgba(60, 72, 100, 0.08)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      transitionProperty: {
        'spacing': 'margin, padding',
      },
      backdropBlur: {
        xs: '2px',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.5s ease-in',
      },
    },
  },
  plugins: [],
}
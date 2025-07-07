/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        // Robinhood-style colors
        'robinhood': {
          'green': '#00C805',
          'green-dark': '#00A004',
          'green-light': '#00E806',
          'black': '#000000',
          'dark-gray': '#1A1A1A',
          'darker-gray': '#0F0F0F',
          'light-gray': '#2A2A2A',
          'text-light': '#FFFFFF',
          'text-dark': '#E0E0E0',
          'text-muted': '#A0A0A0',
        }
      },
      backgroundColor: {
        'dark': {
          'primary': '#000000',
          'secondary': '#1A1A1A',
          'tertiary': '#2A2A2A',
          'accent': '#00C805',
        }
      },
      textColor: {
        'dark': {
          'primary': '#FFFFFF',
          'secondary': '#E0E0E0',
          'muted': '#A0A0A0',
          'accent': '#00C805',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
} 
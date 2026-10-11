/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        sand: {
          50: '#faf8f5',
          100: '#f5f1ea',
          200: '#ebe4d8',
          300: '#ddd1bd',
          400: '#c8b89e',
          500: '#b5a085',
          600: '#a08a6e',
          700: '#856f56',
          800: '#6b5a47',
          900: '#564838',
          950: '#382e23',
        },
        clay: {
          50: '#faf7f4',
          100: '#f2ebe3',
          200: '#e4d5c5',
          300: '#d0b8a0',
          400: '#b8957a',
          500: '#a07a5e',
          600: '#8a6550',
          700: '#786554',
          800: '#5f4f3f',
          900: '#4a3d31',
          950: '#2e251c',
        },
        sage: {
          50: '#f4f6f3',
          100: '#e3e9e0',
          200: '#c7d4c1',
          300: '#a3b89c',
          400: '#7d9775',
          500: '#5d7a56',
          600: '#486043',
          700: '#3a4d37',
          800: '#304030',
          900: '#283528',
        },
        accent: {
          50: '#fdf8f3',
          100: '#faeede',
          200: '#f3d9ba',
          300: '#eabd87',
          400: '#df9b57',
          500: '#d27f35',
          600: '#bf6a2a',
          700: '#a05424',
          800: '#844522',
          900: '#6e3a20',
        },
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        'editorial': '0.12em',
        'wide-sm': '0.06em',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-in': 'slideIn 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
};

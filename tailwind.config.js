/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./client/index.html",
    "./client/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand Colors (new)
        primary: {
          DEFAULT: '#3B5FE8',
          dark: '#2A4BC7',
          light: '#5A7BF0',
        },
        secondary: {
          DEFAULT: '#9B7FD4',
          dark: '#7A5FC0',
          light: '#B9A3E0',
        },
        accent: {
          DEFAULT: '#E8C9A0',
          dark: '#D4B080',
          light: '#F0DCC0',
        },
        dark: '#1A1A2E',
        light: '#F5F5F5',
        // Legacy coffee colors (kept for backward compatibility)
        coffee: {
          50: '#fdf8f6',
          100: '#f2e8e5',
          200: '#eaddd7',
          300: '#e0cec7',
          400: '#d2bab0',
          500: '#bfa094',
          600: '#a18072',
          700: '#977669',
          800: '#846358',
          900: '#43302b',
        }
      }
    },
  },
  plugins: [],
}

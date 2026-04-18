/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"DM Mono"', 'monospace'],
      },
      colors: {
        ink: {
          50: '#f5f0eb',
          100: '#e8ddd2',
          200: '#d1bba5',
          300: '#ba9978',
          400: '#a3774b',
          500: '#8c5524',
          600: '#704419',
          700: '#54330e',
          800: '#382103',
          900: '#1c1001',
        },
        cream: {
          50: '#fefdf9',
          100: '#fdf9f0',
          200: '#faf3e0',
          300: '#f7ecd0',
          400: '#f4e5c0',
          500: '#f1ddb0',
        },
        forest: {
          400: '#4a7c59',
          500: '#3a6b47',
          600: '#2a5a35',
          700: '#1a4923',
        },
        amber: {
          400: '#f59e0b',
          500: '#d97706',
        }
      },
      boxShadow: {
        'book': '4px 4px 0px 0px rgba(28,16,1,0.15)',
        'book-hover': '6px 6px 0px 0px rgba(28,16,1,0.2)',
        'card': '0 2px 16px rgba(28,16,1,0.08)',
      },
    },
  },
  plugins: [],
};

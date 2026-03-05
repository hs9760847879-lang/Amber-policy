/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#ffbf00',
        'background-light': '#f8f8f5',
        'background-dark': '#121212',
        'slate-custom': '#1e1e1e',
        'slate-border': '#2d2d2d',
      },
      fontFamily: {
        display: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

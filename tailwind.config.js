/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: '#0a0a0a',
        canvas: '#f7f5f1',
        accent: '#ff5a1f',
      },
    },
  },
  plugins: [],
}

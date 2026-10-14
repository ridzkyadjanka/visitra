/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: { 950: '#060F26', 900: '#0B1B3F', 800: '#12285A', 700: '#1A3570' },
        brand: { 50: '#EEF4FF', 100: '#DCE7FF', 200: '#B9CEFF', 500: '#2F6BFF', 600: '#1E56F0', 700: '#1844C4' },
      },
      fontFamily: { sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'] },
      boxShadow: { card: '0 1px 2px rgba(11,27,63,.04), 0 4px 16px rgba(11,27,63,.06)' },
    },
  },
  plugins: [],
};

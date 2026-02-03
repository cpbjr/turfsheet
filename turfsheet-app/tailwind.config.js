/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'turf-green': '#73A657',
        'turf-green-dark': '#5D8A46',
        'turf-green-light': '#E8F0E4',
        'bg-main': '#F4F6F8',
        'text-secondary': '#7F8C8D',
        'text-muted': '#BDC3C7',
        'border-color': '#E0E4E8',
        'accent-orange': '#EAB35E',
        'accent-grey': '#95A5A6',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Outfit', 'sans-serif'],
      },
      spacing: {
        'sidebar': '60px',
        'header': '60px',
        'side-panel': '300px',
      },
      boxShadow: {
        'sm': '0 1px 3px rgba(0,0,0,0.12)',
        'md': '0 4px 6px rgba(0,0,0,0.08)',
        'lg': '0 10px 15px rgba(0,0,0,0.05)',
      },
    },
  },
  plugins: [],
}

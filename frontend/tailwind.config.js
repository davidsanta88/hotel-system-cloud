/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#ecf8ff',
          100: '#d9f1ff',
          500: '#00a3ff', // Azul brillante del balcón
          600: '#0070bb', // Azul base corporativo
          700: '#005a96',
        },
        accent: {
          50: '#fffbeb',
          100: '#fef3c7',
          500: '#fdb913', // Amarillo/Ámbar de los balcones
          600: '#e5a500', 
          700: '#b28000',
        },
        hotel: {
          green: '#00a651',
          red: '#ed1c24',
          purple: '#662d91',
        },
        secondary: '#f1f5f9',
        dark: '#1c0f05'
      }
    },
  },
  plugins: [],
}

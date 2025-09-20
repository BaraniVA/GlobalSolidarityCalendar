/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        palestine: {
          white: '#FFFFFF',
          black: '#000000',
          red: '#CE1126',
          green: '#007A3D',
        },
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paytm: {
          blue: "#002970",
          cyan: "#00BAF2",
          dark: "#051630",
          navy: "#0a224a",
          light: "#f0f8ff",
          surface: "#0f172a",
        }
      }
    },
  },
  plugins: [],
}

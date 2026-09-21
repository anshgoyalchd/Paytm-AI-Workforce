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
          dark: "#001740",
          navy: "#0a224a",
          cyan: "#00BAF2",
          cyanLight: "#E6F7FD",
          cyanDark: "#009FD6",
          green: "#00B970",
          greenLight: "#E8F8F0",
          amber: "#FF9900",
          amberLight: "#FFF8E6",
          red: "#FF3B30",
          redLight: "#FEECEB",
          bg: "#F5F7FA",
          card: "#FFFFFF",
          border: "#EBF0F5",
        }
      },
      boxShadow: {
        'paytm': '0 2px 12px rgba(0, 41, 112, 0.08)',
        'paytm-hover': '0 8px 24px rgba(0, 41, 112, 0.12)',
        'paytm-cyan': '0 4px 14px rgba(0, 186, 242, 0.35)',
      }
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: "#08090c",
          darkLighter: "#12141c",
          darkCard: "#181b28",
          red: "#c0392b",
          redLight: "#e74c3c",
          orange: "#e67e22",
          orangeLight: "#ff9f43",
          border: "rgba(255, 255, 255, 0.08)",
          textMuted: "#8a94a6",
        }
      },
      boxShadow: {
        glow: "0 0 20px rgba(231, 76, 60, 0.35)",
        glowOrange: "0 0 20px rgba(230, 126, 34, 0.35)",
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}

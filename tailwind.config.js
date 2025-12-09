/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        risk: {
          safe: "#10b981",
          watch: "#f59e0b",
          warning: "#f97316",
          critical: "#ef4444",
        },
        surface: {
          DEFAULT: "#ffffff",
          dark: "#1f2937",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "16px",
      },
      boxShadow: {
        card: "0 4px 8px rgba(0, 0, 0, 0.08)",
      },
    },
  },
  darkMode: "class",
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#14F195",
        "primary-dark": "#0ea368",
        bg: {
          light: "#F8FAFC",
          dark: "#0F172A",
        },
        surface: {
          light: "#FFFFFF",
          dark: "#1E293B",
          accent: "#334155",
        },
        border: {
          light: "#E2E8F0",
          dark: "#334155",
          accent: "rgba(20, 241, 149, 0.2)",
        },
        slate: {
          950: "#020617",
          900: "#0F172A",
          800: "#1E293B",
          700: "#334155",
          600: "#475569",
          500: "#64748B",
          400: "#94A3B8",
          300: "#CBD5E1",
        }
      },
      spacing: {
        'safe': '24px',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      }
    },
  },
  plugins: [],
};

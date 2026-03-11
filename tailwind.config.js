/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require("nativewind/preset")],
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // écoTech Brand Colors
        primary: "#C8842A",          // Warm amber-brown (main logo color)
        "primary-dark": "#A0671E",   // Darker brown
        eco: "#7A8000",              // Olive green ("é" in écoTech)
        "eco-light": "rgba(122,128,0,0.15)",
        "brand-dark": "#6B2F10",     // Deep dark brown (logo handle)
        "brand-sand": "#D2A76A",     // Light sand/beige
        bg: {
          light: "#FAF6F1",          // Warm off-white for light surfaces
          dark: "#0F0C08",           // Very dark warm background
        },
        surface: {
          light: "#FFFFFF",
          dark: "#1A1410",           // Warm dark card surface
          accent: "#2A1E0F",
        },
        border: {
          light: "#E8DDD0",
          dark: "#3D2E1A",           // Warm border
          accent: "rgba(200, 132, 42, 0.25)",
        },
        slate: {
          950: "#07050300",
          900: "#0F0C08",
          800: "#1A1410",
          700: "#2A1E0F",
          600: "#4A3520",
          500: "#7A6040",
          400: "#A08060",
          300: "#C8A880",
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

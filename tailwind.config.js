/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require("nativewind/preset")],
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // LYNX Warm Premium Palette
        primary: "#E67E22",          // Vibrant Orange (Active actions)
        secondary: "#4A3520",        // Deep Marron (Headers & Identity)
        "brand-orange": "#E67E22",
        "brand-marron": "#4A3520",
        "brand-cream": "#FDFCFB",
        bg: {
          light: "#FFFFFF",          // Pure White
          soft: "#F8F9FA",           // Light Gray / Alabaster
          warm: "#FAF6F1",
        },
        surface: {
          light: "#F3F4F6",          // Light warm surface
          warm: "#EADDCA",           // Beige accent
        },
        border: {
          light: "#E5E7EB",
          warm: "rgba(74, 53, 32, 0.1)", // Subtle brown border
        },
        slate: { // Keeping slate names but remapping to warm tones to minimize breaking class names
          950: "#FFFFFF",
          900: "#F8F9FA",
          800: "#F3F4F6",
          700: "#E5E7EB",
          600: "#D1D5DB",
          500: "#9CA3AF",
          400: "#6B7280",
          300: "#4B5563",
          200: "#374151",
          100: "#1F2937",
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

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brick Colour Palette - Physical building, clay, terracotta & mortar
        brick: {
          DEFAULT: "#B93815",
          50: "#FDF5F2",
          100: "#FBECE6",
          200: "#F5D2C5",
          300: "#ECA994",
          400: "#E17D5F",
          500: "#DC4A22", // Terracotta
          600: "#B93815", // Primary Burnt Brick
          700: "#9C2A10", // Dark Burnt Clay
          800: "#7E230E",
          900: "#681E0C",
          950: "#3D0E05",
        },
        mortar: {
          DEFAULT: "#F8F6F2",
          50: "#FBF9F6",
          100: "#F8F6F2", // Main Chalk Ground
          200: "#EFECE6", // Concrete Sump
          300: "#E2DDD5", // Mortar Joint Divider
          400: "#C4BCB0",
          500: "#9E9587",
          600: "#7A7266",
          700: "#5D574E",
          800: "#3E3A34",
          900: "#22201C",
        },
        iron: {
          DEFAULT: "#141416",
          50: "#F4F4F6",
          100: "#E4E4E8",
          200: "#C8C9D1",
          300: "#9E9EA8",
          400: "#6B6C75",
          500: "#44454C",
          600: "#323338",
          700: "#27272A",
          800: "#1C1D20",
          900: "#18181B",
          950: "#141416", // Deep Architectural Obsidian / Borders
        },
        safety: {
          DEFAULT: "#D97706",
          50: "#FFFBEB",
          100: "#FEF3C7",
          200: "#FDE68A",
          300: "#FCD34D",
          400: "#FBBF24",
          500: "#F59E0B",
          600: "#D97706", // Construction Ochre / Alerts
          700: "#B45309",
          800: "#92400E",
          900: "#78350F",
        },
      },
      boxShadow: {
        brutal: "3px 3px 0px 0px #141416",
        "brutal-sm": "2px 2px 0px 0px #141416",
        "brutal-lg": "5px 5px 0px 0px #141416",
        "brutal-brick": "3px 3px 0px 0px #B93815",
        "brutal-white": "3px 3px 0px 0px #FFFFFF",
      },
      borderRadius: {
        none: "0px",
      },
      animation: {
        "stamp-snap": "stampSnap 150ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "hazard-flash": "hazardFlash 300ms ease-in-out infinite alternate",
      },
      keyframes: {
        stampSnap: {
          "0%": { transform: "scale(0.92)", opacity: "0.8" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        hazardFlash: {
          "0%": { borderColor: "#D97706", backgroundColor: "#FFFBEB" },
          "100%": { borderColor: "#141416", backgroundColor: "#FEF3C7" },
        },
      },
    },
  },
  plugins: [],
};

export default config;

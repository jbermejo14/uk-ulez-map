import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#FF6B00",
          hover: "#E55E00",
          light: "#FFF3EB",
          dark: "#CC5500",
        },
        darkBg: "#0A0A0A",
        darkSurface: "#141414",
        darkCard: "#181818",
        darkBorder: "#27272A",
        lightBg: "#F8FAFC",
        lightSurface: "#FFFFFF",
        lightCard: "#FFFFFF",
        lightBorder: "#E2E8F0",
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;

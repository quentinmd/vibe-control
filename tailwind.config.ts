import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "neon-violet": "#9D4EDD",
        "neon-cyan": "#00D9FF",
        "dark-bg": "#0A0A0F",
        "dark-card": "#1A1A24",
      },
      animation: {
        "pulse-neon": "pulse-neon 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "slide-in": "slide-in 0.3s ease-out",
      },
      keyframes: {
        "pulse-neon": {
          "0%, 100%": {
            boxShadow: "0 0 10px rgba(157, 78, 221, 0.5)",
          },
          "50%": {
            boxShadow:
              "0 0 20px rgba(157, 78, 221, 0.8), 0 0 30px rgba(157, 78, 221, 0.5)",
          },
        },
        "slide-in": {
          "0%": {
            transform: "translateX(-100%)",
            opacity: "0",
          },
          "100%": {
            transform: "translateX(0)",
            opacity: "1",
          },
        },
      },
    },
  },
  plugins: [],
};
export default config;

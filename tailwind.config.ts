import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#07070d",
        canvasElev: "#0d0d16",
        ink: {
          DEFAULT: "#ebebf2",
          muted: "#8a8a98",
          soft: "#4f4f5c",
        },
        rule: {
          DEFAULT: "rgba(255,255,255,0.08)",
          strong: "rgba(255,255,255,0.22)",
        },
        mint: {
          1: "#b4ffd8",
          2: "#00ffb4",
          3: "#00b87a",
          ink: "#0a3d2a",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
        logo: ["var(--font-logo)", "Playfair Display", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#ffffff",
        canvasElev: "#f5f5f7",
        ink: {
          DEFAULT: "#0a0a0f",
          muted: "#6b6b7a",
          soft: "#a0a0ae",
        },
        rule: {
          DEFAULT: "rgba(0,0,0,0.08)",
          strong: "rgba(0,0,0,0.18)",
        },
        mint: {
          1: "#a7f3d0",
          2: "#059669",
          3: "#047857",
          ink: "#ffffff",
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

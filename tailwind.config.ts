import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#0B0D10",
        canvasElev: "#0F1216",
        card: "rgba(255,255,255,0.03)",
        ink: {
          DEFAULT: "#EDEFF3",
          muted: "#99A1AF",
          soft: "#5C6470",
        },
        rule: {
          DEFAULT: "rgba(255,255,255,0.07)",
          strong: "rgba(255,255,255,0.16)",
        },
        mint: {
          1: "#6EE7B7",
          2: "#10B981",
          3: "#059669",
          ink: "#06251B",
        },
      },
      fontFamily: {
        display: ["var(--font-geist)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
        body: ["var(--font-geist)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;

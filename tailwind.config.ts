import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#0A0C10",
        canvas2: "#0D0F14",
        panel: "#12151C",
        panel2: "#171A22",
        ink: {
          DEFAULT: "#F2F4F8",
          muted: "#B3BAC6",
          soft: "#7D8695",
        },
        rule: {
          DEFAULT: "rgba(255,255,255,0.08)",
          strong: "rgba(255,255,255,0.16)",
        },
        accent: "#9FB0FF",
        ok: "#34D399",
        warn: "#F5B04D",
      },
      fontFamily: {
        sans: ["var(--font-manrope)", "system-ui", "sans-serif"],
        display: ["var(--font-manrope)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "ui-monospace", "monospace"],
      },
      maxWidth: {
        site: "1280px",
      },
    },
  },
  plugins: [],
};

export default config;

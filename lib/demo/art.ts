// The product photo the demo shows for a sneaker: a flat side-profile drawing (low-top, mid, high-top, runner or slide)
// in two colours read from the colourway, as an SVG data URL, so it needs no image host (nothing is loaded from
// another site) and an <img src> shows it as is. Simple, rounded shapes with no text or logos, so it reads the same
// at 48 px as at 160 px. Pure (no I/O, no "@/" imports): node --test can load it.

import type { Shape } from "./catalog.ts";

/* ---------- colours: the words of a colourway ("Sail/Dark Mocha", "Core Black/Gum") ---------- */

const NAMED: Record<string, string> = {
  white: "#ffffff", "summit white": "#f7f7f2", "cloud white": "#fafafa", "off white": "#f2efe6", "cream white": "#f3ecdc", "wonder white": "#f1ebde",
  sail: "#f3ead8", cream: "#f1e6cc", "coconut milk": "#efe5d0", "light bone": "#e9e1cf", bone: "#e8dfcc", phantom: "#ece8df", "sea salt": "#ece9e2",
  "vanilla ice": "#f1e8cf", "almond milk": "#eadfca", birch: "#e6dccb", "photon dust": "#e3e1dc", "light orewood brown": "#e6dfd3", chalk: "#f0ede4",
  black: "#1f1f22", "core black": "#1c1c1e", "off noir": "#2b2b2d", anthracite: "#3a3d42", "dark charcoal": "#33363b", magnet: "#45474b", onyx: "#33302e",
  grey: "#a1a5ab", gray: "#a1a5ab", "cement grey": "#a9a9a6", "tech grey": "#bfc3c8", "light smoke grey": "#c9cbcd", "wolf grey": "#b6b8bb",
  "cool grey": "#9a9ea3", "medium grey": "#8b8f94", "iron grey": "#5b5e63", "rain cloud": "#9ea2a6", "grey fog": "#d5d7d9", "light iron ore": "#c4c1bb",
  graphite: "#55595f", "light graphite": "#8d9096", castlerock: "#7a7d80", "steel grey": "#8a9099", "light steel grey": "#b8bec6",
  "pure silver": "#c7ccd1", "metallic silver": "#c3c8ce", silver: "#c0c4c8", "silver metallic": "#c3c8ce", pewter: "#8f8f8f", "flat pewter": "#9a9a96",
  "dark pewter": "#6f6f6c", aluminium: "#c9ccce", "lunar rock": "#c8c6c0", cobblestone: "#b5b1aa", "quartz grey": "#c6c3be", "oyster grey": "#c9c4b9",
  "dark blue grey": "#4b5563", "arid stone": "#cdbfa8",
  red: "#c8102e", "varsity red": "#c41e3a", "university red": "#c8102e", "fire red": "#d32f2f", "sport red": "#d0202f", "gym red": "#9d1b2c",
  "team red": "#8a1c2b", infrared: "#f2445b", "radiant red": "#e8384f", crimson: "#d4204a", "bright crimson": "#e0223f", "hyper crimson": "#ff3f4f",
  cherry: "#b3122e", burgundy: "#6d1a2a", maroon: "#6b1f2a", scarlet: "#d1172e", cinnabar: "#d9472b", "habanero red": "#c9302c", "brick red": "#a8432f",
  "for all time red": "#c8102e",
  "royal blue": "#1f4fd1", "game royal": "#1d4ed8", royal: "#1f4fd1", "university blue": "#8fb8e6", "dark powder blue": "#7fa3c9", "legend blue": "#9ec5ea",
  "valerian blue": "#2e3f73", aquatone: "#3fb5c4", "bleached aqua": "#a7e0dc", "midnight navy": "#1c2541", midnight: "#25304d", navy: "#1f2a44",
  "collegiate navy": "#22304f", obsidian: "#1e2533", "military blue": "#3c6ea8", "racer blue": "#2f62d6", "gamma blue": "#2f6fd8", "blue fusion": "#4f6fbf",
  "light blue": "#a9c8e8", "ambient sky": "#b9d3ea", coast: "#a8cbe6", "aegean storm": "#4b6f87", peacoat: "#2a3550", supersonic: "#7fc6e8",
  "pine green": "#1f5a3d", "lucky green": "#0f7a3d", "collegiate green": "#1c4e3a", "dark green": "#1d4a34", "shadow green": "#5e7a63",
  "oxidized green": "#8cbba0", "green glow": "#b8e986", "pro green": "#1f6b45", "natural green": "#55704c", green: "#2f7a4b", "gutta green": "#2e5a3a",
  "army olive": "#5b5e3a", "medium olive": "#77744a", olive: "#6b6b3a", sequoia: "#3f4b3a", seafoam: "#bfe3cf", "mineral teal": "#3f8c8a",
  "radiant emerald": "#14a06a", "green apple": "#7bc043", volt: "#d7f23a", "hyper jade": "#7fd3c1",
  "yellow ochre": "#d6a12b", "tour yellow": "#f5c12f", taxi: "#f2b705", canary: "#f6d743", "vivid sulfur": "#e8d44d", "varsity maize": "#f2c14e",
  yellow: "#f4c430", "safety orange": "#ff6b1a", "solar orange": "#ff7a2f", starfish: "#f37a2c", "orange frost": "#f7b98d", "max orange": "#ff6a00",
  "metallic gold": "#c9a54b", gold: "#c9a54b", "metallic copper": "#b5713f", "bronze eclipse": "#8a6a45",
  "dark mocha": "#4a3328", mocha: "#7b5a45", palomino: "#b0885f", "velvet brown": "#5a3b2e", ridgerock: "#8d826d", "british khaki": "#a99572",
  "cacao wow": "#5a3c2c", fossil: "#d6c6a5", mushroom: "#b8a99a", brown: "#7a5a43", "clay canyon": "#c49a7a", "desert ore": "#d8c3a5",
  gum: "#b9824b", "gum light brown": "#c28a52", "light iron": "#c4c1bb",
  "rose whisper": "#f2d4d2", "pink foam": "#f3c9cf", "shy pink": "#f5c6cf", "soft pink": "#f6c7d0", "pink glow": "#f7a8c4", "hyper pink": "#ff6fa5",
  atmosphere: "#f2d6d8", pink: "#f4a7b9", "pale coral": "#f5c6b8", "court purple": "#5b3b8c", "voltage purple": "#6c3fc6", "grape ice": "#7a5cc0",
  concord: "#3b2a7a", monarch: "#e07a2a", "shimmer": "#e3c3ae", "bright ceramic": "#ff8a3d", "multi-color": "#e0a030",
};
const KEYS = Object.keys(NAMED).sort((a, b) => b.length - a.length);

/** the colour a colourway part names ("Fire Red", "Core Black"); null when no word is known */
export function colourOf(part: string): string | null {
  const p = part.toLowerCase();
  const k = KEYS.find((x) => p.includes(x));
  return k ? NAMED[k] : null;
}

const rgb = (hex: string) => [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16));
const hex = (c: number[]) => `#${c.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("")}`;
const mixed = (a: string, b: string, t: number) => hex(rgb(a).map((v, i) => v + (rgb(b)[i] - v) * t));
/** relative brightness, 0 (black) to 1 (white) */
export const light = (c: string) => {
  const [r, g, b] = rgb(c);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
};
const far = (a: string, b: string) => rgb(a).reduce((s, v, i) => s + Math.abs(v - rgb(b)[i]), 0) > 60;

export type Palette = { base: string; accent: string; sole: string; line: string; lace: string };

/** The drawing's colours: the first colour of the colourway on the body, the next one that differs on the panels. */
export function paletteOf(colorway: string, name = ""): Palette {
  const parts = colorway.split("/").map(colourOf).filter((c): c is string => !!c);
  const base = parts[0] ?? colourOf(name) ?? "#d6d3cd";
  let accent = parts.slice(1).find((c) => far(c, base)) ?? null;
  // one colour only (an all-white or all-black pair): the panels a shade of it, so the outlines carry the shape
  if (!accent) accent = light(base) > 0.55 ? mixed(base, "#000000", 0.09) : mixed(base, "#ffffff", 0.14);
  const words = `${colorway} ${name}`.toLowerCase();
  const sole = /\bgum\b/.test(words) ? NAMED["gum light brown"]
    : /triple black/.test(words) || (colorway.trim().toLowerCase() === "black") ? "#2a2a2d"
    : /sail|cream|coconut|bone|vanilla|birch/.test(words) ? NAMED.sail
    : "#ffffff";
  const line = light(base) > 0.82 ? "#a3acb9" : mixed(base, "#000000", 0.45);
  return { base, accent, sole, line, lace: light(base) < 0.45 ? "#f1f5f9" : mixed(base, "#000000", 0.55) };
}

/* ---------- the shapes (toe to the right, ground at y 64, 120 × 80) ---------- */

type Draw = { upper: string; panels: string[]; sole: string; outsole?: string; laces?: [number, number, number, number]; cup?: boolean; strap?: boolean };

const COURT_SOLE = "M10 54H108C113 54 115 56.6 115 59.5C115 62.5 112.8 64 109 64H12C8 64 5.5 62.3 5.5 59.2C5.5 56.2 7.3 54 10 54Z";
const TOE = "M84 54C85 47.5 89.5 42.6 93.5 41.7C104 43 110.5 47.2 112.6 54Z";
const MID_HEEL = "M10 54C8.6 46 8.8 38 11.4 32C18 35 23.6 43 25.4 54Z";

const SHAPES: Record<Shape, Draw> = {
  low: {
    upper: "M10 54C8.6 45 9.4 36.5 14 31.5C21 31 29 33.4 38.5 31.8C41 26.6 45 23.6 49.5 23.8C52.6 24 54 25.6 55.8 27.2L82 39.6C97 41 109 45 112.6 54Z",
    panels: ["M10 54C8.8 47 9.4 40.5 12 36C18.5 38.5 23.5 45 25 54Z", TOE, "M50.5 24.2C53 24.6 54.4 25.8 55.8 27.2L82 39.6L80.4 43.2L51.5 29.6Z"],
    sole: COURT_SOLE, laces: [55.8, 27.2, 82, 39.6], cup: true,
  },
  mid: {
    upper: "M10 54C8 43 8.6 31 13.4 24.4C21 24.6 29.4 27 37.4 26C39.8 20.2 43.8 16.8 48.6 16.8C52 16.8 53.6 18.6 55.6 20.4L84.2 37.8C98.6 40.4 109.4 44.8 112.6 54Z",
    panels: [MID_HEEL, TOE, "M49.6 17C52.4 17.4 53.8 18.8 55.6 20.4L84.2 37.8L82.4 41.4L51 23Z"],
    sole: COURT_SOLE, laces: [55.6, 20.4, 84.2, 37.8], cup: true,
  },
  high: {
    upper: "M10.5 54C8.6 40 9 24 13 12.6C20.6 13 28.6 14.4 36 13.6C38.6 8.4 42.6 5.4 47.2 5.6C50.6 5.8 52 7.6 53.6 9.4L84.2 37.8C98.6 40.4 109.4 44.8 112.6 54Z",
    panels: ["M10.5 54C9.2 46 9.2 38 11.6 31.6C18 34.6 23.6 43 25.4 54Z", "M13 12.6C20.6 13 28.6 14.4 36 13.6L36.8 19.8C29 20.8 20.6 19.8 12.4 19.2Z", TOE,
      "M48 6C51 6.2 52.2 7.8 53.6 9.4L84.2 37.8L82.4 41.4L50.4 12.4Z"],
    sole: COURT_SOLE, laces: [53.6, 9.4, 84.2, 37.8], cup: true,
  },
  runner: {
    upper: "M9.6 50C8.6 43 10 36.4 14.6 32.6C21.6 33.6 29 35.6 37 33.8C39.8 28.8 44 25.8 48.8 26C52 26.2 53.6 27.8 55.6 29.4L82.6 41C97.6 42.4 108.6 45.6 112.4 50Z",
    panels: ["M9.6 50C8.8 44.5 9.6 39.6 12.2 36.4C18.4 38.6 23 44 24.4 50Z", "M86 50C87.6 45.6 91.4 43 95 42.6C104.6 43.8 110 46.6 112.4 50Z",
      "M38 50L56.6 31.2L62.6 34L46.2 50Z", "M50 50L64.6 35.4L69 37.4L55.8 50Z"],
    sole: "M9 50H107C112.6 50 115.4 53.4 115.4 57.4C115.4 61.8 112.4 64 107.6 64H12.4C7.8 64 5 61.6 5 57.2C5 52.8 6.6 50 9 50Z",
    outsole: "M5.6 60.4H115C114.2 62.8 111.8 64 107.6 64H12.4C8.8 64 6.6 62.6 5.6 60.4Z",
    laces: [55.6, 29.4, 82.6, 41],
  },
  slide: {
    upper: "M40 52C42 39.4 54 31 70.4 31C87 31 101.4 38.6 109.6 48.6C110.8 50.2 110.6 51.4 109.6 52Z",
    panels: ["M40 52C42 39.4 54 31 70.4 31L71 36.4C58.4 37 48.6 43.4 46.6 52Z"],
    sole: "M8 52H109C113.4 52 116 54.6 116 58C116 61.6 113.4 64 109 64H11.4C7.4 64 5 61.6 5 58C5 54.6 6.2 52 8 52Z",
    outsole: "M5.4 60.6H115.6C114.8 62.8 112.6 64 109 64H11.4C8.4 64 6.4 62.8 5.4 60.6Z",
    strap: true,
  },
};

/** four laces across the lacing line from (x0, y0) to (x1, y1) */
function laces([x0, y0, x1, y1]: [number, number, number, number]): string {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  const [px, py] = [(-dy / len) * 2.7, (dx / len) * 2.7];
  return [0.16, 0.36, 0.56, 0.76]
    .map((t) => {
      const x = x0 + dx * t;
      const y = y0 + dy * t;
      return `M${(x - px).toFixed(1)} ${(y - py).toFixed(1)}L${(x + px).toFixed(1)} ${(y + py).toFixed(1)}`;
    })
    .join("");
}

/** The drawing as SVG markup. */
export function sneakerSvg(shape: Shape, p: Palette): string {
  const d = SHAPES[shape];
  const stroke = `stroke="${p.line}" stroke-width="1.3" stroke-linejoin="round"`;
  const out = d.outsole ? (p.sole === "#ffffff" ? mixed(p.base, "#000000", light(p.base) > 0.8 ? 0.35 : 0.15) : mixed(p.sole, "#000000", 0.18)) : "";
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80" viewBox="0 0 120 80">`,
    `<ellipse cx="60" cy="66" rx="52" ry="2.6" fill="#0f172a" opacity=".08"/>`,
    `<path d="${d.sole}" fill="${p.sole}" ${stroke}/>`,
    d.outsole ? `<path d="${d.outsole}" fill="${out}"/>` : "",
    d.cup ? `<path d="M12 58.4H108" stroke="${p.line}" stroke-width=".9" stroke-linecap="round" opacity=".35"/>` : "",
    `<path d="${d.upper}" fill="${p.base}" ${stroke}/>`,
    ...d.panels.map((x) => `<path d="${x}" fill="${p.accent}" ${stroke}/>`),
    d.laces ? `<path d="${laces(d.laces)}" stroke="${p.lace}" stroke-width="1.7" stroke-linecap="round"/>` : "",
    d.strap ? `<path d="M58 34.6C64 33.4 70 33.2 76 33.8" stroke="${p.lace}" stroke-width="1.4" stroke-linecap="round" opacity=".6"/>` : "",
    `</svg>`,
  ].join("");
}

/** The product photo for a model: its drawing as a data URL (an <img src> shows it; nothing is fetched). */
export function sneakerArt(shape: Shape, colorway: string, name = ""): string {
  return `data:image/svg+xml,${encodeURIComponent(sneakerSvg(shape, paletteOf(colorway, name)))}`;
}

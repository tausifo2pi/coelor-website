// Product pictures for the jewelry demo's generated catalogue (lib/storedemo/jewellery.ts): one piece per product, drawn
// as an SVG data URL in its metal (a shine gradient for gold, silver or rose gold) with its stone, on a warm linen
// backdrop, the way a small studio shoots a flat lay. Drawn here, so the demo shows no other store's photos and loads
// nothing from anywhere. Square canvas (100 × 100), the piece inside the middle three quarters of the width, so it fills
// the square thumbnails and still shows whole in the product drawer's 3:4 frame (both object-cover). Clean at 40–160 px:
// one outline, a highlight, a few engraved lines, no text. Pure, no "@/" imports: node --test loads it.

export type JKind = "ring" | "necklace" | "earring" | "bracelet" | "charm";

/** A small shape a piece carries: a pendant, a charm, a stud's face, a signet's engraving. */
export type Motif = "star" | "moon" | "sun" | "heart" | "shell" | "eye" | "clover" | "bee" | "lock" | "coin" | "flower" | "bar" | "drop" | "bezel" | "pearl" | "ball";

/** How a piece looks, as far as the picture shows it. */
export type JShape = {
  /** ring: the band and what sits on it */
  ring?: "band" | "stack" | "twist" | "beaded" | "dome" | "signet" | "solitaire" | "bezel" | "pearl" | "eternity" | "motif";
  /** necklace and bracelet: the chain */
  chain?: "fine" | "paperclip" | "herringbone" | "pearls" | "tennis" | "rope";
  /** bracelet: a bangle or an open cuff instead of a chain; stations along the chain */
  bangle?: "bangle" | "cuff";
  stations?: boolean;
  /** earring: the kind of earring */
  ear?: "studs" | "hoops" | "huggies" | "drops" | "threaders" | "cuff";
  /** pendant, charm, stud face, signet engraving */
  motif?: Motif;
  /** a stone (a STONES name) set in the piece */
  stone?: string;
  /** hoops and bangles: twisted; hoops: chunky */
  twist?: boolean;
  chunky?: boolean;
};

type Metal = { light: string; mid: string; dark: string; edge: string };

/** The metals the catalogue names; any gold reads as yellow gold, any silver as silver. */
export const METALS: Record<string, Metal> = {
  "Gold Vermeil": { light: "#fdf0bf", mid: "#e3b951", dark: "#a8791f", edge: "#87601a" },
  "14k Gold Fill": { light: "#fcecb4", mid: "#ddb049", dark: "#a2741d", edge: "#825d18" },
  "14k Yellow Gold": { light: "#fbe6a2", mid: "#d9a83a", dark: "#996a15", edge: "#7c5512" },
  "Sterling Silver": { light: "#ffffff", mid: "#d0d5dc", dark: "#8d949e", edge: "#6b727c" },
  "14k White Gold": { light: "#ffffff", mid: "#d8dadb", dark: "#979a9c", edge: "#73777a" },
  "Rose Gold Vermeil": { light: "#fde3d8", mid: "#e2a68f", dark: "#ad6d58", edge: "#8a5342" },
  "14k Rose Gold": { light: "#fbdccd", mid: "#dc9a80", dark: "#a5624c", edge: "#83503d" },
};

type Stone = { hex: string; pearl?: boolean; opal?: boolean; clear?: boolean };

/** Every stone the catalogue names, as it photographs. */
export const STONES: Record<string, Stone> = {
  Pearl: { hex: "#f3ece0", pearl: true },
  Opal: { hex: "#e6eef0", opal: true },
  Moonstone: { hex: "#dfe8f0", clear: true },
  "Lab Diamond": { hex: "#eef3f8", clear: true },
  "White Topaz": { hex: "#eef3f8", clear: true },
  Garnet: { hex: "#7d1d2c" },
  Amethyst: { hex: "#8a5db3" },
  Aquamarine: { hex: "#8fd2dc" },
  Emerald: { hex: "#1f8a5b" },
  Ruby: { hex: "#b3133b" },
  Peridot: { hex: "#9bc43f" },
  Sapphire: { hex: "#24409c" },
  Citrine: { hex: "#e7a52a" },
  "Blue Topaz": { hex: "#57b2db" },
  Turquoise: { hex: "#3eb4a6" },
  Onyx: { hex: "#232326" },
};

const metalOf = (name: string): Metal =>
  METALS[name] ?? (/rose/i.test(name) ? METALS["Rose Gold Vermeil"] : /silver|white/i.test(name) ? METALS["Sterling Silver"] : METALS["Gold Vermeil"]);
const stoneOf = (name: string | undefined): Stone | null => (name ? STONES[name] ?? STONES["White Topaz"] : null);

/* ---------- colour and numbers ---------- */

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const toHex = (c: number[]) => `#${c.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("")}`;
const mix = (a: string, b: string, t: number) => {
  const x = rgb(a);
  const y = rgb(b);
  return toHex(x.map((v, i) => v + (y[i] - v) * t));
};
const r1 = (v: number) => Math.round(v * 10) / 10;
const rad = (deg: number) => (deg * Math.PI) / 180;
/** a point on an ellipse at an angle (0° = right, 90° = the front, nearest the camera) */
const onEllipse = (cx: number, cy: number, rx: number, ry: number, deg: number): [number, number] => [r1(cx + rx * Math.cos(rad(deg))), r1(cy + ry * Math.sin(rad(deg)))];
/** a point on the necklace's curve (a quadratic Bézier from (17, 6) through (50, 100) to (83, 6)), t in [0, 1] */
const onCurve = (t: number): [number, number] => {
  const u = 1 - t;
  return [r1(u * u * 17 + 2 * u * t * 50 + t * t * 83), r1(u * u * 6 + 2 * u * t * 100 + t * t * 6)];
};
const NECK = "M17 6 Q50 100 83 6";

// Placeholders the drawing uses, filled in by jewelleryArt: {m} the metal's shine, {l} {d} {e} its light, dark and edge,
// {s} the stone's fill, {p} a pearl's, {bg} the backdrop.
const ELLIPSE = (cx: number, cy: number, rx: number, ry: number) => `M${r1(cx - rx)} ${cy} A${rx} ${ry} 0 1 0 ${r1(cx + rx)} ${cy} A${rx} ${ry} 0 1 0 ${r1(cx - rx)} ${cy} Z`;
const metal = (d: string, w = 0.9) => `<path d='${d}' fill='{m}' fill-rule='evenodd' stroke='{e}' stroke-width='${w}' stroke-linejoin='round'/>`;
const engrave = (d: string, o = 0.45) => `<path d='${d}' fill='none' stroke='{d}' stroke-width='.8' stroke-linecap='round' stroke-linejoin='round' opacity='${o}'/>`;
const shine = (d: string, w = 1, o = 0.7) => `<path d='${d}' fill='none' stroke='{l}' stroke-width='${w}' stroke-linecap='round' opacity='${o}'/>`;
const gem = (cx: number, cy: number, r: number) =>
  `<circle cx='${r1(cx)}' cy='${r1(cy)}' r='${r}' fill='{s}' stroke='{e}' stroke-width='.5'/>` +
  (r >= 3 ? `<path d='M${r1(cx - r * 0.45)} ${r1(cy - r * 0.2)} L${r1(cx)} ${r1(cy - r * 0.62)} L${r1(cx + r * 0.45)} ${r1(cy - r * 0.2)}' fill='none' stroke='#fff' stroke-width='.6' opacity='.7'/>` : "");
const pearl = (cx: number, cy: number, rx: number, ry = rx) => `<ellipse cx='${r1(cx)}' cy='${r1(cy)}' rx='${rx}' ry='${ry}' fill='{p}' stroke='#b9ad99' stroke-width='.5'/>`;
const sparkle = (x: number, y: number, s: number) =>
  `<path d='M${x} ${r1(y - s)} L${r1(x + s * 0.22)} ${r1(y - s * 0.22)} L${r1(x + s)} ${y} L${r1(x + s * 0.22)} ${r1(y + s * 0.22)} L${x} ${r1(y + s)} L${r1(x - s * 0.22)} ${r1(y + s * 0.22)} L${r1(x - s)} ${y} L${r1(x - s * 0.22)} ${r1(y - s * 0.22)} Z' fill='#fff' opacity='.85'/>`;
const shadow = (cx: number, cy: number, rx: number) => `<ellipse cx='${cx}' cy='${cy}' rx='${rx}' ry='${r1(rx * 0.12)}' fill='#5b4a36' opacity='.1'/>`;

/* ---------- motifs: one small shape, centred at (x, y), about 2s across ---------- */

function star(x: number, y: number, s: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? s * 0.42 : s;
    const a = rad(-90 + i * 36);
    pts.push(`${r1(x + r * Math.cos(a))} ${r1(y + r * Math.sin(a))}`);
  }
  return `M${pts.join(" L")} Z`;
}
const heart = (x: number, y: number, s: number) =>
  `M${x} ${r1(y + s * 0.9)} C${r1(x - s * 1.35)} ${r1(y + s * 0.05)} ${r1(x - s * 0.95)} ${r1(y - s * 1.05)} ${x} ${r1(y - s * 0.38)} C${r1(x + s * 0.95)} ${r1(y - s * 1.05)} ${r1(x + s * 1.35)} ${r1(y + s * 0.05)} ${x} ${r1(y + s * 0.9)} Z`;
const moon = (x: number, y: number, s: number) =>
  `M${r1(x + s * 0.35)} ${r1(y - s * 0.94)} A${s} ${s} 0 1 0 ${r1(x + s * 0.35)} ${r1(y + s * 0.94)} A${r1(s * 0.78)} ${r1(s * 0.78)} 0 1 1 ${r1(x + s * 0.35)} ${r1(y - s * 0.94)} Z`;
const shell = (x: number, y: number, s: number) =>
  `M${x} ${r1(y + s)} L${r1(x - s * 0.35)} ${r1(y + s * 0.7)} C${r1(x - s * 1.25)} ${r1(y + s * 0.2)} ${r1(x - s * 1.1)} ${r1(y - s * 0.95)} ${x} ${r1(y - s * 0.95)} C${r1(x + s * 1.1)} ${r1(y - s * 0.95)} ${r1(x + s * 1.25)} ${r1(y + s * 0.2)} ${r1(x + s * 0.35)} ${r1(y + s * 0.7)} Z`;
const shellRidges = (x: number, y: number, s: number) =>
  [-0.75, -0.4, 0, 0.4, 0.75].map((f) => `M${x} ${r1(y + s * 0.85)} L${r1(x + f * s)} ${r1(y - s * 0.75)}`).join(" ");

/** a motif in metal (with its engraved detail and stone where it has one) */
function motif(m: Motif, x: number, y: number, s: number, stone: boolean): string {
  switch (m) {
    case "star":
      return metal(star(x, y, s)) + shine(`M${r1(x - s * 0.15)} ${r1(y - s * 0.55)} L${r1(x - s * 0.05)} ${r1(y - s * 0.15)}`, 0.8);
    case "moon":
      return metal(moon(x, y, s)) + shine(`M${r1(x - s * 0.55)} ${r1(y - s * 0.4)} Q${r1(x - s * 0.75)} ${y} ${r1(x - s * 0.55)} ${r1(y + s * 0.4)}`, 0.8);
    case "sun": {
      const rays: string[] = [];
      for (let i = 0; i < 12; i++) {
        const [a, b] = [onEllipse(x, y, s * 0.62, s * 0.62, i * 30), onEllipse(x, y, s, s, i * 30)];
        rays.push(`M${a[0]} ${a[1]} L${b[0]} ${b[1]}`);
      }
      return `<path d='${rays.join(" ")}' stroke='{e}' stroke-width='${r1(s * 0.24)}' stroke-linecap='round'/><path d='${rays.join(" ")}' stroke='{m}' stroke-width='${r1(s * 0.15)}' stroke-linecap='round'/>` +
        metal(ELLIPSE(x, y, r1(s * 0.5), r1(s * 0.5))) + (stone ? gem(x, y, r1(s * 0.3)) : "");
    }
    case "heart":
      return metal(heart(x, y, s)) + shine(`M${r1(x - s * 0.62)} ${r1(y - s * 0.4)} Q${r1(x - s * 0.7)} ${r1(y - s * 0.05)} ${r1(x - s * 0.4)} ${r1(y + s * 0.25)}`, 0.8) + (stone ? gem(x, r1(y - s * 0.05), r1(s * 0.28)) : "");
    case "shell":
      return metal(shell(x, y, s)) + engrave(shellRidges(x, y, s), 0.5);
    case "eye":
      return metal(`M${r1(x - s)} ${y} Q${x} ${r1(y - s * 0.95)} ${r1(x + s)} ${y} Q${x} ${r1(y + s * 0.95)} ${r1(x - s)} ${y} Z`) +
        `<circle cx='${x}' cy='${y}' r='${r1(s * 0.38)}' fill='#2f6fb5' stroke='{e}' stroke-width='.4'/><circle cx='${x}' cy='${y}' r='${r1(s * 0.17)}' fill='#15233b'/>` +
        `<circle cx='${r1(x - s * 0.12)}' cy='${r1(y - s * 0.12)}' r='${r1(s * 0.07)}' fill='#fff'/>`;
    case "clover": {
      const leaves = [0, 90, 180, 270].map((a) => onEllipse(x, y - s * 0.1, s * 0.48, s * 0.48, a + 45)).map(([cx, cy]) => ELLIPSE(cx, cy, r1(s * 0.42), r1(s * 0.42))).join(" ");
      return engrave(`M${x} ${r1(y + s * 0.2)} Q${r1(x + s * 0.15)} ${r1(y + s * 0.7)} ${r1(x + s * 0.45)} ${r1(y + s)}`, 0.9) + metal(leaves) + (stone ? gem(x, r1(y - s * 0.1), r1(s * 0.2)) : "");
    }
    case "bee":
      return `<ellipse cx='${r1(x - s * 0.42)}' cy='${r1(y - s * 0.42)}' rx='${r1(s * 0.42)}' ry='${r1(s * 0.28)}' fill='{l}' stroke='{e}' stroke-width='.6' opacity='.85' transform='rotate(-30 ${r1(x - s * 0.42)} ${r1(y - s * 0.42)})'/>` +
        `<ellipse cx='${r1(x + s * 0.42)}' cy='${r1(y - s * 0.42)}' rx='${r1(s * 0.42)}' ry='${r1(s * 0.28)}' fill='{l}' stroke='{e}' stroke-width='.6' opacity='.85' transform='rotate(30 ${r1(x + s * 0.42)} ${r1(y - s * 0.42)})'/>` +
        metal(ELLIPSE(x, r1(y + s * 0.1), r1(s * 0.42), r1(s * 0.72))) +
        engrave(`M${r1(x - s * 0.38)} ${r1(y + s * 0.05)} L${r1(x + s * 0.38)} ${r1(y + s * 0.05)} M${r1(x - s * 0.33)} ${r1(y + s * 0.38)} L${r1(x + s * 0.33)} ${r1(y + s * 0.38)}`, 0.8);
    case "lock":
      return `<path d='M${r1(x - s * 0.45)} ${r1(y - s * 0.1)} L${r1(x - s * 0.45)} ${r1(y - s * 0.5)} A${r1(s * 0.45)} ${r1(s * 0.45)} 0 0 1 ${r1(x + s * 0.45)} ${r1(y - s * 0.5)} L${r1(x + s * 0.45)} ${r1(y - s * 0.1)}' fill='none' stroke='{e}' stroke-width='${r1(s * 0.24)}'/>` +
        `<path d='M${r1(x - s * 0.45)} ${r1(y - s * 0.1)} L${r1(x - s * 0.45)} ${r1(y - s * 0.5)} A${r1(s * 0.45)} ${r1(s * 0.45)} 0 0 1 ${r1(x + s * 0.45)} ${r1(y - s * 0.5)} L${r1(x + s * 0.45)} ${r1(y - s * 0.1)}' fill='none' stroke='{m}' stroke-width='${r1(s * 0.15)}'/>` +
        metal(`M${r1(x - s * 0.8)} ${r1(y - s * 0.15)} L${r1(x + s * 0.8)} ${r1(y - s * 0.15)} L${r1(x + s * 0.8)} ${r1(y + s * 0.75)} Q${r1(x + s * 0.8)} ${r1(y + s * 0.95)} ${r1(x + s * 0.6)} ${r1(y + s * 0.95)} L${r1(x - s * 0.6)} ${r1(y + s * 0.95)} Q${r1(x - s * 0.8)} ${r1(y + s * 0.95)} ${r1(x - s * 0.8)} ${r1(y + s * 0.75)} Z`) +
        `<circle cx='${x}' cy='${r1(y + s * 0.32)}' r='${r1(s * 0.13)}' fill='{d}'/>`;
    case "coin":
      return metal(ELLIPSE(x, y, s, s)) + engrave(ELLIPSE(x, y, r1(s * 0.78), r1(s * 0.78)), 0.4) + (stone ? gem(x, y, r1(s * 0.26)) : engrave(star(x, y, s * 0.42), 0.55));
    case "flower": {
      const petals = [0, 72, 144, 216, 288].map((a) => onEllipse(x, y, s * 0.55, s * 0.55, a - 90)).map(([cx, cy]) => ELLIPSE(cx, cy, r1(s * 0.42), r1(s * 0.42))).join(" ");
      return metal(petals, 0.7) + (stone ? gem(x, y, r1(s * 0.32)) : metal(ELLIPSE(x, y, r1(s * 0.3), r1(s * 0.3))));
    }
    case "bar":
      return metal(`M${r1(x - s)} ${r1(y - s * 0.22)} L${r1(x + s)} ${r1(y - s * 0.22)} L${r1(x + s)} ${r1(y + s * 0.22)} L${r1(x - s)} ${r1(y + s * 0.22)} Z`) + shine(`M${r1(x - s * 0.85)} ${r1(y - s * 0.08)} L${r1(x + s * 0.6)} ${r1(y - s * 0.08)}`, 0.7);
    case "drop":
      return metal(`M${x} ${r1(y - s)} C${r1(x + s * 0.25)} ${r1(y - s * 0.55)} ${r1(x + s * 0.78)} ${r1(y + s * 0.05)} ${r1(x + s * 0.78)} ${r1(y + s * 0.38)} A${r1(s * 0.78)} ${r1(s * 0.62)} 0 0 1 ${r1(x - s * 0.78)} ${r1(y + s * 0.38)} C${r1(x - s * 0.78)} ${r1(y + s * 0.05)} ${r1(x - s * 0.25)} ${r1(y - s * 0.55)} ${x} ${r1(y - s)} Z`) +
        (stone ? `<path d='M${x} ${r1(y - s * 0.62)} C${r1(x + s * 0.18)} ${r1(y - s * 0.3)} ${r1(x + s * 0.55)} ${r1(y + s * 0.1)} ${r1(x + s * 0.55)} ${r1(y + s * 0.38)} A${r1(s * 0.55)} ${r1(s * 0.42)} 0 0 1 ${r1(x - s * 0.55)} ${r1(y + s * 0.38)} C${r1(x - s * 0.55)} ${r1(y + s * 0.1)} ${r1(x - s * 0.18)} ${r1(y - s * 0.3)} ${x} ${r1(y - s * 0.62)} Z' fill='{s}' stroke='{e}' stroke-width='.4'/>` : "");
    case "bezel":
      return metal(ELLIPSE(x, y, s, s)) + (stone ? gem(x, y, r1(s * 0.72)) : engrave(ELLIPSE(x, y, r1(s * 0.65), r1(s * 0.65)), 0.5));
    case "pearl":
      return pearl(x, y, r1(s * 0.78), s);
    case "ball":
      return metal(ELLIPSE(x, y, s, s)) + `<circle cx='${r1(x - s * 0.32)}' cy='${r1(y - s * 0.32)}' r='${r1(s * 0.28)}' fill='{l}' opacity='.8'/>`;
  }
}

/* ---------- the pieces ---------- */

/** a tilted band: the outer edge, the hole (higher up, so the band shows its thickness at the front), the inside of the
 * back of the band */
function band(cy: number, rx: number, ry: number, thick: number): string {
  const inner = ELLIPSE(50, r1(cy - thick * 0.35), r1(rx - thick * 0.8), r1(ry - thick));
  return metal(`${ELLIPSE(50, cy, rx, ry)} ${inner}`) +
    `<path d='M${r1(50 - rx + thick * 0.8)} ${r1(cy - thick * 0.35)} A${r1(rx - thick * 0.8)} ${r1(ry - thick)} 0 0 1 ${r1(50 + rx - thick * 0.8)} ${r1(cy - thick * 0.35)} A${r1(rx - thick * 0.8)} ${r1((ry - thick) * 0.45)} 0 0 0 ${r1(50 - rx + thick * 0.8)} ${r1(cy - thick * 0.35)} Z' fill='{d}' opacity='.45'/>` +
    shine(`M${r1(50 - rx * 0.78)} ${r1(cy + ry * 0.5)} A${rx} ${ry} 0 0 0 ${r1(50 - rx * 0.2)} ${r1(cy + ry * 0.97)}`, 1.1, 0.75);
}

function ring(s: JShape, hasStone: boolean): string {
  const style = s.ring ?? "band";
  const out: string[] = [shadow(50, 84, 27)];
  if (style === "stack") {
    for (const cy of [70, 61, 52]) out.push(band(cy, 25, 12.5, 2.6));
    return out.join("");
  }
  const thick = style === "dome" ? 7.5 : style === "signet" ? 5.5 : style === "solitaire" || style === "bezel" || style === "pearl" || style === "motif" ? 3.4 : 4.6;
  out.push(band(62, 26, 16.5, thick));
  if (style === "twist") {
    const lines: string[] = [];
    for (let a = 15; a <= 165; a += 13) {
      const [x1, y1] = onEllipse(50, 62, 26, 16.5, a);
      const [x2, y2] = onEllipse(50, r1(62 - thick * 0.35), 26 - thick * 0.8, 16.5 - thick, a + 9);
      lines.push(`M${x1} ${y1} L${x2} ${y2}`);
    }
    out.push(engrave(lines.join(" "), 0.55));
  }
  if (style === "beaded" || style === "eternity") {
    for (let a = 20; a <= 160; a += style === "eternity" ? 14 : 11) {
      const [x, y] = onEllipse(50, r1(62 - thick * 0.2), 26 - thick * 0.4, 16.5 - thick * 0.5, a);
      out.push(style === "eternity" ? gem(x, y, 1.9) : `<circle cx='${x}' cy='${y}' r='1.7' fill='{m}' stroke='{e}' stroke-width='.45'/>`);
    }
  }
  if (style === "signet") {
    out.push(metal(ELLIPSE(50, 45.5, 12, 6.2)), `<ellipse cx='50' cy='45' rx='9.4' ry='4.4' fill='{l}' opacity='.45'/>`);
    if (s.motif === "star") out.push(engrave(star(50, 45.2, 3.6), 0.65));
    else if (s.motif === "moon") out.push(engrave(moon(50, 45.2, 3.2), 0.65));
  }
  if (style === "solitaire") {
    out.push(engrave("M44.6 47 L45.6 39.5 M55.4 47 L54.4 39.5 M47.6 48 L48 41 M52.4 48 L52 41", 0.9));
    out.push(gem(50, 39.5, 6.6), sparkle(47.6, 37.2, 2.2));
  }
  if (style === "bezel" || (style === "motif" && s.motif === "bezel")) out.push(motif("bezel", 50, 44, 6, hasStone));
  else if (style === "pearl") out.push(pearl(50, 40, 7.2, 7.2));
  else if (style === "motif" && s.motif) out.push(motif(s.motif, 50, 43, 6.5, hasStone));
  return out.join("");
}

function chainPath(d: string, kind: JShape["chain"]): string {
  switch (kind) {
    case "paperclip":
      return `<path d='${d}' fill='none' stroke='{e}' stroke-width='3.2'/><path d='${d}' fill='none' stroke='{m}' stroke-width='2.4'/><path d='${d}' fill='none' stroke='{bg}' stroke-width='.9' stroke-dasharray='3.6 2.4'/>`;
    case "herringbone":
      return `<path d='${d}' fill='none' stroke='{e}' stroke-width='5' stroke-linecap='round'/><path d='${d}' fill='none' stroke='{m}' stroke-width='4.2' stroke-linecap='round'/><path d='${d}' fill='none' stroke='{d}' stroke-width='4.2' stroke-dasharray='.5 1.1' opacity='.35'/>`;
    case "rope":
      return `<path d='${d}' fill='none' stroke='{e}' stroke-width='3'/><path d='${d}' fill='none' stroke='{m}' stroke-width='2.3'/><path d='${d}' fill='none' stroke='{d}' stroke-width='2.3' stroke-dasharray='1 1.4' opacity='.5'/>`;
    default:
      return `<path d='${d}' fill='none' stroke='{e}' stroke-width='1.9'/><path d='${d}' fill='none' stroke='{m}' stroke-width='1.3'/><path d='${d}' fill='none' stroke='{d}' stroke-width='1.3' stroke-dasharray='1 1.1' opacity='.4'/>`;
  }
}

function necklace(s: JShape, hasStone: boolean): string {
  const out: string[] = [];
  if (s.chain === "pearls") {
    for (let t = 0.03; t <= 0.98; t += 0.043) out.push(pearl(...onCurve(t), 2.7));
    return out.join("");
  }
  if (s.chain === "tennis") {
    out.push(chainPath(NECK, "fine"));
    for (let t = 0.12; t <= 0.89; t += 0.031) out.push(gem(...onCurve(t), 1.7));
    return out.join("");
  }
  out.push(chainPath(NECK, s.chain));
  if (s.motif === "bar") return out.join("") + motif("bar", 50, 53.5, 9.5, false);
  if (s.motif) {
    const big = s.motif === "pearl" ? 7.6 : s.motif === "bezel" ? 7 : 10.5;
    out.push(`<circle cx='50' cy='56' r='1.7' fill='none' stroke='{e}' stroke-width='1.5'/><circle cx='50' cy='56' r='1.7' fill='none' stroke='{m}' stroke-width='.9'/>`);
    out.push(motif(s.motif, 50, r1(58 + big), big, hasStone));
  }
  return out.join("");
}

function earrings(s: JShape, hasStone: boolean): string {
  const ear = s.ear ?? "studs";
  const one = (x: number): string => {
    switch (ear) {
      case "hoops":
      case "huggies": {
        const [rx, ry, w] = ear === "hoops" ? [12.5, 16, s.chunky ? 5.4 : 3.6] : [8.5, 10, 4.8];
        const cy = ear === "hoops" ? 52 : 50;
        const d = `M${r1(x - 1.6)} ${r1(cy - ry)} A${rx} ${ry} 0 1 0 ${r1(x + 1.6)} ${r1(cy - ry)}`;
        let o = `<path d='${d}' fill='none' stroke='{e}' stroke-width='${r1(w + 1)}' stroke-linecap='round'/><path d='${d}' fill='none' stroke='{m}' stroke-width='${w}' stroke-linecap='round'/>`;
        if (s.twist) o += `<path d='${d}' fill='none' stroke='{d}' stroke-width='${w}' stroke-dasharray='.8 1.6' opacity='.4'/>`;
        o += shine(`M${r1(x - rx * 0.86)} ${r1(cy - ry * 0.35)} A${rx} ${ry} 0 0 0 ${r1(x - rx * 0.5)} ${r1(cy + ry * 0.8)}`, 1, 0.7);
        if (hasStone && ear === "huggies" && s.motif !== "pearl") for (let a = 35; a <= 145; a += 22) o += gem(...onEllipse(x, cy, rx, ry, a), 1.5);
        if (s.motif === "pearl" || (hasStone && ear === "hoops")) o += s.motif === "pearl" ? pearl(x, r1(cy + ry + 4.5), 3.6, 4.4) : gem(x, r1(cy + ry), 2.6);
        return o;
      }
      case "drops": {
        const m = s.motif ?? (hasStone ? "drop" : "ball");
        return `<circle cx='${x}' cy='32' r='2.6' fill='{m}' stroke='{e}' stroke-width='.6'/>` + engrave(`M${x} 34.6 L${x} 46`, 1) + `<path d='M${x} 34.6 L${x} 46' stroke='{m}' stroke-width='.7'/>` +
          motif(m, x, m === "pearl" ? 55 : 56, m === "pearl" ? 7 : 8, hasStone);
      }
      case "threaders":
        return chainPath(`M${x} 30 Q${r1(x - 4)} 52 ${r1(x - 1)} 76`, "fine") + motif(s.motif ?? "ball", x, 29, s.motif === "star" ? 4.6 : 3.2, hasStone) + metal(`M${r1(x - 2.6)} 75.4 L${r1(x + 0.6)} 75.4 L${r1(x + 0.6)} 77.4 L${r1(x - 2.6)} 77.4 Z`, 0.5);
      case "cuff": {
        const d = `M${r1(x + 2)} 35 A11 14 0 1 0 ${r1(x + 7)} 62`;
        return `<path d='${d}' fill='none' stroke='{e}' stroke-width='5.6' stroke-linecap='round'/><path d='${d}' fill='none' stroke='{m}' stroke-width='4.5' stroke-linecap='round'/>` +
          (s.motif ? motif(s.motif, r1(x - 8), 50, 4.2, hasStone) : "");
      }
      default: {
        const m = s.motif ?? (hasStone ? "bezel" : "ball");
        return shadow(x, 64, 8) + motif(m, x, 50, m === "bezel" ? 8.5 : m === "pearl" ? 10 : 9.5, hasStone) + (m === "bezel" && hasStone ? sparkle(r1(x - 2.6), 47, 2.2) : "");
      }
    }
  };
  return one(31) + one(69);
}

function bracelet(s: JShape, hasStone: boolean): string {
  const out: string[] = [shadow(50, 82, 30)];
  const [cx, cy, rx, ry] = [50, 56, 33, 20];
  if (s.bangle === "bangle") {
    out.push(metal(`${ELLIPSE(cx, cy, rx, ry)} ${ELLIPSE(cx, cy - 1.4, rx - 3.4, ry - 4)}`));
    if (s.twist) {
      const lines: string[] = [];
      for (let a = 0; a < 360; a += 10) {
        const [x1, y1] = onEllipse(cx, cy, rx, ry, a);
        const [x2, y2] = onEllipse(cx, cy - 1.4, rx - 3.4, ry - 4, a + 6);
        lines.push(`M${x1} ${y1} L${x2} ${y2}`);
      }
      out.push(engrave(lines.join(" "), 0.45));
    }
    out.push(shine(`M${r1(cx - rx * 0.8)} ${r1(cy + ry * 0.55)} A${rx} ${ry} 0 0 0 ${r1(cx - rx * 0.15)} ${r1(cy + ry * 0.98)}`, 1.1));
    return out.join("");
  }
  if (s.bangle === "cuff") {
    const [a0, a1] = [onEllipse(cx, cy, rx, ry, 112), onEllipse(cx, cy, rx, ry, 68)];
    const d = `M${a0[0]} ${a0[1]} A${rx} ${ry} 0 1 1 ${a1[0]} ${a1[1]}`;
    out.push(`<path d='${d}' fill='none' stroke='{e}' stroke-width='8.4' stroke-linecap='round'/><path d='${d}' fill='none' stroke='{m}' stroke-width='7.2' stroke-linecap='round'/>`);
    const [h0, h1] = [onEllipse(cx, cy, rx, ry, 150), onEllipse(cx, cy, rx, ry, 205)];
    out.push(shine(`M${h0[0]} ${h0[1]} A${rx} ${ry} 0 0 1 ${h1[0]} ${h1[1]}`, 1.4));
    if (hasStone) out.push(gem(a0[0], a0[1], 2.6), gem(a1[0], a1[1], 2.6));
    return out.join("");
  }
  if (s.chain === "pearls") {
    for (let a = 0; a < 360; a += 12) out.push(pearl(...onEllipse(cx, cy, rx, ry, a), 3.1));
    return out.join("");
  }
  if (s.chain === "tennis") {
    out.push(chainPath(ELLIPSE(cx, cy, rx, ry), "fine"));
    for (let a = 0; a < 360; a += 9) out.push(gem(...onEllipse(cx, cy, rx, ry, a), 2));
    return out.join("");
  }
  out.push(chainPath(ELLIPSE(cx, cy, rx, ry), s.chain));
  if (s.stations || s.motif) {
    for (const a of [55, 90, 125]) {
      const [x, y] = onEllipse(cx, cy, rx, ry, a);
      out.push(motif(s.motif ?? "bezel", x, r1(y + (s.motif ? 4 : 0)), s.motif ? 4 : 2.8, hasStone));
    }
  }
  return out.join("");
}

function charm(s: JShape, hasStone: boolean): string {
  const m = s.motif ?? "coin";
  const size = m === "bezel" ? 11 : m === "bar" ? 14 : 15;
  return shadow(50, 86, 16) +
    `<circle cx='50' cy='33' r='4.6' fill='none' stroke='{e}' stroke-width='3'/><circle cx='50' cy='33' r='4.6' fill='none' stroke='{m}' stroke-width='2'/>` +
    metal(`M47.8 37.2 L52.2 37.2 L51.8 ${r1(59 - size * 0.8)} L48.2 ${r1(59 - size * 0.8)} Z`, 0.6) +
    motif(m, 50, 58, size, hasStone) +
    (hasStone && (m === "bezel" || m === "coin") ? sparkle(46.5, 54.5, 2.4) : "");
}

function draw(kind: JKind, s: JShape, hasStone: boolean): string {
  switch (kind) {
    case "ring": return ring(s, hasStone);
    case "necklace": return necklace(s, hasStone);
    case "earring": return earrings(s, hasStone);
    case "bracelet": return bracelet(s, hasStone);
    case "charm": return charm(s, hasStone);
  }
}

const BG = "#f3eee6";
const memo = new Map<string, string>();

/** The picture of a piece: its kind, its metal (a METALS name) and its look, as a data:image/svg+xml URL. The same
 * three always give the same picture. */
export function jewelleryArt(kind: JKind, metalName: string, shape: JShape = {}): string {
  const key = `${kind}|${metalName}|${JSON.stringify(shape)}`;
  const hit = memo.get(key);
  if (hit) return hit;
  const m = metalOf(metalName);
  const st = stoneOf(shape.stone);
  const defs: string[] = [
    `<linearGradient id='m' gradientUnits='userSpaceOnUse' x1='18' y1='14' x2='82' y2='88'><stop offset='0' stop-color='${m.light}'/><stop offset='.38' stop-color='${m.mid}'/><stop offset='.5' stop-color='${mix(m.light, m.mid, 0.35)}'/><stop offset='.66' stop-color='${m.mid}'/><stop offset='1' stop-color='${m.dark}'/></linearGradient>`,
    `<radialGradient id='p' cx='.36' cy='.32' r='.75'><stop offset='0' stop-color='#ffffff'/><stop offset='.45' stop-color='#f2ebdf'/><stop offset='1' stop-color='#cfc3ad'/></radialGradient>`,
  ];
  if (st) {
    const hl = st.clear ? "#ffffff" : mix(st.hex, "#ffffff", 0.55);
    const lo = st.clear ? "#b9c6d3" : mix(st.hex, "#000000", 0.35);
    defs.push(
      st.opal
        ? `<radialGradient id='s' cx='.38' cy='.34' r='.8'><stop offset='0' stop-color='#ffffff'/><stop offset='.35' stop-color='#d9f0ec'/><stop offset='.6' stop-color='#f3d5e6'/><stop offset='.82' stop-color='#cfe3f4'/><stop offset='1' stop-color='#a9bfcc'/></radialGradient>`
        : st.pearl
          ? `<radialGradient id='s' cx='.36' cy='.32' r='.75'><stop offset='0' stop-color='#ffffff'/><stop offset='.45' stop-color='#f2ebdf'/><stop offset='1' stop-color='#cfc3ad'/></radialGradient>`
          : `<radialGradient id='s' cx='.35' cy='.32' r='.8'><stop offset='0' stop-color='${hl}'/><stop offset='.5' stop-color='${st.hex}'/><stop offset='1' stop-color='${lo}'/></radialGradient>`,
    );
  }
  const body = draw(kind, shape, !!st)
    .replace(/\{m\}/g, "url(#m)")
    .replace(/\{s\}/g, "url(#s)")
    .replace(/\{p\}/g, "url(#p)")
    .replace(/\{l\}/g, m.light)
    .replace(/\{d\}/g, m.dark)
    .replace(/\{e\}/g, m.edge)
    .replace(/\{bg\}/g, BG);
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><defs>${defs.join("")}</defs><rect width='100' height='100' fill='${BG}'/>${body}</svg>`;
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  if (memo.size > 2000) memo.clear();
  memo.set(key, url);
  return url;
}

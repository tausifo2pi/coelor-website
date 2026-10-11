// Product pictures for the boutique demo's generated catalogue (lib/storedemo/catalog.ts): one flat garment silhouette
// per product, tinted by its colour, as an SVG data URL. Drawn here, so the demo shows no other store's photos and loads
// nothing from anywhere. The canvas is square (100 × 100) and the garment stays inside the middle three quarters of the
// width: it fills the square thumbnails and still shows whole in the product drawer's 3:4 frame (both object-cover).
// Clean at 40–160 px: one outline, a few seam lines, no text. Pure, no "@/" imports: node --test loads it.

export type Kind = "dress" | "top" | "sweater" | "cardigan" | "jeans" | "skirt" | "pants" | "jacket" | "set" | "belt" | "hat" | "bag" | "scarf";
type Pattern = "floral" | "leopard" | "plaid" | "stripe" | "gingham";
type Shade = { hex: string; pattern?: Pattern; accent?: string };

/** Every colour the catalogue names, as a boutique photographs it: muted and warm, nothing neon. */
export const SHADES: Record<string, Shade> = {
  Black: { hex: "#26262a" },
  Charcoal: { hex: "#4a4b50" },
  "Heather Grey": { hex: "#a9a8a5" },
  White: { hex: "#f8f7f3" },
  Ivory: { hex: "#f1ebdd" },
  Cream: { hex: "#ebe0c9" },
  Oatmeal: { hex: "#d9ccb4" },
  Natural: { hex: "#d8c29b" },
  Taupe: { hex: "#a39282" },
  Khaki: { hex: "#b6a57e" },
  Tan: { hex: "#c39a6b" },
  Camel: { hex: "#b98955" },
  Mocha: { hex: "#806052" },
  Brown: { hex: "#6d4c38" },
  Chocolate: { hex: "#4d3226" },
  Cognac: { hex: "#9b5a32" },
  Rust: { hex: "#b05a34" },
  "Burnt Orange": { hex: "#c66a35" },
  Mustard: { hex: "#c99a3a" },
  Butter: { hex: "#efd98f" },
  Coral: { hex: "#e0806b" },
  Red: { hex: "#a8292f" },
  Burgundy: { hex: "#6c2431" },
  Wine: { hex: "#7a2e3e" },
  Berry: { hex: "#8c3758" },
  Plum: { hex: "#5b3550" },
  Mauve: { hex: "#b4878f" },
  "Dusty Rose": { hex: "#c99490" },
  Blush: { hex: "#e9c3ba" },
  Pink: { hex: "#e8a6b8" },
  Lavender: { hex: "#bcadd0" },
  "Dusty Blue": { hex: "#8fa7bf" },
  Navy: { hex: "#283650" },
  Teal: { hex: "#2f6c70" },
  Emerald: { hex: "#24644b" },
  "Hunter Green": { hex: "#31493b" },
  Olive: { hex: "#6e6e45" },
  Sage: { hex: "#a8b49a" },
  "Light Wash": { hex: "#a9bfd4" },
  "Medium Wash": { hex: "#6f8db0" },
  "Vintage Wash": { hex: "#8ea4bc" },
  "Dark Wash": { hex: "#36496a" },
  "Black Wash": { hex: "#3a3c42" },
  "Black Floral": { hex: "#26262a", pattern: "floral", accent: "#e8b4b0" },
  "Ivory Floral": { hex: "#f1ebdd", pattern: "floral", accent: "#c46a6a" },
  "Blue Floral": { hex: "#4f6c8e", pattern: "floral", accent: "#f1e6d6" },
  "Rust Floral": { hex: "#b05a34", pattern: "floral", accent: "#f0dcc0" },
  "Sage Floral": { hex: "#a8b49a", pattern: "floral", accent: "#f6efe3" },
  Leopard: { hex: "#c99d62", pattern: "leopard", accent: "#3d2a1e" },
  "Brown Plaid": { hex: "#8b6a4f", pattern: "plaid", accent: "#e7d9c0" },
  "Grey Plaid": { hex: "#9d9c99", pattern: "plaid", accent: "#3f4046" },
  "Red Plaid": { hex: "#9e2b2f", pattern: "plaid", accent: "#2a2a2e" },
  "Navy Stripe": { hex: "#f4f1ea", pattern: "stripe", accent: "#283650" },
  "Black Stripe": { hex: "#f4f1ea", pattern: "stripe", accent: "#26262a" },
  "Blue Gingham": { hex: "#f4f1ea", pattern: "gingham", accent: "#6f8db0" },
};

/** How a piece is cut, as far as the picture shows it. */
export type Shape = {
  /** dress, skirt */
  length?: "mini" | "midi" | "maxi";
  /** dress, top */
  sleeve?: "none" | "short" | "long";
  /** a placket down the front (shirts, henleys, button-front pieces) */
  placket?: boolean;
  /** sweater */
  neck?: "crew" | "turtle" | "v";
  /** jeans, pants */
  leg?: "straight" | "wide" | "flare";
  /** set: what goes with the top */
  bottom?: "pants" | "shorts" | "skirt";
  /** jacket, bag */
  fringe?: boolean;
  /** skirt, dress: tiers or pleats */
  tiers?: boolean;
  bag?: "tote" | "crossbody" | "clutch";
};

/* ---------- colour ---------- */

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const toHex = (c: number[]) => `#${c.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("")}`;
const mix = (a: string, b: string, t: number) => {
  const x = rgb(a);
  const y = rgb(b);
  return toHex(x.map((v, i) => v + (y[i] - v) * t));
};
const luma = (hex: string) => {
  const [r, g, b] = rgb(hex);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
};

/** The colour of a named shade; a name the table does not know gets a neutral oatmeal. */
export const shadeOf = (name: string): Shade => SHADES[name] ?? SHADES.Oatmeal;

/* ---------- drawing ---------- */

/** A garment as drawn: `fill` paths in its colour (back to front), `cut` paths in the backdrop colour (an open front),
 * `dark` paths a shade darker (lapels, a flap, a hat band), seam `lines`, raw `top` markup (buckles, buttons, fringe),
 * and a vertical `shift` to centre short pieces. */
type Parts = { fill: string[]; cut?: string[]; dark?: string[]; lines?: string[]; top?: string; shift?: number };

const r1 = (v: number) => Math.round(v * 10) / 10;

/** A path mirrored left to right. Paths here use only M, L, C, Q and Z with absolute x y pairs. */
function mirror(d: string): string {
  let i = 0;
  return d.replace(/-?\d+(\.\d+)?/g, (n) => String(i++ % 2 === 0 ? r1(100 - Number(n)) : Number(n)));
}

function dress(s: Shape): Parts {
  const length = s.length ?? "midi";
  const hem = { mini: 66, midi: 80, maxi: 92 }[length];
  const hw = { mini: 19, midi: 22, maxi: 24 }[length];
  const sleeve =
    s.sleeve === "short" ? "M37 15 L28.5 24.5 L33.5 30 L40.5 25 Z" : s.sleeve === "long" ? "M37 15 L30 21 L25.5 55 L31.5 56.5 L37.5 31 Z" : "";
  const body = `M38 14 C42 22 58 22 62 14 L64 16 C62 22 61 26 60 30 L59 40 L${50 + hw} ${hem} Q50 ${hem + 3} ${50 - hw} ${hem} L41 40 L40 30 C39 26 38 22 36 16 Z`;
  const lines = ["M41 40 L59 40", `M46 44 L${r1(50 - hw * 0.45)} ${hem - 3}`, `M54 44 L${r1(50 + hw * 0.45)} ${hem - 3}`];
  if (s.placket) lines.push("M50 21 L50 39");
  if (s.tiers) for (const f of [0.36, 0.68]) lines.push(across(40, 41, 59, hem, 50 - hw, 50 + hw, f));
  return { fill: sleeve ? [sleeve, mirror(sleeve), body] : [body], lines, shift: length === "mini" ? 8 : length === "midi" ? 3 : 0 };
}

/** a line across a flared piece at fraction f of the way from the top (y0, x from a0 to b0) to the hem (y1, a1 to b1) */
function across(y0: number, a0: number, b0: number, y1: number, a1: number, b1: number, f: number): string {
  const y = r1(y0 + (y1 - y0) * f);
  return `M${r1(a0 + (a1 - a0) * f + 0.8)} ${y} L${r1(b0 + (b1 - b0) * f - 0.8)} ${y}`;
}

function top(s: Shape): Parts {
  const body =
    s.sleeve === "none"
      ? "M40 16 L43 16 C45 28 55 28 57 16 L60 16 C61 26 64 30 66 34 L67 80 Q50 82 33 80 L34 34 C36 30 39 26 40 16 Z"
      : s.sleeve === "short"
        ? "M41 18 C45 25 55 25 59 18 L69 21 L80 36 L72 42 L66 37 L67 80 Q50 82 33 80 L34 37 L28 42 L20 36 L31 21 Z"
        : "M41 18 C45 25 55 25 59 18 L69 21 L82 66 L74 68.5 L66 42 L67 80 Q50 82 33 80 L34 42 L26 68.5 L18 66 L31 21 Z";
  const lines = ["M34 76 Q50 78 66 76"];
  if (s.placket && s.sleeve !== "none") lines.push("M50 24 L50 79");
  return { fill: [body], lines, top: s.placket && s.sleeve !== "none" ? dots([[51.8, 32], [51.8, 44], [51.8, 56], [51.8, 68]], 0.9) : "" };
}

const SWEATER = "M40 17 C44 23 56 23 60 17 L72 21 Q78 24 80 34 L85 70 L76 72 L71 42 L70 80 L30 80 L29 42 L24 72 L15 70 L20 34 Q22 24 28 21 Z";

function knitLines(): string[] {
  const ribs: string[] = ["M30 74 L70 74", "M15.7 65 L24.7 67", "M84.3 65 L75.3 67"];
  for (let x = 33; x < 68; x += 3.4) ribs.push(`M${r1(x)} 75 L${r1(x)} 79`);
  return ribs;
}

function sweater(s: Shape): Parts {
  const lines = knitLines();
  const fill = [SWEATER];
  if (s.neck === "turtle") fill.push("M41 8 L59 8 L60.5 19 C56 23 44 23 39.5 19 Z");
  else if (s.neck === "v") lines.push("M41 18 L50 32 L59 18", "M43.5 18.6 L50 28.6 L56.5 18.6");
  else lines.push("M40.8 19 C44.5 24.6 55.5 24.6 59.2 19");
  if (s.neck === "turtle") for (let x = 43; x < 58; x += 3) lines.push(`M${x} 9.5 L${r1(x + (x - 50) * 0.08)} 19`);
  return { fill, lines, shift: 2 };
}

function cardigan(): Parts {
  return {
    fill: [SWEATER],
    cut: ["M41.5 17.5 L50 40 L58.5 17.5 Z"],
    lines: [...knitLines(), "M41.5 17.5 L50 40 L50 80", "M58.5 17.5 L50 40"],
    top: dots([[52.4, 47], [52.4, 55], [52.4, 63], [52.4, 71]], 1.25),
    shift: 2,
  };
}

const LEGS: Record<NonNullable<Shape["leg"]>, string> = {
  straight: "M34 10 L66 10 L67.5 38 L66 92 L53.5 92 L50 40 L46.5 92 L34 92 L32.5 38 Z",
  wide: "M34 10 L66 10 L68 38 L73 92 L52 92 L50 42 L48 92 L27 92 L32 38 Z",
  flare: "M34 10 L66 10 L67.5 36 L64.5 66 L71 92 L53 92 L51 66 L50 42 L49 66 L47 92 L29 92 L35.5 66 L32.5 36 Z",
};

function jeans(s: Shape): Parts {
  return {
    fill: [LEGS[s.leg ?? "straight"]],
    lines: ["M34 15 L66 15", "M50 15 L50 30 Q50 33 47.5 34", "M36.5 15 Q38.5 22 33.2 24.5", "M63.5 15 Q61.5 22 66.8 24.5"],
    top: `<path d='M39 10 L39 15 M61 10 L61 15 M50 10 L50 15' stroke='#c7a35a' stroke-width='1.2' opacity='.8'/>`,
  };
}

function pants(s: Shape): Parts {
  const leg = s.leg ?? "wide";
  const crease = { straight: ["M41 16 L40.2 90", "M59 16 L59.8 90"], wide: ["M41 16 L37.5 90", "M59 16 L62.5 90"], flare: ["M41 16 L41.5 64 L38 90", "M59 16 L58.5 64 L62 90"] }[leg];
  return { fill: [LEGS[leg]], lines: ["M34 15 L66 15", "M42 15 L42.6 21", "M58 15 L57.4 21", ...crease] };
}

function skirt(s: Shape): Parts {
  const length = s.length ?? "midi";
  const w = { mini: 27, midi: 20, maxi: 11 }[length];
  const hem = { mini: 71, midi: 80, maxi: 90 }[length];
  const hw = { mini: 23, midi: 24, maxi: 25 }[length];
  const body = `M39 ${w} L61 ${w} L61 ${w + 4} L${50 + hw} ${hem} Q50 ${hem + 3} ${50 - hw} ${hem} L39 ${w + 4} Z`;
  const lines = [`M39 ${w + 4} L61 ${w + 4}`, `M45 ${w + 8} L${r1(50 - hw * 0.55)} ${hem - 3}`, `M55 ${w + 8} L${r1(50 + hw * 0.55)} ${hem - 3}`];
  if (s.tiers) for (const f of [0.36, 0.68]) lines.push(across(w + 4, 39, 61, hem, 50 - hw, 50 + hw, f));
  return { fill: [body], lines };
}

function jacket(s: Shape): Parts {
  const lines = ["M50 46 L50 82", "M33 62 L43 62", "M57 62 L67 62"];
  let top = "";
  if (s.fringe) {
    lines.push("M30.5 34 Q50 40 69.5 34");
    const strands: string[] = [];
    for (let x = 32; x <= 68.5; x += 2.4) strands.push(`M${r1(x)} 82 L${r1(x)} 89`);
    top = `<path d='${strands.join(" ")}' stroke='{edge}' stroke-width='1.1' stroke-linecap='round'/>`;
  }
  return {
    fill: ["M40 16 L60 16 L70 20 Q76 22 78 30 L84 70 L76 72 L70 40 L69 82 L31 82 L30 40 L24 72 L16 70 L22 30 Q24 22 30 20 Z"],
    cut: ["M40 16 L50 46 L60 16 Z"],
    dark: ["M40 16 L34.5 25.5 L50 46 Z", "M60 16 L65.5 25.5 L50 46 Z"],
    lines,
    top,
    shift: s.fringe ? -2 : 0,
  };
}

function set(s: Shape): Parts {
  const crop = "M42 8 C45 13 55 13 58 8 L67 11 L76 22 L70 27 L65 23 L65 42 Q50 43.5 35 42 L35 23 L30 27 L24 22 L33 11 Z";
  const bottom = s.bottom ?? "pants";
  const lower =
    bottom === "shorts"
      ? "M36 47 L64 47 L68 70 L52 72 L50 60 L48 72 L32 70 Z"
      : bottom === "skirt"
        ? "M37 47 L63 47 L71 84 Q50 87 29 84 Z"
        : "M36 47 L64 47 L66 60 L70 93 L52.5 93 L50 64 L47.5 93 L30 93 L34 60 Z";
  return { fill: [lower, crop], lines: ["M36 51 L64 51", "M35.5 38.5 Q50 40 64.5 38.5"], shift: bottom === "shorts" ? 9 : bottom === "skirt" ? 4 : 0 };
}

function dots(at: [number, number][], r: number, color = "{ink}"): string {
  return at.map(([x, y]) => `<circle cx='${x}' cy='${y}' r='${r}' fill='${color}'/>`).join("");
}

function belt(): Parts {
  const holes: [number, number][] = [50, 40, 30].map((a) => [r1(50 + 29.5 * Math.cos((a * Math.PI) / 180)), r1(50 + 17.25 * Math.sin((a * Math.PI) / 180))]);
  return {
    // the strap as a ring (outer and inner ellipse, even-odd), the buckle at the front
    fill: ["M16 50 A34 21 0 1 0 84 50 A34 21 0 1 0 16 50 Z M25 50 A25 13.5 0 1 1 75 50 A25 13.5 0 1 1 25 50 Z"],
    top:
      `<ellipse cx='50' cy='50' rx='29.5' ry='17.25' fill='none' stroke='{ink}' stroke-width='.7' stroke-dasharray='1.4 1.6' opacity='.5'/>` +
      dots(holes, 0.95) +
      `<rect x='41' y='62' width='18' height='13' rx='2.5' fill='none' stroke='#c7a35a' stroke-width='2.6'/><path d='M44 68.5 L56 68.5' stroke='#b38f48' stroke-width='1.6' stroke-linecap='round'/>`,
  };
}

function hat(): Parts {
  return {
    fill: [
      "M14 62 A36 11 0 1 0 86 62 A36 11 0 1 0 14 62 Z",
      "M31 62 C30 46 33 33 40 30.5 Q50 35 60 30.5 C67 33 70 46 69 62 Q50 66 31 62 Z",
      "M14 62 A36 11 0 0 0 86 62 L69 62 Q50 66 31 62 Z",
    ],
    dark: ["M31.4 55 Q50 59 68.6 55 L68.9 61 Q50 65.5 31.1 61 Z"],
    lines: ["M50 34.5 L50 44"],
    shift: -3,
  };
}

function bag(s: Shape): Parts {
  const style = s.bag ?? "crossbody";
  if (style === "tote") {
    return {
      fill: ["M27 40 L73 40 L70 82 Q69.6 86 66 86 L34 86 Q30.4 86 30 82 Z"],
      lines: ["M27.6 45 L72.4 45"],
      top: `<path d='M38 41 C38 19 62 19 62 41' fill='none' stroke='{edge}' stroke-width='4.4' stroke-linecap='round'/><path d='M38 41 C38 19 62 19 62 41' fill='none' stroke='{fill}' stroke-width='2.6' stroke-linecap='round'/>`,
      shift: -2,
    };
  }
  if (style === "clutch") {
    return {
      fill: ["M22 42 L78 42 L78 70 Q78 74 74 74 L26 74 Q22 74 22 70 Z"],
      dark: ["M22 42 L78 42 L50 61 Z"],
      top: dots([[50, 60.5]], 1.9, "#c7a35a"),
    };
  }
  const strands: string[] = [];
  if (s.fringe) for (let x = 32; x <= 68.5; x += 2.4) strands.push(`M${r1(x)} 84 L${r1(x)} 92`);
  return {
    fill: ["M29 48 L71 48 L71 79 Q71 84 66 84 L34 84 Q29 84 29 79 Z"],
    dark: ["M29 48 L71 48 L71 63 Q50 70 29 63 Z"],
    top:
      `<path d='M31.5 49 C29 12 71 12 68.5 49' fill='none' stroke='{edge}' stroke-width='2' stroke-linecap='round'/>` +
      dots([[50, 65.5]], 2.2, "#c7a35a") +
      (strands.length ? `<path d='${strands.join(" ")}' stroke='{edge}' stroke-width='1.1' stroke-linecap='round'/>` : ""),
    shift: s.fringe ? -3 : 0,
  };
}

function scarf(): Parts {
  const strands: string[] = [];
  for (let x = 33.6; x <= 45.6; x += 2) strands.push(`M${r1(x)} 84 L${r1(x)} 90.5`);
  for (let x = 55; x <= 67.2; x += 2) strands.push(`M${r1(x)} 79 L${r1(x)} 85.5`);
  return {
    fill: ["M35 23 L47 23 L46 84 L33 84 Z", "M53 23 L65 23 L67.5 79 L54.5 79 Z", "M33 17 Q50 7 67 17 L64.5 25 Q50 17.5 35.5 25 Z"],
    lines: ["M39 28 L38 80", "M43 28 L42.5 80", "M57.5 28 L58.5 75", "M61.5 28 L63 75"],
    top: `<path d='${strands.join(" ")}' stroke='{edge}' stroke-width='1' stroke-linecap='round'/>`,
  };
}

function parts(kind: Kind, s: Shape): Parts {
  switch (kind) {
    case "dress": return dress(s);
    case "top": return top(s);
    case "sweater": return sweater(s);
    case "cardigan": return cardigan();
    case "jeans": return jeans(s);
    case "pants": return pants(s);
    case "skirt": return skirt(s);
    case "jacket": return jacket(s);
    case "set": return set(s);
    case "belt": return belt();
    case "hat": return hat();
    case "bag": return bag(s);
    case "scarf": return scarf();
  }
}

function patternDef(sh: Shade): string {
  const a = sh.accent ?? "#ffffff";
  switch (sh.pattern) {
    case "floral":
      return `<pattern id='p' width='9' height='9' patternUnits='userSpaceOnUse'><circle cx='2.2' cy='2.2' r='1.3' fill='${a}'/><circle cx='6.7' cy='6.7' r='1.3' fill='${a}'/><circle cx='6.9' cy='2.3' r='.65' fill='#7d8b62'/><circle cx='2.3' cy='6.9' r='.65' fill='#7d8b62'/></pattern>`;
    case "leopard":
      return `<pattern id='p' width='12' height='12' patternUnits='userSpaceOnUse'><ellipse cx='3' cy='3' rx='1.7' ry='1.2' fill='${a}'/><ellipse cx='9' cy='7' rx='1.5' ry='1.1' fill='${a}'/><ellipse cx='4.5' cy='10' rx='1.2' ry='.9' fill='${a}'/><circle cx='9.5' cy='1.5' r='.6' fill='${a}'/></pattern>`;
    case "plaid":
      return `<pattern id='p' width='12' height='12' patternUnits='userSpaceOnUse'><rect y='4' width='12' height='3' fill='${a}' opacity='.35'/><rect x='4' width='3' height='12' fill='${a}' opacity='.35'/><path d='M0 10.5 H12 M10.5 0 V12' stroke='${a}' stroke-width='.6' opacity='.6'/></pattern>`;
    case "stripe":
      return `<pattern id='p' width='5' height='5' patternUnits='userSpaceOnUse'><rect width='5' height='2' fill='${a}'/></pattern>`;
    case "gingham":
      return `<pattern id='p' width='8' height='8' patternUnits='userSpaceOnUse'><rect width='4' height='8' fill='${a}' opacity='.4'/><rect width='8' height='4' fill='${a}' opacity='.4'/></pattern>`;
    default:
      return "";
  }
}

const memo = new Map<string, string>();

/** The picture of a piece: its kind, its colour (a SHADES name) and its cut, as a data:image/svg+xml URL. The same
 * three always give the same picture. */
export function garmentArt(kind: Kind, colour: string, shape: Shape = {}): string {
  const key = `${kind}|${colour}|${JSON.stringify(shape)}`;
  const hit = memo.get(key);
  if (hit) return hit;
  const sh = shadeOf(colour);
  const fill = sh.hex;
  const light = luma(fill) > 0.75;
  const bg = light ? "#e6e0d7" : "#f2eee8";
  const edge = mix(fill, "#000000", 0.3);
  const ink = luma(fill) < 0.2 ? mix(fill, "#ffffff", 0.3) : mix(fill, "#000000", 0.32);
  const p = parts(kind, shape);
  const out: string[] = [];
  for (const d of p.fill) {
    out.push(`<path d='${d}' fill='${fill}' fill-rule='evenodd' stroke='${edge}' stroke-width='1.1' stroke-linejoin='round'/>`);
    if (sh.pattern) out.push(`<path d='${d}' fill='url(#p)' fill-rule='evenodd'/>`);
  }
  for (const d of p.cut ?? []) out.push(`<path d='${d}' fill='${bg}' stroke='${edge}' stroke-width='1.1' stroke-linejoin='round'/>`);
  for (const d of p.dark ?? []) out.push(`<path d='${d}' fill='${mix(fill, "#000000", 0.16)}' stroke='${edge}' stroke-width='1.1' stroke-linejoin='round'/>`);
  if (p.lines?.length) out.push(`<path d='${p.lines.join(" ")}' fill='none' stroke='${ink}' stroke-width='1' stroke-linecap='round' stroke-linejoin='round' opacity='.55'/>`);
  if (p.top) out.push(p.top.replace(/\{edge\}/g, edge).replace(/\{ink\}/g, ink).replace(/\{fill\}/g, fill));
  const body = p.shift ? `<g transform='translate(0 ${p.shift})'>${out.join("")}</g>` : out.join("");
  const defs = sh.pattern ? `<defs>${patternDef(sh)}</defs>` : "";
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'>${defs}<rect width='100' height='100' fill='${bg}'/>${body}</svg>`;
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  if (memo.size > 2000) memo.clear();
  memo.set(key, url);
  return url;
}

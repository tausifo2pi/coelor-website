// Product pictures for the streetwear demo's generated catalogue (lib/storedemo/catalog-streetwear.ts): one flat-lay
// garment per product (boxy tees, hoodies with a kangaroo pocket, crewnecks, baggy cargos, shorts, coach / varsity /
// puffer / work jackets, caps and beanies), tinted by its colour, with the shop's own graphic printed on it, as an SVG
// data URL. Drawn here, so the demo shows no other store's photos and loads nothing from anywhere. The same square
// canvas as the boutique's pictures (lib/storedemo/art.ts): 100 × 100, the garment inside the middle three quarters of
// the width, so it fills the square thumbnails and still shows whole in the product drawer's 3:4 frame. Clean at
// 40–160 px: one outline, a few seam lines, a graphic that is a shape (a flame, a star, a bolt…), never text or a logo
// of a real brand. Pure, no "@/" imports: node --test loads it.

export type StreetKind = "tee" | "longsleeve" | "hoodie" | "zip" | "crewneck" | "pants" | "shorts" | "jacket" | "cap" | "beanie";
type Pattern = "camo" | "stripe";
type Shade = { hex: string; pattern?: Pattern; accent?: string };

/** Every colour the catalogue names, as a streetwear shop shoots it: washed blacks, bone, olive, a safety orange. A
 * shade with an accent is two-tone (a varsity's sleeves, a trucker's mesh, a ringer's trim, a track stripe). */
export const STREET_SHADES: Record<string, Shade> = {
  Black: { hex: "#1f1f22" },
  "Washed Black": { hex: "#3a3a3d" },
  Charcoal: { hex: "#47484d" },
  "Heather Grey": { hex: "#a7a7a5" },
  Ash: { hex: "#c9c9c5" },
  White: { hex: "#f6f6f3" },
  Cream: { hex: "#ece4d1" },
  Bone: { hex: "#ddd4c0" },
  Sand: { hex: "#cbb995" },
  Khaki: { hex: "#b2a07a" },
  Tan: { hex: "#b5895a" },
  Brown: { hex: "#6b4a35" },
  Chocolate: { hex: "#463126" },
  Olive: { hex: "#66673f" },
  "Army Green": { hex: "#4f5638" },
  Forest: { hex: "#2e4837" },
  Sage: { hex: "#9dac93" },
  Navy: { hex: "#232d45" },
  "Faded Navy": { hex: "#47546f" },
  "Royal Blue": { hex: "#2e4ea8" },
  Slate: { hex: "#66788d" },
  "Powder Blue": { hex: "#a8c2da" },
  Red: { hex: "#b2262d" },
  Burgundy: { hex: "#5d2130" },
  "Safety Orange": { hex: "#e8661e" },
  Rust: { hex: "#a2522f" },
  Mustard: { hex: "#c69a36" },
  Purple: { hex: "#5a3f84" },
  Lavender: { hex: "#b8add4" },
  Pink: { hex: "#e3a3b5" },
  "Light Wash": { hex: "#a7bcd1" },
  Indigo: { hex: "#2c3c62" },
  "Black Denim": { hex: "#2d2f35" },
  "Woodland Camo": { hex: "#6e6a48", pattern: "camo", accent: "#3f3a2a" },
  "Black Camo": { hex: "#3c3c3f", pattern: "camo", accent: "#1c1c1f" },
  "Grey Stripe": { hex: "#ecebe6", pattern: "stripe", accent: "#4a4b50" },
  "Navy Stripe": { hex: "#ecebe6", pattern: "stripe", accent: "#232d45" },
  "Black/Cream": { hex: "#1f1f22", accent: "#ece4d1" },
  "Navy/Cream": { hex: "#232d45", accent: "#ece4d1" },
  "Forest/Cream": { hex: "#2e4837", accent: "#ece4d1" },
  "Burgundy/Cream": { hex: "#5d2130", accent: "#ece4d1" },
  "Black/Orange": { hex: "#1f1f22", accent: "#e8661e" },
  "Black/White": { hex: "#1f1f22", accent: "#f6f6f3" },
  "Navy/White": { hex: "#232d45", accent: "#f6f6f3" },
  "Olive/Cream": { hex: "#66673f", accent: "#ece4d1" },
  "White/Black": { hex: "#f6f6f3", accent: "#1f1f22" },
  "Cream/Brown": { hex: "#ece4d1", accent: "#6b4a35" },
};

/** How a piece is cut and printed, as far as the picture shows it. */
export type StreetShape = {
  /** tees, long sleeves, hoodies, crewnecks: a big centre graphic or a small chest one */
  graphic?: "big" | "chest" | "none";
  /** which of the shop's graphics (0–5) */
  mark?: number;
  /** tee: a chest pocket; a ringer's contrast collar and cuffs */
  pocket?: boolean;
  ringer?: boolean;
  /** pants, shorts */
  leg?: "cargo" | "knee" | "cuffed" | "track" | "straight";
  jacket?: "coach" | "varsity" | "puffer" | "work" | "track" | "windbreaker" | "vest";
  cap?: "six" | "five" | "trucker";
  /** beanie */
  pom?: boolean;
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

/** The colour of a named shade; a name the table does not know gets heather grey. */
export const streetShadeOf = (name: string): Shade => STREET_SHADES[name] ?? STREET_SHADES["Heather Grey"];

/* ---------- the shop's graphics: shapes, never letters ---------- */

const r1 = (v: number) => Math.round(v * 10) / 10;

/** graphic `mark` (0–5) centred at (x, y), `s` its half-size, in colour `c` */
function emblem(mark: number, x: number, y: number, s: number, c: string): string {
  const g = (inner: string) => `<g transform='translate(${r1(x)} ${r1(y)}) scale(${r1(s)})'>${inner}</g>`;
  switch (((mark % 6) + 6) % 6) {
    case 0: // a flame (the cinder)
      return g(`<path d='M0 -1 C.5 -.45 .82 -.08 .64 .42 C.52 .8 .22 1 0 1 C-.22 1 -.52 .8 -.64 .42 C-.78 .04 -.52 -.18 -.32 -.44 C-.3 -.12 -.12 .04 0 .06 C.13 -.28 .06 -.64 0 -1 Z' fill='${c}'/>`);
    case 1: // a star
      return g(`<path d='M0 -1 L.24 -.32 L.95 -.31 L.38 .12 L.59 .81 L0 .4 L-.59 .81 L-.38 .12 L-.95 -.31 L-.24 -.32 Z' fill='${c}'/>`);
    case 2: // a ring with a dot
      return g(`<circle r='.82' fill='none' stroke='${c}' stroke-width='.26'/><circle r='.28' fill='${c}'/>`);
    case 3: // a bolt
      return g(`<path d='M.18 -1 L-.56 .14 L-.06 .14 L-.22 1 L.56 -.18 L.06 -.18 Z' fill='${c}'/>`);
    case 4: // three bars, like a wordmark seen from afar
      return g(`<rect x='-.95' y='-.62' width='1.9' height='.3' rx='.08' fill='${c}'/><rect x='-.62' y='-.15' width='1.24' height='.3' rx='.08' fill='${c}'/><rect x='-.8' y='.32' width='1.6' height='.3' rx='.08' fill='${c}'/>`);
    default: // a diamond in a diamond
      return g(`<path d='M0 -1 L.78 0 L0 1 L-.78 0 Z' fill='none' stroke='${c}' stroke-width='.22'/><path d='M0 -.42 L.32 0 L0 .42 L-.32 0 Z' fill='${c}'/>`);
  }
}

/* ---------- drawing ---------- */

/** A garment as drawn: `fill` paths in its colour (back to front), `two` paths in its second colour (a varsity's
 * sleeves, a trucker's mesh), `dark` paths a shade darker (a hood's inside, a collar, a cuff), seam `lines`, raw `top`
 * markup ({edge}, {ink}, {fill}, {two}, {print} are filled in) and a vertical `shift` to centre short pieces. */
type Parts = { fill: string[]; two?: string[]; dark?: string[]; lines?: string[]; top?: string; shift?: number };

/** A path mirrored left to right. Paths here use only M, L, C, Q and Z with absolute x y pairs. */
function mirror(d: string): string {
  let i = 0;
  return d.replace(/-?\d+(\.\d+)?/g, (n) => String(i++ % 2 === 0 ? r1(100 - Number(n)) : Number(n)));
}

/** the graphic on a top: big in the middle of the chest, or small on the wearer's left */
function printed(s: StreetShape, bigAt: [number, number], bigSize: number, chestAt: [number, number] = [58, 31]): string {
  const g = s.graphic ?? "none";
  if (g === "none") return "";
  const [x, y] = g === "big" ? bigAt : chestAt;
  return emblem(s.mark ?? 0, x, y, g === "big" ? bigSize : 3.4, "{print}");
}

function tee(s: StreetShape): Parts {
  const body = "M41 15 C44.5 21 55.5 21 59 15 L71 18.5 L85 36 L75.5 43.5 L69 37 L69 85 Q50 87 31 85 L31 37 L24.5 43.5 L15 36 L29 18.5 Z";
  const lines = ["M31.5 81.5 Q50 83.5 68.5 81.5"];
  if (!s.ringer) lines.push("M83.1 33.7 L73.6 41.2", "M16.9 33.7 L26.4 41.2", "M40.4 15.8 C44.5 23.2 55.5 23.2 59.6 15.8");
  let top = "";
  if (s.ringer) {
    top += `<path d='M40.6 15.6 C44.5 22.6 55.5 22.6 59.4 15.6' fill='none' stroke='{two}' stroke-width='2.4' stroke-linecap='round'/>`;
    top += `<path d='M84.2 35 L74.7 42.5 M15.8 35 L25.3 42.5' stroke='{two}' stroke-width='2.4' stroke-linecap='round'/>`;
  }
  if (s.pocket) lines.push("M54 30 L62.5 30 L62.5 39 Q58.2 40.4 54 39 Z");
  top += printed(s.pocket ? { ...s, graphic: s.graphic === "chest" ? "big" : s.graphic } : s, [50, 46], 9.5);
  return { fill: [body], lines, top };
}

function longsleeve(s: StreetShape): Parts {
  const body = "M41 15 C44.5 21 55.5 21 59 15 L71 18.5 Q77 21 79 30 L86 74 L77.5 75.5 L69 42 L69 85 Q50 87 31 85 L31 42 L22.5 75.5 L14 74 L21 30 Q23 21 29 18.5 Z";
  const lines = ["M31.5 81.5 Q50 83.5 68.5 81.5", "M85.3 69.6 L77 71.2", "M14.7 69.6 L23 71.2", "M40.4 15.8 C44.5 23.2 55.5 23.2 59.6 15.8"];
  return { fill: [body], lines, top: printed(s, [50, 45], 9.5) };
}

const SWEAT = "M40 19 C44 24 56 24 60 19 L72 22 Q78 25 80 35 L85.5 72 L76.5 74 L71 44 L70.5 86 L29.5 86 L29 44 L23.5 74 L14.5 72 L20 35 Q22 25 28 22 Z";
const ribs = (): string[] => {
  const out = ["M29.6 80.5 L70.4 80.5", "M84.8 66.8 L76 68.8", "M15.2 66.8 L24 68.8"];
  for (let x = 32.5; x < 68.5; x += 3.2) out.push(`M${r1(x)} 81.5 L${r1(x)} 85.2`);
  return out;
};

function hoodie(s: StreetShape, zip: boolean): Parts {
  const hood = "M36.5 23 C32.5 8.5 67.5 8.5 63.5 23 C60 27 40 27 36.5 23 Z";
  const opening = "M41.5 21.5 C40.5 12.5 59.5 12.5 58.5 21.5 C56 25 44 25 41.5 21.5 Z";
  const lines = ribs();
  let top = "";
  if (zip) {
    lines.push("M38.4 60 L35.6 77", "M61.6 60 L64.4 77");
    top += `<path d='M50 24.5 L50 86' stroke='#9a9ca3' stroke-width='1.5'/><circle cx='50' cy='31' r='1.3' fill='#9a9ca3'/>`;
    top += printed({ ...s, graphic: s.graphic === "none" ? "none" : "chest" }, [50, 42], 3.4, [59, 35]);
  } else {
    lines.push("M36.5 56 L63.5 56", "M36.5 56 L33 76.5", "M63.5 56 L67 76.5", "M33 76.5 L67 76.5");
    top += printed(s, [50, 44.5], 7.8, [59, 36]);
  }
  top += `<path d='M46.2 25.5 L45.6 33.5 M53.8 25.5 L54.4 33.5' stroke='{cord}' stroke-width='1.25' stroke-linecap='round'/>`;
  top += `<rect x='44.8' y='33' width='1.6' height='2.8' rx='.5' fill='{cord}'/><rect x='53.6' y='33' width='1.6' height='2.8' rx='.5' fill='{cord}'/>`;
  return { fill: [hood, SWEAT], dark: [opening], lines, top, shift: 1 };
}

function crewneck(s: StreetShape): Parts {
  const lines = [...ribs(), "M39.4 19.6 C43.6 26.4 56.4 26.4 60.6 19.6", "M41.4 20.4 C45 25 55 25 58.6 20.4"];
  return { fill: [SWEAT], lines, top: printed(s, [50, 45], 9.5, [58, 34]), shift: 1 };
}

function pants(s: StreetShape): Parts {
  const leg = s.leg ?? "straight";
  const tapered = leg === "cuffed" || leg === "track";
  const body = tapered
    ? "M33 9 L67 9 L69.5 40 L68.5 84 L69 92 L53 92 L53.5 84 L50 44 L46.5 84 L47 92 L31 92 L31.5 84 L30.5 40 Z"
    : "M33 9 L67 9 L69 40 L72.5 92 L52.5 92 L50 44 L47.5 92 L27.5 92 L31 40 Z";
  const lines = ["M33 14 L67 14", "M50 14 L50 29 Q50 32 47.5 33"];
  const dark: string[] = [];
  let top = "";
  if (leg === "cargo") {
    const pocket = "M28.6 48 L37.8 48 L38.4 63 Q33.4 64.4 28.4 63 Z";
    lines.push(pocket, mirror(pocket));
    dark.push("M28.5 48 L37.9 48 L38 52.4 L28.4 52.4 Z", mirror("M28.5 48 L37.9 48 L38 52.4 L28.4 52.4 Z"));
  }
  if (leg === "knee") {
    const patch = "M29.4 57 L47.6 57 L48.2 73 L28.6 73 Z";
    dark.push(patch, mirror(patch));
    lines.push("M62 20 L62 34", "M60 20 L60 34");
  }
  if (tapered) lines.push("M31.6 85 L46.9 85", "M53.1 85 L68.4 85");
  if (leg === "cuffed") top += `<path d='M47.8 14 L47 22 M52.2 14 L53 22' stroke='{cord}' stroke-width='1.1' stroke-linecap='round'/>`;
  if (leg === "track") top += `<path d='M33.4 15 L32.6 40 L33.4 84 M66.6 15 L67.4 40 L66.6 84' fill='none' stroke='{two}' stroke-width='2.2'/>`;
  return { fill: [body], dark, lines, top };
}

function shorts(s: StreetShape): Parts {
  const body = "M31.5 18 L68.5 18 L71 46 L73.5 71 L52.5 73 L50 50 L47.5 73 L26.5 71 L29 46 Z";
  const lines = ["M31.5 23.5 L68.5 23.5", "M50 23.5 L50 34"];
  const dark: string[] = [];
  let top = `<path d='M47.8 23.5 L47 31 M52.2 23.5 L53 31' stroke='{cord}' stroke-width='1.1' stroke-linecap='round'/>`;
  if (s.leg === "cargo") {
    const pocket = "M26.9 47 L35.5 47 L36 61 Q31.4 62.2 26.6 61 Z";
    lines.push(pocket, mirror(pocket));
    dark.push("M26.8 47 L35.6 47 L35.7 51 L26.7 51 Z", mirror("M26.8 47 L35.6 47 L35.7 51 L26.7 51 Z"));
  }
  if (s.leg === "track") top += `<path d='M31.8 24.5 L31 46 L29.4 69.4 M68.2 24.5 L69 46 L70.6 69.4' fill='none' stroke='{two}' stroke-width='2.4'/>`;
  lines.push("M27 67 L47.8 68.8", "M73 67 L52.2 68.8");
  return { fill: [body], dark, lines, top, shift: 5 };
}

const JACKET = "M39 15 L61 15 L72 19 Q78 21 80 29 L86 72 L77 74 L71 42 L70 85 L30 85 L29 42 L23 74 L14 72 L20 29 Q22 21 28 19 Z";
const SLEEVE = "M72 19 Q78 21 80 29 L86 72 L77 74 L71 42 L70.4 24 Z";
const snaps = (ys: number[], x = 51.6) => ys.map((y) => `<circle cx='${x}' cy='${y}' r='1.15' fill='{ink}'/>`).join("");

function jacket(s: StreetShape): Parts {
  const style = s.jacket ?? "coach";
  if (style === "vest") {
    const body = "M39 15 L61 15 L68.5 19 Q71 29 69.5 41 L70.5 85 L29.5 85 L30.5 41 Q29 29 31.5 19 Z";
    const lines = ["M50 22 L50 85"];
    for (let y = 30; y < 84; y += 9) lines.push(`M30.6 ${y} L69.4 ${y}`);
    return { fill: [body], dark: ["M39 15 L61 15 L60 21 Q50 25 40 21 Z"], lines, top: `<path d='M50 22 L50 85' stroke='#9a9ca3' stroke-width='1.4'/>` };
  }
  if (style === "puffer") {
    const body = "M38 15 L62 15 L73 19 Q80 22 82 31 L87.5 72 L77 75 L72 44 L72.5 84 Q50 89 27.5 84 L28 44 L23 75 L12.5 72 L18 31 Q20 22 27 19 Z";
    const lines: string[] = [];
    for (const y of [30, 41, 52, 63, 74]) lines.push(`M28.4 ${y} Q50 ${y + 2.4} 71.6 ${y}`);
    for (const y of [36, 48, 60]) lines.push(`M${r1(20.4 + (y - 30) * 0.06)} ${y} L${r1(26.6 + (y - 30) * 0.05)} ${y + 1.2}`, `M${r1(79.6 - (y - 30) * 0.06)} ${y} L${r1(73.4 - (y - 30) * 0.05)} ${y + 1.2}`);
    return {
      fill: [body, "M38 8 L62 8 L63 19 Q50 23.5 37 19 Z"],
      lines,
      top: `<path d='M50 10 L50 86.4' stroke='#9a9ca3' stroke-width='1.4'/>`,
      shift: 2,
    };
  }
  const lines = ["M50 22 L50 85", "M30.2 80.5 L69.8 80.5", "M85.4 67.4 L76.6 69.4", "M14.6 67.4 L23.4 69.4"];
  const dark: string[] = [];
  const two: string[] = [];
  let top = "";
  const collar = "M39 15 L34.5 23.5 L46 29 L50 21.5 Z";
  if (style === "coach") {
    dark.push(collar, mirror(collar));
    top += snaps([33, 43, 53, 63, 73]);
    top += printed({ ...s, graphic: s.graphic === "none" ? "none" : "chest" }, [50, 40], 3.2, [60, 36]);
  } else if (style === "varsity") {
    two.push(SLEEVE, mirror(SLEEVE));
    dark.push("M39 15 L61 15 L59 20.5 Q50 24 41 20.5 Z");
    lines.push("M30.4 82.4 L69.6 82.4");
    top += snaps([30, 40, 50, 60, 70, 79]);
    top += `<circle cx='39.5' cy='38' r='6' fill='{two}' stroke='{edge}' stroke-width='.8'/>` + emblem(s.mark ?? 0, 39.5, 38, 3.6, "{fill}");
  } else if (style === "work") {
    dark.push("M38.5 15 L32.8 23 L45 27.5 L50 21 L55 27.5 L67.2 23 L61.5 15 Z");
    lines.push("M35 37 L45 37 L45 47 L35 47 Z", "M55 37 L65 37 L65 47 L55 47 Z", "M34.5 37 L45.5 37 L45.5 40.5 L34.5 40.5 Z", "M54.5 37 L65.5 37 L65.5 40.5 L54.5 40.5 Z");
    top += snaps([30, 41, 52, 63, 74]);
  } else if (style === "track") {
    dark.push("M39 15 L61 15 L60.4 20.6 Q50 23.6 39.6 20.6 Z");
    top += `<path d='M50 18 L50 85' stroke='#9a9ca3' stroke-width='1.4'/>`;
    top += `<path d='M72.6 21.5 L80.2 73.2 M27.4 21.5 L19.8 73.2' stroke='{two}' stroke-width='2.4'/>`;
    top += printed({ ...s, graphic: s.graphic === "none" ? "none" : "chest" }, [50, 40], 3.2, [60, 33]);
  } else {
    // windbreaker: a half zip and a colour block across the chest and sleeves
    two.push("M29.3 38 L70.7 38 L70.6 51 L29.4 51 Z", "M70.8 33 L80.6 32.4 L82.4 45 L71.4 47 Z", mirror("M70.8 33 L80.6 32.4 L82.4 45 L71.4 47 Z"));
    dark.push("M39 15 L61 15 L60.4 20.6 Q50 23.6 39.6 20.6 Z");
    lines.splice(0, 1);
    top += `<path d='M50 18 L50 36' stroke='#9a9ca3' stroke-width='1.4'/>`;
  }
  return { fill: [JACKET], two, dark, lines, top };
}

function cap(s: StreetShape): Parts {
  // three quarters from the front: the crown, and the brim reaching out to the front left
  const style = s.cap ?? "six";
  const crown = "M27 63 C26 41 41 31 57 31 C73 31 83 43 83 63 Q55 67.5 27 63 Z";
  const brim = style === "five"
    ? "M27 63 Q46 66.4 63 65.6 Q55 72 35 73.6 Q17 74.6 14 70.4 Q14.5 65.6 27 63 Z"
    : "M27 63 Q46 66.4 63 65.6 Q54 75 34 77 Q16 78 13 72.4 Q13.6 66 27 63 Z";
  const lines = style === "five" ? ["M44.6 33.4 L46.4 65.8", "M69 35.6 L71.6 65.2"] : ["M57 31 L52 66.4", "M57 31 L38 64.2", "M57 31 L72.6 65.4"];
  const two: string[] = [];
  let top = "";
  if (style === "trucker") {
    const side = "M64.6 32.2 C75.6 35.4 83 45 83 63 Q76.6 64.6 70.4 65.2 Z";
    two.push(side);
    const holes: string[] = [];
    for (let y = 40; y < 63; y += 3.1) for (let x = 68.5; x < 82; x += 3.1) if (x < 66 + (y - 32) * 0.55 + 4 && x > 64.6 + (y - 32) * 0.19) holes.push(`<circle cx='${r1(x)}' cy='${r1(y)}' r='.55' fill='{edge}' opacity='.45'/>`);
    top += holes.join("");
  }
  top += `<ellipse cx='57' cy='31.4' rx='2.4' ry='1.3' fill='{fill}' stroke='{edge}' stroke-width='.8'/>`;
  top += emblem(s.mark ?? 0, 47, 50, 6, "{print}");
  return { fill: [crown, brim], two, lines, top, shift: -4 };
}

function beanie(s: StreetShape): Parts {
  const dome = "M28 57 C28 24 72 24 72 57 Z";
  const cuff = "M26 55 L74 55 L74 75 Q50 77.5 26 75 Z";
  const lines: string[] = [];
  for (let x = 30; x <= 70; x += 3.3) lines.push(`M${r1(x)} 57.5 L${r1(x)} 74.4`);
  for (const x of [37, 43.5, 50, 56.5, 63]) lines.push(`M${x} ${x === 50 ? 31 : 34} L${x} 54`);
  let top = `<rect x='44.5' y='60.5' width='11' height='7.5' rx='1' fill='{print}'/>`;
  if (s.pom) top = `<circle cx='50' cy='24' r='7.5' fill='{fill}' stroke='{edge}' stroke-width='1.1'/>` + top;
  return { fill: [dome], dark: [cuff], lines, top, shift: s.pom ? 2 : -2 };
}

function parts(kind: StreetKind, s: StreetShape): Parts {
  switch (kind) {
    case "tee": return tee(s);
    case "longsleeve": return longsleeve(s);
    case "hoodie": return hoodie(s, false);
    case "zip": return hoodie(s, true);
    case "crewneck": return crewneck(s);
    case "pants": return pants(s);
    case "shorts": return shorts(s);
    case "jacket": return jacket(s);
    case "cap": return cap(s);
    case "beanie": return beanie(s);
  }
}

function patternDef(sh: Shade): string {
  const a = sh.accent ?? "#000000";
  if (sh.pattern === "camo") {
    return `<pattern id='p' width='22' height='22' patternUnits='userSpaceOnUse'><path d='M2 4 Q7 1 10 5 Q12 9 7 10 Q2 10 2 4 Z M14 12 Q19 10 21 14 Q20 19 15 18 Q11 16 14 12 Z' fill='${a}' opacity='.75'/><path d='M12 1 Q16 0 17 3 Q15 6 12 4 Z M3 15 Q7 13 8 17 Q6 21 3 19 Z' fill='${mix(sh.hex, "#ffffff", 0.22)}' opacity='.8'/></pattern>`;
  }
  if (sh.pattern === "stripe") return `<pattern id='p' width='6' height='6' patternUnits='userSpaceOnUse'><rect width='6' height='2.2' fill='${a}'/></pattern>`;
  return "";
}

const memo = new Map<string, string>();

/** The picture of a piece: its kind, its colour (a STREET_SHADES name) and its cut, as a data:image/svg+xml URL. The
 * same three always give the same picture. */
export function streetArt(kind: StreetKind, colour: string, shape: StreetShape = {}): string {
  const key = `${kind}|${colour}|${JSON.stringify(shape)}`;
  const hit = memo.get(key);
  if (hit) return hit;
  const sh = streetShadeOf(colour);
  const fill = sh.hex;
  const light = luma(fill) > 0.72;
  const bg = light ? "#dedfdc" : "#ececea";
  const edge = mix(fill, "#000000", luma(fill) < 0.15 ? 0.5 : 0.32);
  const ink = luma(fill) < 0.2 ? mix(fill, "#ffffff", 0.32) : mix(fill, "#000000", 0.34);
  const two = sh.accent ?? (luma(fill) < 0.45 ? "#f2f1ec" : "#1f1f22");
  // the print: cream or orange on a dark piece, black or orange on a light one (the mark picks which)
  const orange = (shape.mark ?? 0) % 3 === 1 && colour !== "Safety Orange" && colour !== "Rust";
  const print = orange ? "#e8661e" : luma(fill) < 0.45 ? "#f1e9d6" : "#1f1f22";
  const cord = luma(fill) < 0.45 ? "#e9e6dd" : mix(fill, "#000000", 0.45);
  const p = parts(kind, shape);
  const out: string[] = [`<ellipse cx='50' cy='94' rx='30' ry='2.2' fill='#000000' opacity='.06'/>`];
  const draw = (d: string, color: string) => {
    out.push(`<path d='${d}' fill='${color}' fill-rule='evenodd' stroke='${edge}' stroke-width='1.1' stroke-linejoin='round'/>`);
    if (sh.pattern && color === fill) out.push(`<path d='${d}' fill='url(#p)' fill-rule='evenodd'/>`);
  };
  for (const d of p.fill) draw(d, fill);
  for (const d of p.two ?? []) draw(d, two);
  for (const d of p.dark ?? []) out.push(`<path d='${d}' fill='${mix(fill, "#000000", 0.18)}' stroke='${edge}' stroke-width='1.1' stroke-linejoin='round'/>`);
  if (p.lines?.length) out.push(`<path d='${p.lines.join(" ")}' fill='none' stroke='${ink}' stroke-width='1' stroke-linecap='round' stroke-linejoin='round' opacity='.55'/>`);
  if (p.top) out.push(p.top.replace(/\{edge\}/g, edge).replace(/\{ink\}/g, ink).replace(/\{fill\}/g, fill).replace(/\{two\}/g, two).replace(/\{print\}/g, print).replace(/\{cord\}/g, cord));
  const body = p.shift ? `<g transform='translate(0 ${p.shift})'>${out.join("")}</g>` : out.join("");
  const defs = sh.pattern ? `<defs>${patternDef(sh)}</defs>` : "";
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'>${defs}<rect width='100' height='100' fill='${bg}'/>${body}</svg>`;
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  if (memo.size > 2000) memo.clear();
  memo.set(key, url);
  return url;
}

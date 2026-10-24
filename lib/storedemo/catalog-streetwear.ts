// The streetwear demo's catalogue, generated (user decision 2026-10-11: no client data, no third-party store's
// catalogue): about 150 pieces of an independent streetwear shop (tees, long sleeves, hoodies, crewnecks, cargo and
// work pants, shorts, outerwear, caps and beanies) under its own label and four small labels it stocks, plus a few
// pre-owned and consigned archive pieces, each one of a kind. Invented names and labels (checked 2026-10-24: no
// streetwear shop or label by these names shows up in a web search), no real brand's names or graphics, every number
// generated. Pictures by lib/storedemo/art-streetwear.ts. The same shape the engine reads (lib/storedemo/types.ts).
//
// Time-based and pure, like the boutique's catalogue (lib/storedemo/catalog.ts, which hands a streetwear config here):
// new pieces come out in a weekly drop (the config's drop days at 11:00 shop time, all at once), pre-owned pieces are
// uploaded on Monday afternoons, the best sellers are re-ranked every Monday and kept in stock by production runs.
// Limited pieces sell out fast: every size has its own moment its last unit sells (Variant.soldAt), minutes after a
// hot drop goes live or weeks later for a slow one, so the engine shows that sale and the pull at that very moment,
// also when it is later today. A size is sold out on a day if its last unit sold before that day began; a size that
// sells out later today is still for sale until its moment. Everything follows from (config, the shop's local day)
// through a hash: the same catalogue for every visitor all day.
// No "@/" imports: node --test loads it.
import { streetArt, type StreetKind, type StreetShape } from "./art-streetwear.ts";
import type { Catalog, DemoConfig, Product, Variant } from "./types.ts";

const MIN = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;
/** day numbers count days since 1970-01-01 on the shop's wall clock; weeks are counted from Monday 1 January 2024 */
const EPOCH = Date.UTC(2024, 0, 1) / DAY;
/** a drop goes live at 11:00 shop time, every piece at once */
export const DROP_MINUTE = 11 * 60;
/** pre-owned pieces are uploaded on Monday afternoons, a few minutes apart */
const UPLOAD_MINUTE = 16 * 60;
/** how far back the catalogue looks for its newest pieces and its best sellers */
const LOOK_BACK = 210;
const BEST_FROM = 7;
const BEST_TO = 150;
const MARKDOWN_AFTER = 56;

/** The shop's own label (the demo shop, lib/demo/client-streetwear.ts) */
export const OWN_LABEL = "Cinderlot";
export const PRE_OWNED = "Pre-owned";
export const ONE_SIZE = "O/S";

/* ---------- hashing: one stable number per (parts) ---------- */

function hash(s: string): number {
  let x = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    x ^= s.charCodeAt(i);
    x = Math.imul(x, 0x01000193);
  }
  x ^= x >>> 16;
  x = Math.imul(x, 0x85ebca6b);
  x ^= x >>> 13;
  x = Math.imul(x, 0xc2b2ae35);
  x ^= x >>> 16;
  return x >>> 0;
}
const H = (...p: (string | number)[]) => hash(p.join("|"));
/** a stable number in [0, 1) */
const U = (...p: (string | number)[]) => H(...p) / 4294967296;

function pickIndex(weights: number[], u: number): number {
  const total = weights.reduce((s, w) => s + w, 0);
  let x = u * total;
  for (let i = 0; i < weights.length; i++) {
    x -= weights[i];
    if (x < 0) return i;
  }
  return weights.length - 1;
}
const pick = <T,>(xs: T[], u: number): T => xs[Math.min(xs.length - 1, Math.floor(u * xs.length))];

/* ---------- the shop's clock (the same as lib/storedemo/catalog.ts) ---------- */

const offsets = new Map<string, number>();
/** minutes the zone is ahead of UTC at instant t (cached per hour) */
function offsetMin(tz: string, t: number): number {
  const k = `${tz}|${Math.floor(t / HOUR)}`;
  const hit = offsets.get(k);
  if (hit !== undefined) return hit;
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric" }).formatToParts(new Date(t));
  const g = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const wall = Date.UTC(g("year"), g("month") - 1, g("day"), g("hour") % 24, g("minute"));
  const off = Math.round((wall - Math.floor(t / MIN) * MIN) / MIN);
  if (offsets.size > 5000) offsets.clear();
  offsets.set(k, off);
  return off;
}
const dayOf = (tz: string, t: number) => Math.floor((t + offsetMin(tz, t) * MIN) / DAY);
function instant(tz: string, d: number, m: number): number {
  const wall = d * DAY + m * MIN;
  let t = wall - offsetMin(tz, wall) * MIN;
  t = wall - offsetMin(tz, t) * MIN;
  return t;
}

/* ---------- what the shop sells ---------- */

type KindDef = { kind: StreetKind; category: string; w: number; fall: number; spring: number };
// share of a drop, and how the season moves it (fall and winter drops from August, spring and summer from February)
const KINDS: KindDef[] = [
  { kind: "tee", category: "Tees", w: 26, fall: 0.8, spring: 1.3 },
  { kind: "longsleeve", category: "Long Sleeves", w: 7, fall: 1.25, spring: 0.75 },
  { kind: "hoodie", category: "Hoodies", w: 18, fall: 1.45, spring: 0.7 },
  { kind: "crewneck", category: "Crewnecks", w: 9, fall: 1.3, spring: 0.8 },
  { kind: "pants", category: "Pants", w: 11, fall: 1.1, spring: 0.9 },
  { kind: "shorts", category: "Shorts", w: 7, fall: 0.3, spring: 1.8 },
  { kind: "jacket", category: "Outerwear", w: 8, fall: 1.8, spring: 0.45 },
  { kind: "cap", category: "Headwear", w: 8, fall: 1, spring: 1.1 },
  { kind: "beanie", category: "Headwear", w: 4, fall: 1.9, spring: 0.15 },
];
const ONE_SIZED = new Set<StreetKind>(["cap", "beanie"]);

// The first words of a title: a graphic or a collection, the way a streetwear label names its pieces. No colour words
// (the colour is its own field), no label names, nothing a real brand is known for. A piece's name is
// NAMES[(n × 41) mod 67]: two pieces share a name only when their numbers are a whole number of rounds apart, and
// then they get a different detail (see dropProduct), so titles never repeat.
const NAMES = [
  "Night Shift", "Overpass", "Corner Store", "Late Bus", "Afterhours", "Rooftop", "Fire Escape", "Streetlight", "Rush Hour",
  "Low Signal", "Pirate Radio", "Payphone", "Laundromat", "Block Party", "Crosstown", "Back Alley", "Parking Lot", "Last Stop",
  "Skyline", "Heatwave", "Cold Front", "Dial Tone", "Pager", "Mixtape", "Fast Lane", "Graveyard Shift", "Red Eye",
  "Long Weekend", "Off Hours", "Side Street", "Ember", "Coal Yard", "Ash Cloud", "Spark Plug", "Burnout", "Night Bus",
  "Train Yard", "Chain Link", "Box Fan", "Bus Depot", "Corner Lot", "Soundcheck", "Tape Deck", "Boombox", "Arcade",
  "High Score", "Free Throw", "Pickup Game", "Half Court", "Shot Clock", "Home Team", "Rain Delay", "Overcast", "Sodium Light",
  "Overnight", "Detour", "Wrong Turn", "Exit Only", "One Way", "Dead End", "Loading Zone", "Tow Away", "Bus Shelter",
  "Hydrant", "Stairwell", "Rooftop Pool", "Third Rail",
];

type Detail = { d: string; nouns: string[]; shape?: StreetShape; art?: StreetKind; palette?: string[]; price?: [number, number] };
const TWO_TONE = ["Black/Cream", "Navy/Cream", "Forest/Cream", "Burgundy/Cream", "Black/Orange"];
const TRACK = ["Black/White", "Navy/White", "Black/Orange", "Burgundy/Cream", "Forest/Cream"];
const DENIM = ["Light Wash", "Indigo", "Black Denim"];
const big: StreetShape = { graphic: "big" };
const chest: StreetShape = { graphic: "chest" };

// Per kind: a detail and the nouns it goes with, and how that looks in the picture. At least 7 details each (see NAMES).
const DETAILS: Record<StreetKind, Detail[]> = {
  tee: [
    { d: "Heavyweight", nouns: ["Tee"], shape: big },
    { d: "Boxy", nouns: ["Tee"], shape: big },
    { d: "Pigment Dyed", nouns: ["Tee"], shape: chest },
    { d: "Puff Print", nouns: ["Tee"], shape: big },
    { d: "Vintage Wash", nouns: ["Tee"], shape: big },
    { d: "Pocket", nouns: ["Tee"], shape: { pocket: true, graphic: "chest" } },
    { d: "Ringer", nouns: ["Tee"], shape: { ringer: true, graphic: "big" }, palette: ["White/Black", "Cream/Brown"] },
    { d: "Embroidered", nouns: ["Tee"], shape: chest },
    { d: "Oversized", nouns: ["Tee"], shape: big },
    { d: "Garment Dyed", nouns: ["Tee"], shape: chest },
  ],
  longsleeve: [
    { d: "Heavyweight", nouns: ["Long Sleeve"], shape: big },
    { d: "Thermal", nouns: ["Long Sleeve"], shape: chest },
    { d: "Waffle Knit", nouns: ["Long Sleeve"], shape: chest },
    { d: "Puff Print", nouns: ["Long Sleeve"], shape: big },
    { d: "Striped", nouns: ["Long Sleeve"], shape: { graphic: "none" }, palette: ["Grey Stripe", "Navy Stripe"] },
    { d: "Pigment Dyed", nouns: ["Long Sleeve"], shape: big },
    { d: "Oversized", nouns: ["Long Sleeve"], shape: big },
  ],
  hoodie: [
    { d: "Heavyweight", nouns: ["Hoodie"], shape: big },
    { d: "Puff Print", nouns: ["Hoodie"], shape: big },
    { d: "Embroidered", nouns: ["Hoodie"], shape: chest },
    { d: "Pigment Dyed", nouns: ["Hoodie"], shape: big },
    { d: "Fleece", nouns: ["Hoodie"], shape: chest },
    { d: "Full Zip", nouns: ["Hoodie"], shape: chest, art: "zip" },
    { d: "Oversized", nouns: ["Hoodie"], shape: big },
    { d: "Vintage Wash", nouns: ["Hoodie"], shape: big },
    { d: "Chainstitch", nouns: ["Hoodie"], shape: chest },
  ],
  zip: [],
  crewneck: [
    { d: "Heavyweight", nouns: ["Crewneck"], shape: big },
    { d: "Embroidered", nouns: ["Crewneck"], shape: chest },
    { d: "Pigment Dyed", nouns: ["Crewneck"], shape: big },
    { d: "Vintage Wash", nouns: ["Crewneck"], shape: big },
    { d: "Chenille Patch", nouns: ["Crewneck"], shape: chest },
    { d: "French Terry", nouns: ["Crewneck"], shape: chest },
    { d: "Puff Print", nouns: ["Crewneck"], shape: big },
  ],
  pants: [
    { d: "Ripstop Cargo", nouns: ["Pants"], shape: { leg: "cargo" } },
    { d: "Nylon Cargo", nouns: ["Pants"], shape: { leg: "cargo" } },
    { d: "Double Knee", nouns: ["Work Pants"], shape: { leg: "knee" } },
    { d: "Carpenter", nouns: ["Pants"], shape: { leg: "knee" } },
    { d: "Parachute", nouns: ["Pants"], shape: { leg: "cuffed" } },
    { d: "Fleece", nouns: ["Sweatpants"], shape: { leg: "cuffed" }, palette: ["Heather Grey", "Black", "Washed Black", "Navy", "Forest", "Brown", "Cream", "Ash"], price: [85, 110] },
    { d: "Track", nouns: ["Pants"], shape: { leg: "track" }, palette: TRACK },
    { d: "Painter", nouns: ["Pants"], shape: { leg: "straight" } },
    { d: "Baggy", nouns: ["Jeans"], shape: { leg: "straight" }, palette: DENIM, price: [110, 158] },
    { d: "Wide Leg Cargo", nouns: ["Pants"], shape: { leg: "cargo" } },
  ],
  shorts: [
    { d: "Mesh", nouns: ["Shorts"], shape: { leg: "track" } },
    { d: "Nylon", nouns: ["Shorts"], shape: { leg: "straight" } },
    { d: "Cargo", nouns: ["Shorts"], shape: { leg: "cargo" } },
    { d: "Fleece", nouns: ["Sweat Shorts"], shape: { leg: "straight" }, palette: ["Heather Grey", "Black", "Navy", "Forest", "Ash", "Cream"] },
    { d: "Denim", nouns: ["Shorts"], shape: { leg: "straight" }, palette: DENIM },
    { d: "Ripstop", nouns: ["Cargo Shorts"], shape: { leg: "cargo" } },
    { d: "Terry", nouns: ["Shorts"], shape: { leg: "straight" } },
    { d: "Basketball", nouns: ["Shorts"], shape: { leg: "track" }, palette: TRACK },
  ],
  jacket: [
    { d: "Nylon", nouns: ["Coach Jacket"], shape: { jacket: "coach", graphic: "chest" }, palette: ["Black", "Navy", "Olive", "Forest", "Safety Orange", "Burgundy", "Sand"], price: [118, 158] },
    { d: "Satin", nouns: ["Coach Jacket"], shape: { jacket: "coach", graphic: "chest" }, palette: ["Black", "Navy", "Forest", "Burgundy", "Brown"], price: [128, 165] },
    { d: "Wool", nouns: ["Varsity Jacket"], shape: { jacket: "varsity" }, palette: TWO_TONE, price: [220, 280] },
    { d: "Puffer", nouns: ["Jacket"], shape: { jacket: "puffer" }, palette: ["Black", "Olive", "Navy", "Brown", "Safety Orange", "Forest", "Cream"], price: [210, 265] },
    { d: "Canvas", nouns: ["Work Jacket"], shape: { jacket: "work" }, palette: ["Tan", "Brown", "Black", "Olive", "Chocolate", "Khaki"], price: [148, 190] },
    { d: "Duck Canvas", nouns: ["Chore Coat"], shape: { jacket: "work" }, palette: ["Tan", "Brown", "Black", "Olive", "Khaki"], price: [158, 198] },
    { d: "Track", nouns: ["Jacket"], shape: { jacket: "track", graphic: "chest" }, palette: TRACK, price: [118, 148] },
    { d: "Nylon", nouns: ["Windbreaker"], shape: { jacket: "windbreaker" }, palette: ["Black/Orange", "Navy/White", "Olive/Cream", "Black/White"], price: [110, 140] },
    { d: "Quilted", nouns: ["Liner Vest"], shape: { jacket: "vest" }, palette: ["Olive", "Black", "Army Green", "Navy", "Safety Orange"], price: [110, 145] },
    { d: "Ripstop", nouns: ["Puffer Vest"], shape: { jacket: "vest" }, palette: ["Black", "Olive", "Safety Orange", "Navy"], price: [128, 160] },
  ],
  cap: [
    { d: "Snapback", nouns: ["Cap"], shape: { cap: "six" } },
    { d: "6-Panel", nouns: ["Cap"], shape: { cap: "six" } },
    { d: "5-Panel", nouns: ["Cap"], shape: { cap: "five" } },
    { d: "Dad", nouns: ["Hat"], shape: { cap: "six" } },
    { d: "Trucker", nouns: ["Hat"], shape: { cap: "trucker" }, palette: ["Black/White", "Navy/White", "Olive/Cream", "Black/Orange"] },
    { d: "Corduroy", nouns: ["Cap"], shape: { cap: "six" } },
    { d: "Nylon Camp", nouns: ["Cap"], shape: { cap: "five" } },
    { d: "Washed Twill", nouns: ["Cap"], shape: { cap: "six" } },
  ],
  beanie: [
    { d: "Ribbed", nouns: ["Beanie"] },
    { d: "Cuffed", nouns: ["Beanie"] },
    { d: "Waffle Knit", nouns: ["Beanie"] },
    { d: "Fisherman", nouns: ["Beanie"] },
    { d: "Pom", nouns: ["Beanie"], shape: { pom: true } },
    { d: "Jacquard", nouns: ["Beanie"] },
    { d: "Skully", nouns: ["Beanie"] },
  ],
};

// Colours per kind (names of lib/storedemo/art-streetwear.ts STREET_SHADES); a detail can bring its own.
const PALETTES: Record<StreetKind, string[]> = {
  tee: ["Black", "White", "Heather Grey", "Ash", "Cream", "Bone", "Washed Black", "Navy", "Forest", "Olive", "Sand", "Brown", "Faded Navy", "Red", "Safety Orange", "Powder Blue", "Pink", "Lavender", "Sage", "Burgundy"],
  longsleeve: ["Black", "White", "Heather Grey", "Washed Black", "Cream", "Navy", "Olive", "Forest", "Burgundy", "Charcoal", "Sand"],
  hoodie: ["Black", "Heather Grey", "Ash", "Washed Black", "Charcoal", "Cream", "Bone", "Navy", "Forest", "Olive", "Army Green", "Brown", "Chocolate", "Burgundy", "Safety Orange", "Royal Blue", "Slate", "Sage", "Purple", "Pink", "Powder Blue", "Mustard"],
  zip: [],
  crewneck: ["Black", "Heather Grey", "Ash", "Washed Black", "Cream", "Bone", "Navy", "Forest", "Olive", "Brown", "Burgundy", "Royal Blue", "Slate", "Sage", "Mustard", "Faded Navy"],
  pants: ["Black", "Olive", "Army Green", "Khaki", "Tan", "Sand", "Brown", "Charcoal", "Navy", "Woodland Camo", "Black Camo", "Chocolate"],
  shorts: ["Black", "Heather Grey", "Olive", "Khaki", "Navy", "Royal Blue", "Red", "Sand", "Woodland Camo", "Forest", "Ash"],
  jacket: ["Black", "Olive", "Navy"],
  cap: ["Black", "Navy", "Olive", "Forest", "Brown", "Cream", "Bone", "Burgundy", "Sand", "Washed Black", "Royal Blue", "Safety Orange"],
  beanie: ["Black", "Heather Grey", "Safety Orange", "Forest", "Navy", "Cream", "Brown", "Burgundy", "Olive", "Mustard", "Charcoal", "Powder Blue"],
};
// colours that sell in fall and winter, and the ones that sell in spring and summer (the rest all year)
const WARM = new Set(["Brown", "Chocolate", "Burgundy", "Forest", "Olive", "Army Green", "Rust", "Mustard", "Charcoal", "Woodland Camo", "Black Camo", "Washed Black", "Burgundy/Cream", "Forest/Cream"]);
const LIGHT = new Set(["White", "Powder Blue", "Pink", "Lavender", "Sage", "Sand", "Cream", "Royal Blue", "Bone", "Ash"]);

const PRICE: Record<StreetKind, [number, number]> = {
  tee: [40, 58], longsleeve: [52, 68], hoodie: [98, 148], zip: [110, 150], crewneck: [85, 120], pants: [95, 160], shorts: [55, 90],
  jacket: [120, 200], cap: [38, 48], beanie: [32, 40],
};
// streetwear price points, whole dollars
const POINTS = [
  32, 34, 35, 36, 38, 40, 42, 44, 45, 48, 50, 52, 55, 58, 60, 62, 65, 68, 70, 72, 75, 78, 80, 85, 88, 90, 95, 98, 100, 105, 110, 115,
  118, 120, 125, 128, 130, 135, 138, 140, 145, 148, 150, 155, 158, 160, 165, 170, 175, 180, 185, 190, 195, 198, 210, 220, 225, 230,
  240, 245, 250, 260, 265, 275, 280, 295, 310, 325, 340, 360, 380,
];
const nearest = (v: number) => POINTS.reduce((a, b) => (Math.abs(b - v) < Math.abs(a - v) ? b : a), POINTS[0]);

// The shop's own label, and four small labels it stocks (invented, checked 2026-10-24: no clothing label by these names
// shows up in a web search): what each makes, how often it is in a drop, and where its prices sit against the shop's.
const LABELS: { name: string; kinds: StreetKind[]; w: number; price: number }[] = [
  { name: OWN_LABEL, kinds: ["tee", "longsleeve", "hoodie", "crewneck", "pants", "shorts", "jacket", "cap", "beanie"], w: 4.6, price: 1 },
  { name: "Quietyard", kinds: ["tee", "longsleeve", "hoodie", "crewneck", "cap"], w: 1.1, price: 1.08 },
  { name: "Lowmarsh Athletic", kinds: ["tee", "crewneck", "shorts", "pants", "jacket"], w: 1, price: 0.95 },
  { name: "Halfmile Club", kinds: ["tee", "hoodie", "cap", "beanie"], w: 0.9, price: 0.92 },
  { name: "Ninefold", kinds: ["jacket", "pants", "shorts", "longsleeve"], w: 0.9, price: 1.12 },
];

// size runs (most pieces S–XXL, some S–XL); caps and beanies are one size
const RUNS: [string[], number][] = [
  [["S", "M", "L", "XL", "XXL"], 68],
  [["S", "M", "L", "XL"], 32],
];
/** how fast a size sells through, against S */
const SELLS: Record<string, number> = { S: 0.85, M: 1.15, L: 1.2, XL: 0.95, XXL: 0.7, [ONE_SIZE]: 0.9 };

/* ---------- drops and uploads ---------- */

const dropOffsets = (cfg: DemoConfig) => [...new Set(cfg.catalog.dropDays.map((d) => (d + 6) % 7))].sort((a, b) => a - b);

/** One piece: a drop's (k = drop number, j = place in it) or a Monday upload's (k = week, j). `heat`: how well it sells. */
type Piece = { from: "drop" | "upload"; k: number; j: number; n: number; id: string; day: number; minute: number; heat: number };

function piecesSince(cfg: DemoConfig, from: number, to: number): Piece[] {
  const seed = cfg.catalog.seed;
  const offs = dropOffsets(cfg);
  const out: Piece[] = [];
  const firstWeek = Math.floor((from - EPOCH) / 7);
  const lastWeek = Math.floor((to - EPOCH) / 7);
  for (let w = firstWeek; w <= lastWeek; w++) {
    offs.forEach((off, i) => {
      const k = w * offs.length + i;
      const day = EPOCH + w * 7 + off;
      if (day < from || day > to) return;
      const [lo, hi] = cfg.catalog.perDrop;
      const size = lo + Math.floor(U(seed, "n", k) * (hi - lo + 1));
      // every drop has a headliner that goes in minutes; the rest lean warm (it is a drop, not a restock)
      for (let j = 0; j < size; j++) {
        const heat = j === 0 ? 0.9 + 0.1 * U(seed, "heat", k, j) : Math.pow(U(seed, "heat", k, j), 0.8);
        out.push({ from: "drop", k, j, n: k * 12 + j, id: `d${k.toString(36)}${j.toString(36)}`, day, minute: DROP_MINUTE, heat });
      }
    });
    const day = EPOCH + w * 7; // Monday
    if (day < from || day > to) continue;
    const size = 1 + Math.floor(U(seed, "uploads", w) * 3);
    for (let j = 0; j < size; j++) out.push({ from: "upload", k: w, j, n: w * 3 + j, id: `u${w.toString(36)}${j}`, day, minute: UPLOAD_MINUTE + j * 9, heat: U(seed, "heat-u", w, j) });
  }
  return out;
}

const newestFirst = (a: Piece, b: Piece) => b.day - a.day || b.minute - a.minute || b.j - a.j || b.from.localeCompare(a.from);

/** the best sellers for the week of shop day d: the hottest drop pieces out 7–150 days, recent ones a little ahead */
function bestSellers(cfg: DemoConfig, d: number): Map<string, { rank: number; piece: Piece }> {
  const monday = d - ((((d - EPOCH) % 7) + 7) % 7);
  const scored = piecesSince(cfg, monday - BEST_TO, monday - BEST_FROM)
    .filter((p) => p.from === "drop")
    .map((piece) => ({ piece, score: piece.heat * (0.6 + 0.4 * (1 - (monday - piece.day) / BEST_TO)) }));
  scored.sort((a, b) => b.score - a.score || a.piece.id.localeCompare(b.piece.id));
  return new Map(scored.slice(0, cfg.catalog.best).map((s, rank) => [s.piece.id, { rank, piece: s.piece }]));
}

/* ---------- one product ---------- */

function colourWeights(palette: string[], taken: string[], fall: boolean): number[] {
  return palette.map((c) => (taken.includes(c) ? 0 : WARM.has(c) ? (fall ? 2.2 : 0.5) : LIGHT.has(c) ? (fall ? 0.45 : 2) : 1));
}

/** the shop's day window: a size whose last unit sold before `start` is sold out today; one that sells before `end`
 * still sells today, at its moment */
type Today = { day: number; start: number; end: number };

/** a variant as the store shows it today, from the moment its last unit sells (null: not in sight) */
function variantOf(id: string, color: string, size: string, soldAt: number | null, today: Today): Variant {
  if (soldAt === null || soldAt >= today.end) return { id, color, size, available: true };
  return { id, color, size, available: soldAt >= today.start, soldAt: new Date(soldAt).toISOString() };
}

function season(day: number): boolean {
  const month = new Date(day * DAY).getUTCMonth();
  return month >= 7 || month === 0;
}

function dropProduct(cfg: DemoConfig, p: Piece, today: Today, best: number | null): Product {
  const seed = cfg.catalog.seed;
  const { n, id } = p;
  const fall = season(p.day);
  const kd = KINDS[pickIndex(KINDS.map((x) => x.w * (fall ? x.fall : x.spring)), U(seed, "kind", n))];
  const kind = kd.kind;

  const slot = (n * 41) % NAMES.length;
  const details = DETAILS[kind];
  const det = details[(Math.floor(n / NAMES.length) + (H(seed, "slot", slot) % details.length)) % details.length];
  const noun = pick(det.nouns, U(seed, "noun", n));
  const title = `${NAMES[slot]} ${det.d} ${noun}`;

  const labels = LABELS.filter((l) => l.kinds.includes(kind));
  const label = labels[pickIndex(labels.map((l) => l.w), U(seed, "label", n))];

  // one colour for most pieces, two or three for some; the season leans the choice
  const palette = det.palette ?? PALETTES[kind];
  const cu = U(seed, "colours", n);
  const count = Math.min(palette.length, cu < 0.62 ? 1 : cu < 0.9 ? 2 : 3);
  const colours: string[] = [];
  for (let i = 0; i < count; i++) colours.push(palette[pickIndex(colourWeights(palette, colours, fall), U(seed, "colour", n, i))]);
  const sizes = ONE_SIZED.has(kind) ? [ONE_SIZE] : RUNS[pickIndex(RUNS.map((r) => r[1]), U(seed, "run", n))][0].filter((s) => s in cfg.sizes);

  // When each size's last unit sells. A hot limited piece sells out within hours of the drop, a slow one over weeks
  // or never; the best sellers are kept in stock by production runs (lib/storedemo/config-streetwear.ts restock), so
  // they rarely run out.
  const pub = instant(cfg.tz, p.day, p.minute);
  const span = 0.08 + 60 * Math.pow(1 - p.heat, 2.4);
  const stays = Math.pow(1 - p.heat, 1.1) * 0.95;
  const lastUnit = (ci: number, si: number, size: string): number | null => {
    const u = U(seed, "out", id, ci, si);
    if (best !== null) return u < 0.07 ? pub + (12 + U(seed, "out-b", id, ci, si) * 40) * DAY : null;
    if (U(seed, "stays", id, ci, si) < stays) return null;
    return pub + ((0.008 + Math.pow(u, 1.7) * span) / (SELLS[size] ?? 1)) * DAY;
  };
  const variants = colours.flatMap((color, ci) => sizes.map((size, si) => variantOf(`${id}-${ci}${si}`, color, size, lastUnit(ci, si, size), today)));

  // slow pieces go into the archive sale after eight weeks
  const range = det.price ?? PRICE[det.art ?? kind];
  const base = nearest((range[0] + Math.pow(U(seed, "price", n), 1.2) * (range[1] - range[0])) * label.price);
  let price = base;
  let compareAt: number | undefined;
  const age = today.day - p.day;
  if (age >= MARKDOWN_AFTER && best === null && p.heat < 0.32 && U(seed, "markdown", id) < 0.6) {
    const off = POINTS.filter((x) => x <= base * (0.7 + 0.1 * U(seed, "off", id))).pop();
    if (off && off < base) {
      price = off;
      compareAt = base;
    }
  }

  const shape: StreetShape = { ...det.shape, ...(det.shape?.graphic || kind === "cap" || kind === "jacket" ? { mark: H(seed, "mark", n) % 6 } : {}) };
  return {
    id,
    title,
    brand: label.name,
    category: kd.category,
    price,
    ...(compareAt ? { compareAt } : {}),
    image: streetArt(det.art ?? kind, colours[0], shape),
    publishedAt: new Date(pub).toISOString(),
    best,
    variants,
  };
}

// pre-owned and consigned pieces: what comes in, as a share
const ARCHIVE_KINDS: [StreetKind, number][] = [["hoodie", 5], ["jacket", 4], ["crewneck", 3], ["tee", 3], ["pants", 2], ["cap", 1]];

/** A pre-owned piece: one unit of one size, a season code of a year or two ago, sold once (or not yet). */
function uploadProduct(cfg: DemoConfig, p: Piece, today: Today): Product {
  const seed = cfg.catalog.seed;
  const { n, id } = p;
  const kind = ARCHIVE_KINDS[pickIndex(ARCHIVE_KINDS.map((k) => k[1]), U(seed, "u-kind", n))][0];
  const details = DETAILS[kind];
  const det = details[H(seed, "u-detail", n) % details.length];
  const noun = pick(det.nouns, U(seed, "u-noun", n));
  const slot = (n * 29 + 7) % NAMES.length;
  const year = new Date(p.day * DAY).getUTCFullYear() - 1 - (H(seed, "u-year", n) % 2);
  const code = `${U(seed, "u-season", n) < 0.55 ? "FW" : "SS"}${String(year).slice(2)}`;
  const label = U(seed, "u-label", n) < 0.4 ? LABELS[0] : LABELS[1 + (H(seed, "u-label2", n) % (LABELS.length - 1))];
  const palette = det.palette ?? PALETTES[kind];
  const colour = palette[pickIndex(colourWeights(palette, [], season(p.day)), U(seed, "u-colour", n))];
  const sizes = ONE_SIZED.has(kind) ? [ONE_SIZE] : ["S", "M", "L", "XL", "XXL"].filter((s) => s in cfg.sizes);
  const size = sizes[pickIndex(sizes.map((s) => cfg.sizes[s] ?? 1), U(seed, "u-size", n))];
  const pub = instant(cfg.tz, p.day, p.minute);
  // a one-off sells some days to some weeks after it is up, or is still waiting
  const sold = U(seed, "u-stays", id) < 0.25 ? null : pub + (0.3 + Math.pow(U(seed, "u-sold", id), 1.6) * 28) * DAY;
  const range = det.price ?? PRICE[det.art ?? kind];
  const retail = (range[0] + range[1]) / 2;
  const shape: StreetShape = { ...det.shape, ...(det.shape?.graphic || kind === "cap" || kind === "jacket" ? { mark: H(seed, "u-mark", n) % 6 } : {}) };
  return {
    id,
    title: `${code} ${NAMES[slot]} ${det.d} ${noun}`,
    brand: label.name,
    category: PRE_OWNED,
    price: nearest(retail * (0.7 + U(seed, "u-price", n) * 0.95)),
    image: streetArt(det.art ?? kind, colour, shape),
    publishedAt: new Date(pub).toISOString(),
    best: null,
    oneOff: true,
    variants: [variantOf(`${id}-00`, colour, size, sold, today)],
  };
}

/* ---------- the catalogue ---------- */

/** The catalogue's stamp for instant t: the start of the shop's day (the same as lib/storedemo/catalog.ts catalogStamp). */
export function streetwearStamp(cfg: DemoConfig, t: number): string {
  return new Date(instant(cfg.tz, dayOf(cfg.tz, t), 0)).toISOString();
}

/** The catalogue on the shop's day at instant t: the newest pieces (this day's drop or upload included, out later that
 * day) and this week's best sellers, newest first. */
export function streetwearCatalogAt(cfg: DemoConfig, t: number): Catalog {
  const d = dayOf(cfg.tz, t);
  const today: Today = { day: d, start: instant(cfg.tz, d, 0), end: instant(cfg.tz, d + 1, 0) };
  const best = bestSellers(cfg, d);
  const all = piecesSince(cfg, d - LOOK_BACK, d).sort(newestFirst);
  const pieces = new Map<string, Piece>(all.slice(0, cfg.catalog.newest).map((p) => [p.id, p]));
  for (const b of best.values()) if (!pieces.has(b.piece.id)) pieces.set(b.piece.id, b.piece);
  const products = [...pieces.values()].map((p) => (p.from === "drop" ? dropProduct(cfg, p, today, best.get(p.id)?.rank ?? null) : uploadProduct(cfg, p, today)));
  products.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.id.localeCompare(b.id));
  return { products, at: new Date(today.start).toISOString() };
}

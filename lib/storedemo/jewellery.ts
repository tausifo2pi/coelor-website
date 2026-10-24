// The jewelry demo's catalogue, generated (no client data, no third-party store's catalogue): about 140 pieces of a
// small US jewelry studio that designs its own line (rings, necklaces, earrings, bracelets and charms) in six
// collections, with invented design names, metals as variants (gold vermeil, sterling silver, rose gold vermeil, 14k
// gold fill, solid 14k gold), birthstones as variants, ring sizes on rings and chain lengths on some necklaces, studio
// prices and a picture drawn by lib/storedemo/jewellery-art.ts. It has the shape the engine reads (lib/storedemo/types.ts
// Catalog) and is wired in through the config's catalog.build (lib/storedemo/jewellery-config.ts).
//
// Time-based and pure like the boutique's generator (lib/storedemo/catalog.ts), whose clock and drop rules it repeats:
// new pieces come out in weekly drops (the config's drop day, 10:00 shop time, a few minutes apart), ring sizes and
// metals sell out as pieces age, a few slow pieces get a last-chance price, and the best-seller list is re-ranked every
// Monday from pieces out up to a year (jewelry stays in the line longer than clothes). Everything follows from (config,
// the shop's local day) through a hash, so every visitor on the same day gets the same catalogue, built again only at the
// shop's midnight. No "@/" imports: node --test loads it.
import { jewelleryArt, type JKind, type JShape } from "./jewellery-art.ts";
import { catalogStamp } from "./catalog.ts";
import type { Catalog, DemoConfig, Product, Variant } from "./types.ts";

const MIN = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;
/** day numbers count days since 1970-01-01 on the shop's wall clock; drops are counted from Monday 1 January 2024 */
const EPOCH = Date.UTC(2024, 0, 1) / DAY;
/** a drop goes up at 10:00 shop time, one piece every few minutes */
const DROP_MINUTE = 10 * 60;
/** no size or metal sells out in a piece's first 21 days: the engine dates a sold-out variant's last sale up to 19.5
 * days after the piece came out, so that sale has always happened by the time it shows as sold out */
const SELL_FROM = 21;
/** days over which a piece sells through, once it can (jewelry sells slower than clothes) */
const SELL_SPAN = 110;
const LAST_CHANCE_AFTER = 120;
/** best sellers: pieces out between 10 days and a year at the start of the week */
const BEST_FROM = 10;
const BEST_TO = 360;

/* ---------- hashing: one stable number per (parts), the same function as catalog.ts and the engine ---------- */

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

/* ---------- the shop's clock ---------- */

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
/** the shop's day number at instant t */
const dayOf = (tz: string, t: number) => Math.floor((t + offsetMin(tz, t) * MIN) / DAY);
/** UTC instant of local minute `m` of shop day `d` */
function instant(tz: string, d: number, m: number): number {
  const wall = d * DAY + m * MIN;
  let t = wall - offsetMin(tz, wall) * MIN;
  t = wall - offsetMin(tz, t) * MIN;
  return t;
}

/* ---------- what the studio makes ---------- */

export const ONE_SIZE = "One size";
/** US ring sizes the studio stocks, smallest first */
export const RING_SIZES = ["5", "5.5", "6", "6.5", "7", "7.5", "8", "8.5", "9", "10"];
/** chain lengths, shortest first */
export const LENGTHS = ['16"', '18"', '20"'];

export const COLLECTIONS = ["Everyday", "Tidewater", "Celestial", "Birthstone", "Heirloom 14k", "Charm Bar"] as const;
type Collection = (typeof COLLECTIONS)[number];

/** how a piece is made, which sets its metals and its price: gold vermeil or silver, 14k gold fill chains, solid 14k
 * gold, or a birthstone piece (one metal, the twelve stones as variants) */
type Make = "vermeil" | "fill" | "solid" | "birthstone";
export const METAL_CHOICES: Record<Exclude<Make, "birthstone">, [string, number][]> = {
  vermeil: [["Gold Vermeil", 3], ["Sterling Silver", 2], ["Rose Gold Vermeil", 1]],
  fill: [["14k Gold Fill", 3], ["Sterling Silver", 1.5]],
  solid: [["14k Yellow Gold", 3], ["14k White Gold", 1.5], ["14k Rose Gold", 1]],
};
/** the twelve birthstones as the studio sets them (lab-created where the natural stone is out of reach) */
export const BIRTHSTONES = [
  "Garnet (Jan)", "Amethyst (Feb)", "Aquamarine (Mar)", "White Topaz (Apr)", "Emerald (May)", "Moonstone (Jun)",
  "Ruby (Jul)", "Peridot (Aug)", "Sapphire (Sep)", "Opal (Oct)", "Citrine (Nov)", "Blue Topaz (Dec)",
];
export const BIRTHSTONE_METAL = "Gold Vermeil";

type KindDef = { kind: JKind; category: string; w: number; holiday: number };
// share of the drops; necklaces, bracelets and charms lean on the gift season (November and December drops)
const KINDS: KindDef[] = [
  { kind: "ring", category: "Rings", w: 29, holiday: 0.9 },
  { kind: "necklace", category: "Necklaces", w: 26, holiday: 1.25 },
  { kind: "earring", category: "Earrings", w: 24, holiday: 1 },
  { kind: "bracelet", category: "Bracelets", w: 11, holiday: 1.3 },
  { kind: "charm", category: "Charms", w: 10, holiday: 1.4 },
];

// The first word of a title: a design name. No metal, stone or collection words. A piece's name is NAMES[(n × 41) mod
// length]: two pieces share a name only when their numbers are a whole number of rounds apart, and then they get a
// different detail (see productOf), so titles never repeat.
const NAMES = [
  "Juniper", "Marlowe", "Odette", "Isla", "Celeste", "Maren", "Wren", "Ada", "Esme", "Ivy", "Nell", "Thea", "Vera",
  "Margot", "Imogen", "Sloane", "Tessa", "Willa", "Romy", "Delphine", "Elodie", "Faye", "Greer", "Hollis", "Josie", "Kit",
  "Lottie", "Mae", "Nora", "Paloma", "Quinn", "Rhea", "Sadie", "Tilda", "Vivian", "Winnie", "Blair", "Cora", "Elise",
  "Frida", "Hattie", "Iris", "June", "Mira", "Petra", "Selma", "Talia", "Una", "Zadie", "Bea", "Clio", "Edie", "Fleur",
  "Gia", "Hana", "Ines", "Jolie", "Kaia", "Lise", "Mila", "Nadia", "Oona", "Rosa", "Yara",
];

// Per kind: a detail, the nouns it goes with, its collection, how it is made and how it looks. At least 12 details each
// (see NAMES), every detail unique within its kind.
type Detail = [detail: string, nouns: string[], collection: Collection, make: Make, look: JShape];
const DETAILS: Record<JKind, Detail[]> = {
  ring: [
    ["Twisted", ["Stacking Ring", "Band"], "Everyday", "vermeil", { ring: "twist" }],
    ["Beaded", ["Stacking Ring", "Band"], "Everyday", "vermeil", { ring: "beaded" }],
    ["Hammered", ["Band", "Stacking Ring"], "Everyday", "vermeil", { ring: "band" }],
    ["Chunky Dome", ["Ring"], "Everyday", "vermeil", { ring: "dome" }],
    ["Oval Signet", ["Ring", "Pinky Ring"], "Everyday", "vermeil", { ring: "signet" }],
    ["Stacking", ["Ring Set"], "Everyday", "vermeil", { ring: "stack" }],
    ["Pearl", ["Ring", "Stacking Ring"], "Tidewater", "vermeil", { ring: "pearl", stone: "Pearl" }],
    ["Opal", ["Ring", "Stacking Ring"], "Tidewater", "vermeil", { ring: "bezel", stone: "Opal" }],
    ["Wave", ["Band", "Stacking Ring"], "Tidewater", "vermeil", { ring: "twist" }],
    ["Blue Topaz", ["Ring"], "Tidewater", "vermeil", { ring: "solitaire", stone: "Blue Topaz" }],
    ["Moonstone", ["Ring", "Stacking Ring"], "Celestial", "vermeil", { ring: "solitaire", stone: "Moonstone" }],
    ["Starburst", ["Signet Ring"], "Celestial", "vermeil", { ring: "signet", motif: "star" }],
    ["Crescent", ["Signet Ring"], "Celestial", "vermeil", { ring: "signet", motif: "moon" }],
    ["Lab Diamond Solitaire", ["Ring"], "Heirloom 14k", "solid", { ring: "solitaire", stone: "Lab Diamond" }],
    ["Lab Diamond Eternity", ["Band"], "Heirloom 14k", "solid", { ring: "eternity", stone: "Lab Diamond" }],
    ["Sapphire", ["Ring"], "Heirloom 14k", "solid", { ring: "solitaire", stone: "Sapphire" }],
    ["Classic", ["Band"], "Heirloom 14k", "solid", { ring: "dome" }],
  ],
  necklace: [
    ["Paperclip", ["Chain Necklace"], "Everyday", "fill", { chain: "paperclip" }],
    ["Herringbone", ["Chain Necklace"], "Everyday", "vermeil", { chain: "herringbone" }],
    ["Box", ["Chain Necklace"], "Everyday", "fill", { chain: "fine" }],
    ["Bar", ["Necklace"], "Everyday", "vermeil", { motif: "bar" }],
    ["Coin", ["Pendant Necklace"], "Everyday", "vermeil", { motif: "coin" }],
    ["Heart", ["Pendant Necklace", "Locket Necklace"], "Everyday", "vermeil", { motif: "heart" }],
    ["Baroque Pearl", ["Necklace", "Choker"], "Tidewater", "vermeil", { chain: "pearls", stone: "Pearl" }],
    ["Pearl Drop", ["Pendant Necklace", "Necklace"], "Tidewater", "vermeil", { motif: "pearl", stone: "Pearl" }],
    ["Seashell", ["Pendant Necklace", "Charm Necklace"], "Tidewater", "vermeil", { motif: "shell" }],
    ["Crescent Moon", ["Pendant Necklace", "Necklace"], "Celestial", "vermeil", { motif: "moon" }],
    ["North Star", ["Pendant Necklace", "Necklace"], "Celestial", "vermeil", { motif: "star" }],
    ["Sunburst", ["Pendant Necklace"], "Celestial", "vermeil", { motif: "sun" }],
    ["Birthstone Drop", ["Necklace", "Pendant Necklace"], "Birthstone", "birthstone", { motif: "drop" }],
    ["Birthstone Bezel", ["Necklace"], "Birthstone", "birthstone", { motif: "bezel" }],
    ["Lab Diamond Bezel", ["Pendant Necklace", "Necklace"], "Heirloom 14k", "solid", { motif: "bezel", stone: "Lab Diamond" }],
    ["Lab Diamond Tennis", ["Necklace"], "Heirloom 14k", "solid", { chain: "tennis", stone: "Lab Diamond" }],
    ["Rope", ["Chain Necklace"], "Heirloom 14k", "solid", { chain: "rope" }],
  ],
  earring: [
    ["Chunky", ["Hoops"], "Everyday", "vermeil", { chunky: true }],
    ["Twisted", ["Hoops", "Huggies"], "Everyday", "vermeil", { twist: true }],
    ["Mini", ["Huggies", "Hoops"], "Everyday", "vermeil", {}],
    ["Hammered", ["Hoops", "Ear Cuff"], "Everyday", "vermeil", {}],
    ["Ball", ["Studs", "Threaders"], "Everyday", "vermeil", { motif: "ball" }],
    ["Pearl", ["Studs", "Drop Earrings", "Huggies"], "Tidewater", "vermeil", { motif: "pearl", stone: "Pearl" }],
    ["Shell", ["Studs", "Drop Earrings"], "Tidewater", "vermeil", { motif: "shell" }],
    ["Opal", ["Studs", "Huggies"], "Tidewater", "vermeil", { stone: "Opal" }],
    ["Crescent", ["Studs", "Ear Cuff"], "Celestial", "vermeil", { motif: "moon" }],
    ["Star", ["Studs", "Threaders"], "Celestial", "vermeil", { motif: "star" }],
    ["Sunburst", ["Studs", "Drop Earrings"], "Celestial", "vermeil", { motif: "sun" }],
    ["Birthstone", ["Studs", "Huggies"], "Birthstone", "birthstone", {}],
    ["Lab Diamond", ["Studs", "Huggies"], "Heirloom 14k", "solid", { stone: "Lab Diamond" }],
    ["Sapphire Drop", ["Earrings"], "Heirloom 14k", "solid", { ear: "drops", stone: "Sapphire" }],
  ],
  bracelet: [
    ["Paperclip", ["Chain Bracelet"], "Everyday", "fill", { chain: "paperclip" }],
    ["Figaro", ["Chain Bracelet"], "Everyday", "fill", { chain: "fine" }],
    ["Herringbone", ["Bracelet"], "Everyday", "vermeil", { chain: "herringbone" }],
    ["Hammered", ["Cuff", "Bangle"], "Everyday", "vermeil", {}],
    ["Twisted", ["Bangle"], "Everyday", "vermeil", { twist: true }],
    ["Pearl", ["Bracelet"], "Tidewater", "vermeil", { chain: "pearls", stone: "Pearl" }],
    ["Seashell", ["Charm Bracelet"], "Tidewater", "vermeil", { chain: "fine", motif: "shell" }],
    ["Star Station", ["Bracelet"], "Celestial", "vermeil", { chain: "fine", motif: "star" }],
    ["Moon Phase", ["Bracelet", "Bangle"], "Celestial", "vermeil", { chain: "fine", motif: "moon" }],
    ["Birthstone Station", ["Bracelet"], "Birthstone", "birthstone", { chain: "fine", stations: true }],
    ["Lab Diamond", ["Tennis Bracelet"], "Heirloom 14k", "solid", { chain: "tennis", stone: "Lab Diamond" }],
    ["Rope", ["Chain Bracelet"], "Heirloom 14k", "solid", { chain: "rope" }],
  ],
  charm: [
    ["Heart", ["Charm"], "Charm Bar", "vermeil", { motif: "heart" }],
    ["Evil Eye", ["Charm"], "Charm Bar", "vermeil", { motif: "eye" }],
    ["Clover", ["Charm"], "Charm Bar", "vermeil", { motif: "clover" }],
    ["Bumble Bee", ["Charm"], "Charm Bar", "vermeil", { motif: "bee" }],
    ["Padlock", ["Charm"], "Charm Bar", "vermeil", { motif: "lock" }],
    ["Daisy", ["Charm"], "Charm Bar", "vermeil", { motif: "flower", stone: "Citrine" }],
    ["Mini Coin", ["Charm"], "Charm Bar", "vermeil", { motif: "coin" }],
    ["Scallop Shell", ["Charm"], "Tidewater", "vermeil", { motif: "shell" }],
    ["Crescent Moon", ["Charm"], "Celestial", "vermeil", { motif: "moon" }],
    ["Sunburst", ["Charm"], "Celestial", "vermeil", { motif: "sun" }],
    ["Lucky Star", ["Charm"], "Celestial", "vermeil", { motif: "star" }],
    ["Birthstone", ["Charm"], "Birthstone", "birthstone", { motif: "bezel" }],
    ["Lab Diamond Coin", ["Charm"], "Heirloom 14k", "solid", { motif: "coin", stone: "Lab Diamond" }],
  ],
};

/** what the noun says about the look (the kind of earring, a bangle or a cuff, a set of stacking rings) */
function nounLook(kind: JKind, noun: string, look: JShape): JShape {
  if (kind === "earring") {
    const ear: JShape["ear"] = /Studs/.test(noun) ? "studs" : /Huggies/.test(noun) ? "huggies" : /Hoops/.test(noun) ? "hoops" : /Drop/.test(noun) ? "drops" : /Threaders/.test(noun) ? "threaders" : /Cuff/.test(noun) ? "cuff" : look.ear;
    return { ...look, ear };
  }
  if (kind === "bracelet" && /Bangle/.test(noun)) return { ...look, bangle: "bangle", chain: undefined, motif: undefined };
  if (kind === "bracelet" && /Cuff/.test(noun)) return { ...look, bangle: "cuff" };
  return look;
}

/** the stone a birthstone variant names ("Garnet (Jan)" → "Garnet") */
export const stoneName = (variant: string) => variant.replace(/\s*\(.*\)$/, "");

// ring size runs the studio stocks: whole sizes 5–9 on most rings, half sizes on bands, 6–10 on chunkier pieces
const RING_RUNS: [string[], number][] = [
  [["5", "6", "7", "8", "9"], 45],
  [["5", "5.5", "6", "6.5", "7", "7.5", "8", "8.5", "9"], 22],
  [["6", "7", "8", "9", "10"], 15],
  [["5", "6", "7", "8"], 18],
];
/** how fast a size sells through, against size 8 (6 to 7.5 sell most; 18" is the length most buy) */
const SELLS: Record<string, number> = {
  "5": 0.6, "5.5": 0.65, "6": 1, "6.5": 1.1, "7": 1.15, "7.5": 1, "8": 0.95, "8.5": 0.7, "9": 0.7, "10": 0.5,
  '16"': 0.8, '18"': 1.1, '20"': 0.8, [ONE_SIZE]: 0.6,
};

/** retail prices per kind and make, whole dollars */
const PRICE: Record<JKind, Record<Make, [number, number]>> = {
  ring: { vermeil: [38, 92], fill: [36, 68], solid: [195, 640], birthstone: [48, 78] },
  necklace: { vermeil: [44, 118], fill: [38, 88], solid: [240, 780], birthstone: [52, 84] },
  earring: { vermeil: [28, 78], fill: [26, 58], solid: [145, 420], birthstone: [38, 64] },
  bracelet: { vermeil: [38, 98], fill: [32, 78], solid: [265, 890], birthstone: [44, 72] },
  charm: { vermeil: [18, 48], fill: [18, 38], solid: [95, 220], birthstone: [28, 44] },
};
// studio price points
const POINTS = [
  18, 22, 24, 26, 28, 32, 34, 36, 38, 42, 44, 46, 48, 52, 54, 56, 58, 62, 64, 66, 68, 72, 74, 78, 84, 88, 92, 96, 98, 108,
  118, 124, 128, 138, 145, 148, 165, 185, 195, 220, 240, 265, 285, 320, 345, 380, 420, 465, 495, 540, 595, 640, 695, 780, 840, 890,
];

/* ---------- drops ---------- */

/** the config's drop days as days after Monday, in week order */
const dropOffsets = (cfg: DemoConfig) => [...new Set(cfg.catalog.dropDays.map((d) => (d + 6) % 7))].sort((a, b) => a - b);

function dropDay(cfg: DemoConfig, k: number): number {
  const offs = dropOffsets(cfg);
  return EPOCH + Math.floor(k / offs.length) * 7 + offs[((k % offs.length) + offs.length) % offs.length];
}
const dropSize = (cfg: DemoConfig, k: number) => {
  const [lo, hi] = cfg.catalog.perDrop;
  return lo + Math.floor(U(cfg.catalog.seed, "n", k) * (hi - lo + 1));
};
/** the last drop on or before shop day d */
function lastDrop(cfg: DemoConfig, d: number): number {
  const per = dropOffsets(cfg).length;
  let k = (Math.floor((d - EPOCH) / 7) + 1) * per - 1;
  while (dropDay(cfg, k) > d) k--;
  return k;
}

/** One piece of a drop: drop k, place j. `heat` is how well it sells (best sellers, sell-through, last-chance prices). */
type Piece = { k: number; j: number; n: number; id: string; day: number; heat: number };
const pieceOf = (cfg: DemoConfig, k: number, j: number): Piece => ({
  k, j, n: k * 10 + j, id: `j${k.toString(36)}${j}`, day: dropDay(cfg, k), heat: U(cfg.catalog.seed, "heat", k, j),
});

/** the best sellers for the week of shop day d: the hottest pieces out 10 days to a year, recent ones a little ahead */
function bestSellers(cfg: DemoConfig, d: number): Map<string, { rank: number; piece: Piece }> {
  const monday = d - ((((d - EPOCH) % 7) + 7) % 7);
  const scored: { piece: Piece; score: number }[] = [];
  for (let k = lastDrop(cfg, monday - BEST_FROM); dropDay(cfg, k) >= monday - BEST_TO; k--) {
    for (let j = 0; j < dropSize(cfg, k); j++) {
      const piece = pieceOf(cfg, k, j);
      const age = monday - piece.day;
      scored.push({ piece, score: piece.heat * (0.7 + 0.3 * (1 - age / BEST_TO)) });
    }
  }
  scored.sort((a, b) => b.score - a.score || a.piece.id.localeCompare(b.piece.id));
  return new Map(scored.slice(0, cfg.catalog.best).map((s, rank) => [s.piece.id, { rank, piece: s.piece }]));
}

/* ---------- one product ---------- */

function pick<T>(xs: T[], u: number): T {
  return xs[Math.min(xs.length - 1, Math.floor(u * xs.length))];
}

function priceOf(kind: JKind, make: Make, u: number): number {
  const [lo, hi] = PRICE[kind][make];
  const pts = POINTS.filter((p) => p >= lo && p <= hi);
  return pts[Math.min(pts.length - 1, Math.floor(Math.pow(u, 1.3) * pts.length))];
}

/** the metals a piece comes in (1 to 3; rings 1 or 2), or the twelve birthstones */
function coloursOf(seed: string, n: number, kind: JKind, make: Make): string[] {
  if (make === "birthstone") return [...BIRTHSTONES];
  const choices = METAL_CHOICES[make];
  const cu = U(seed, "metals", n);
  let count = make === "fill" ? (cu < 0.55 ? 1 : 2) : cu < 0.45 ? 1 : cu < 0.83 ? 2 : 3;
  if (kind === "ring") count = Math.min(count, 2);
  const out: string[] = [];
  for (let i = 0; i < count; i++) out.push(choices[pickIndex(choices.map(([c, w]) => (out.includes(c) ? 0 : w)), U(seed, "metal", n, i))][0]);
  return out;
}

function sizesOf(seed: string, n: number, kind: JKind, look: JShape, noun: string): string[] {
  if (kind === "ring") return look.ring === "stack" ? RING_RUNS[0][0] : RING_RUNS[pickIndex(RING_RUNS.map((r) => r[1]), U(seed, "run", n))][0];
  // plain chains come in three lengths most of the time; pendants hang on an adjustable 16–18" chain
  if (kind === "necklace" && /Chain/.test(noun) && U(seed, "lengths", n) < 0.65) return LENGTHS;
  return [ONE_SIZE];
}

function productOf(cfg: DemoConfig, p: Piece, today: number, best: number | null): Product {
  const seed = cfg.catalog.seed;
  const { n, id } = p;
  const month = new Date(p.day * DAY).getUTCMonth();
  const gifts = month >= 10;
  const kd = KINDS[pickIndex(KINDS.map((x) => x.w * (gifts ? x.holiday : 1)), U(seed, "kind", n))];
  const kind = kd.kind;

  const slot = (n * 41) % NAMES.length;
  const details = DETAILS[kind];
  const [detail, nouns, collection, make, look0] = details[(Math.floor(n / NAMES.length) + (H(seed, "slot", slot) % details.length)) % details.length];
  const noun = pick(nouns, U(seed, "noun", n));
  const title = `${NAMES[slot]} ${detail} ${noun}`;
  const look = nounLook(kind, noun, look0);

  const colours = coloursOf(seed, n, kind, make);
  const sizes = sizesOf(seed, n, kind, look, noun);

  // sizes and metals sell out as the piece ages (popular sizes first, hot pieces faster, solid gold slower); best
  // sellers are recast, so they rarely run out; a one-size piece in one metal sells out whole
  const age = today - p.day;
  const cap = (0.45 + 0.55 * p.heat) * (best !== null ? 0.35 : 1) * (make === "solid" ? 0.6 : 1);
  const gone = (size: string, u: number) => age >= SELL_FROM && u < Math.min(0.9, ((age - SELL_FROM) / SELL_SPAN) * cap * (SELLS[size] ?? 1));
  const variants: Variant[] = colours.flatMap((color, ci) =>
    sizes.map((size, si) => ({ id: `${id}-${ci.toString(36)}${si}`, color, size, available: !gone(size, U(seed, "out", id, ci, si)) })),
  );

  // a slow piece gets a last-chance price after four months (never solid gold)
  const base = priceOf(kind, make, U(seed, "price", n));
  let price = base;
  let compareAt: number | undefined;
  if (age >= LAST_CHANCE_AFTER && make !== "solid" && p.heat < 0.35 && U(seed, "last", id) < 0.55) {
    const off = POINTS.filter((x) => x <= base * (0.7 + 0.1 * U(seed, "off", id))).pop();
    if (off && off < base) {
      price = off;
      compareAt = base;
    }
  }

  // the picture: the first metal; a birthstone piece in its metal with one of the twelve stones
  const photo = make === "birthstone"
    ? jewelleryArt(kind, BIRTHSTONE_METAL, { ...look, stone: stoneName(BIRTHSTONES[H(seed, "photo", n) % BIRTHSTONES.length]) })
    : jewelleryArt(kind, colours[0], look);

  const minute = DROP_MINUTE + p.j * 6 + Math.floor(U(seed, "minute", n) * 5);
  return {
    id,
    title,
    brand: collection,
    category: kd.category,
    price,
    ...(compareAt ? { compareAt } : {}),
    image: photo,
    publishedAt: new Date(instant(cfg.tz, p.day, minute)).toISOString(),
    best,
    variants,
  };
}

/* ---------- the catalogue ---------- */

/** The catalogue on the shop's day at instant t: the newest pieces (this day's drop included, published later that
 * day) and this week's best sellers, newest first. The config's catalog.build. */
export function jewelleryCatalogAt(cfg: DemoConfig, t: number): Catalog {
  const today = dayOf(cfg.tz, t);
  const best = bestSellers(cfg, today);
  const pieces = new Map<string, Piece>();
  for (let k = lastDrop(cfg, today); pieces.size < cfg.catalog.newest; k--) {
    for (let j = dropSize(cfg, k) - 1; j >= 0 && pieces.size < cfg.catalog.newest; j--) {
      const p = pieceOf(cfg, k, j);
      pieces.set(p.id, p);
    }
  }
  for (const b of best.values()) if (!pieces.has(b.piece.id)) pieces.set(b.piece.id, b.piece);
  const products = [...pieces.values()].map((p) => productOf(cfg, p, today, best.get(p.id)?.rank ?? null));
  products.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.id.localeCompare(b.id));
  return { products, at: catalogStamp(cfg, t) };
}

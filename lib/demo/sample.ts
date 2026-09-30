// The generated sales channels of the live demo (the lib/demo/channels.ts slots not in API_CHANNELS): data that looks
// like the client's real StockX and Alias rows on every page (sales, listings, linked products, the product drawer, the
// automations and the connection cards), so a reader sees their own kind of setup next to the live one.
//
// Deterministic and time-based: every row follows from (channel slot, day, index) through a hash, so the same `now`
// gives the same rows, orders appear as time passes, totals only grow, and a restart changes nothing. A slot's rhythm
// comes from its role: a web store (steady, 8–14 orders a day, busiest in the evening) or live selling ("Live" in the
// role: 3–4 evening shows a week of 20–60 sales within about two hours, a trickle otherwise). Names, labels and cadence
// are read from the channel config only, so flipping a slot to another platform is a change in channels.ts alone.
// Pure (no I/O, no "@/" imports): `node --test lib/demo/sample.test.mts`.

import { CHANNELS, fromApi, type Channel, type SellPlatform } from "./channels.ts";
import { connectionsOf, type Job, type Linked, type Listing, type Overview, type Page, type Product, type Sale, type Step, type StoreId } from "./shape.ts";

/** Monday 5 January 2026: the sample stores' first day (they are about nine months old in October 2026). */
export const SAMPLE_START = Date.UTC(2026, 0, 5);
const MIN = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;

/* ---------- hashing: one stable 32-bit number per (parts) ---------- */

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
const iso = (t: number) => new Date(t).toISOString();
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const join = (xs: string[]) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);
const cumsum = (xs: number[]) => {
  let s = 0;
  return xs.map((x) => (s += x));
};
/** index into a cumulative weight list for u in [0, 1) */
function pick(cum: number[], u: number): number {
  const target = u * cum[cum.length - 1];
  let i = 0;
  while (i < cum.length - 1 && cum[i] <= target) i++;
  return i;
}
/** k distinct items, drawn by weight */
function draw<T>(items: T[], weight: (x: T) => number, k: number, seed: string): T[] {
  const pool = items.slice();
  const out: T[] = [];
  for (let j = 0; j < k && pool.length; j++) {
    let u = U(seed, j) * pool.reduce((s, x) => s + weight(x), 0);
    let i = 0;
    for (; i < pool.length - 1; i++) {
      u -= weight(pool[i]);
      if (u < 0) break;
    }
    out.push(pool[i]);
    pool.splice(i, 1);
  }
  return out;
}

/* ---------- the catalogue: popular models with their real style codes and size runs ---------- */

type Run = "nike" | "women" | "gs" | "adidas" | "slide" | "nb";
// [US size, EU size] as the marketplaces and Picqer write them; demand peaks around `peak`
const RUNS: Record<Run, { peak: number; spread: number; sizes: [string, string][] }> = {
  nike: { peak: 9.75, spread: 1.9, sizes: [["6", "38.5"], ["6.5", "39"], ["7", "40"], ["7.5", "40.5"], ["8", "41"], ["8.5", "42"], ["9", "42.5"], ["9.5", "43"],
    ["10", "44"], ["10.5", "44.5"], ["11", "45"], ["11.5", "45.5"], ["12", "46"], ["12.5", "47"], ["13", "47.5"], ["14", "48.5"]] },
  women: { peak: 7.75, spread: 1.5, sizes: [["5W", "35.5"], ["5.5W", "36"], ["6W", "36.5"], ["6.5W", "37.5"], ["7W", "38"], ["7.5W", "38.5"], ["8W", "39"],
    ["8.5W", "40"], ["9W", "40.5"], ["9.5W", "41"], ["10W", "42"], ["10.5W", "42.5"], ["11W", "43"], ["12W", "44"]] },
  gs: { peak: 5.5, spread: 1.2, sizes: [["3.5Y", "35.5"], ["4Y", "36"], ["4.5Y", "36.5"], ["5Y", "37.5"], ["5.5Y", "38"], ["6Y", "38.5"], ["6.5Y", "39"], ["7Y", "40"]] },
  adidas: { peak: 9, spread: 2.3, sizes: [["4", "36"], ["4.5", "36 2/3"], ["5", "37 1/3"], ["5.5", "38"], ["6", "38 2/3"], ["6.5", "39 1/3"], ["7", "40"],
    ["7.5", "40 2/3"], ["8", "41 1/3"], ["8.5", "42"], ["9", "42 2/3"], ["9.5", "43 1/3"], ["10", "44"], ["10.5", "44 2/3"], ["11", "45 1/3"], ["11.5", "46"],
    ["12", "46 2/3"], ["12.5", "47 1/3"], ["13", "48"]] },
  slide: { peak: 9.5, spread: 2, sizes: [["4", "36"], ["5", "37 1/3"], ["6", "38 2/3"], ["7", "40"], ["8", "41 1/3"], ["9", "42 2/3"], ["10", "44"], ["11", "45 1/3"],
    ["12", "46 2/3"], ["13", "48"]] },
  nb: { peak: 9.75, spread: 1.8, sizes: [["7", "40"], ["7.5", "40.5"], ["8", "41.5"], ["8.5", "42"], ["9", "42.5"], ["9.5", "43"], ["10", "44"], ["10.5", "44.5"],
    ["11", "45"], ["11.5", "45.5"], ["12", "46.5"], ["13", "47.5"]] },
};

// [name as StockX writes it, style code, colour, size run, how popular (1–5), first size of the run stocked]
const POOL: [string, string, string, Run, number, number?][] = [
  ["Jordan 4 Retro Bred Reimagined", "FV5029-006", "Black/Fire Red", "nike", 5, 2],
  ["Jordan 4 Retro Military Black", "DH6927-111", "White/Black", "nike", 4, 2],
  ["Jordan 4 Retro Red Cement", "DH6927-161", "White/Fire Red", "nike", 3, 2],
  ["Jordan 4 Retro Thunder (2023)", "DH6927-017", "Black/Tour Yellow", "nike", 3, 2],
  ["Jordan 4 Retro Midnight Navy", "DH6927-140", "White/Midnight Navy", "nike", 3, 2],
  ["Jordan 4 Retro Black Cat (2020)", "CU1110-010", "Black", "nike", 3, 2],
  ["Jordan 4 Retro White Oreo (2021)", "CT8527-100", "White/Tech Grey", "nike", 2, 2],
  ["Jordan 4 Retro SB Pine Green", "DR5415-103", "Sail/Pine Green", "nike", 3, 2],
  ["Jordan 4 Retro Black Canvas", "DH7138-006", "Black/Light Steel Grey", "nike", 2, 2],
  ["Jordan 4 Retro Bred (2019)", "308497-060", "Black/Cement Grey", "nike", 2, 2],
  ["Jordan 4 Retro Frozen Moments (Women's)", "AQ9129-001", "Light Iron Ore", "women", 2],
  ["Jordan 1 Retro High OG Chicago Lost and Found", "DZ5485-612", "Varsity Red/Sail", "nike", 4, 2],
  ["Jordan 1 Retro High OG Yellow Ochre", "DZ5485-701", "Yellow Ochre/Black", "nike", 2, 2],
  ["Jordan 1 Retro High OG Spider-Man Across the Spider-Verse", "DV1748-601", "University Red/Black", "nike", 2, 2],
  ["Jordan 1 Retro High OG Dark Mocha", "555088-105", "Sail/Dark Mocha", "nike", 3, 2],
  ["Jordan 1 Retro High OG Patent Bred", "555088-063", "Black/Varsity Red", "nike", 2, 2],
  ["Jordan 1 Retro High OG University Blue", "555088-134", "White/University Blue", "nike", 3, 2],
  ["Jordan 1 Retro High OG Heritage", "555088-161", "White/University Red", "nike", 2, 2],
  ["Jordan 1 Retro High OG SP Travis Scott Mocha", "CD4487-100", "Sail/Dark Mocha", "nike", 2, 2],
  ["Jordan 1 Retro Low OG SP Travis Scott Reverse Mocha", "DM7866-162", "Sail/Ridgerock", "nike", 4, 2],
  ["Jordan 3 Retro White Cement Reimagined", "DN3707-100", "Summit White/Fire Red", "nike", 3, 2],
  ["Jordan 3 Retro Black Cement (2018)", "854262-001", "Black/Cement Grey", "nike", 2, 2],
  ["Jordan 5 Retro Aqua", "DD0587-047", "Black/Aquatone", "nike", 2, 2],
  ["Jordan 6 Retro Toro Bravo", "CT8529-600", "University Red/Black", "nike", 2, 2],
  ["Jordan 11 Retro Cherry (2022)", "CT8012-116", "White/Varsity Red", "nike", 3, 2],
  ["Jordan 11 Retro DMP Gratitude (2023)", "CT8012-170", "White/Metallic Gold", "nike", 3, 2],
  ["Jordan 11 Retro Cool Grey (2021)", "CT8012-005", "Medium Grey/White", "nike", 2, 2],
  ["Jordan 12 Retro Cherry (2023)", "CT8013-116", "White/Varsity Red", "nike", 2, 2],
  ["Nike Dunk Low Retro White Black Panda", "DD1391-100", "White/Black", "nike", 5],
  ["Nike Dunk Low Grey Fog", "DD1391-103", "White/Grey Fog", "nike", 3],
  ["Nike Dunk Low UNC (2021)", "DD1391-102", "White/University Blue", "nike", 2],
  ["Nike Dunk Low Retro White Black (Women's)", "DD1503-101", "White/Black", "women", 3],
  ["Nike Dunk Low Retro White Black (GS)", "CW1590-100", "White/Black", "gs", 3],
  ["Nike SB Dunk Low Travis Scott", "CT5053-001", "Multi-Color/Black", "nike", 2, 2],
  ["Nike Air Force 1 Low '07 White", "CW2288-111", "White", "nike", 3],
  ["Nike Air Force 1 Low '07 Black", "CW2288-001", "Black", "nike", 2],
  ["Nike Air Force 1 Low Supreme White", "CU9225-100", "White", "nike", 2],
  ["Nike Air Max 1 '86 OG Big Bubble Sport Red", "DQ3989-100", "White/Sport Red", "nike", 2, 2],
  ["Nike Air Max 90 Infrared (2020)", "CT1685-100", "White/Radiant Red", "nike", 2, 2],
  ["Nike Air Max 97 Silver Bullet (2022)", "DM0028-002", "Metallic Silver/Varsity Red", "nike", 2, 2],
  ["Nike Air Max Plus Triple Black", "604133-050", "Black", "nike", 2, 2],
  ["Nike Kobe 6 Protro Grinch (2020)", "CW2190-300", "Green Apple/Volt", "nike", 3, 2],
  ["Nike Kobe 8 Protro Halo", "FJ9364-100", "White", "nike", 2, 2],
  ["adidas Samba OG Cloud White Core Black", "B75806", "Cloud White/Core Black", "adidas", 5],
  ["adidas Samba OG Core Black Gum", "B75807", "Core Black/Gum", "adidas", 3],
  ["adidas Campus 00s Core Black", "HQ8708", "Core Black/Cloud White", "adidas", 3],
  ["adidas Handball Spezial Navy Gum", "BD7633", "Collegiate Navy/Gum", "adidas", 3],
  ["adidas Yeezy Boost 350 V2 Onyx", "HQ4540", "Onyx", "adidas", 3, 3],
  ["adidas Yeezy Boost 350 V2 Bone", "HQ6316", "Bone", "adidas", 3, 3],
  ["adidas Yeezy Slide Onyx", "HQ6448", "Onyx", "slide", 3],
  ["adidas Yeezy Slide Bone", "FZ5897", "Bone", "slide", 2],
  ["adidas Yeezy Foam RNR Onyx", "HP8739", "Onyx", "slide", 2],
  ["New Balance 550 White Green", "BB550WT1", "White/Green", "nb", 3],
  ["New Balance 530 White Silver Navy", "MR530SG", "White/Silver", "nb", 3],
  ["New Balance 2002R Protection Pack Rain Cloud", "M2002RDA", "Rain Cloud", "nb", 3],
  ["New Balance 2002R Protection Pack Phantom", "M2002RDB", "Phantom", "nb", 2],
  ["New Balance 9060 Rain Cloud Grey", "U9060GRY", "Rain Cloud", "nb", 3],
  ["New Balance 990v6 Made in USA Grey", "M990GL6", "Grey", "nb", 2],
];

// StockX's product photos (checked to exist, 2026-09-30); the models without one have no photo, like some real products
const PHOTOS: Record<string, string> = {
  "FV5029-006": "Air-Jordan-4-Retro-Bred-Reimagined", "DH6927-111": "Air-Jordan-4-Retro-Military-Black", "DH6927-161": "Air-Jordan-4-Retro-Red-Cement",
  "DH6927-017": "Air-Jordan-4-Retro-Thunder-2023", "CU1110-010": "Air-Jordan-4-Retro-Black-Cat-2020", "CT8527-100": "Air-Jordan-4-Retro-White-Oreo-2021",
  "DR5415-103": "Air-Jordan-4-Retro-SB-Pine-Green", "DZ5485-701": "Air-Jordan-1-Retro-High-OG-Yellow-Ochre", "555088-134": "Air-Jordan-1-Retro-High-White-University-Blue-Black",
  "555088-161": "Air-Jordan-1-Retro-High-OG-Heritage", "CD4487-100": "Air-Jordan-1-Retro-High-Travis-Scott", "DN3707-100": "Air-Jordan-3-Retro-White-Cement-Reimagined",
  "854262-001": "Air-Jordan-3-Retro-Black-Cement-2018", "DD0587-047": "Air-Jordan-5-Retro-Aqua", "CT8529-600": "Air-Jordan-6-Retro-Toro-Bravo",
  "CT8012-116": "Air-Jordan-11-Retro-Cherry-2022", "CT8012-005": "Air-Jordan-11-Retro-Cool-Grey-2021", "CT8013-116": "Air-Jordan-12-Retro-Cherry-2023",
  "DD1391-100": "Nike-Dunk-Low-Retro-White-Black-2021", "DD1391-103": "Nike-Dunk-Low-Grey-Fog", "DD1391-102": "Nike-Dunk-Low-UNC-2021",
  "DD1503-101": "Nike-Dunk-Low-White-Black-2021-W", "CW1590-100": "Nike-Dunk-Low-Retro-White-Black-GS", "CT5053-001": "Nike-SB-Dunk-Low-Travis-Scott",
  "CU9225-100": "Nike-Air-Force-1-Low-Supreme-Box-Logo-White", "CT1685-100": "Nike-Air-Max-90-Infrared-2020", "604133-050": "Nike-Air-Max-Plus-Triple-Black",
  "CW2190-300": "Nike-Kobe-6-Protro-Grinch", "B75806": "adidas-Samba-OG-Cloud-White-Core-Black", "B75807": "adidas-Samba-OG-Core-Black-Gum",
  "HQ8708": "adidas-Campus-00s-Core-Black", "BD7633": "adidas-Handball-Spezial-Navy-Gum", "HQ4540": "adidas-Yeezy-Boost-350-V2-Onyx",
  "FZ5897": "adidas-Yeezy-Slide-Bone-2022", "HP8739": "adidas-Yeezy-Foam-RNNR-Onyx", "BB550WT1": "New-Balance-550-White-Green",
  "MR530SG": "New-Balance-530-White-Silver-Navy", "U9060GRY": "New-Balance-9060-Rain-Cloud-Grey", "M990GL6": "New-Balance-990v6-Grey",
};

type Size = { us: string; eu: string; w: number; code: string };
type Model = { name: string; alias: string; style: string; color: string; hype: number; sizes: Size[]; hay: string; image: string | null };

// how the demo shows an Alias (GOAT) product name: its URL slug made readable (lib/demo/shape.ts prettySlug), e.g.
// "Air Jordan 4 Retro Bred Reimagined", "Adidas Samba Og Cloud White Core Black", "Wmns Air Jordan 4 Retro Frozen Moments"
function aliasName(name: string): string {
  let n = name.replace(/^Jordan /, "Air Jordan ").replace(/\s*\(GS\)$/, " GS");
  if (/\(Women's\)$/.test(n)) n = `Wmns ${n.replace(/\s*\(Women's\)$/, "")}`;
  return n.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean).map((w) => (w === "x" ? w : w[0].toUpperCase() + w.slice(1))).join(" ");
}

const MODELS: Model[] = POOL.map(([name, style, color, run, hype, from = 0]) => {
  const r = RUNS[run];
  return {
    name, alias: aliasName(name), style, color, hype,
    sizes: r.sizes.slice(from).map(([us, eu]) => {
      const v = Number.parseFloat(us);
      // Picqer's product code is the style code and the EU size ("DD1391-100-42", "B75806-42 2/3")
      return { us, eu, w: Math.exp(-(((v - r.peak) / r.spread) ** 2)) + 0.06, code: `${style}-${eu}` };
    }),
    hay: `${name}\n${style}\n${style.replace(/-/g, " ")}`.toLowerCase(),
    image: PHOTOS[style] ? `https://images.stockx.com/images/${PHOTOS[style]}-Product.jpg` : null,
  };
});

/** Search like the API's (a regex of the already cleaned term): the term, as typed, in the product name or style. */
const words = (q?: string) => {
  const t = (q ?? "").toLowerCase().trim();
  return t ? [t] : [];
};
const matches = (hay: string, ws: string[]) => ws.every((w) => hay.includes(w));

/* ---------- time ---------- */

// Europe/Amsterdam: summer time from the last Sunday of March to the last Sunday of October (01:00 UTC)
function lastSunday(y: number, month: number): number {
  const last = new Date(Date.UTC(y, month + 1, 0));
  return Date.UTC(y, month, last.getUTCDate() - last.getUTCDay(), 1);
}
function tzOffset(t: number): number {
  const y = new Date(t).getUTCFullYear();
  return t >= lastSunday(y, 2) && t < lastSunday(y, 9) ? 2 : 1;
}
const dayOf = (t: number) => Math.floor((t - SAMPLE_START) / DAY);

// how a web store's orders spread over the (local) day: quiet at night, busy in the evening
const STORE_HOURS = cumsum([0.35, 0.2, 0.1, 0.05, 0.05, 0.08, 0.2, 0.45, 0.7, 0.85, 0.95, 1.05, 1.25, 1.2, 1.05, 1.05, 1.15, 1.3, 1.55, 1.95, 2.35, 2.45, 1.9, 1.0]);
// orders on a steady day, Monday to Sunday
const WEEKDAY_ORDERS = [9, 10, 10, 11, 11, 12, 13];
// the days of a week with a show (0 = Monday); each week takes one of these
const SHOW_WEEKS = [[1, 3, 6], [1, 4, 6], [0, 3, 5], [1, 3, 5, 6], [2, 4, 6], [1, 3, 4, 6], [0, 2, 4, 6], [1, 4, 5]];

/** a moment on UTC day `t0` at a local hour drawn from `hours` */
function localMoment(t0: number, off: number, hours: number[], u1: number, u2: number): number {
  const h = pick(hours, u1);
  return t0 + ((h - off + 24) % 24) * HOUR + Math.floor(u2 * HOUR);
}

/* ---------- row keys ---------- */

// A key looks exactly like a real row key (a 32-bit number in base 36, lib/demo/shape.ts rowId) but can be read back
// here: [kind 2 bits][slot 2][payload 20][check 8], shuffled by a 4-round Feistel permutation. The payload is day × 256 +
// index for sales and listings (days < 4096, i.e. until 2037; at most ~65 sales and ~140 listings a day), model × 64 + size
// for linked products. lib/demo/ak.ts tries its real keys first, and a
// key only opens a row that exists, so a real key that happens to decode opens nothing.
type Kind = "o" | "l" | "k"; // order, listing, linked product
const KINDS: Kind[] = ["o", "l", "k"];
const round = (x: number, r: number) => H("fk", r, x) & 0xffff;
function shuffle(v: number): number {
  let hi = v >>> 16;
  let lo = v & 0xffff;
  for (let r = 0; r < 4; r++) [hi, lo] = [lo, hi ^ round(lo, r)];
  return (hi * 65536 + lo) >>> 0;
}
function unshuffle(v: number): number {
  let hi = v >>> 16;
  let lo = v & 0xffff;
  for (let r = 3; r >= 0; r--) [hi, lo] = [lo ^ round(hi, r), hi];
  return (hi * 65536 + lo) >>> 0;
}
function keyOf(kind: Kind, slot: number, a: number, b: number): string {
  const payload = kind === "k" ? a * 64 + b : a * 256 + b;
  const head = (KINDS.indexOf(kind) * 4 + slot) * 1048576 + payload;
  return shuffle(head * 256 + (H("key", head) & 0xff)).toString(36);
}
function parseKey(key: string): { kind: Kind; slot: number; a: number; b: number } | null {
  if (!/^[0-9a-z]{1,7}$/.test(key)) return null;
  const v = Number.parseInt(key, 36);
  if (v > 0xffffffff || v.toString(36) !== key) return null;
  const raw = unshuffle(v);
  const head = Math.floor(raw / 256);
  if ((H("key", head) & 0xff) !== raw % 256) return null;
  const kind = KINDS[Math.floor(head / 4194304)];
  const slot = Math.floor(head / 1048576) % 4;
  const payload = head % 1048576;
  if (!kind) return null;
  return kind === "k" ? { kind, slot, a: Math.floor(payload / 64), b: payload % 64 } : { kind, slot, a: Math.floor(payload / 256), b: payload % 256 };
}
/** could this be a generated row's key (it still has to exist: see `product`) */
export const isSampleKey = (key: string) => parseKey(key) !== null;

/* ---------- the world ---------- */

export type Rhythm = "store" | "live";
/** A slot's rhythm: `rhythm` when the config sets one, else live selling when its role says "live", else a web store. */
export const rhythmOf = (c: Channel & { rhythm?: Rhythm }): Rhythm => c.rhythm ?? (/live/i.test(c.role) ? "live" : "store");

const PROFILE: Record<Rhythm, { link: number; lastPair: number; ship: number; shipH: [number, number]; word: string }> = {
  // share of the catalogue linked to it, sales that were the last pair, share shown as shipped (and after how long)
  store: { link: 0.7, lastPair: 0.12, ship: 0.22, shipH: [4, 10], word: "orders" },
  live: { link: 0.4, lastPair: 0.35, ship: 0.15, shipH: [20, 44], word: "sales" },
};

type Acct = { id: StoreId; label: string; platform: SellPlatform; sample: boolean; pct: number }; // sample: generated here
type Elig = { m: number; sizes: number[]; cum: number[] };
type RawOrder = { key: string; ai: number; m: number; si: number; soldAt: number; syncedAt: number; flag: 0 | 1 | 2; lastPair: boolean; cancelAt: number; shipAt: number; ref: string };
type RawListing = { key: string; ai: number; m: number; si: number; at: number };
type Day = { orders: RawOrder[]; listings: RawListing[] };
type Query = { now: number; platform?: string; store?: string; q?: string; offset?: number; limit?: number };

export type SampleWorld = ReturnType<typeof sampleWorld>;

/** The sample channels of `channels` (default: the demo's CHANNELS). Pass another list to see a flipped config. */
export function sampleWorld(channels: readonly Channel[] = CHANNELS) {
  const accts: Acct[] = [];
  let realN = 0;
  for (const c of channels) {
    c.accounts.forEach((a, i) => {
      // real accounts: how often a sample product is also linked there (StockX EU nearly always, the last Alias account half the time)
      const gen = !fromApi(c.id);
      const pct = gen ? PROFILE[rhythmOf(c)].link * (i === 0 ? 1 : 0.8) : Math.max(0.3, 0.95 - 0.12 * realN++);
      accts.push({ id: a.id as StoreId, label: a.label, platform: c.id, sample: gen, pct });
    });
  }
  const order = new Map(accts.map((a, i) => [a.id as string, i]));
  const sampleAccts = accts.filter((a) => a.sample);
  /** is this Picqer product code linked to this account (the same rule for sample and real products) */
  const linkedTo = (code: string, a: Acct) => U("link", a.id, code) < a.pct;
  const links: number[][][] = MODELS.map((mo) => mo.sizes.map((s) => accts.flatMap((a, ai) => (linkedTo(s.code, a) ? [ai] : []))));

  const chans = channels.filter((c) => !fromApi(c.id)).map((c, slot) => {
    const rhythm = rhythmOf(c);
    const own = accts.flatMap((a, ai) => (a.platform === c.id ? [ai] : []));
    const byAcct = new Map(own.map((ai) => {
      const of = (all: boolean): Elig[] => MODELS.flatMap((mo, m) => {
        const sizes = mo.sizes.flatMap((_, si) => (all || links[m][si].includes(ai) ? [si] : []));
        return sizes.length ? [{ m, sizes, cum: cumsum(sizes.map((si) => mo.sizes[si].w)) }] : [];
      });
      const linked = of(false);
      const elig = linked.length ? linked : of(true); // (a config linking nothing to it still sells something)
      return [ai, { elig, cum: cumsum(elig.map((e) => MODELS[e.m].hype)) }];
    }));
    return { c, slot, rhythm, prof: PROFILE[rhythm], own, byAcct, days: new Map<number, Day>(), before: [0] as number[] };
  });
  type Ch = (typeof chans)[number];
  const bySlot = (slot: number) => chans.find((ch) => ch.slot === slot) ?? null;

  /* ---- cadence: the sync picks orders up at the channel's interval, a few seconds past the boundary ---- */
  const runAt = (c: Channel, what: string, min: number, k: number) => k * min * MIN + 1200 + (H("run", c.id, what, k) % 7000);
  function lastRun(c: Channel, what: string, min: number, now: number): number {
    const k = Math.floor(now / (min * MIN));
    const t = runAt(c, what, min, k);
    return t <= now ? t : runAt(c, what, min, k - 1);
  }
  const every = (c: Channel) => (c.ordersMin > 0 ? c.ordersMin : 5);
  const syncOf = (c: Channel, soldAt: number) => runAt(c, "orders", every(c), Math.ceil((soldAt + 20_000) / (every(c) * MIN)));

  /* ---- one day of one channel ---- */
  const pickAcct = (ch: Ch, u: number) => (ch.own.length === 1 || u < 0.7 ? ch.own[0] : ch.own[1 + Math.floor(((u - 0.7) / 0.3) * (ch.own.length - 1))]);
  function pickProduct(ch: Ch, ai: number, u1: number, u2: number): [number, number] {
    const b = ch.byAcct.get(ai)!;
    const e = b.elig[pick(b.cum, u1)];
    return [e.m, e.sizes[pick(e.cum, u2)]];
  }
  const storeCount = (ch: Ch, d: number) => {
    const ramp = Math.min(1, 0.5 + d / 300); // a new store: half as busy in January, fully by June
    const n = Math.round(WEEKDAY_ORDERS[d % 7] * ramp) + (H(ch.c.id, "n", d) % 5) - 2;
    return clamp(n, ramp < 1 ? 3 : 8, 14);
  };
  /** orders on the days before `d` (web-store order numbers count up) */
  function ordersBefore(ch: Ch, d: number): number {
    while (ch.before.length <= d) ch.before.push(ch.before[ch.before.length - 1] + storeCount(ch, ch.before.length - 1));
    return ch.before[d];
  }

  function genDay(ch: Ch, d: number): Day {
    const id = ch.c.id;
    const t0 = SAMPLE_START + d * DAY;
    const off = tzOffset(t0 + 12 * HOUR);
    const drafts: { ai: number; m: number; si: number; soldAt: number }[] = [];
    const listings: RawListing[] = [];
    const list = (ai: number, m: number, si: number, at: number) => listings.push({ key: keyOf("l", ch.slot, d, listings.length), ai, m, si, at });
    const b = (ai: number) => ch.byAcct.get(ai)!;

    if (ch.rhythm === "store") {
      const n = storeCount(ch, d);
      for (let i = 0; i < n; i++) {
        const ai = pickAcct(ch, U(id, "a", d, i));
        const [m, si] = pickProduct(ch, ai, U(id, "m", d, i), U(id, "s", d, i));
        drafts.push({ ai, m, si, soldAt: localMoment(t0, off, STORE_HOURS, U(id, "h", d, i), U(id, "t", d, i)) });
      }
      // new stock goes online in a few batches during working hours: one model, its sizes a split second apart
      const batches = 3 + (H(id, "lb", d) % 3);
      for (let j = 0; j < batches; j++) {
        const ai = pickAcct(ch, U(id, "la", d, j));
        const e = b(ai).elig[pick(b(ai).cum, U(id, "lm", d, j))];
        const at = t0 + ((9 + (H(id, "lh", d, j) % 9) - off + 24) % 24) * HOUR + (H(id, "lt", d, j) % HOUR);
        const sizes = draw(e.sizes, () => 1, 5 + (H(id, "lk", d, j) % 7), `${id}|ls|${d}|${j}`);
        sizes.forEach((si, x) => list(ai, e.m, si, at - x * (110 + (H(id, "lx", d, j, x) % 150))));
      }
    } else {
      const pattern = SHOW_WEEKS[H(id, "week", Math.floor(d / 7)) % SHOW_WEEKS.length];
      if (pattern.includes(d % 7)) {
        // a show: 20–60 sales, a lineup of models dropped one after another, each drop selling 1–6 sizes within minutes
        const total = 20 + (H(id, "T", d) % 41);
        const start = t0 + ((19 * 60 + 30 * (H(id, "start", d) % 4) - off * 60 + 1440) % 1440) * MIN;
        const length = (95 + (H(id, "len", d) % 36)) * MIN;
        const ai = pickAcct(ch, U(id, "sa", d));
        const big = b(ai).elig.filter((e) => e.sizes.length >= 5);
        const cands = big.length >= 7 ? big : b(ai).elig;
        const lineup = draw(cands, (e) => MODELS[e.m].hype, clamp(Math.round(total / 3) + (H(id, "L", d) % 3) - 1, 7, 20), `${id}|lineup|${d}`);
        const caps = lineup.map((e) => Math.min(6, e.sizes.length));
        const sold = lineup.map(() => 1);
        const weight = lineup.map((_, j) => 1 + (H(id, "w", d, j) % 4));
        for (let r = sold.reduce((s, x) => s + x, 0), x = 0; r < total && x < 400; x++) {
          const open = lineup.map((_, j) => (sold[j] < caps[j] ? weight[j] : 0));
          if (!open.some((w) => w > 0)) break;
          sold[pick(cumsum(open), U(id, "k", d, x))]++;
          r++;
        }
        const prep = start - (150 + (H(id, "prep", d) % 120)) * MIN; // the lineup is listed in the afternoon
        const slotLen = length / lineup.length;
        lineup.forEach((e, j) => {
          const listed = draw(e.sizes, (si) => MODELS[e.m].sizes[si].w, Math.min(e.sizes.length, sold[j] + (H(id, "extra", d, j) % 2)), `${id}|drop|${d}|${j}`);
          const lat = prep + j * (2 + (H(id, "lp", d, j) % 5)) * MIN + (H(id, "lps", d, j) % MIN);
          listed.forEach((si, x) => list(ai, e.m, si, lat - x * (120 + (H(id, "lpx", d, j, x) % 200))));
          let t = start + Math.floor(j * slotLen) + (H(id, "drop", d, j) % 25_000) + 15_000;
          listed.slice(0, sold[j]).forEach((si, x) => {
            t += x === 0 ? 0 : (6 + (H(id, "gap", d, j, x) % 30)) * 1000 + (H(id, "ms", d, j, x) % 1000);
            drafts.push({ ai, m: e.m, si, soldAt: t });
          });
        });
      } else if (H(id, "bn", d) % 2 === 0) {
        // no show: now and then a few pairs listed to buy now
        const ai = pickAcct(ch, U(id, "la", d));
        const e = b(ai).elig[pick(b(ai).cum, U(id, "lm", d))];
        const at = t0 + ((11 + (H(id, "lh", d) % 6) - off + 24) % 24) * HOUR + (H(id, "lt", d) % HOUR);
        draw(e.sizes, () => 1, 3 + (H(id, "lk", d) % 3), `${id}|bn|${d}`).forEach((si, x) => list(ai, e.m, si, at - x * (130 + (H(id, "lx", d, x) % 150))));
      }
      // and a trickle of buy-now sales every day
      const trickle = [0, 0, 1, 1, 1, 2, 2, 3][H(id, "tr", d) % 8];
      for (let i = 0; i < trickle; i++) {
        const ai = pickAcct(ch, U(id, "ta", d, i));
        const [m, si] = pickProduct(ch, ai, U(id, "tm", d, i), U(id, "ts", d, i));
        drafts.push({ ai, m, si, soldAt: localMoment(t0, off, STORE_HOURS, U(id, "th", d, i), U(id, "tt", d, i)) });
      }
    }

    // what the sync did with each one; web-store order numbers count up through the day
    const rank = drafts.map((_, i) => i).sort((x, y) => drafts[x].soldAt - drafts[y].soldAt);
    const seq = ch.rhythm === "store" ? ordersBefore(ch, d) : 0;
    const orders: RawOrder[] = rank.map((i, r) => {
      const o = drafts[i];
      const u = U(id, "flag", d, i);
      const flag: RawOrder["flag"] = u < 0.025 ? 1 : u < 0.031 ? 2 : 0;
      const [lo, hi] = ch.prof.shipH;
      const ref = ch.rhythm === "store" ? String(1001 + seq + r) : String(H(id, "ref", d, i) % 1000).padStart(3, "0");
      const cancelAt = flag === 0 && U(id, "cx", d, i) < 0.02 ? o.soldAt + (1 + U(id, "cxt", d, i) * 19) * HOUR : 0;
      return {
        key: keyOf("o", ch.slot, d, i), ai: o.ai, m: o.m, si: o.si, soldAt: o.soldAt, syncedAt: syncOf(ch.c, o.soldAt), flag,
        lastPair: flag === 0 && U(id, "last", d, i) < ch.prof.lastPair,
        cancelAt,
        // a cancelled order never ships
        shipAt: !cancelAt && U(id, "ship", d, i) < ch.prof.ship ? o.soldAt + (lo + U(id, "sht", d, i) * (hi - lo)) * HOUR : Infinity,
        ref: `•••${ref.slice(-3)}`,
      };
    });
    orders.reverse();
    listings.sort((x, y) => y.at - x.at);
    return { orders, listings };
  }

  function day(ch: Ch, d: number): Day {
    let v = ch.days.get(d);
    if (!v) ch.days.set(d, (v = genDay(ch, d)));
    return v;
  }

  /* ---- rows as the pages show them ---- */
  const linkLabels = (m: number, si: number, except: number) => links[m][si].filter((x) => x !== except).map((x) => accts[x].label);

  function toSale(o: RawOrder, now: number): Sale {
    const a = accts[o.ai];
    const mo = MODELS[o.m];
    const cancelled = o.cancelAt > 0 && now >= o.cancelAt;
    const steps: Step[] = [];
    if (o.flag === 1) steps.push({ kind: "flag", text: "Not linked in Picqer yet, flagged" });
    else if (o.flag === 2) steps.push({ kind: "flag", text: "Picqer had 0 left, flagged" });
    else steps.push({ kind: "stock", text: "Picqer stock −1" });
    const pulled = o.lastPair ? linkLabels(o.m, o.si, o.ai) : [];
    if (pulled.length) steps.push({ kind: "pulled", text: `Last pair: pulled from ${join(pulled)}` });
    if (cancelled) steps.push({ kind: "restock", text: "Buyer cancelled, stock +1 back" });
    return {
      id: o.key, platform: a.platform, store: a.id, storeLabel: a.label, product: mo.name, style: mo.style, size: mo.sizes[o.si].us, ref: o.ref,
      state: cancelled ? "Cancelled" : now >= o.shipAt ? "Shipped" : "Sold",
      soldAt: iso(o.soldAt), syncedAt: iso(o.syncedAt), steps, detail: o.flag !== 1,
    };
  }
  const toListing = (l: RawListing): Listing => {
    const a = accts[l.ai];
    const mo = MODELS[l.m];
    return { id: l.key, platform: a.platform, store: a.id, storeLabel: a.label, product: mo.name, style: mo.style, size: mo.sizes[l.si].us, at: iso(l.at) };
  };

  /** the channels a query covers (none when it names a real platform or store) */
  function scope(q: Query): { chs: Ch[]; ai?: number } {
    if (q.store) {
      const ai = accts.findIndex((a) => a.id === q.store && a.sample);
      const ch = ai < 0 ? undefined : chans.find((x) => x.own.includes(ai));
      return ch ? { chs: [ch], ai } : { chs: [] };
    }
    if (q.platform) return { chs: chans.filter((x) => x.c.id === q.platform) };
    return { chs: chans };
  }

  /** newest first over every day since the start: the page asked for, and how many match in all */
  function scan<R extends { ai: number; m: number }>(q: Query, rows: (d: Day) => R[], time: (r: R) => number, seen: (r: R) => number) {
    const { chs, ai } = scope(q);
    const ws = words(q.q);
    const offset = q.offset ?? 0;
    const limit = q.limit ?? 20;
    const per: { r: R; t: number }[][] = [];
    let total = 0;
    for (const ch of chs) {
      const got: { r: R; t: number }[] = [];
      for (let d = dayOf(q.now); d >= 0; d--) {
        for (const r of rows(day(ch, d))) {
          if (seen(r) > q.now || (ai !== undefined && r.ai !== ai) || (ws.length && !matches(MODELS[r.m].hay, ws))) continue;
          total++;
          if (got.length < offset + limit) got.push({ r, t: time(r) });
        }
      }
      per.push(got);
    }
    const all = per.length === 1 ? per[0] : per.flat().sort((x, y) => y.t - x.t);
    return { rows: all.slice(offset, offset + limit).map((x) => x.r), total };
  }

  const orderScan = (q: Query) => scan(q, (d) => d.orders, (o) => o.soldAt, (o) => o.syncedAt);
  const listingScan = (q: Query) => scan(q, (d) => d.listings, (l) => l.at, (l) => l.at);

  /* ---- linked products: when each model's sizes were (re)linked, per account ---- */
  const CYCLE = 45 * DAY; // stock comes back, the sync links it again: every model within the last 45 days
  function linkAt(m: number, si: number, ai: number, now: number): number {
    const phase = H("relink", m) % CYCLE;
    const k = Math.max(0, Math.floor((now - 12 * HOUR - SAMPLE_START - phase) / CYCLE));
    // one pass per account; within it the sizes a split second apart, the smallest first
    return SAMPLE_START + phase + k * CYCLE + (H("pass", m, accts[ai].id) % (11 * HOUR)) + si * 210 + (H("gap", m, si, ai) % 150);
  }
  // as each platform writes a product: Alias (GOAT) spaces its style codes and names it by its slug
  const isAlias = (ai: number) => accts[ai].platform === "alias";
  const styleAt = (mo: Model, ai: number) => (isAlias(ai) ? mo.style.replace(/-/g, " ") : mo.style);
  function linkedRow(slot: number, m: number, si: number, now: number): Linked {
    const mo = MODELS[m];
    const s = mo.sizes[si];
    const ats = links[m][si].map((ai) => linkAt(m, si, ai, now));
    return {
      // the real rows only have a name when an Alias link gives one (lib/demo/shape.ts linkedOf)
      id: keyOf("k", slot, m, si), code: s.code, name: links[m][si].some(isAlias) ? mo.alias : "", color: mo.color, us: s.us, eu: s.eu,
      links: links[m][si].map((ai) => ({ store: accts[ai].id, storeLabel: accts[ai].label, platform: accts[ai].platform, style: styleAt(mo, ai), size: s.us })),
      linkedAt: ats.length ? iso(Math.max(...ats)) : null,
      detail: true,
    };
  }

  // a real product's style for its sample links: the dashed one (StockX's), else the code without its EU size
  const styleOf = (code: string, styles: string[]) =>
    styles.find((s) => s && !/\s/.test(s)) ?? styles.find(Boolean)?.replace(/\s+/g, "-") ?? code.replace(/-[\d.]+( \d\/\d)?$/, "");
  /** when a real product's sample links were made: a few seconds after its last real link */
  const sampleAt = (code: string, a: Acct, last: number) => last + 2000 + (H("at", a.id, code) % 38_000);
  const byStore = <T extends { store: StoreId }>(xs: T[]) => xs.sort((x, y) => (order.get(x.store) ?? 99) - (order.get(y.store) ?? 99));

  /* ---- a product's drawer ---- */
  function stockOf(code: string) {
    const total = [1, 1, 1, 2, 2, 2, 3, 3, 4, 5, 6][H("stock", code) % 11];
    const reserved = H("res", code) % 5 === 0 ? 1 : 0;
    return { free: Math.max(1, total - reserved), total: Math.max(total, reserved + 1), reserved };
  }
  function productOfSample(m: number, si: number, now: number, sale?: RawOrder): Product {
    const mo = MODELS[m];
    const s = mo.sizes[si];
    let stock = stockOf(s.code);
    if (sale?.flag === 2) stock = { free: 0, total: 0, reserved: 0 }; // sold with none left: flagged
    else if (sale?.lastPair) {
      const state = toSale(sale, now).state;
      stock = state === "Cancelled" ? { free: 1, total: 1, reserved: 0 } : state === "Shipped" ? { free: 0, total: 0, reserved: 0 } : { free: 0, total: 1, reserved: 1 };
    }
    const ls = links[m][si].map((ai) => ({ store: accts[ai].id, storeLabel: accts[ai].label, platform: accts[ai].platform, name: isAlias(ai) ? mo.alias : mo.name,
      style: styleAt(mo, ai), size: s.us, at: iso(linkAt(m, si, ai, now)) }));
    // listings on the real Alias accounts it is linked to (they come down when the size sells out)
    const aliasListings = stock.free > 0
      ? links[m][si].filter((ai) => accts[ai].platform === "alias").map((ai) => ({ storeLabel: accts[ai].label, count: 1 + (H("al", s.code, ai) % Math.min(3, stock.free)) }))
      : [];
    // the photo job (every 6 hours, just past the hour) adds it on its first run after the product was linked
    const first = Math.min(...links[m][si].map((ai) => linkAt(m, si, ai, now)));
    const run = Math.ceil(first / (6 * HOUR)) * 6 * HOUR + 5000 + (H("photo", s.code) % 62_000);
    const photo = mo.image && Number.isFinite(first) && run <= now ? run : null;
    return { name: mo.name, code: s.code, color: mo.color, us: s.us, eu: s.eu, image: photo ? mo.image : null, photoAt: photo ? iso(photo) : null, stock, links: ls, aliasListings };
  }

  /* ---- automations ---- */
  function jobs(now: number): Job[] {
    const orders: Job[] = [];
    const stock: Job[] = [];
    for (const ch of chans) {
      const c = ch.c;
      orders.push({ key: `${c.id}-orders`, name: `${c.name} ${ch.prof.word} into Picqer`, platform: c.id, every: c.ordersEvery, lastRun: iso(lastRun(c, "orders", every(c), now)), status: "ok" });
      stock.push({ key: `${c.id}-stock`, name: `Stock pushed to ${c.name}`, platform: c.id, every: "every 5 min", lastRun: iso(lastRun(c, "stock", 5, now)), status: "ok" });
    }
    return [...orders, ...stock];
  }

  return {
    /** the sample channels, in config order */
    channels: chans.map((ch) => ch.c),
    /** a generated platform id ("shopify") */
    isPlatform: (p: unknown) => chans.some((ch) => ch.c.id === p),
    /** a generated store id ("sh-main") */
    isStore: (s: unknown) => sampleAccts.some((a) => a.id === s),

    /** Sales, newest first: all sample channels, or one `platform` / `store`; `q` searches product and style. */
    sales(q: Query): { rows: Sale[]; total: number } {
      const r = orderScan(q);
      return { rows: r.rows.map((o) => toSale(o, q.now)), total: r.total };
    },

    /** What is listed on the sample channels, newest first (a web store's new stock, a show's lineup). */
    listings(q: Query): { rows: Listing[]; total: number } {
      const r = listingScan(q);
      return { rows: r.rows.map(toListing), total: r.total };
    },

    /** The linked-products tab of a sample store: the Picqer products linked to it, newest link first. */
    linked(q: { now: number; store: string; q?: string; page: number; per: number }): Page<Linked> {
      const ai = accts.findIndex((a) => a.id === q.store && a.sample);
      const ch = chans.find((x) => x.own.includes(ai));
      const ws = words(q.q);
      const rows: { m: number; si: number; at: number }[] = [];
      if (ch) {
        MODELS.forEach((mo, m) => mo.sizes.forEach((s, si) => {
          if (links[m][si].includes(ai) && (!ws.length || matches(`${mo.hay}\n${mo.alias.toLowerCase()}\n${s.code.toLowerCase()}`, ws))) rows.push({ m, si, at: Math.max(...links[m][si].map((x) => linkAt(m, si, x, q.now))) });
        }));
      }
      rows.sort((x, y) => y.at - x.at || x.m - y.m || y.si - x.si);
      const page = rows.slice(q.per * (q.page - 1), q.per * q.page).map((r) => linkedRow(ch!.slot, r.m, r.si, q.now));
      return { rows: page, total: rows.length, page: q.page, pages: Math.max(1, Math.ceil(rows.length / q.per)) };
    },

    /** The drawer for a sample row's key (a sale, a listing or a linked product); null for any other key. */
    product(key: string, now: number): Product | null {
      const k = parseKey(key);
      const ch = k && bySlot(k.slot);
      if (!k || !ch) return null;
      if (k.kind === "k") return MODELS[k.a]?.sizes[k.b] ? productOfSample(k.a, k.b, now) : null;
      if (k.a > dayOf(now)) return null;
      const d = day(ch, k.a);
      if (k.kind === "l") {
        const l = d.listings.find((x) => x.key === key);
        return l && l.at <= now ? productOfSample(l.m, l.si, now) : null;
      }
      const o = d.orders.find((x) => x.key === key);
      return o && o.syncedAt <= now && o.flag !== 1 ? productOfSample(o.m, o.si, now, o) : null;
    },

    /** A real linked row with the sample channels its product code is linked to (the same rule as its drawer). */
    withLinks(row: Linked): Linked {
      const add = row.code ? sampleAccts.filter((a) => linkedTo(row.code, a)) : [];
      if (!add.length) return row;
      const style = styleOf(row.code, row.links.map((l) => l.style));
      const size = row.us || row.links[0]?.size || "";
      const last = row.linkedAt ? Date.parse(row.linkedAt) : NaN;
      const at = Number.isFinite(last) ? Math.max(...add.map((a) => sampleAt(row.code, a, last))) : NaN;
      return {
        ...row,
        links: byStore([...row.links, ...add.map((a) => ({ store: a.id, storeLabel: a.label, platform: a.platform, style, size }))]),
        linkedAt: Number.isFinite(at) ? iso(at) : row.linkedAt,
      };
    },

    /** A real product's drawer with its sample links (by product code, as on the linked-products page). */
    withProductLinks(p: Product): Product {
      const add = p.code ? sampleAccts.filter((a) => linkedTo(p.code, a)) : [];
      if (!add.length) return p;
      const style = styleOf(p.code, p.links.map((l) => l.style));
      const size = p.us || p.links[0]?.size || "";
      const name = p.links.find((l) => l.name)?.name || p.name;
      const ats = p.links.map((l) => (l.at ? Date.parse(l.at) : NaN)).filter(Number.isFinite);
      const last = ats.length ? Math.max(...ats) : NaN;
      return {
        ...p,
        links: byStore([...p.links, ...add.map((a) => ({ store: a.id, storeLabel: a.label, platform: a.platform, name, style, size, at: Number.isFinite(last) ? iso(sampleAt(p.code, a, last)) : null }))]),
      };
    },

    jobs,

    /** The overview with the sample channels in: their counts, their newest sales in the feed, their automations and cards. */
    overview(o: Overview, now: number): Overview {
      const sales24h = { ...o.kpis.sales24h };
      const salesTotal = { ...o.kpis.salesTotal };
      const listings = { ...o.kpis.listings };
      const feed = [...o.feed];
      for (const ch of chans) {
        const r = orderScan({ now, platform: ch.c.id, limit: 12 });
        salesTotal[ch.c.id] = r.total;
        let n = 0;
        for (const d of [dayOf(now), dayOf(now) - 1]) {
          if (d >= 0) n += day(ch, d).orders.filter((x) => x.syncedAt <= now && x.soldAt > now - DAY).length;
        }
        sales24h[ch.c.id] = n;
        listings[ch.c.id] = listingScan({ now, platform: ch.c.id, limit: 0 }).total;
        feed.push(...r.rows.map((x) => toSale(x, now)));
      }
      feed.sort((a, b) => (b.soldAt ?? "").localeCompare(a.soldAt ?? ""));
      const top = feed.slice(0, 12);
      // the sample channels' order jobs follow the real order jobs; their stock jobs come last
      const js = jobs(now);
      const real = [...o.jobs];
      let at = 0;
      real.forEach((j, i) => { if (j.key.endsWith("-orders")) at = i + 1; });
      const merged = [...real.slice(0, at), ...js.filter((j) => j.key.endsWith("-orders")), ...real.slice(at), ...js.filter((j) => !j.key.endsWith("-orders"))];
      return {
        ...o,
        kpis: {
          ...o.kpis, sales24h, salesTotal, listings, lastSale: top[0] ?? null,
          jobs: { ok: merged.filter((j) => j.status === "ok" || j.status === "running").length, total: merged.length },
        },
        connections: connectionsOf(merged, channels),
        jobs: merged,
        feed: top,
      };
    },
  };
}

/** The demo's sample channels (lib/demo/channels.ts). */
export const SAMPLE = sampleWorld();

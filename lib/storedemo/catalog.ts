// The boutique demo's catalogue, generated (user decision 2026-10-11: no client data, no third-party store's catalogue):
// about 160 pieces of a US women's boutique (dresses, tops, sweaters, cardigans, denim, skirts, pants, matching sets,
// jackets and accessories) with invented titles and labels, colours, a size run per piece, prices and markdowns, and a
// picture drawn by lib/storedemo/art.ts. It has the same shape the engine reads (lib/storedemo/types.ts Catalog).
//
// Time-based and pure, like the engine around it (lib/storedemo/engine.ts): new pieces come out in drops (the config's
// drop days, mid-morning shop time, a few minutes apart), sizes sell out as pieces age, old pieces are marked down, and
// the best-seller list is re-ranked every Monday. Everything follows from (config, the shop's local day) through a hash,
// so every visitor on the same day gets the same catalogue. It changes only at the shop's midnight and already holds
// the pieces that come out later that day: the engine shows a piece from its publish time on, and the orders around the
// catalogue stay the same all day instead of shifting with every new piece.
// No "@/" imports: node --test loads it.
import { garmentArt, type Kind, type Shape } from "./art.ts";
import type { Catalog, DemoConfig, Product, Variant } from "./types.ts";

const MIN = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;
/** day numbers count days since 1970-01-01 on the shop's wall clock; drops are counted from Monday 1 January 2024 */
const EPOCH = Date.UTC(2024, 0, 1) / DAY;
/** a drop goes up at 10:30 shop time, one piece every few minutes */
const DROP_MINUTE = 10 * 60 + 30;
/** no size sells out in a piece's first 21 days: the engine dates a sold-out size's last sale up to 19.5 days after the
 * piece came out, so that sale has always happened by the time the size shows as sold out */
const SELL_FROM = 21;
/** days over which a piece sells through, once it can */
const SELL_SPAN = 40;
const MARKDOWN_AFTER = 42;
/** best sellers: pieces out between 10 and 150 days at the start of the week */
const BEST_FROM = 10;
const BEST_TO = 150;

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

/* ---------- what the boutique sells ---------- */

type KindDef = { kind: Kind; category: string; w: number; fall: number; spring: number };
// share of the drops, and how the season moves it (fall and winter drops from August, spring and summer from February)
const KINDS: KindDef[] = [
  { kind: "top", category: "Tops", w: 23, fall: 0.95, spring: 1.1 },
  { kind: "dress", category: "Dresses", w: 17, fall: 1.05, spring: 1.25 },
  { kind: "sweater", category: "Sweaters", w: 8, fall: 1.6, spring: 0.35 },
  { kind: "cardigan", category: "Cardigans", w: 5, fall: 1.7, spring: 0.6 },
  { kind: "jeans", category: "Denim", w: 8, fall: 1, spring: 1 },
  { kind: "skirt", category: "Skirts", w: 6, fall: 0.9, spring: 1.2 },
  { kind: "pants", category: "Pants", w: 7, fall: 1.1, spring: 0.9 },
  { kind: "set", category: "Sets", w: 7, fall: 0.8, spring: 1.3 },
  { kind: "jacket", category: "Jackets", w: 6, fall: 1.8, spring: 0.5 },
  { kind: "belt", category: "Accessories", w: 3, fall: 1, spring: 1 },
  { kind: "hat", category: "Accessories", w: 3, fall: 1.1, spring: 1.1 },
  { kind: "bag", category: "Accessories", w: 4, fall: 1, spring: 1 },
  { kind: "scarf", category: "Accessories", w: 3, fall: 1.6, spring: 0.2 },
];
const ACCESSORY = new Set<Kind>(["belt", "hat", "bag", "scarf"]);

// The first word of a title, boutique style: a name or a place. No colour words (the colour is its own field) and none
// of the labels below. A piece's name is NAMES[(n × 41) mod length]: two pieces share a name only when their numbers
// are a whole number of rounds apart, and then they get a different detail (see productOf), so titles never repeat.
const NAMES = [
  "Marlowe", "Juniper", "Sutton", "Harlow", "Everly", "Sloane", "Wren", "Delphine", "Tallulah", "Rosalie", "Briar", "Calla",
  "Odette", "Margot", "Imogen", "Celia", "Josie", "Lainey", "Maren", "Nora", "Penny", "Quinn", "Rhea", "Sadie", "Tessa",
  "Vivian", "Willa", "Ada", "Blair", "Cora", "Daisy", "Elodie", "Faye", "Georgia", "Hattie", "Ivy", "Juliet", "Kit",
  "Lottie", "Mae", "Nell", "Opal", "Poppy", "Stella", "Thea", "Vera", "Winnie", "Greer", "Hollis", "Lucia", "Mirabel",
  "Noelle", "Paloma", "Romy", "Selah", "Tilda", "Esme", "Frankie", "Goldie", "Iris", "June", "Louisa", "Maisie", "Nina",
  "Saddle Creek", "Sunset Ridge", "Blue Bonnet", "Prairie Rose", "Magnolia Lane", "Willow Bend", "Laurel Grove",
  "Pecan Grove", "Silver Lake", "Honey Creek", "Red Rock", "Sweetwater", "Canyon Road", "Golden Hour", "Sunday Market",
  "Back Porch", "Harvest Moon", "Wildflower", "Desert Bloom", "Main Street", "County Fair", "Fireside", "First Frost",
  "Cider Mill", "Lazy Sunday", "Palm Springs", "Marfa", "Big Sky", "Bluebell", "Meadowlark", "Hill Country", "River Bend",
  "Tumbleweed", "Starlight", "Late Bloom", "Sugar Pine", "Orchard Row", "Coastline", "Daydream", "Little Creek",
];

// Per kind: a detail and the nouns it goes with, and how that cuts in the picture. At least 8 details each (see NAMES).
type Detail = [string, string[], Shape?];
const DETAILS: Record<Kind, Detail[]> = {
  dress: [
    ["Ribbed Knit", ["Midi Dress", "Maxi Dress"], { sleeve: "none" }],
    ["Smocked", ["Mini Dress", "Midi Dress"], { sleeve: "short" }],
    ["Satin Slip", ["Midi Dress", "Mini Dress"], { sleeve: "none" }],
    ["Tiered", ["Maxi Dress", "Midi Dress"], { sleeve: "short", tiers: true }],
    ["Puff Sleeve", ["Mini Dress", "Midi Dress"], { sleeve: "short" }],
    ["Wrap", ["Midi Dress", "Mini Dress"], { sleeve: "long" }],
    ["Sweater", ["Mini Dress", "Midi Dress"], { sleeve: "long" }],
    ["Button Front", ["Midi Dress", "Mini Dress"], { sleeve: "short", placket: true }],
    ["Ruffle Hem", ["Mini Dress", "Maxi Dress"], { sleeve: "none" }],
    ["Square Neck", ["Midi Dress", "Mini Dress"], { sleeve: "long" }],
    ["Linen Blend", ["Maxi Dress", "Midi Dress"], { sleeve: "none" }],
    ["Pleated", ["Midi Dress", "Maxi Dress"], { sleeve: "long", tiers: true }],
  ],
  top: [
    ["Waffle Knit", ["Top", "Henley"]],
    ["Ribbed", ["Tank", "Long Sleeve Top"]],
    ["Satin", ["Cami", "Blouse"]],
    ["Eyelet", ["Top", "Blouse"], { sleeve: "short" }],
    ["Puff Sleeve", ["Top", "Blouse"], { sleeve: "short" }],
    ["Lace Trim", ["Cami", "Tank"]],
    ["Button Down", ["Shirt", "Blouse"], { placket: true }],
    ["Smocked", ["Top", "Blouse"]],
    ["Ruffle Collar", ["Blouse", "Top"]],
    ["Square Neck", ["Top", "Tee"]],
    ["Thermal", ["Henley", "Top"]],
    ["Mock Neck", ["Top", "Long Sleeve Top"]],
    ["Pocket", ["Tee"]],
    ["Gauze", ["Top", "Blouse"]],
  ],
  sweater: [
    ["Cable Knit", ["Sweater"]],
    ["Chunky Knit", ["Sweater", "Pullover"]],
    ["Waffle Knit", ["Sweater"]],
    ["Fuzzy", ["Sweater", "Pullover"]],
    ["Mock Neck", ["Sweater"], { neck: "turtle" }],
    ["Turtleneck", ["Sweater"], { neck: "turtle" }],
    ["Fair Isle", ["Sweater"]],
    ["Oversized", ["Sweater", "Pullover"]],
    ["V Neck", ["Sweater"], { neck: "v" }],
    ["Crew Neck", ["Sweater", "Pullover"]],
    ["Cropped", ["Sweater"]],
    ["Balloon Sleeve", ["Sweater"]],
  ],
  cardigan: [
    ["Chunky Knit", ["Cardigan"]],
    ["Cable Knit", ["Cardigan"]],
    ["Cropped", ["Cardigan"]],
    ["Pointelle", ["Cardigan"]],
    ["Fuzzy", ["Cardigan"]],
    ["Longline", ["Cardigan"]],
    ["Ribbed", ["Cardigan"]],
    ["Oversized", ["Cardigan"]],
    ["Pocket", ["Cardigan"]],
    ["Brushed", ["Cardigan"]],
  ],
  jeans: [
    ["High Rise Straight Leg", ["Jeans"], { leg: "straight" }],
    ["Wide Leg", ["Jeans"], { leg: "wide" }],
    ["Distressed Flare", ["Jeans"], { leg: "flare" }],
    ["Relaxed", ["Jeans"], { leg: "wide" }],
    ["Mid Rise Skinny", ["Jeans"], { leg: "straight" }],
    ["Vintage Bootcut", ["Jeans"], { leg: "flare" }],
    ["Barrel Leg", ["Jeans"], { leg: "wide" }],
    ["Cropped Straight", ["Jeans"], { leg: "straight" }],
    ["Raw Hem Straight", ["Jeans"], { leg: "straight" }],
    ["Super High Rise Flare", ["Jeans"], { leg: "flare" }],
  ],
  skirt: [
    ["Satin Slip", ["Midi Skirt"]],
    ["Pleated", ["Midi Skirt", "Mini Skirt"]],
    ["Tiered", ["Maxi Skirt", "Midi Skirt"], { tiers: true }],
    ["Suede", ["Mini Skirt", "Midi Skirt"]],
    ["Wrap", ["Midi Skirt", "Mini Skirt"]],
    ["Faux Leather", ["Mini Skirt", "Midi Skirt"]],
    ["Knit", ["Midi Skirt", "Maxi Skirt"]],
    ["Ruffle", ["Mini Skirt"], { tiers: true }],
    ["Bias Cut", ["Midi Skirt", "Maxi Skirt"]],
    ["Button Front", ["Mini Skirt", "Midi Skirt"]],
  ],
  pants: [
    ["Wide Leg", ["Pants", "Trousers"], { leg: "wide" }],
    ["Pleated", ["Trousers"], { leg: "wide" }],
    ["Cargo", ["Pants"], { leg: "wide" }],
    ["Linen", ["Pants"], { leg: "wide" }],
    ["Flare", ["Pants"], { leg: "flare" }],
    ["Faux Leather", ["Pants"], { leg: "straight" }],
    ["Straight Leg", ["Trousers", "Pants"], { leg: "straight" }],
    ["Ribbed Knit", ["Pants"], { leg: "flare" }],
    ["Palazzo", ["Pants"], { leg: "wide" }],
    ["Corduroy", ["Pants"], { leg: "straight" }],
    ["Barrel Leg", ["Pants"], { leg: "wide" }],
  ],
  set: [
    ["Ribbed Knit", ["Two Piece Set", "Pant Set"]],
    ["Waffle Knit", ["Lounge Set", "Two Piece Set"]],
    ["Linen", ["Short Set", "Pant Set"]],
    ["Satin", ["Skirt Set", "Pant Set"]],
    ["Sweater", ["Two Piece Set", "Skirt Set"]],
    ["Smocked", ["Short Set", "Skirt Set"]],
    ["Gauze", ["Short Set", "Pant Set"]],
    ["Terry", ["Short Set", "Two Piece Set"]],
    ["Pleated", ["Skirt Set"]],
    ["Crochet", ["Skirt Set", "Short Set"]],
  ],
  jacket: [
    ["Suede Fringe", ["Jacket"], { fringe: true }],
    ["Faux Leather Moto", ["Jacket"]],
    ["Quilted", ["Jacket"]],
    ["Corduroy", ["Shacket", "Jacket"]],
    ["Sherpa", ["Jacket"]],
    ["Wool Blend", ["Coat", "Shacket"]],
    ["Oversized", ["Blazer"]],
    ["Utility", ["Jacket"]],
    ["Cropped", ["Trench", "Blazer"]],
    ["Teddy", ["Coat"]],
    ["Suede", ["Shacket", "Jacket"]],
  ],
  belt: [
    ["Tooled Leather", ["Belt"]],
    ["Braided Leather", ["Belt"]],
    ["Western Buckle", ["Belt"]],
    ["Chain Link", ["Belt"]],
    ["Suede Wrap", ["Belt"]],
    ["Concho", ["Belt"]],
    ["Skinny Leather", ["Belt"]],
    ["Woven", ["Belt"]],
  ],
  hat: [
    ["Felt", ["Rancher Hat", "Fedora"]],
    ["Wide Brim", ["Felt Hat", "Sun Hat"]],
    ["Straw", ["Panama Hat", "Cowboy Hat", "Sun Hat"]],
    ["Wool", ["Fedora", "Rancher Hat"]],
    ["Suede", ["Cowboy Hat"]],
    ["Packable", ["Sun Hat"]],
    ["Flat Brim", ["Wool Hat", "Felt Hat"]],
    ["Braided Band", ["Rancher Hat", "Fedora"]],
  ],
  bag: [
    ["Woven", ["Tote", "Shoulder Bag"]],
    ["Quilted", ["Crossbody", "Shoulder Bag"]],
    ["Fringe", ["Crossbody"], { fringe: true }],
    ["Croc Embossed", ["Shoulder Bag", "Clutch"]],
    ["Slouchy", ["Hobo Bag"]],
    ["Suede", ["Tote", "Crossbody"]],
    ["Mini", ["Bucket Bag", "Crossbody"]],
    ["Structured", ["Tote", "Satchel"]],
    ["Beaded", ["Clutch"]],
  ],
  scarf: [
    ["Blanket", ["Scarf"]],
    ["Fringe", ["Scarf"]],
    ["Brushed Knit", ["Scarf"]],
    ["Silk", ["Square Scarf", "Neck Scarf"]],
    ["Oversized", ["Scarf", "Wrap"]],
    ["Gauze", ["Scarf"]],
    ["Waffle Knit", ["Scarf"]],
    ["Cashmere Blend", ["Scarf", "Wrap"]],
    ["Ribbed", ["Infinity Scarf"]],
  ],
};

/** what the noun says about the cut (length, sleeves, the bottom of a set, the kind of bag) */
function nounShape(noun: string): Shape {
  const s: Shape = {};
  if (/Mini/.test(noun)) s.length = "mini";
  else if (/Midi/.test(noun)) s.length = "midi";
  else if (/Maxi/.test(noun)) s.length = "maxi";
  if (/Tank|Cami/.test(noun)) s.sleeve = "none";
  else if (/Tee/.test(noun)) s.sleeve = "short";
  else if (/Long Sleeve|Henley|Shirt|Blouse|Top/.test(noun)) s.sleeve = "long";
  if (/Henley/.test(noun)) s.placket = true;
  if (/Short Set/.test(noun)) s.bottom = "shorts";
  else if (/Skirt Set/.test(noun)) s.bottom = "skirt";
  if (/Tote|Satchel|Bucket|Hobo/.test(noun)) s.bag = "tote";
  else if (/Clutch/.test(noun)) s.bag = "clutch";
  else if (/Crossbody|Shoulder/.test(noun)) s.bag = "crossbody";
  return s;
}

// Invented labels (checked 2026-10-11: no clothing brand by these names shows up in a web search), a few carried
// across several kinds, the way a boutique buys from a handful of wholesale labels.
const LABELS: { name: string; kinds: Kind[]; w: number }[] = [
  { name: "Calloway Row", kinds: ["dress", "skirt", "top"], w: 1.3 },
  { name: "Tamsin Rowe", kinds: ["dress", "top", "set", "skirt"], w: 1.2 },
  { name: "Hazelmere", kinds: ["sweater", "cardigan", "scarf", "top"], w: 1.1 },
  { name: "Odessa Moon", kinds: ["set", "pants", "top", "dress", "sweater", "cardigan"], w: 1 },
  { name: "Ashby Kate", kinds: ["pants", "skirt", "jacket", "top"], w: 0.9 },
  { name: "Mabry Denim", kinds: ["jeans", "jacket"], w: 1 },
  { name: "Copper Fawn", kinds: ["jacket", "hat", "belt", "top"], w: 0.7 },
  { name: "Sorrel Supply Co.", kinds: ["belt", "hat", "bag", "scarf"], w: 1 },
];

// Colours per kind (names of lib/storedemo/art.ts SHADES).
const PALETTES: Record<Kind, string[]> = {
  dress: ["Black", "Ivory", "Sage", "Dusty Blue", "Burgundy", "Rust", "Olive", "Mocha", "Blush", "Emerald", "Navy", "Plum", "Mustard", "Lavender", "Wine", "Dusty Rose", "Black Floral", "Ivory Floral", "Blue Floral", "Rust Floral", "Sage Floral", "Leopard"],
  top: ["White", "Ivory", "Black", "Taupe", "Mocha", "Sage", "Rust", "Blush", "Dusty Blue", "Burgundy", "Charcoal", "Heather Grey", "Mustard", "Coral", "Cream", "Olive", "Lavender", "Butter", "Pink", "Navy Stripe", "Black Stripe", "Leopard"],
  sweater: ["Oatmeal", "Cream", "Camel", "Mocha", "Charcoal", "Heather Grey", "Rust", "Olive", "Burgundy", "Sage", "Dusty Blue", "Black", "Ivory", "Hunter Green", "Mauve", "Chocolate", "Butter", "Lavender"],
  cardigan: ["Oatmeal", "Cream", "Camel", "Mocha", "Charcoal", "Heather Grey", "Rust", "Olive", "Burgundy", "Sage", "Black", "Ivory", "Hunter Green", "Mauve", "Chocolate", "Butter", "Lavender"],
  jeans: ["Light Wash", "Medium Wash", "Vintage Wash", "Dark Wash", "Black Wash", "White"],
  skirt: ["Black", "Mocha", "Olive", "Burgundy", "Cream", "Camel", "Sage", "Emerald", "Chocolate", "Dusty Blue", "Butter", "Blush", "Brown Plaid", "Leopard", "Ivory Floral", "Black Floral"],
  pants: ["Black", "Cream", "Camel", "Olive", "Charcoal", "Mocha", "Taupe", "Navy", "Chocolate", "Sage", "Khaki", "Ivory", "Grey Plaid", "Brown Plaid"],
  set: ["Sage", "Mocha", "Oatmeal", "Black", "Heather Grey", "Dusty Blue", "Blush", "Rust", "Lavender", "Olive", "Cream", "Butter", "Navy Stripe", "Blue Gingham"],
  jacket: ["Camel", "Cognac", "Black", "Chocolate", "Olive", "Cream", "Tan", "Charcoal", "Mocha", "Rust", "Ivory", "Brown Plaid", "Grey Plaid"],
  belt: ["Black", "Cognac", "Tan", "Brown", "Chocolate", "Ivory"],
  hat: ["Black", "Camel", "Cream", "Chocolate", "Natural", "Olive", "Ivory", "Tan", "Burgundy"],
  bag: ["Black", "Cognac", "Tan", "Cream", "Chocolate", "Natural", "Taupe", "Olive", "Burgundy", "Leopard"],
  scarf: ["Oatmeal", "Cream", "Rust", "Mocha", "Black", "Sage", "Burgundy", "Camel", "Brown Plaid", "Grey Plaid", "Red Plaid", "Leopard"],
};
// colours that sell in fall and winter, and the ones that sell in spring and summer (the rest all year)
const WARM = new Set(["Rust", "Burnt Orange", "Mustard", "Burgundy", "Wine", "Plum", "Olive", "Hunter Green", "Emerald", "Chocolate", "Cognac", "Camel", "Mocha", "Brown", "Charcoal", "Mauve", "Brown Plaid", "Grey Plaid", "Red Plaid", "Leopard", "Rust Floral", "Black Floral"]);
const LIGHT = new Set(["Blush", "Pink", "Lavender", "Butter", "Coral", "Sage", "Dusty Blue", "White", "Ivory Floral", "Blue Floral", "Sage Floral", "Natural", "Light Wash", "Navy Stripe", "Blue Gingham"]);

// size runs a boutique buys (most pieces S–L, some XS or XL, some extended to 2X); accessories are one size
const RUNS: [string[], number][] = [
  [["S", "M", "L"], 40],
  [["XS", "S", "M", "L"], 14],
  [["S", "M", "L", "XL"], 22],
  [["XS", "S", "M", "L", "XL"], 10],
  [["S", "M", "L", "XL", "1X", "2X"], 14],
];
export const ONE_SIZE = "O/S";
/** how fast a size sells through, against L */
const SELLS: Record<string, number> = { XS: 0.8, S: 1.15, M: 1.15, L: 1, XL: 0.8, "1X": 0.6, "2X": 0.6, [ONE_SIZE]: 0.7 };

const PRICE: Record<Kind, [number, number]> = {
  top: [28, 58], dress: [44, 98], sweater: [46, 88], cardigan: [48, 92], jeans: [58, 98], skirt: [36, 68], pants: [42, 78],
  set: [62, 118], jacket: [68, 168], belt: [24, 48], hat: [32, 68], bag: [38, 88], scarf: [24, 38],
};
// boutique price points, whole dollars
const POINTS = [24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48, 52, 54, 56, 58, 62, 64, 66, 68, 72, 74, 78, 82, 84, 88, 92, 96, 98, 104, 108, 112, 118, 124, 128, 136, 138, 148, 158, 168];

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

/** One piece of a drop: drop k, place j. `heat` is how well it sells (best sellers, sell-through, markdowns). */
type Piece = { k: number; j: number; n: number; id: string; day: number; heat: number };
const pieceOf = (cfg: DemoConfig, k: number, j: number): Piece => ({
  k, j, n: k * 10 + j, id: `p${k.toString(36)}${j}`, day: dropDay(cfg, k), heat: U(cfg.catalog.seed, "heat", k, j),
});

/** the best sellers for the week of shop day d: the hottest pieces out 10–150 days, recent ones a little ahead */
function bestSellers(cfg: DemoConfig, d: number): Map<string, { rank: number; piece: Piece }> {
  const monday = d - ((((d - EPOCH) % 7) + 7) % 7);
  const scored: { piece: Piece; score: number }[] = [];
  for (let k = lastDrop(cfg, monday - BEST_FROM); dropDay(cfg, k) >= monday - BEST_TO; k--) {
    for (let j = 0; j < dropSize(cfg, k); j++) {
      const piece = pieceOf(cfg, k, j);
      const age = monday - piece.day;
      scored.push({ piece, score: piece.heat * (0.6 + 0.4 * (1 - age / BEST_TO)) });
    }
  }
  scored.sort((a, b) => b.score - a.score || a.piece.id.localeCompare(b.piece.id));
  return new Map(scored.slice(0, cfg.catalog.best).map((s, rank) => [s.piece.id, { rank, piece: s.piece }]));
}

/* ---------- one product ---------- */

function pick<T>(xs: T[], u: number): T {
  return xs[Math.min(xs.length - 1, Math.floor(u * xs.length))];
}

function priceOf(kind: Kind, u: number): number {
  const [lo, hi] = PRICE[kind];
  const pts = POINTS.filter((p) => p >= lo && p <= hi);
  return pts[Math.min(pts.length - 1, Math.floor(Math.pow(u, 1.25) * pts.length))];
}

function productOf(cfg: DemoConfig, p: Piece, today: number, best: number | null): Product {
  const seed = cfg.catalog.seed;
  const { n, id } = p;
  const month = new Date(p.day * DAY).getUTCMonth();
  const fall = month >= 7 || month === 0;
  const kd = KINDS[pickIndex(KINDS.map((x) => x.w * (fall ? x.fall : x.spring)), U(seed, "kind", n))];
  const kind = kd.kind;

  const slot = (n * 41) % NAMES.length;
  const details = DETAILS[kind];
  const [detail, nouns, cut] = details[(Math.floor(n / NAMES.length) + (H(seed, "slot", slot) % details.length)) % details.length];
  const noun = pick(nouns, U(seed, "noun", n));
  const title = `${NAMES[slot]} ${detail} ${noun}`;

  const labels = LABELS.filter((l) => l.kinds.includes(kind));
  const brand = labels[pickIndex(labels.map((l) => l.w), U(seed, "label", n))].name;

  // one colour for most pieces, two or three for some; the season leans the choice
  const palette = PALETTES[kind];
  const cu = U(seed, "colours", n);
  const count = cu < 0.58 ? 1 : cu < 0.88 ? 2 : 3;
  const colours: string[] = [];
  for (let i = 0; i < count; i++) {
    const w = palette.map((c) => (colours.includes(c) ? 0 : WARM.has(c) ? (fall ? 2.2 : 0.5) : LIGHT.has(c) ? (fall ? 0.4 : 2) : 1));
    colours.push(palette[pickIndex(w, U(seed, "colour", n, i))]);
  }

  const accessory = ACCESSORY.has(kind);
  const sizes = accessory ? [ONE_SIZE] : RUNS[pickIndex(RUNS.map((r) => r[1]), U(seed, "run", n))][0].filter((s) => s in cfg.sizes);

  // sizes sell out as the piece ages (popular sizes first, hot pieces faster); best sellers are restocked, so they
  // rarely run out; an accessory sells out in every colour at once
  const age = today - p.day;
  const cap = (0.45 + 0.55 * p.heat) * (best !== null ? 0.35 : 1);
  const gone = (size: string, u: number) => age >= SELL_FROM && u < Math.min(0.92, ((age - SELL_FROM) / SELL_SPAN) * cap * (SELLS[size] ?? 1));
  const allGone = accessory && gone(ONE_SIZE, U(seed, "out", id));
  const variants: Variant[] = colours.flatMap((color, ci) =>
    sizes.map((size, si) => ({ id: `${id}-${ci}${si}`, color, size, available: accessory ? !allGone : !gone(size, U(seed, "out", id, ci, si)) })),
  );

  // slow pieces are marked down after six weeks
  const base = priceOf(kind, U(seed, "price", n));
  let price = base;
  let compareAt: number | undefined;
  if (age >= MARKDOWN_AFTER && p.heat < 0.5 && U(seed, "markdown", id) < 0.75) {
    const off = POINTS.filter((x) => x <= base * (0.68 + 0.12 * U(seed, "off", id))).pop();
    if (off && off < base) {
      price = off;
      compareAt = base;
    }
  }

  const minute = DROP_MINUTE + p.j * 6 + Math.floor(U(seed, "minute", n) * 5);
  const shape: Shape = { ...cut, ...nounShape(noun) };
  return {
    id,
    title,
    brand,
    category: kd.category,
    price,
    ...(compareAt ? { compareAt } : {}),
    image: garmentArt(kind, colours[0], shape),
    publishedAt: new Date(instant(cfg.tz, p.day, minute)).toISOString(),
    best,
    variants,
  };
}

/* ---------- the catalogue ---------- */

/** The catalogue's stamp for instant t: the start of the shop's day. Two instants with the same stamp have the same
 * catalogue, so the page only builds it again when the stamp changes. */
export function catalogStamp(cfg: DemoConfig, t: number): string {
  return new Date(instant(cfg.tz, dayOf(cfg.tz, t), 0)).toISOString();
}

/** The catalogue on the shop's day at instant t: the newest pieces (this day's drop included, published later that
 * day) and this week's best sellers, newest first. */
export function catalogAt(cfg: DemoConfig, t: number): Catalog {
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

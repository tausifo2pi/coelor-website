// The demo clients' own fields and calendars (lead-outreach PLAN_followups_custom_demo.md step 5b): what a product
// drawer shows under "Northvale fields" / "Fernhollow fields", when the next Whatnot show or TikTok LIVE is, and which
// pieces a LIVE holds back. A real build has fields like these because the client asked for them (a bin, a floor price,
// a fit note); here they are generated, so every value follows from the product id through a hash: the same product
// always shows the same bin, the same cost and the same fabric, on every visit and in every list it is opened from.
// Pure (no I/O, no "@/" imports): `node --test lib/demo/fields.test.mts`.

const MIN = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;

/* ---------- hashing: one stable number per (parts), the same function as lib/demo/sample.ts and the store engine ---------- */

export function hash(s: string): number {
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
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const pad2 = (n: number) => String(n).padStart(2, "0");
/** one of `items`, by weight, for u in [0, 1) */
function weighted<T>(items: [T, number][], u: number): T {
  let x = u * items.reduce((s, [, w]) => s + w, 0);
  for (const [v, w] of items) {
    x -= w;
    if (x < 0) return v;
  }
  return items[items.length - 1][0];
}

/* ---------- a shop's clock (its own time zone, whatever the reader's is) ---------- */

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
export type Wall = { y: number; mo: number; d: number; h: number; mi: number; dow: number };

const FORMATS = new Map<string, Intl.DateTimeFormat>();
/** The wall clock in zone `tz` at instant `t`; dow 0 = Sunday. */
export function wallOf(t: number, tz: string): Wall {
  let f = FORMATS.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric" });
    FORMATS.set(tz, f);
  }
  const p: Record<string, number> = {};
  for (const x of f.formatToParts(new Date(t))) if (x.type !== "literal") p[x.type] = Number(x.value);
  return { y: p.year, mo: p.month, d: p.day, h: p.hour % 24, mi: p.minute, dow: new Date(Date.UTC(p.year, p.month - 1, p.day)).getUTCDay() };
}
const offsetOf = (t: number, tz: string) => {
  const w = wallOf(t, tz);
  return Date.UTC(w.y, w.mo - 1, w.d, w.h, w.mi) - Math.floor(t / MIN) * MIN;
};
/** The instant a wall-clock time in zone `tz` happens (month 1–12; a day past the month's end rolls over). */
export function fromWall(y: number, mo: number, d: number, h: number, mi: number, tz: string): number {
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  const t = guess - offsetOf(guess, tz);
  return guess - offsetOf(t, tz);
}
/** Local midnight of the day `t` falls on. */
export function dayStart(t: number, tz: string): number {
  const w = wallOf(t, tz);
  return fromWall(w.y, w.mo, w.d, 0, 0, tz);
}
/** Local Monday 00:00 of the week `t` falls in. */
export function weekStart(t: number, tz: string): number {
  const w = wallOf(t, tz);
  return fromWall(w.y, w.mo, w.d - ((w.dow + 6) % 7), 0, 0, tz);
}
/** The same wall time `n` working days (Mon–Fri) later. */
export function businessDaysAfter(t: number, n: number, tz: string): number {
  const w = wallOf(t, tz);
  let k = 0;
  let left = n;
  while (left > 0) {
    k++;
    const dow = new Date(Date.UTC(w.y, w.mo - 1, w.d + k)).getUTCDay();
    if (dow !== 0 && dow !== 6) left--;
  }
  return fromWall(w.y, w.mo, w.d + k, w.h, w.mi, tz);
}
/** "20:00" (a European shop) */
export const time24 = (w: Pick<Wall, "h" | "mi">) => `${pad2(w.h)}:${pad2(w.mi)}`;
/** "7 pm", "9:05 pm" (a US shop) */
export const time12 = (w: Pick<Wall, "h" | "mi">) => `${w.h % 12 || 12}${w.mi ? `:${pad2(w.mi)}` : ""} ${w.h < 12 ? "am" : "pm"}`;

/* ==================== Northvale Kicks (the sneaker demo) ==================== */

export const BOX = ["Original box", "Damaged box", "No lid"] as const;
export const SOURCES = ["Harbourline Wholesale", "Kiln Street consignment", "Walk-in buy"] as const;
export type SneakerFields = {
  /** "B-14-03": zone, rack, shelf. A model's sizes sit on one rack. */
  bin: string;
  box: (typeof BOX)[number];
  source: (typeof SOURCES)[number];
  /** what the pair cost (for a consigned pair: the payout to the consignor), whole dollars */
  cost: number;
  /** the lowest ask the lowest-ask check may go to, in $5 steps, always above the cost */
  floor: number;
  /** Kiln Street's consignor number, only on consigned pairs */
  consignor: string | null;
};

// what a pair of each kind goes for (USD, a mid size), roughly; the first match wins
const MARKET: [RegExp, number][] = [
  [/travis scott/i, 860], [/kobe 6/i, 520], [/kobe/i, 260],
  [/jordan 1\b.*low/i, 150], [/jordan 1\b/i, 235], [/jordan 4\b/i, 245], [/jordan 3\b/i, 215], [/jordan 11\b/i, 225],
  [/jordan (5|6|12)\b/i, 195], [/jordan/i, 200],
  [/supreme/i, 135], [/air force 1/i, 105], [/air max/i, 150], [/dunk.*\(gs\)/i, 95], [/dunk/i, 115],
  [/yeezy boost/i, 250], [/yeezy (slide|foam)/i, 90], [/samba|handball|gazelle/i, 110], [/campus/i, 100],
  [/990v6|990 v6/i, 210], [/2002r|9060/i, 160], [/new balance|\bnb\b/i, 120],
];

/** "DD1391-100-42" → its style ("DD1391-100") and EU size ("42"), as Picqer's product codes are written. */
export function splitCode(code: string): { style: string; eu: string } {
  const m = /^(.*?)-([\d.]+(?: \d\/\d)?)$/.exec(code.trim());
  return m ? { style: m[1], eu: m[2] } : { style: code.trim(), eu: "" };
}

/** The Northvale fields of one Picqer product (by its product code; the id when it has none). */
export function sneakerFields(code: string, name = ""): SneakerFields {
  const key = code || name || "?";
  const { style, eu } = splitCode(key);
  // the model's sizes share a zone and a rack; each size has its own shelf
  const zone = "ABCDEF"[H("zone", style) % 6];
  const rack = 1 + (H("rack", style) % 24);
  const shelf = 1 + (H("shelf", key) % 8);
  const source = weighted<SneakerFields["source"]>([["Harbourline Wholesale", 50], ["Kiln Street consignment", 22], ["Walk-in buy", 28]], U("source", key));
  // walk-in pairs come in worse boxes more often than wholesale ones
  const box = weighted<SneakerFields["box"]>(
    source === "Walk-in buy" ? [["Original box", 66], ["Damaged box", 22], ["No lid", 12]] : [["Original box", 86], ["Damaged box", 10], ["No lid", 4]],
    U("box", key),
  );
  const base = MARKET.find(([re]) => re.test(name))?.[1] ?? 165;
  // the model's own level (±10 %), and the size's (the edges of a run sell for a little more)
  const v = Number.parseFloat(eu);
  const edge = Number.isFinite(v) ? Math.min(0.12, Math.abs(v - 43) * 0.02) : 0;
  const market = base * (0.9 + 0.2 * U("model", style)) * (1 + edge);
  const margin = source === "Walk-in buy" ? 0.58 + 0.12 * U("cost", key) : source === "Harbourline Wholesale" ? 0.76 + 0.1 * U("cost", key) : 0.8 + 0.06 * U("cost", key);
  const cost = Math.round(market * margin);
  // a box that isn't perfect sells for a little less; the floor never drops under cost + $15
  const floor = Math.max(Math.ceil((cost + 15) / 5) * 5, Math.round((market * (box === "Original box" ? 0.95 : 0.9)) / 5) * 5);
  const consignor = source === "Kiln Street consignment" ? `KS-${String(100 + (H("consignor", style, eu) % 900)).padStart(4, "0")}` : null;
  return { bin: `${zone}-${pad2(rack)}-${pad2(shelf)}`, box, source, cost, floor, consignor };
}

/* ---------- the Whatnot shows: the same calendar as lib/demo/sample.ts draws them ---------- */

// Copied from lib/demo/sample.ts (SAMPLE_START, SHOW_WEEKS, the show's start and length, its lineup): this module is
// shipped to the browser and sample.ts is not, so the calendar is repeated here. lib/demo/fields.test.mts checks it
// against sample.ts's own show sales, so a change there fails the test instead of drifting.
const SHOWS_FROM = Date.UTC(2026, 0, 5); // sample.ts SAMPLE_START, a Monday: day 0 of its calendar
const SHOW_WEEKS = [[1, 3, 6], [1, 4, 6], [0, 3, 5], [1, 3, 5, 6], [2, 4, 6], [1, 3, 4, 6], [0, 2, 4, 6], [1, 4, 5]];
const MON_FIRST = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
function lastSunday(y: number, month: number): number {
  const last = new Date(Date.UTC(y, month + 1, 0));
  return Date.UTC(y, month, last.getUTCDate() - last.getUTCDay(), 1);
}
/** Amsterdam's offset from UTC in hours (as sample.ts reckons it) */
function amsterdam(t: number): number {
  const y = new Date(t).getUTCFullYear();
  return t >= lastSunday(y, 2) && t < lastSunday(y, 9) ? 2 : 1;
}

export type WhatnotShow = {
  start: number;
  end: number;
  /** "Thu" and "20:00", in the shop's time (Amsterdam) */
  day: string;
  time: string;
  /** today in the shop's time */
  today: boolean;
  /** on air at `now` */
  live: boolean;
  /** models in the lineup (each sells at least one size) */
  models: number;
};

/** The show on air now, else the next one (live-selling slot `id`; "whatnot" in lib/demo/channels.ts). */
export function nextWhatnotShow(now: number, id = "whatnot"): WhatnotShow | null {
  const today = Math.floor((now - SHOWS_FROM) / DAY);
  for (let d = Math.max(0, today - 1); d <= today + 21; d++) {
    const pattern = SHOW_WEEKS[H(id, "week", Math.floor(d / 7)) % SHOW_WEEKS.length];
    if (!pattern.includes(d % 7)) continue;
    const t0 = SHOWS_FROM + d * DAY;
    const off = amsterdam(t0 + 12 * HOUR);
    const local = 19 * 60 + 30 * (H(id, "start", d) % 4);
    const start = t0 + ((local - off * 60 + 1440) % 1440) * MIN;
    const end = start + (95 + (H(id, "len", d) % 36)) * MIN;
    if (now >= end) continue;
    const total = 20 + (H(id, "T", d) % 41);
    return {
      start, end,
      day: MON_FIRST[d % 7],
      time: time24({ h: Math.floor(local / 60), mi: local % 60 }),
      today: d === today,
      live: now >= start,
      models: clamp(Math.round(total / 3) + (H(id, "L", d) % 3) - 1, 7, 20),
    };
  }
  return null;
}

/* ==================== Fernhollow (the boutique demo) ==================== */

export type BoutiqueFields = {
  fit: string;
  fabric: string;
  /** "FP-48213" (the Faire purchase order it came in on), or "Own label" */
  faire: string;
  /** how a return of this piece is graded (rule F-07: back on sale, Poshmark pre-loved, or written off) */
  grade: string;
};

type Group = "top" | "dress" | "denim" | "bottom" | "knit" | "outer" | "body" | "shoe" | "jewelry" | "bag" | "acc";
function groupOf(category: string, title: string): Group {
  const c = `${category} ${title}`.toLowerCase();
  if (/earring|necklace|bracelet|ring\b|jewel/.test(c)) return "jewelry";
  if (/\bbag\b|tote|clutch|purse|crossbody/.test(c)) return "bag";
  if (/accessor|hat\b|beanie|scarf|belt|sunglass|hair/.test(c)) return "acc";
  if (/shoe|boot|sandal|sneaker|heel|loafer/.test(c)) return "shoe";
  if (/denim|jean/.test(category.toLowerCase()) || /\bjeans?\b/.test(c)) return "denim";
  if (/bodysuit|swim|bikini|legging|bralette|lingerie/.test(c)) return "body";
  if (/sweater|cardigan|knit|sweatshirt|hoodie|pullover/.test(c)) return "knit";
  if (/jacket|coat|blazer|shacket|vest/.test(c)) return "outer";
  if (/dress|romper|jumpsuit/.test(c)) return "dress";
  if (/pant|short|skirt|skort|trouser|jogger/.test(c)) return "bottom";
  return "top";
}

const FITS: Record<Group, [string, number][]> = {
  top: [["True to size", 4], ["Runs small, size up", 2], ["Relaxed fit, true to size", 2], ["Fitted through the bust, size up if between sizes", 1], ["Cropped, true to size", 1]],
  dress: [["True to size", 4], ["Runs small, size up", 2], ["Fitted through the bust, size up if between sizes", 2], ["Relaxed fit, size down for a closer fit", 1]],
  denim: [["True to size, high rise", 3], ["Runs small, size up one", 2], ["Stretch denim, true to size", 2], ["Rigid denim, size up if between sizes", 1]],
  bottom: [["True to size", 4], ["Runs small, size up", 2], ["Elastic waist, true to size", 2], ["High rise, fitted at the waist", 1]],
  knit: [["Oversized, size down for a closer fit", 3], ["Relaxed fit, true to size", 3], ["Runs small, size up", 1], ["Cropped, true to size", 1]],
  outer: [["True to size, room for a sweater", 3], ["Runs small, size up", 2], ["Oversized, size down for a closer fit", 2]],
  body: [["True to size, very stretchy", 3], ["Runs small, size up", 2], ["Snug fit, size up if between sizes", 1]],
  shoe: [["True to size", 3], ["Runs half a size small", 2]],
  jewelry: [["One size", 1]],
  bag: [["One size", 1]],
  acc: [["One size", 1]],
};

// a fabric named in the title wins; else the usual mixes for its kind of piece
const FABRIC_WORDS: [RegExp, string][] = [
  [/lace/i, "100% nylon lace, lined"], [/satin/i, "97% polyester, 3% spandex satin"], [/leather|pleather/i, "100% polyurethane (vegan leather)"],
  [/linen/i, "55% linen, 45% rayon"], [/velvet/i, "95% polyester, 5% spandex velvet"], [/sequin/i, "100% polyester, sequin overlay"],
  [/athletic|active|yoga/i, "75% nylon, 25% spandex"], [/fleece|sweatshirt|hoodie/i, "60% cotton, 40% polyester fleece"], [/gauze/i, "100% cotton gauze"],
  [/suede/i, "100% polyester faux suede"], [/denim|jean/i, "92% cotton, 6% polyester, 2% spandex"],
];
const FABRICS: Record<Group, string[]> = {
  top: ["62% cotton, 38% polyester", "95% rayon, 5% spandex", "100% polyester", "60% cotton, 40% modal", "100% cotton"],
  dress: ["100% rayon", "100% polyester, lined", "95% polyester, 5% spandex", "100% cotton gauze"],
  denim: ["92% cotton, 6% polyester, 2% spandex", "98% cotton, 2% spandex", "100% cotton (rigid)"],
  bottom: ["68% polyester, 28% rayon, 4% spandex", "100% cotton", "95% polyester, 5% spandex", "55% linen, 45% rayon"],
  knit: ["52% acrylic, 28% polyester, 20% nylon", "100% acrylic", "60% cotton, 40% acrylic", "48% viscose, 28% polyester, 24% nylon"],
  outer: ["100% polyester", "65% polyester, 35% cotton", "100% cotton twill"],
  body: ["92% nylon, 8% spandex", "95% rayon, 5% spandex", "88% polyester, 12% spandex"],
  shoe: ["Faux suede upper, rubber sole", "Polyurethane upper, rubber sole"],
  jewelry: ["14k gold-plated brass", "Stainless steel, gold tone"],
  bag: ["100% polyurethane (vegan leather)", "100% cotton canvas"],
  acc: ["100% acrylic", "100% polyester", "Acetate"],
};

const GRADES: Record<Group, string> = {
  top: "Tags on, unworn: back on sale · worn once: Poshmark pre-loved · marked: written off",
  dress: "Tags on, unworn: back on sale · worn once: Poshmark pre-loved · marked: written off",
  denim: "Tags on, hem uncut: back on sale · worn: Poshmark pre-loved",
  bottom: "Tags on, unworn: back on sale · worn once: Poshmark pre-loved · marked: written off",
  knit: "Tags on, no pilling: back on sale · pilling: Poshmark pre-loved",
  outer: "Tags on, unworn: back on sale · worn: Poshmark pre-loved",
  body: "Liner intact, tags on: back on sale · otherwise written off",
  shoe: "Soles clean, box intact: back on sale · worn outside: Poshmark pre-loved",
  jewelry: "Final sale (earrings) · other pieces unworn in their pouch: back on sale",
  bag: "Unused, dust bag in: back on sale · otherwise Poshmark pre-loved",
  acc: "Unused, tags on: back on sale · otherwise written off",
};

/** The Fernhollow fields of one product. */
export function boutiqueFields(p: { id: string; title: string; category: string; brand: string; publishedAt?: string }, shop = "Fernhollow"): BoutiqueFields {
  const g = groupOf(p.category ?? "", p.title ?? "");
  const fit = weighted(FITS[g], U("fit", p.id));
  const named = FABRIC_WORDS.find(([re]) => re.test(p.title ?? ""))?.[1];
  const fabric = named ?? FABRICS[g][H("fabric", p.id) % FABRICS[g].length];
  // one Faire order per brand per week: a brand's pieces published in the same week came in on the same PO
  const own = !p.brand || p.brand.toLowerCase().includes(shop.toLowerCase());
  const week = Math.floor((Date.parse(p.publishedAt ?? "") || 0) / (7 * DAY));
  const faire = own ? "Own label" : `FP-${40000 + (H("po", p.brand, week) % 60000)}`;
  // light colours show every mark: a stricter grade
  const light = /\b(white|ivory|cream)\b/i.test(p.title ?? "") && g !== "jewelry" && g !== "bag";
  const grade = light ? "Spotless, tags on: back on sale · any mark or make-up: Poshmark pre-loved" : GRADES[g];
  return { fit, fabric, faire, grade };
}

/* ---------- the TikTok LIVE: when, and which pieces it holds back ---------- */

export type LiveShow = {
  /** the show's local date, "2026-10-13": the lineup's seed */
  key: string;
  start: number;
  end: number;
  /** rule F-06: the pieces come off Amazon and Walmart this long before the show */
  holdFrom: number;
  /** "next" (another day), "today" (later today, before the hold), "hold" (held back, not on air yet), "live" (on air) */
  phase: "next" | "today" | "hold" | "live";
  /** "Thu" and "7 pm" in the shop's time */
  day: string;
  time: string;
  holdTime: string;
  endTime: string;
};

/** The LIVE on air now, else the next one: show days (0 = Sunday) at 19:00–21:05 in the shop's zone, as the store engine
 * sells them (lib/storedemo/engine.ts minuteOf / liveNow), held back from 2 hours before. */
export function nextLive(now: number, tz: string, showDays: number[] | undefined, holdMin = 120): LiveShow | null {
  if (!showDays?.length) return null;
  const w = wallOf(now, tz);
  for (let k = 0; k <= 7; k++) {
    const u = new Date(Date.UTC(w.y, w.mo - 1, w.d + k));
    if (!showDays.includes(u.getUTCDay())) continue;
    const [y, mo, d] = [u.getUTCFullYear(), u.getUTCMonth() + 1, u.getUTCDate()];
    const start = fromWall(y, mo, d, 19, 0, tz);
    const end = fromWall(y, mo, d, 21, 5, tz);
    if (now > end) continue;
    const holdFrom = start - holdMin * MIN;
    const hold = wallOf(holdFrom, tz);
    return {
      key: `${y}-${pad2(mo)}-${pad2(d)}`,
      start, end, holdFrom,
      phase: now >= start ? "live" : now >= holdFrom ? "hold" : k === 0 ? "today" : "next",
      day: WEEKDAYS[u.getUTCDay()],
      time: time12({ h: 19, mi: 0 }),
      holdTime: time12(hold),
      endTime: time12({ h: 21, mi: 5 }),
    };
  }
  return null;
}

export type LineupPiece = { id: string; best: number | null; publishedAt: string; listedOn: string[]; soldOut: boolean };

/** The show's lineup, in lot order: pieces listed on the live channel, in stock, out for a day before the show; best
 * sellers and new pieces drawn first. About 55–80 % of an average show's orders (`perShow`), so most pieces sell. */
export function liveLineup<T extends LineupPiece>(rows: T[], liveId: string, show: Pick<LiveShow, "key" | "start">, perShow: [number, number] = [16, 38]): T[] {
  const pool = rows.filter((p) => !p.soldOut && p.listedOn.includes(liveId) && Date.parse(p.publishedAt) <= show.start - DAY);
  const n = Math.min(pool.length, clamp(Math.round(((perShow[0] + perShow[1]) / 2) * (0.55 + 0.25 * U("lineup-n", show.key))), 6, 30));
  const fresh = (p: T) => show.start - Date.parse(p.publishedAt) < 21 * DAY;
  const score = (p: T) => U("lineup", show.key, p.id) * (1 + (p.best !== null ? 1.5 : 0) + (fresh(p) ? 1 : 0));
  return pool
    .map((p) => ({ p, s: score(p) }))
    .sort((a, b) => b.s - a.s || a.p.id.localeCompare(b.p.id))
    .slice(0, n)
    .map((x) => x.p);
}

/** "Lot 07" */
export const lotOf = (i: number) => `Lot ${pad2(i + 1)}`;

type LiveChannel = { id: string; name: string; rhythm: string; showDays?: number[]; perShow?: [number, number] };

/** A store's next LIVE with its lineup and the pieces held back: the same answer for the dashboard tile and for a
 * product's drawer (its lot number), so the two always agree. The hold is rule F-06: Amazon and Walmart (the
 * marketplaces that sell all day) lose the show's pieces from 2 hours before until the show ends. */
export function storeLive<T extends LineupPiece, C extends LiveChannel>(rows: T[], channels: C[], tz: string, now: number) {
  const channel = channels.find((c) => c.rhythm === "live" && c.showDays?.length);
  const show = channel ? nextLive(now, tz, channel.showDays) : null;
  if (!channel || !show) return null;
  const named = channels.filter((c) => /amazon|walmart/i.test(`${c.id} ${c.name}`));
  const holdFrom = named.length ? named : channels.filter((c) => c.rhythm === "steady");
  const lineup = liveLineup(rows, channel.id, show, channel.perShow);
  const held = lineup.filter((p) => p.listedOn.some((id) => holdFrom.some((c) => c.id === id)));
  return { channel, show, lineup, held, holdFrom };
}

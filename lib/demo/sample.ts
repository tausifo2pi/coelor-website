// The sneaker demo client's data (Northvale Kicks, lib/demo/clients.ts), every row the live demo shows, generated: the
// sales, listings and linked products of every channel in lib/demo/channels.ts, the Picqer side (products, stock,
// photos), the product drawer, the automations and the connection cards. The products come from lib/demo/catalog.ts;
// no store's real data and no network (the browser builds it all, lib/demo/gen.ts).
//
// Deterministic and time-based: every row follows from (channel, day, index) through a hash, so the same `now` gives the
// same rows for every visitor, orders appear as time passes, totals only grow, and a restart changes nothing. A
// channel's rhythm comes from its place in the build: the marketplaces it started with (lib/demo/channels.ts
// CORE_CHANNELS: steady sales all day, the US accounts on US hours, picked up by the build's own jobs every few
// minutes), a web store (8–14 orders a day, busiest in the evening) or live selling ("Live" in the role: 3–4 evening
// shows a week of 20–60 sales within about two hours, a trickle otherwise). A channel's data starts on the day it joined
// the build (lib/demo/clients.ts systems), and a rule's effect shows from the day it was built (its rules). Names,
// labels and cadence are read from the channel config only, so flipping a slot to another platform is a change in
// channels.ts alone. Every job ran within its own interval: the automations are always on schedule.
// Pure (no I/O, no "@/" imports): `node --test lib/demo/sample.test.mts`.

import { CHANNELS, isCore, type Channel, type SellPlatform } from "./channels.ts";
import { MODELS, type Model } from "./catalog.ts";
import { sneakerArt } from "./art.ts";
import { NORTHVALE } from "./clients.ts";
import { connectionsOf, join, jobsMeta, type Job, type Linked, type Listing, type Overview, type Page, type Product, type Sale, type Step, type StoreId } from "./shape.ts";

const MIN = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;

const dateOf = (iso: string | undefined, fallback: number) => {
  const t = iso ? Date.parse(`${iso}T00:00:00Z`) : Number.NaN;
  return Number.isFinite(t) ? t : fallback;
};
/** The build's first day (NORTHVALE.since, Monday 5 January 2026): the marketplaces' rows start here. */
export const SAMPLE_START = dateOf(NORTHVALE.since, Date.UTC(2026, 0, 5));
/** the day a rule of the build went live (lib/demo/clients.ts rules): before it, rows don't show what it does */
const builtOn = (match: (r: (typeof NORTHVALE.rules)[number]) => boolean) => Math.max(SAMPLE_START, dateOf(NORTHVALE.rules.find(match)?.built, SAMPLE_START));
const SOLD_OUT_FROM = builtOn((r) => r.job === "zero-stock"); // last pairs pulled everywhere
const FLAG_FROM = builtOn((r) => r.job === null && /unmatch/i.test(`${r.name} ${r.file}`)); // unmatched orders flagged, not guessed
const PHOTOS_FROM = builtOn((r) => r.job === "picqer-images"); // product photos added
/** the day a channel joined the build (its system's `since`), never before the build's first day */
const sinceOf = (c: Channel) => Math.max(SAMPLE_START, dateOf(NORTHVALE.systems.find((s) => s.slug === c.id || s.slug === c.logo)?.since, SAMPLE_START));

/* ---------- hashing: stable 32-bit numbers ---------- */

/** a string's seed (FNV-1a, then mixed) */
function seedOf(s: string): number {
  let x = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    x ^= s.charCodeAt(i);
    x = Math.imul(x, 0x01000193);
  }
  return mix(x >>> 0, 0x5bd1e995);
}
/** two numbers into one (murmur3's finaliser over a ^ b·c): integers in, a uniform 32-bit number out */
function mix(a: number, b: number): number {
  let x = a ^ Math.imul(b, 0xcc9e2d51);
  x = Math.imul(x ^ (x >>> 16), 0x85ebca6b);
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35);
  return (x ^ (x >>> 16)) >>> 0;
}
const h = (s: number, a: number, b = 0, c = 0, d = 0) => mix(mix(mix(mix(s, a), b + 1), c + 2), d + 3);
/** a stable number in [0, 1) */
const u = (s: number, a: number, b = 0, c = 0, d = 0) => h(s, a, b, c, d) / 4294967296;

// what a hash is for (one number per purpose, so two purposes never draw the same number)
const P = {
  count: 1, acct: 2, model: 3, size: 4, hour: 5, minute: 6, flag: 7, last: 8, cancel: 9, cancelT: 10, ship: 11, check: 12, done: 13, ref: 14,
  hook: 15, batches: 16, batchModel: 17, batchSize: 18, batchHour: 19, batchT: 20, batchGap: 21, draw: 22, week: 23, total: 24, start: 25, len: 26,
  lineup: 27, sold: 28, weight: 29, extra: 30, prep: 31, prepGap: 32, drop: 33, gap: 34, buyNow: 35, trickle: 36, link: 37, pass: 38, jitter: 39,
  cycle: 40, phase: 41, stock: 42, reserved: 43, listed: 44, photo: 45, noPhoto: 46, own: 47, restock: 48, run: 49,
};

const iso = (t: number) => new Date(t).toISOString();
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const cumsum = (xs: number[]) => {
  let s = 0;
  return xs.map((x) => (s += x));
};
/** index into a cumulative weight list for u in [0, 1) (binary search) */
function pick(cum: ArrayLike<number>, x: number): number {
  const target = x * cum[cum.length - 1];
  let lo = 0;
  let hi = cum.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (cum[mid] <= target) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}
/** k distinct items, drawn by weight */
function draw<T>(items: T[], weight: (x: T) => number, k: number, s: number, a: number, b: number): T[] {
  const pool = items.slice();
  const out: T[] = [];
  for (let j = 0; j < k && pool.length; j++) {
    let x = u(s, P.draw, a, b, j) * pool.reduce((t, y) => t + weight(y), 0);
    let i = 0;
    for (; i < pool.length - 1; i++) {
      x -= weight(pool[i]);
      if (x < 0) break;
    }
    out.push(pool[i]);
    pool.splice(i, 1);
  }
  return out;
}

/* ---------- time ---------- */

// Europe/Amsterdam (the team): summer time from the last Sunday of March to the last Sunday of October (01:00 UTC)
function lastSunday(y: number, month: number): number {
  const last = new Date(Date.UTC(y, month + 1, 0));
  return Date.UTC(y, month, last.getUTCDate() - last.getUTCDay(), 1);
}
const amsOffset = (t: number) => {
  const y = new Date(t).getUTCFullYear();
  return t >= lastSunday(y, 2) && t < lastSunday(y, 9) ? 2 : 1;
};
// US Eastern (the US accounts' buyers): summer time from the second Sunday of March to the first Sunday of November
function nthSunday(y: number, month: number, n: number): number {
  const first = new Date(Date.UTC(y, month, 1)).getUTCDay();
  return Date.UTC(y, month, 1 + ((7 - first) % 7) + 7 * (n - 1), 6);
}
const etOffset = (t: number) => {
  const y = new Date(t).getUTCFullYear();
  return t >= nthSunday(y, 2, 2) && t < nthSunday(y, 10, 1) ? -4 : -5;
};
const dayOf = (t: number) => Math.floor((t - SAMPLE_START) / DAY);
/** days since 1 January 1970 (a Thursday): Monday-first weekday and week number */
const epochDay = (d: number) => Math.floor((SAMPLE_START + d * DAY) / DAY);
const weekdayOf = (d: number) => (epochDay(d) + 3) % 7;
const weekOf = (d: number) => Math.floor((epochDay(d) + 3) / 7);

// how sales spread over the (local) day: a web store is quiet at night and busy in the evening; a marketplace is flatter
const STORE_W = [0.35, 0.2, 0.1, 0.05, 0.05, 0.08, 0.2, 0.45, 0.7, 0.85, 0.95, 1.05, 1.25, 1.2, 1.05, 1.05, 1.15, 1.3, 1.55, 1.95, 2.35, 2.45, 1.9, 1.0];
const STORE_HOURS = cumsum(STORE_W);
// a show day's buy-now sales come in before the lineup goes up (9:00–16:00), so a show's window holds its own sales only
const BEFORE_SHOW = cumsum(STORE_W.map((w, hr) => (hr >= 9 && hr < 16 ? w : 0)));
const MARKET_HOURS = cumsum([0.5, 0.32, 0.22, 0.16, 0.16, 0.22, 0.38, 0.62, 0.82, 0.95, 1.0, 1.05, 1.15, 1.15, 1.1, 1.1, 1.15, 1.25, 1.4, 1.6, 1.75, 1.7, 1.35, 0.9]);
// orders on a steady day, Monday to Sunday: a web store, and a marketplace's share of its daily average
const WEEKDAY_ORDERS = [9, 10, 10, 11, 11, 12, 13];
const MARKET_WEEK = [1.06, 0.95, 0.94, 0.97, 1.0, 1.0, 1.12];
// the days of a week with a show (0 = Monday); each week takes one of these
const SHOW_WEEKS = [[1, 3, 6], [1, 4, 6], [0, 3, 5], [1, 3, 5, 6], [2, 4, 6], [1, 3, 4, 6], [0, 2, 4, 6], [1, 4, 5]];

/** a moment on UTC day `t0` at a local hour (UTC + `off`) drawn from `hours` */
function localMoment(t0: number, off: number, hours: number[], u1: number, u2: number): number {
  const hr = pick(hours, u1);
  return t0 + ((hr - off + 24) % 24) * HOUR + Math.floor(u2 * HOUR);
}

/* ---------- job runs: every `min` minutes, a few seconds past the boundary ---------- */

type Sched = { seed: number; period: number };
const sched = (key: string, min: number): Sched => ({ seed: seedOf(`run|${key}`), period: min * MIN });
const runAt = (s: Sched, k: number) => k * s.period + 1200 + (mix(s.seed, k) % 7000);
/** the last run at or before `now` */
function lastRun(s: Sched, now: number): number {
  const k = Math.floor(now / s.period);
  const t = runAt(s, k);
  return t <= now ? t : runAt(s, k - 1);
}
/** the first run at or after `t` */
function nextRun(s: Sched, t: number): number {
  const k = Math.floor(t / s.period);
  const r = runAt(s, k);
  return r >= t ? r : runAt(s, k + 1);
}

/* ---------- row keys ---------- */

// A key looks like any row key (a 32-bit number in base 36) and reads back here: [kind 2 bits][channel 2][payload 20]
// [check 8], shuffled by a 4-round Feistel permutation. The payload is day × 256 + index for sales and listings (days <
// 4096, i.e. until 2037; at most 255 sales and 255 listings a channel a day), model × 64 + size for linked products. A
// key only opens a row that exists, and a made-up key almost never even reads back (the check byte).
type Kind = "o" | "l" | "k"; // order, listing, linked product
const KINDS: Kind[] = ["o", "l", "k"];
const KEY_SEED = seedOf("row-key");
const round = (x: number, r: number) => mix(KEY_SEED + r, x) & 0xffff;
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
const check = (head: number) => mix(KEY_SEED, head) & 0xff;
function keyOf(kind: Kind, slot: number, a: number, b: number): string {
  const payload = kind === "k" ? a * 64 + b : a * 256 + b;
  const head = (KINDS.indexOf(kind) * 4 + slot) * 1048576 + payload;
  return shuffle(head * 256 + check(head)).toString(36);
}
function parseKey(key: string): { kind: Kind; slot: number; a: number; b: number } | null {
  if (!/^[0-9a-z]{1,7}$/.test(key)) return null;
  const v = Number.parseInt(key, 36);
  if (v > 0xffffffff || v.toString(36) !== key) return null;
  const raw = unshuffle(v);
  const head = Math.floor(raw / 256);
  if (check(head) !== raw % 256) return null;
  const kind = KINDS[Math.floor(head / 4194304)];
  const slot = Math.floor(head / 1048576) % 4;
  const payload = head % 1048576;
  if (!kind) return null;
  return kind === "k" ? { kind, slot, a: Math.floor(payload / 64), b: payload % 64 } : { kind, slot, a: Math.floor(payload / 256), b: payload % 256 };
}
/** could this be a row's key (it still has to exist: see `product`) */
export const isSampleKey = (key: string) => parseKey(key) !== null;

/* ---------- the world ---------- */

export type Rhythm = "market" | "store" | "live";
/** A channel's rhythm: `rhythm` when the config sets one, a marketplace the build started with, live selling when its
 * role says "live", else a web store. */
export const rhythmOf = (c: Channel & { rhythm?: Rhythm }): Rhythm => c.rhythm ?? (isCore(c.id) ? "market" : /live/i.test(c.role) ? "live" : "store");

type Profile = {
  /** share of the catalogue linked to a channel's first account (a marketplace's next accounts: 0.13 less each) */
  link: number;
  /** sales that were the last pair, sales cancelled, hours to the cancel */
  lastPair: number; cancel: number; cancelH: [number, number];
  /** hours to shipped, then to checked and done (a marketplace authenticates); 0 = never */
  shipH: [number, number]; checkH: [number, number]; doneH: [number, number];
  word: string;
};
const PROFILE: Record<Rhythm, Profile> = {
  market: { link: 0.96, lastPair: 0.14, cancel: 0.015, cancelH: [2, 30], shipH: [14, 40], checkH: [20, 60], doneH: [12, 36], word: "sales" },
  store: { link: 0.7, lastPair: 0.12, cancel: 0.02, cancelH: [1, 20], shipH: [3, 26], checkH: [0, 0], doneH: [0, 0], word: "orders" },
  live: { link: 0.4, lastPair: 0.35, cancel: 0.015, cancelH: [1, 20], shipH: [20, 44], checkH: [0, 0], doneH: [0, 0], word: "sales" },
};
// the build's own jobs that pick a marketplace's listings up and put its cancelled pairs back (lib/demo/shape.ts JOBS)
const LISTING_JOB: Partial<Record<SellPlatform, string>> = { stockx: "stockx-products", alias: "alias-listings" };
const RESTOCK_JOB: Partial<Record<SellPlatform, string>> = { alias: "alias-restock" };

type Acct = { id: StoreId; label: string; platform: SellPlatform; chi: number; k: number; pct: number; seed: number; us: boolean; since: number; perDay: number; batches: [number, number] };
type O = {
  i: number; d: number; ai: number; m: number; si: number; t: number; y: number; f: 0 | 1 | 2; lp: boolean;
  cx: number; rs: number; sh: number; ck: number; dn: number; n: number;
};
type L = { i: number; d: number; ai: number; m: number; si: number; t: number };
/** a live channel's show that day: on air from `start` to `end` (its last sale is in), `models` in the lineup */
type Show = { start: number; end: number; models: number };
type Day = { o: O[]; l: L[]; show?: Show };
type Query = { now: number; platform?: string; store?: string; q?: string; offset?: number; limit?: number };
const EMPTY: Day = { o: [], l: [] };

export type SampleWorld = ReturnType<typeof sampleWorld>;

/** The demo's world for `channels` (default: the demo's CHANNELS; at most four). Pass another list to see a flipped
 * config. */
export function sampleWorld(channels: readonly Channel[] = CHANNELS) {
  const meta = jobsMeta(channels);

  /* ---- accounts: how much of the catalogue each is linked to, how busy it is ---- */
  const accts: Acct[] = [];
  let coreN = 0;
  channels.forEach((c, chi) => {
    const rhythm = rhythmOf(c);
    const since = sinceOf(c);
    const first = chi === channels.findIndex((x) => rhythmOf(x) === "market");
    c.accounts.forEach((a, k) => {
      const pct = rhythm === "market" ? Math.max(0.45, PROFILE.market.link - 0.13 * coreN++) : PROFILE[rhythm].link * (k === 0 ? 1 : 0.8);
      accts.push({
        id: a.id as StoreId, label: a.label, platform: c.id, chi, k, pct, seed: seedOf(`acct|${a.id}`), us: /\bUSA?\b/.test(a.label), since,
        // a marketplace's sales a day and new-stock batches a day: the first marketplace twice as busy, its second account less
        perDay: (first ? 30 : 15) * (k === 0 ? 1 : 0.65),
        batches: first ? (k === 0 ? [4, 8] : [3, 6]) : k === 0 ? [2, 5] : [1, 4],
      });
    });
  });

  /* ---- the catalogue in Picqer: when each model came in, which accounts each size is linked to ---- */
  const N = MODELS.length;
  const added = MODELS.map((mo) => Math.max(mo.rel, SAMPLE_START - DAY));
  const addedDay = added.map((t) => dayOf(t));
  const yearBoost = MODELS.map((mo) => (mo.rel >= Date.UTC(2025, 0, 1) ? 1.5 : mo.rel < Date.UTC(2022, 0, 1) ? 0.8 : 1));
  // a new release sells several times its usual rate for a few weeks (rounded: the same in every browser)
  const REC = Float64Array.from({ length: 366 }, (_, age) => 1 + Math.round(2.6e6 * Math.exp(-age / 35)) / 1e6);
  const codeSeed = MODELS.map((mo) => mo.sizes.map((s) => seedOf(s.code)));
  /** linked[m][si]: a bit per account. The same rule everywhere: a size is linked to an account or it isn't. */
  const linked: number[][] = MODELS.map((mo, m) => mo.sizes.map((_, si) => accts.reduce((bits, a, ai) => (u(a.seed, P.link, codeSeed[m][si]) < a.pct ? bits | (1 << ai) : bits), 0)));
  const has = (m: number, si: number, ai: number) => (linked[m][si] & (1 << ai)) !== 0;
  /** an account's linked sizes of a model, with how well each sells */
  const sizesOf = accts.map((_, ai) => MODELS.map((mo, m) => {
    const s = mo.sizes.flatMap((_, si) => (has(m, si, ai) ? [si] : []));
    return s.length ? { s, cum: cumsum(s.map((si) => mo.sizes[si].w)) } : null;
  }));

  // An account's models in Picqer by the end of week `wk` (days 7·wk to 7·wk + 6), weighted by how well they sell that
  // week. Built once a week rather than once a day (a day's sales then reject a model that isn't in yet).
  const weeks = new Map<number, { ms: number[]; cum: number[] }>();
  function weekList(ai: number, wk: number) {
    const key = ai * 4096 + wk;
    let v = weeks.get(key);
    if (!v) {
      const ms: number[] = [];
      const w: number[] = [];
      for (let m = 0; m < N; m++) {
        if (!sizesOf[ai][m] || addedDay[m] > wk * 7 + 6) continue;
        ms.push(m);
        w.push(MODELS[m].hype * yearBoost[m] * REC[clamp(wk * 7 + 3 - dayOf(MODELS[m].rel), 0, 365)]);
      }
      weeks.set(key, (v = { ms, cum: cumsum(w) }));
    }
    return v;
  }
  /** a model the account sells on day `d` (in Picqer by then, `min` sizes linked to it), drawn by weight with x in [0, 1) */
  function pickModel(ai: number, d: number, x: number, min = 1): number {
    const { ms, cum } = weekList(ai, Math.floor(d / 7));
    const ok = (m: number) => addedDay[m] <= d && sizesOf[ai][m]!.s.length >= min;
    for (let t = 0; t < 12 && ms.length; t++) {
      const m = ms[pick(cum, (x + t * 0.6180339887) % 1)];
      if (ok(m)) return m;
    }
    // rare (few models fit): the first that does, else any model linked to the account
    return ms.find(ok) ?? sizesOf[ai].findIndex((z) => !!z);
  }
  /** the models with `min` sizes linked that the account sells on day `d` (a show's lineup is drawn from these) */
  const candidates = (ai: number, d: number, min: number) => weekList(ai, Math.floor(d / 7)).ms.filter((m) => addedDay[m] <= d && sizesOf[ai][m]!.s.length >= min);
  const pickSize = (ai: number, m: number, x: number) => {
    const z = sizesOf[ai][m]!;
    return z.s[pick(z.cum, x)];
  };

  /* ---- the channels ---- */
  const chans = channels.map((c, chi) => {
    const rhythm = rhythmOf(c);
    const since = sinceOf(c);
    const ordersMin = c.ordersMin > 0 ? c.ordersMin : 5;
    return {
      c, slot: chi & 3, rhythm, prof: PROFILE[rhythm], seed: seedOf(`ch|${c.id}`), since, startDay: dayOf(since),
      own: accts.flatMap((a, ai) => (a.chi === chi ? [ai] : [])),
      orders: sched(`${c.id}-orders`, rhythm === "market" ? (meta[`${c.id}-orders`]?.min ?? ordersMin) : ordersMin),
      listJob: LISTING_JOB[c.id] && meta[LISTING_JOB[c.id]!] && rhythm === "market" ? sched(LISTING_JOB[c.id]!, meta[LISTING_JOB[c.id]!].min) : null,
      restockJob: RESTOCK_JOB[c.id] && meta[RESTOCK_JOB[c.id]!] && rhythm === "market" ? sched(RESTOCK_JOB[c.id]!, meta[RESTOCK_JOB[c.id]!].min) : null,
      days: [] as (Day | undefined)[],
      cumO: [0] as number[],
      cumL: [0] as number[],
      before: [0] as number[],
    };
  });
  type Ch = (typeof chans)[number];
  const bySlot = (slot: number) => chans.find((ch) => ch.slot === slot) ?? null;
  // a channel with webhooks (c.realtime) hands each order over within seconds; the others wait for the next run
  const syncOf = (ch: Ch, t: number, i: number, d: number) => (ch.c.realtime ? t + 2000 + (h(ch.seed, P.hook, d, i) % 10_000) : nextRun(ch.orders, t + 20_000));

  /* ---- one day of one channel ---- */
  const storeCount = (ch: Ch, d: number) => {
    const ramp = Math.min(1, 0.5 + (d - ch.startDay) / 120); // a new store: half as busy at first, fully after four months
    const n = Math.round(WEEKDAY_ORDERS[weekdayOf(d)] * ramp) + (h(ch.seed, P.count, d) % 5) - 2;
    return clamp(n, ramp < 1 ? 3 : 8, 14);
  };
  /** web-store orders on the days before `d` (its order numbers count up) */
  function ordersBefore(ch: Ch, d: number): number {
    while (ch.before.length <= d) {
      const x = ch.before.length - 1;
      ch.before.push(ch.before[x] + (x >= ch.startDay ? storeCount(ch, x) : 0));
    }
    return ch.before[d];
  }

  function genDay(ch: Ch, d: number): Day {
    if (d < ch.startDay || d < 0) return EMPTY;
    const s = ch.seed;
    const t0 = SAMPLE_START + d * DAY;
    const ams = amsOffset(t0 + 12 * HOUR);
    const et = etOffset(t0 + 12 * HOUR);
    const wd = weekdayOf(d);
    const drafts: { ai: number; m: number; si: number; t: number }[] = [];
    const listings: L[] = [];
    const list = (ai: number, m: number, si: number, t: number) => listings.push({ i: listings.length, d, ai, m, si, t });
    let show: Show | undefined;

    if (ch.rhythm === "market") {
      const growth = 0.9 + 0.25 * Math.min(1, d / 280); // busier through the year
      for (const ai of ch.own) {
        const a = accts[ai];
        const n = Math.round(a.perDay * MARKET_WEEK[wd] * growth * (0.85 + 0.3 * u(a.seed, P.count, d)));
        for (let i = 0; i < n && drafts.length < 255; i++) {
          const m = pickModel(ai, d, u(a.seed, P.model, d, i));
          const t = localMoment(t0, a.us ? et : ams, MARKET_HOURS, u(a.seed, P.hour, d, i), u(a.seed, P.minute, d, i));
          drafts.push({ ai, m, si: pickSize(ai, m, u(a.seed, P.size, d, i)), t });
        }
        // new stock is listed in batches during the team's working hours (Monday to Saturday, a little on Sunday): one
        // model, its sizes a split second apart; the build's listing job picks them up on its next run
        const [lo, hi] = a.batches;
        const nb = wd === 6 ? h(a.seed, P.batches, d) % 2 : lo + (h(a.seed, P.batches, d) % (hi - lo + 1));
        for (let j = 0; j < nb; j++) {
          const m = pickModel(ai, d, u(a.seed, P.batchModel, d, j), 3);
          const z = sizesOf[ai][m]!;
          const k = Math.min(z.s.length, 2 + (h(a.seed, P.batchSize, d, j) % 8));
          const at = t0 + ((9 + (h(a.seed, P.batchHour, d, j) % 9) - ams + 24) % 24) * HOUR + (h(a.seed, P.batchT, d, j) % HOUR);
          const run = nextRun(ch.listJob ?? ch.orders, at + 4000);
          draw(z.s, (si) => MODELS[m].sizes[si].w + 0.3, k, a.seed, d, j).forEach((si, x) => {
            if (listings.length < 255) list(ai, m, si, run + 900 + x * (35 + (h(a.seed, P.batchGap, d, j, x) % 30)));
          });
        }
      }
    } else if (ch.rhythm === "store") {
      const n = storeCount(ch, d);
      for (let i = 0; i < n; i++) {
        const ai = ch.own.length === 1 || u(s, P.acct, d, i) < 0.7 ? ch.own[0] : ch.own[1 + Math.floor(((u(s, P.acct, d, i) - 0.7) / 0.3) * (ch.own.length - 1))];
        const m = pickModel(ai, d, u(s, P.model, d, i));
        drafts.push({ ai, m, si: pickSize(ai, m, u(s, P.size, d, i)), t: localMoment(t0, ams, STORE_HOURS, u(s, P.hour, d, i), u(s, P.minute, d, i)) });
      }
      // new stock goes online in a few batches during working hours: one model, its sizes a split second apart
      const batches = 3 + (h(s, P.batches, d) % 3);
      for (let j = 0; j < batches; j++) {
        const ai = ch.own[0];
        const m = pickModel(ai, d, u(s, P.batchModel, d, j), 3);
        const at = t0 + ((9 + (h(s, P.batchHour, d, j) % 9) - ams + 24) % 24) * HOUR + (h(s, P.batchT, d, j) % HOUR);
        draw(sizesOf[ai][m]!.s, () => 1, 5 + (h(s, P.batchSize, d, j) % 7), s, d, j).forEach((si, x) => list(ai, m, si, at - x * (110 + (h(s, P.batchGap, d, j, x) % 150))));
      }
    } else {
      const ai = ch.own[0];
      const pattern = SHOW_WEEKS[h(s, P.week, weekOf(d)) % SHOW_WEEKS.length];
      if (pattern.includes(wd)) {
        // a show: 20–60 sales, a lineup of models dropped one after another, each drop selling 1–6 sizes within minutes
        const total = 20 + (h(s, P.total, d) % 41);
        const start = t0 + ((19 * 60 + 30 * (h(s, P.start, d) % 4) - ams * 60 + 1440) % 1440) * MIN;
        const length = (95 + (h(s, P.len, d) % 36)) * MIN;
        const lineup = draw(candidates(ai, d, 5), (m) => MODELS[m].hype, clamp(Math.round(total / 3) + (h(s, P.lineup, d) % 3) - 1, Math.max(7, Math.ceil(total / 5)), 20), s, d, 0);
        const caps = lineup.map((m) => Math.min(6, sizesOf[ai][m]!.s.length));
        const sold = lineup.map(() => 1);
        const weight = lineup.map((_, j) => 1 + (h(s, P.weight, d, j) % 4));
        for (let r = sold.length, x = 0; r < total && x < 400; x++) {
          const open = lineup.map((_, j) => (sold[j] < caps[j] ? weight[j] : 0));
          if (!open.some((w) => w > 0)) break;
          sold[pick(cumsum(open), u(s, P.sold, d, x))]++;
          r++;
        }
        const prep = start - (150 + (h(s, P.prep, d) % 120)) * MIN; // the lineup is listed in the afternoon
        const slotLen = length / lineup.length;
        lineup.forEach((m, j) => {
          const z = sizesOf[ai][m]!;
          const listed = draw(z.s, (si) => MODELS[m].sizes[si].w, Math.min(z.s.length, sold[j] + (h(s, P.extra, d, j) % 2)), s, d, 100 + j);
          const lat = prep + j * (2 + (h(s, P.prepGap, d, j) % 5)) * MIN + (h(s, P.batchT, d, j) % MIN);
          listed.forEach((si, x) => list(ai, m, si, lat - x * (120 + (h(s, P.batchGap, d, j, x) % 200))));
          let t = start + Math.floor(j * slotLen) + (h(s, P.drop, d, j) % 25_000) + 15_000;
          listed.slice(0, sold[j]).forEach((si, x) => {
            t += x === 0 ? 0 : (6 + (h(s, P.gap, d, j, x) % 30)) * 1000 + (h(s, P.minute, d, j, x) % 1000);
            drafts.push({ ai, m, si, t });
          });
        });
        // the dashboard announces the show from these same numbers (overview `nextShow`): it ends at its planned
        // length, or a minute after its last sale if the last lot runs over
        show = { start, end: Math.max(start + length, Math.max(...drafts.map((x) => x.t)) + MIN), models: lineup.length };
      } else if (h(s, P.buyNow, d) % 2 === 0) {
        // no show: now and then a few pairs listed to buy now
        const m = pickModel(ai, d, u(s, P.batchModel, d), 3);
        const at = t0 + ((11 + (h(s, P.batchHour, d) % 6) - ams + 24) % 24) * HOUR + (h(s, P.batchT, d) % HOUR);
        draw(sizesOf[ai][m]!.s, () => 1, 3 + (h(s, P.batchSize, d) % 3), s, d, 999).forEach((si, x) => list(ai, m, si, at - x * (130 + (h(s, P.batchGap, d, 0, x) % 150))));
      }
      // and a trickle of buy-now sales every day (on a show day, before the show)
      const trickle = [0, 0, 1, 1, 1, 2, 2, 3][h(s, P.trickle, d) % 8];
      for (let i = 0; i < trickle; i++) {
        const m = pickModel(ai, d, u(s, P.model, d, 500 + i));
        drafts.push({ ai, m, si: pickSize(ai, m, u(s, P.size, d, 500 + i)), t: localMoment(t0, ams, show ? BEFORE_SHOW : STORE_HOURS, u(s, P.hour, d, 500 + i), u(s, P.minute, d, 500 + i)) });
      }
    }

    // what the sync did with each one; web-store order numbers count up through the day
    const p = ch.prof;
    const rank = drafts.map((_, i) => i).sort((x, y) => drafts[x].t - drafts[y].t);
    const seq = ch.rhythm === "store" ? ordersBefore(ch, d) : 0;
    const restockAt = (cx: number) => (ch.restockJob ? nextRun(ch.restockJob, cx) : ch.c.realtime ? cx + 20_000 : nextRun(ch.orders, cx + 20_000));
    const span = ([lo, hi]: [number, number], x: number) => (lo + x * (hi - lo)) * HOUR;
    const orders: O[] = rank.map((i, r) => {
      const o = drafts[i];
      const a = accts[o.ai];
      const f = u(a.seed, P.flag, d, i);
      const flag: O["f"] = f < 0.012 && o.t >= FLAG_FROM ? 1 : f > 0.994 ? 2 : 0;
      const cx = flag === 0 && u(a.seed, P.cancel, d, i) < p.cancel ? o.t + span(p.cancelH, u(a.seed, P.cancelT, d, i)) : 0;
      const sh = cx ? Infinity : o.t + span(p.shipH, u(a.seed, P.ship, d, i));
      const ck = p.checkH[1] && !cx ? sh + span(p.checkH, u(a.seed, P.check, d, i)) : Infinity;
      return {
        i, d, ai: o.ai, m: o.m, si: o.si, t: o.t, y: syncOf(ch, o.t, i, d), f: flag,
        lp: flag === 0 && o.t >= SOLD_OUT_FROM && u(a.seed, P.last, d, i) < p.lastPair,
        cx, rs: cx ? restockAt(cx) : 0, sh, ck, dn: p.doneH[1] && !cx ? ck + span(p.doneH, u(a.seed, P.done, d, i)) : Infinity,
        n: ch.rhythm === "store" ? 1001 + seq + r : h(a.seed, P.ref, d, i),
      };
    });
    orders.reverse();
    listings.sort((x, y) => y.t - x.t);
    return { o: orders, l: listings, show };
  }

  function day(ch: Ch, d: number): Day {
    if (d < 0) return EMPTY;
    let v = ch.days[d];
    if (!v) ch.days[d] = v = genDay(ch, d);
    return v;
  }
  /** rows in the days before `d` (every one of them is visible from day d + 1 on: a row is picked up within minutes) */
  function before(ch: Ch, kind: "o" | "l", d: number): number {
    const cum = kind === "o" ? ch.cumO : ch.cumL;
    while (cum.length <= d) cum.push(cum[cum.length - 1] + day(ch, cum.length - 1)[kind].length);
    return cum[Math.max(0, d)];
  }

  /* ---- rows as the pages show them ---- */
  const isAlias = (ai: number) => accts[ai].platform === "alias";
  // as each platform writes a product: Alias (GOAT) names it by its slug and spaces its style codes
  const nameAt = (mo: Model, ai: number) => (isAlias(ai) ? mo.alias : mo.name);
  const styleAt = (mo: Model, ai: number) => (isAlias(ai) ? mo.style.replace(/-/g, " ") : mo.style);
  const REF_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789";
  /** the masked order reference: the first marketplace's are letters and digits, the others' order numbers digits */
  const firstMarket = chans.findIndex((ch) => ch.rhythm === "market");
  function refOf(o: O): string {
    const a = accts[o.ai];
    if (chans[a.chi].rhythm === "store") return `•••${String(o.n).slice(-3)}`;
    if (a.chi === firstMarket) {
      return `•••${[1, 34, 1156].map((x) => REF_CHARS[Math.floor(o.n / x) % 34]).join("")}`;
    }
    return `•••${String(o.n % 1000).padStart(3, "0")}`;
  }
  /** the accounts a size was linked to at `t` */
  const linkedAccts = (m: number, si: number, t: number) => accts.flatMap((_, ai) => (has(m, si, ai) && linkedOn(m, si, ai) <= t ? [ai] : []));

  function stateOf(o: O, now: number): string {
    if (o.cx && now >= o.cx) return "Cancelled";
    if (now >= o.dn) return "Sold"; // done: the marketplace paid out
    if (now >= o.ck) return "Being checked";
    if (now >= o.sh) return "Shipped";
    return "Sold";
  }

  function toSale(o: O, now: number): Sale {
    const a = accts[o.ai];
    const mo = MODELS[o.m];
    const steps: Step[] = [];
    if (o.f === 1) steps.push({ kind: "flag", text: "Not linked in Picqer yet, flagged" });
    else if (o.f === 2) steps.push({ kind: "flag", text: "Picqer had 0 left, flagged" });
    else steps.push({ kind: "stock", text: "Picqer stock −1" });
    if (o.lp) {
      // the last pair: its listings come down on the other accounts it is linked to (an Alias sale also pulls the
      // account's other listings of that size)
      const pulled = linkedAccts(o.m, o.si, o.t).filter((x) => x !== o.ai || (isAlias(x) && u(a.seed, P.own, o.d, o.i) < 0.5)).map((x) => accts[x].label);
      if (pulled.length) steps.push({ kind: "pulled", text: `Last pair: pulled from ${join(pulled)}` });
    }
    if (o.cx && now >= o.rs) steps.push({ kind: "restock", text: "Buyer cancelled, stock +1 back" });
    return {
      id: keyOf("o", chans[a.chi].slot, o.d, o.i), platform: a.platform, store: a.id, storeLabel: a.label, product: nameAt(mo, o.ai), style: styleAt(mo, o.ai),
      size: mo.sizes[o.si].us, ref: refOf(o), state: stateOf(o, now), soldAt: iso(o.t), syncedAt: iso(o.y), steps, detail: o.f !== 1,
    };
  }
  const toListing = (l: L): Listing => {
    const a = accts[l.ai];
    const mo = MODELS[l.m];
    return { id: keyOf("l", chans[a.chi].slot, l.d, l.i), platform: a.platform, store: a.id, storeLabel: a.label, product: nameAt(mo, l.ai), style: styleAt(mo, l.ai), size: mo.sizes[l.si].us, at: iso(l.t) };
  };

  /* ---- searching and paging ---- */
  /** a search as the page sends it (lib/demo/shape.ts searchTerm): the term, as typed, in the product name or style */
  const hitsOf = (q?: string): Uint8Array | null => {
    const t = (q ?? "").toLowerCase().trim();
    return t ? Uint8Array.from(MODELS, (mo) => (mo.hay.includes(t) ? 1 : 0)) : null;
  };
  /** the channels a query covers */
  function scope(q: Query): { chs: Ch[]; ai?: number } {
    if (q.store) {
      const ai = accts.findIndex((a) => a.id === q.store);
      return ai < 0 ? { chs: [] } : { chs: [chans[accts[ai].chi]], ai };
    }
    if (q.platform) return { chs: chans.filter((x) => x.c.id === q.platform) };
    return { chs: chans };
  }

  /** newest first over every day since the start: the page asked for, and how many match in all */
  function scan<R extends O | L>(kind: "o" | "l", q: Query, seen: (r: R) => number) {
    const { chs, ai } = scope(q);
    const hits = hitsOf(q.q);
    const offset = q.offset ?? 0;
    const limit = q.limit ?? 20;
    const want = offset + limit;
    const dNow = dayOf(q.now);
    const per: R[][] = [];
    let total = 0;
    for (const ch of chs) {
      const got: R[] = [];
      const ok = (r: R) => seen(r) <= q.now && (ai === undefined || r.ai === ai) && (!hits || hits[r.m] === 1);
      if (!hits && ai === undefined) {
        // every row of the days before yesterday is visible: count those, look at the last two days row by row
        total += before(ch, kind, dNow - 1);
        for (const d of [dNow, dNow - 1]) for (const r of day(ch, d)[kind] as R[]) if (ok(r)) total++;
        for (let d = dNow; d >= ch.startDay && d >= 0 && got.length < want; d--) {
          for (const r of day(ch, d)[kind] as R[]) if (ok(r) && got.length < want) got.push(r);
        }
      } else {
        for (let d = dNow; d >= ch.startDay && d >= 0; d--) {
          for (const r of day(ch, d)[kind] as R[]) {
            if (!ok(r)) continue;
            total++;
            if (got.length < want) got.push(r);
          }
        }
      }
      per.push(got);
    }
    const all = per.length === 1 ? per[0] : per.flat().sort((x, y) => y.t - x.t);
    return { rows: all.slice(offset, offset + limit), total };
  }
  const orderScan = (q: Query) => scan<O>("o", q, (o) => o.y);
  const listingScan = (q: Query) => scan<L>("l", q, (l) => l.t);

  /* ---- linked products: when each size was linked to each account, and linked again after a restock ---- */
  const PP = sched("picqer-products", meta["picqer-products"]?.min ?? 540);
  const IMG = sched("picqer-images", meta["picqer-images"]?.min ?? 360);
  // a link is made in a run of the linking job, a model within a few minutes of the run's start, its sizes a split
  // second apart (the smallest first)
  const pass = (m: number, ai: number) => 1500 + (h(accts[ai].seed, P.pass, m) % 200_000);
  const jitter = (m: number, si: number, ai: number) => si * 210 + (h(accts[ai].seed, P.jitter, m, si) % 150);
  const firstRun = MODELS.map((_, m) => accts.map((a) => nextRun(PP, Math.max(added[m], a.since))));
  /** when a size was first linked to an account */
  const linkedOn = (m: number, si: number, ai: number) => firstRun[m][ai] + pass(m, ai) + jitter(m, si, ai);
  // stock comes back every few weeks and the linking job links the model again
  const cycle = MODELS.map((mo) => (35 + (seedOf(`cycle|${mo.style}`) % 26)) * DAY);
  const phase = MODELS.map((mo, m) => seedOf(`phase|${mo.style}`) % cycle[m]);
  /** the linking run of a model's latest restock that is done by `now` (0: none since it came in) */
  function restockRun(m: number, now: number): number {
    for (let k = Math.floor((now - SAMPLE_START - phase[m]) / cycle[m]); k >= 0; k--) {
      const e = SAMPLE_START + phase[m] + k * cycle[m];
      if (e < added[m]) return 0;
      const r = nextRun(PP, e);
      if (r + 240_000 <= now) return r;
    }
    return 0;
  }
  /** a size's latest link to an account at `now` (NaN: not linked yet) */
  function linkAt(m: number, si: number, ai: number, now: number, rr = restockRun(m, now)): number {
    const first = linkedOn(m, si, ai);
    if (!has(m, si, ai) || first > now) return Number.NaN;
    const again = rr + pass(m, ai) + jitter(m, si, ai);
    return rr && again > first ? again : first;
  }
  /** when each size was first linked anywhere, sorted (the products KPI counts these) */
  const firstLinks = Float64Array.from(MODELS.flatMap((mo, m) => mo.sizes.map((_, si) => Math.min(...accts.map((_, ai) => (has(m, si, ai) ? linkedOn(m, si, ai) : Infinity)))))).sort();
  const firstLink = (m: number, si: number) => Math.min(...accts.map((_, ai) => (has(m, si, ai) ? linkedOn(m, si, ai) : Infinity)));
  const linkedCount = (now: number) => {
    let lo = 0;
    let hi = firstLinks.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (firstLinks[mid] <= now) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  };
  // Picqer holds far more than the catalogue it sells: older models and sizes no longer listed, a few new ones a day
  const productsTotal = (now: number) => linkedCount(now) + 8_800 + Math.floor(Math.max(0, (now - SAMPLE_START) / DAY) * 3.2);

  function linkedRow(slot: number, m: number, si: number, now: number): Linked {
    const mo = MODELS[m];
    const s = mo.sizes[si];
    const rr = restockRun(m, now);
    const ais = accts.flatMap((_, ai) => (Number.isFinite(linkAt(m, si, ai, now, rr)) ? [ai] : []));
    return {
      // named only when an Alias link gives the name (Picqer's own name is in the drawer)
      id: keyOf("k", slot, m, si), code: s.code, name: ais.some(isAlias) ? mo.alias : "", color: mo.color, us: s.us, eu: s.eu,
      links: ais.map((ai) => ({ store: accts[ai].id, storeLabel: accts[ai].label, platform: accts[ai].platform, style: styleAt(mo, ai), size: s.us })),
      linkedAt: ais.length ? iso(Math.max(...ais.map((ai) => linkAt(m, si, ai, now, rr)))) : null,
      detail: true,
    };
  }

  /* ---- a product's drawer ---- */
  const art: (string | undefined)[] = [];
  const artOf = (m: number) => (art[m] ??= sneakerArt(MODELS[m].shape, MODELS[m].color, MODELS[m].name));
  function stockOf(m: number, si: number) {
    const s = codeSeed[m][si];
    const total = [1, 1, 1, 2, 2, 2, 3, 3, 4, 5, 6][h(s, P.stock) % 11] + (MODELS[m].hype >= 4 ? 1 : 0);
    const reserved = h(s, P.reserved) % 5 === 0 ? 1 : 0;
    return { free: Math.max(1, total - reserved), total: Math.max(total, reserved + 1), reserved };
  }
  function productOf(m: number, si: number, now: number, sale?: O): Product {
    const mo = MODELS[m];
    const s = mo.sizes[si];
    let stock = stockOf(m, si);
    if (sale?.f === 2) stock = { free: 0, total: 0, reserved: 0 }; // sold with none left: flagged
    else if (sale?.lp) {
      const state = stateOf(sale, now);
      stock = state === "Cancelled" ? { free: 1, total: 1, reserved: 0 } : state === "Sold" && now < sale.sh ? { free: 0, total: 1, reserved: 1 } : { free: 0, total: 0, reserved: 0 };
    }
    const rr = restockRun(m, now);
    const ais = accts.flatMap((_, ai) => (Number.isFinite(linkAt(m, si, ai, now, rr)) ? [ai] : []));
    const links = ais.map((ai) => ({ store: accts[ai].id, storeLabel: accts[ai].label, platform: accts[ai].platform, name: nameAt(mo, ai), style: styleAt(mo, ai), size: s.us,
      at: iso(linkAt(m, si, ai, now, rr)) }));
    // listings on the Alias accounts it is linked to (they come down when the size sells out)
    const aliasListings = stock.free > 0 ? ais.filter(isAlias).map((ai) => ({ storeLabel: accts[ai].label, count: 1 + (h(codeSeed[m][si], P.listed, ai) % Math.min(3, stock.free)) })) : [];
    // the photo job adds it on its first run after the product was linked (or after the job was built)
    const first = firstLink(m, si);
    const photo = Number.isFinite(first) && h(codeSeed[m][si], P.noPhoto) % 40 !== 0 ? nextRun(IMG, Math.max(first, PHOTOS_FROM)) + 5000 + (h(codeSeed[m][si], P.photo) % 62_000) : Infinity;
    const shown = photo <= now;
    return { name: mo.name, code: s.code, color: mo.color, us: s.us, eu: s.eu, image: shown ? artOf(m) : null, photoAt: shown ? iso(photo) : null, stock, links, aliasListings };
  }

  /* ---- automations ---- */
  const coreIds = new Set(chans.filter((ch) => ch.rhythm === "market").map((ch) => ch.c.id as string));
  const own = Object.entries(meta).filter(([key, j]) => !key.endsWith("-orders") && (j.platform === "picqer" || coreIds.has(j.platform)));
  const ownSched = own.map(([key, j]) => sched(key, j.min));
  const stockSched = chans.map((ch) => sched(`${ch.c.id}-stock`, 5));

  /** The live channel's show on air at `now`, else its next one (within three weeks): the window its sales fall in. */
  function nextShow(now: number): NonNullable<Overview["nextShow"]> | null {
    const ch = chans.find((x) => x.rhythm === "live");
    if (!ch) return null;
    for (let d = Math.max(ch.startDay, dayOf(now) - 1); d <= dayOf(now) + 21; d++) {
      const sh = day(ch, d).show;
      if (sh && now < sh.end) return { platform: ch.c.id, start: iso(sh.start), end: iso(sh.end), models: sh.models };
    }
    return null;
  }

  function jobs(now: number): Job[] {
    const orders: Job[] = chans.filter((ch) => now >= ch.since).map((ch) => {
      const c = ch.c;
      const key = `${c.id}-orders`;
      const j = meta[key];
      // a webhook channel's job runs on each order: its last run is the last order handed over
      const hooked = c.realtime ? orderScan({ now, platform: c.id, limit: 1 }).rows[0]?.y : undefined;
      return {
        key, name: j && ch.rhythm === "market" ? j.name : `${c.name} ${ch.prof.word} into Picqer`, platform: c.id,
        every: c.realtime ? "real time · webhook" : (j && ch.rhythm === "market" ? j.every : c.ordersEvery),
        lastRun: iso(c.realtime ? Math.min(now, hooked ?? now - 90_000) : lastRun(ch.orders, now)), status: "ok" as const,
      };
    });
    const build = own.map(([key, j], x): Job => ({ key, name: j.name, platform: j.platform, every: j.every, lastRun: iso(lastRun(ownSched[x], now)), status: "ok" }));
    const stock = chans.flatMap((ch, x): Job[] => (ch.rhythm === "market" || now < ch.since ? [] : [{
      key: `${ch.c.id}-stock`, name: `Stock pushed to ${ch.c.name}`, platform: ch.c.id, every: "every 5 min", lastRun: iso(lastRun(stockSched[x], now)), status: "ok",
    }]));
    return [...orders, ...build, ...stock];
  }

  return {
    /** the channels, in config order */
    channels: chans.map((ch) => ch.c),

    /** Sales, newest first: every channel, or one `platform` / `store`; `q` searches product and style. */
    sales(q: Query): { rows: Sale[]; total: number } {
      const r = orderScan(q);
      return { rows: r.rows.map((o) => toSale(o, q.now)), total: r.total };
    },

    /** What the sync picked up as listed, newest first (marketplace stock, a web store's new stock, a show's lineup). */
    listings(q: Query): { rows: Listing[]; total: number } {
      const r = listingScan(q);
      return { rows: r.rows.map(toListing), total: r.total };
    },

    /** The products tab of one account: the Picqer products linked to it, newest link first. */
    linked(q: { now: number; store: string; q?: string; page: number; per: number }): Page<Linked> {
      const ai = accts.findIndex((a) => a.id === q.store);
      const t = (q.q ?? "").toLowerCase().trim();
      const rows: { m: number; si: number; at: number }[] = [];
      if (ai >= 0) {
        for (let m = 0; m < N; m++) {
          const mo = MODELS[m];
          const rr = restockRun(m, q.now);
          mo.sizes.forEach((s, si) => {
            if (!has(m, si, ai) || linkedOn(m, si, ai) > q.now || (t && !`${mo.hay}\n${s.code.toLowerCase()}`.includes(t))) return;
            let at = 0;
            for (let x = 0; x < accts.length; x++) {
              const v = linkAt(m, si, x, q.now, rr);
              if (v > at) at = v;
            }
            rows.push({ m, si, at });
          });
        }
      }
      rows.sort((x, y) => y.at - x.at || x.m - y.m || y.si - x.si);
      const slot = ai >= 0 ? chans[accts[ai].chi].slot : 0;
      const page = rows.slice(q.per * (q.page - 1), q.per * q.page).map((r) => linkedRow(slot, r.m, r.si, q.now));
      return { rows: page, total: rows.length, page: q.page, pages: Math.max(1, Math.ceil(rows.length / q.per)) };
    },

    /** The drawer for a row's key (a sale, a listing or a linked product); null for any other key. */
    product(key: string, now: number): Product | null {
      const k = parseKey(key);
      const ch = k && bySlot(k.slot);
      if (!k || !ch) return null;
      if (k.kind === "k") return MODELS[k.a]?.sizes[k.b] && firstLink(k.a, k.b) <= now ? productOf(k.a, k.b, now) : null;
      if (k.a > dayOf(now)) return null;
      const d = day(ch, k.a);
      if (k.kind === "l") {
        const l = d.l.find((x) => x.i === k.b);
        return l && l.t <= now ? productOf(l.m, l.si, now) : null;
      }
      const o = d.o.find((x) => x.i === k.b);
      return o && o.y <= now && o.f !== 1 ? productOf(o.m, o.si, now, o) : null;
    },

    jobs,
    nextShow,

    /** The dashboard, connections and automations: counts, the newest sales, the jobs and the connection cards. */
    overview(now: number): Overview {
      const zero = () => Object.fromEntries(channels.map((c) => [c.id, 0])) as Record<SellPlatform, number>;
      const sales24h = zero();
      const salesTotal = zero();
      const listings = zero();
      const feed: Sale[] = [];
      for (const ch of chans) {
        const r = orderScan({ now, platform: ch.c.id, limit: 12 });
        salesTotal[ch.c.id] = r.total;
        let n = 0;
        for (const d of [dayOf(now), dayOf(now) - 1]) n += day(ch, d).o.filter((x) => x.y <= now && x.t > now - DAY).length;
        sales24h[ch.c.id] = n;
        listings[ch.c.id] = listingScan({ now, platform: ch.c.id, limit: 0 }).total;
        feed.push(...r.rows.map((x) => toSale(x, now)));
      }
      feed.sort((a, b) => (b.soldAt ?? "").localeCompare(a.soldAt ?? ""));
      const top = feed.slice(0, 12);
      const js = jobs(now);
      return {
        at: iso(now),
        kpis: {
          sales24h: { ...sales24h, more: false }, salesTotal, listings, lastSale: top[0] ?? null,
          products: { total: productsTotal(now), linked: linkedCount(now) },
          jobs: { ok: js.filter((j) => j.status === "ok" || j.status === "running").length, total: js.length },
        },
        connections: connectionsOf(js, channels),
        jobs: js,
        feed: top,
        nextShow: nextShow(now),
      };
    },
  };
}

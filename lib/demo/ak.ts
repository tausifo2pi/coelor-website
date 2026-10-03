// Server side of the live demo: reads the client's sync API (ak-api) and hands the page shaped data (lib/demo/shape.ts).
// Only the GET reads listed here are ever called, with parameters built here (a page number, a store, a cleaned search
// term), never a path from the browser. A visitor never waits for the client's API when a copy exists: every read is
// shared and refreshed behind the answer (lib/demo/cache.ts), a refresher keeps the copies fresh (startDemoRefresh, from
// instrumentation.ts), and the answers the page shows first are kept on disk for the first visitor after a restart
// (lib/demo/answers.ts). Only the very first read after a fresh install waits.
// The generated channels (the lib/demo/channels.ts slots not in API_CHANNELS) come from lib/demo/sample.ts, with no API
// call, and are merged into every answer in the same shape as the real rows.
import path from "node:path";
import { answerStore, type AnswerStore } from "@/lib/demo/answers";
import { readCache } from "@/lib/demo/cache";
import { CHANNELS, channel, fromApi } from "@/lib/demo/channels";
import { SAMPLE } from "@/lib/demo/sample";
import {
  STORES, listOf, listingOf, linkedOf, overviewOf, pageOf, picqerId, productOf, saleOf, searchTerm, storeById,
  type Linked, type Listing, type Overview, type Page, type Product, type Sale, type SellPlatform, type StoreId,
} from "@/lib/demo/shape";
import { TRACK_DIR } from "@/lib/track";

const BASE = `${(process.env.AK_API_URL ?? "https://ak-api.coelor.com").replace(/\/+$/, "")}/api/v1`;
const TIMEOUT_MS = 6000;
// a copy this old means its fresh reads keep failing: the page says "data from … ago"
const STALE_SHOW_MS = 10 * 60_000;
const MAX_ENTRIES = 300;

export type Live<T> = { data: T; at: string; stale: boolean };

const reads = readCache(
  (p) =>
    fetch(`${BASE}${p}`, { cache: "no-store", signal: AbortSignal.timeout(TIMEOUT_MS), headers: { accept: "application/json" } }).then((r) => {
      if (!r.ok) throw new Error(`ak-api ${r.status}`);
      return r.json() as Promise<unknown>;
    }),
  {
    staleAfterMs: STALE_SHOW_MS,
    max: MAX_ENTRIES,
    onError: (p, err) => console.error("demo: live read failed", p.split("?")[0], err instanceof Error ? err.message : err),
  },
);
const read = (p: string, ttlMs: number) => reads.read(p, ttlMs);

// Row key → Picqer product id, for the rows the demo has shown, so the browser opens a product by its row key only.
const products = new Map<string, string>();

let store: AnswerStore | null = null;
/** the answers on disk (and the row key → product map with them), loaded on first use */
function answers(): AnswerStore {
  if (!store) {
    store = answerStore(path.join(TRACK_DIR, "demo-answers.json"));
    for (const [k, v] of store.get<[string, string][]>("_products") ?? []) {
      if (typeof k === "string" && picqerId(v)) products.set(k, v);
    }
  }
  return store;
}
const saveProducts = () => answers().put("_products", [...products].slice(-3000));

function remember(rowKey: string, raw: unknown): boolean {
  const pid = picqerId((raw as { picqerProductId?: unknown })?.picqerProductId);
  if (!pid) return false;
  products.delete(rowKey);
  products.set(rowKey, pid);
  if (products.size > 5000) products.delete(products.keys().next().value as string);
  return true;
}

const qs = (p: Record<string, string | number | undefined>) =>
  Object.entries(p).filter(([, v]) => v !== undefined && v !== "").map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join("&");

// The API's key for each demo store. The main Alias account's key is read from /alias/stores (it carries the client's
// name, which this code never spells out).
async function storeKey(id: StoreId): Promise<string | null> {
  if (id === "sx-eu") return "stockx_eu";
  if (id === "sx-us") return "stockx_us";
  if (id === "al-usa") return "alias_USA";
  const { data } = await read("/alias/stores", 60 * 60 * 1000);
  const keys = Array.isArray((data as { data?: unknown })?.data) ? ((data as { data: unknown[] }).data) : [];
  return (keys.find((k) => typeof k === "string" && /^alias_[A-Za-z0-9_]+$/.test(k) && k !== "alias_USA") as string) ?? null;
}

const oldest = (...xs: { at: number; stale: boolean }[]) => ({
  at: new Date(Math.min(...xs.map((x) => x.at))).toISOString(),
  stale: xs.some((x) => x.stale),
});

export async function overview(): Promise<Live<Overview>> {
  const T = 30_000;
  const now = Date.now();
  const [cron, stats, sx, al, sxListings, alListings] = await Promise.all([
    read("/cron/status", T),
    read("/product-match/stats", 5 * 60_000),
    read(`/stockx/orders?${qs({ limit: 120, sortBy: "createdAt", sortOrder: -1 })}`, T),
    read(`/alias/orders?${qs({ limit: 120, sortBy: "createdAt", sortOrder: -1 })}`, T),
    read(`/stockx/products?${qs({ limit: 1 })}`, 5 * 60_000),
    read(`/alias/products?${qs({ limit: 1 })}`, 5 * 60_000),
  ]);
  const real = overviewOf({ cron: cron.data, stats: stats.data, sx: sx.data, al: al.data, sxListings: sxListings.data, alListings: alListings.data }, now);
  for (const [raw, platform] of [[sx.data, "stockx"], [al.data, "alias"]] as const) {
    for (const x of listOf(raw).rows) {
      const s = saleOf(x, platform);
      if (s) remember(s.id, x);
    }
  }
  for (const s of real.feed) s.detail = products.has(s.id);
  if (real.kpis.lastSale) real.kpis.lastSale.detail = products.has(real.kpis.lastSale.id);
  // the generated channels as of the same moment as the real reads, so no row is newer than the answer
  return { data: SAMPLE.overview(real, Math.min(cron.at, sx.at, al.at)), ...oldest(cron, sx, al) };
}

export type ListQuery = { platform?: SellPlatform; store?: StoreId; q?: string; page: number };
const PER = 20;
const MAX_PAGE = 25;

export function listQuery(sp: URLSearchParams): ListQuery {
  const platform = sp.get("platform");
  const store = storeById(sp.get("store"));
  const page = Math.min(MAX_PAGE, Math.max(1, Number.parseInt(sp.get("page") ?? "1", 10) || 1));
  return {
    platform: store?.platform ?? channel(platform ?? "")?.id,
    store: store?.id,
    q: searchTerm(sp.get("q")) || undefined,
    page,
  };
}

async function onePlatform<T>(kind: "orders" | "products", platform: SellPlatform, q: ListQuery, limit: number, page: number,
  shape: (r: unknown, p: SellPlatform) => T | null) {
  const store = q.store ? await storeKey(q.store) : undefined;
  const sortBy = kind === "orders" ? "createdAt" : "_id";
  const r = await read(`/${platform}/${kind}?${qs({ limit, page, sortBy, sortOrder: -1, store: store ?? undefined, search: q.q })}`, 60_000);
  const { rows, total } = listOf(r.data);
  const out: T[] = [];
  for (const x of rows) {
    const row = shape(x, platform);
    if (!row) continue;
    if (kind === "orders") {
      const sale = row as unknown as Sale;
      sale.detail = remember(sale.id, x);
    }
    out.push(row);
  }
  return { rows: out, total, r };
}

/** the channels read from the API; the others are generated (lib/demo/sample.ts) */
const REAL = CHANNELS.filter((c) => fromApi(c.id)).map((c) => c.id);
type Gen<T> = (q: { now: number; platform?: string; store?: string; q?: string; offset?: number; limit?: number }) => { rows: T[]; total: number };
/** A generated answer's moment, as if read through the same cache as the real ones (a new read every `ttl`). */
function snapshot(ttl: number, now = Date.now()): number {
  const at = (k: number) => k * ttl + 150 + ((k * 7919) % 850);
  const k = Math.floor(now / ttl);
  return at(k) <= now ? at(k) : at(k - 1);
}
const generated = (t: number) => ({ at: new Date(t).toISOString(), stale: false });

// Every channel in one list: the first `page × 20` of each, merged by time (so paging stays short, up to page 25).
async function allPlatforms<T>(kind: "orders" | "products", q: ListQuery, shape: (r: unknown, p: SellPlatform) => T | null, time: (x: T) => string, gen: Gen<T>) {
  const limit = PER * q.page;
  const real = await Promise.all(REAL.map((p) => onePlatform(kind, p, q, limit, 1, shape)));
  const more = gen({ now: Math.min(...real.map((r) => r.r.at)), q: q.q, limit });
  const rows = [...real.flatMap((r) => r.rows), ...more.rows].sort((x, y) => time(y).localeCompare(time(x))).slice(PER * (q.page - 1), PER * q.page);
  const total = real.reduce((n, r) => n + r.total, more.total);
  return { page: pageOf(rows, total, q.page, PER), ...oldest(...real.map((r) => r.r)) };
}

async function list<T>(kind: "orders" | "products", q: ListQuery, shape: (r: unknown, p: SellPlatform) => T | null, time: (x: T) => string, gen: Gen<T>): Promise<Live<Page<T>>> {
  if (!q.platform) {
    const { page, ...live } = await allPlatforms(kind, q, shape, time, gen);
    return { data: page, ...live };
  }
  if (SAMPLE.isPlatform(q.platform)) {
    const now = snapshot(60_000);
    const r = gen({ now, platform: q.platform, store: q.store, q: q.q, offset: PER * (q.page - 1), limit: PER });
    return { data: pageOf(r.rows, r.total, q.page, PER), ...generated(now) };
  }
  const one = await onePlatform(kind, q.platform, q, PER, q.page, shape);
  return { data: pageOf(one.rows, one.total, q.page, PER), ...oldest(one.r) };
}

export const sales = (q: ListQuery): Promise<Live<Page<Sale>>> => list("orders", q, saleOf, (s) => s.soldAt ?? "", SAMPLE.sales);
export const listings = (q: ListQuery): Promise<Live<Page<Listing>>> => list("products", q, listingOf, (s) => s.at ?? "", SAMPLE.listings);

/** Linked products for one store (default StockX EU): a Picqer product and the marketplace stores it is linked to. */
export async function linked(q: ListQuery): Promise<Live<Page<Linked>>> {
  if (q.store && SAMPLE.isStore(q.store)) {
    const now = snapshot(60_000);
    return { data: SAMPLE.linked({ now, store: q.store, q: q.q, page: q.page, per: PER }), ...generated(now) };
  }
  const key = await storeKey(q.store ?? STORES[0].id);
  const r = await read(`/product-match?${qs({ limit: PER, page: q.page, store: key ?? undefined, search: q.q })}`, 60_000);
  const { rows, total } = listOf(r.data);
  const out = rows.map((x) => {
    // the generated channels a real product is linked to follow from its code (the same in its drawer)
    const row = SAMPLE.withLinks(linkedOf(x));
    row.detail = remember(row.id, x);
    return row;
  });
  return { data: pageOf(out, total, q.page, PER), ...oldest(r) };
}

/** One product the demo has listed (by its row key): Picqer's record and live stock, its links, its Alias listings. */
export async function product(rowKey: string): Promise<Live<Product> | null> {
  const pid = products.get(rowKey);
  if (!pid) {
    // a generated row's key reads back to its product (lib/demo/sample.ts); any other key opens nothing
    const now = Date.now();
    const p = SAMPLE.product(rowKey, now);
    return p ? { data: p, ...generated(Math.max(snapshot(5 * 60_000, now), now - 60_000)) } : null;
  }
  const T = 5 * 60_000;
  const [p, stock, matches, al] = await Promise.all([
    read(`/picqer/products/${pid}`, T),
    read(`/picqer/products/${pid}/stock`, T).catch(() => ({ data: null, at: Date.now(), stale: true })),
    read(`/picqer/products/${pid}/matches`, T),
    read(`/alias/products/${pid}/active-listings`, T).catch(() => ({ data: null, at: Date.now(), stale: true })),
  ]);
  return { data: SAMPLE.withProductLinks(productOf({ product: p.data, stock: stock.data, matches: matches.data, aliasListings: al.data })), ...oldest(p, matches) };
}

/* ---------- requests: one key per answer, the disk copy when the live answer is slow, the refresher ---------- */

/** What the page asked for, as one normalised key (the disk copy's name) and the work that answers it; null = no such view. */
export function demoRequest(view: string, sp: URLSearchParams): { key: string; run: () => Promise<Live<unknown> | null> } | null {
  switch (view) {
    case "overview":
      return { key: "overview", run: overview };
    case "sales":
    case "listings":
    case "linked": {
      const q = listQuery(sp);
      const run = view === "sales" ? sales : view === "listings" ? listings : linked;
      return { key: `${view}?${qs({ platform: q.platform, store: q.store, q: q.q, page: q.page })}`, run: () => run(q) };
    }
    case "product": {
      const id = sp.get("id") ?? "";
      return /^[a-z0-9]{1,10}$/.test(id) ? { key: `product?id=${id}`, run: () => product(id) } : { key: "product", run: async () => null };
    }
    default:
      return null;
  }
}

// the overview and the first page of every list without a search: what a visitor sees first
const storable = (key: string) => key === "overview" || (/^(sales|listings|linked)\?/.test(key) && /(^|[?&])page=1($|&)/.test(key) && !/[?&]q=/.test(key));
// with a disk copy in hand, a live answer gets this long before the copy is sent instead (an answer from copies in
// memory takes a few ms; only a server that has just started has to read the client's API first)
const FIRST_MS = 300;
let lastUse = 0;

/** The answer for one request: live when it comes quickly (and then kept on disk), else the last good one from disk.
 * Throws only when there is neither. */
export async function answer(key: string, run: () => Promise<Live<unknown> | null>): Promise<Live<unknown> | null> {
  lastUse = Date.now();
  const keep = storable(key);
  const saved = keep ? answers().get<Live<unknown>>(key) : undefined;
  if (!keep) answers(); // the row key → product map comes with the store
  const work = run().then((a) => {
    if (a && keep) answers().put(key, a);
    if (a) saveProducts();
    return a;
  });
  if (!saved) return work;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const first = await Promise.race([
    work.then((a) => ({ a })),
    new Promise<null>((r) => (timer = setTimeout(() => r(null), FIRST_MS))),
  ]).catch(() => null);
  clearTimeout(timer);
  if (first) return first.a;
  work.catch(() => {}); // it still finishes behind this answer and updates the copy
  return { ...saved, stale: saved.stale || Date.now() - Date.parse(saved.at) > STALE_SHOW_MS };
}

// What the refresher keeps fresh: the views a visitor opens first, for every account read from the API.
const REAL_STORES = STORES.filter((s) => fromApi(s.platform)).map((s) => s.id);
const WARM: string[] = [
  "overview",
  "sales?page=1",
  "listings?page=1",
  ...REAL.flatMap((p) => [`sales?platform=${p}&page=1`, `listings?platform=${p}&page=1`]),
  ...REAL_STORES.map((s) => `linked?store=${s}&page=1`), // the Products page always names its account
];

let refreshing = false;
/** One round: every warm view once (stale copies start their fresh reads), then again once those reads are in, and
 * the answers saved. */
export async function refreshDemo(): Promise<void> {
  if (refreshing) return;
  refreshing = true;
  try {
    const jobs = WARM.map((k) => {
      const [view, query = ""] = k.split("?");
      return demoRequest(view, new URLSearchParams(query))!;
    });
    await Promise.allSettled(jobs.map((j) => j.run()));
    await reads.settle();
    const done = await Promise.allSettled(jobs.map((j) => j.run()));
    done.forEach((r, i) => {
      if (r.status === "fulfilled" && r.value) answers().put(jobs[i].key, r.value);
    });
    saveProducts();
    answers().flush();
  } finally {
    refreshing = false;
  }
}

let ticking: ReturnType<typeof setInterval> | null = null;
/** From instrumentation.ts: a round at start, then every minute while the demo was used in the last 20 minutes and every
 * 10 minutes otherwise; every other minute this server also loads the demo page for itself, so it stays in memory
 * (a server-side load logs no tracking event). */
export function startDemoRefresh() {
  if (ticking || process.env.NODE_ENV !== "production") return;
  const self = `http://127.0.0.1:${process.env.PORT || 3000}`;
  let n = 0;
  const tick = () => {
    n += 1;
    if (Date.now() - lastUse < 20 * 60_000 || n % 10 === 0) refreshDemo().catch(() => {});
    if (n % 2 === 0) fetch(`${self}/demo/multi-platform-sync`, { cache: "no-store", signal: AbortSignal.timeout(15_000) }).then((r) => r.arrayBuffer()).catch(() => {});
  };
  ticking = setInterval(tick, 60_000);
  ticking.unref?.();
  setTimeout(() => refreshDemo().catch(() => {}), 3_000).unref?.();
}

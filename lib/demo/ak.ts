// Server side of the live demo: reads the client's sync API (ak-api) and hands the page shaped data (lib/demo/shape.ts).
// Only the GET reads listed here are ever called, with parameters built here (a page number, a store, a cleaned search
// term), never a path from the browser. Answers are kept in memory for a short while, so visitors share one call; when
// the API is slow or down the last good answer is used and marked stale.
import {
  STORES, listOf, listingOf, linkedOf, overviewOf, pageOf, picqerId, productOf, saleOf, searchTerm, storeById,
  type Linked, type Listing, type Overview, type Page, type Product, type Sale, type SellPlatform, type StoreId,
} from "@/lib/demo/shape";

const BASE = `${(process.env.AK_API_URL ?? "https://ak-api.coelor.com").replace(/\/+$/, "")}/api/v1`;
const TIMEOUT_MS = 6000;
const STALE_MS = 6 * 60 * 60 * 1000; // an old answer beats none for this long
const MAX_ENTRIES = 300;

type Entry = { at: number; data?: unknown; wait?: Promise<unknown> };
const cache = new Map<string, Entry>();

export type Live<T> = { data: T; at: string; stale: boolean };

async function read(path: string, ttlMs: number): Promise<{ data: unknown; at: number; stale: boolean }> {
  const hit = cache.get(path);
  const now = Date.now();
  if (hit?.data !== undefined && now - hit.at < ttlMs) return { data: hit.data, at: hit.at, stale: false };
  if (hit?.wait) {
    const data = await hit.wait.catch(() => undefined);
    const e = cache.get(path);
    if (data !== undefined && e?.data !== undefined) return { data: e.data, at: e.at, stale: false };
  }
  const wait = fetch(`${BASE}${path}`, { cache: "no-store", signal: AbortSignal.timeout(TIMEOUT_MS), headers: { accept: "application/json" } })
    .then((r) => {
      if (!r.ok) throw new Error(`ak-api ${r.status}`);
      return r.json() as Promise<unknown>;
    });
  cache.set(path, { at: hit?.at ?? 0, data: hit?.data, wait });
  try {
    const data = await wait;
    cache.set(path, { at: Date.now(), data });
    if (cache.size > MAX_ENTRIES) cache.delete(cache.keys().next().value as string);
    return { data, at: Date.now(), stale: false };
  } catch (err) {
    cache.set(path, { at: hit?.at ?? 0, data: hit?.data });
    if (hit?.data !== undefined && now - hit.at < STALE_MS) return { data: hit.data, at: hit.at, stale: true };
    throw err;
  }
}

// Row key → Picqer product id, for the rows the demo has shown, so the browser opens a product by its row key only.
const products = new Map<string, string>();
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
  const [cron, stats, sx, al, sxListings, alListings] = await Promise.all([
    read("/cron/status", T),
    read("/product-match/stats", 5 * 60_000),
    read(`/stockx/orders?${qs({ limit: 120, sortBy: "createdAt", sortOrder: -1 })}`, T),
    read(`/alias/orders?${qs({ limit: 120, sortBy: "createdAt", sortOrder: -1 })}`, T),
    read(`/stockx/products?${qs({ limit: 1 })}`, 5 * 60_000),
    read(`/alias/products?${qs({ limit: 1 })}`, 5 * 60_000),
  ]);
  const data = overviewOf({ cron: cron.data, stats: stats.data, sx: sx.data, al: al.data, sxListings: sxListings.data, alListings: alListings.data });
  for (const [raw, platform] of [[sx.data, "stockx"], [al.data, "alias"]] as const) {
    for (const x of listOf(raw).rows) {
      const s = saleOf(x, platform);
      if (s) remember(s.id, x);
    }
  }
  for (const s of data.feed) s.detail = products.has(s.id);
  if (data.kpis.lastSale) data.kpis.lastSale.detail = products.has(data.kpis.lastSale.id);
  return { data, ...oldest(cron, sx, al) };
}

export type ListQuery = { platform?: SellPlatform; store?: StoreId; q?: string; page: number };
const PER = 20;
const MAX_PAGE = 25;

export function listQuery(sp: URLSearchParams): ListQuery {
  const platform = sp.get("platform");
  const store = storeById(sp.get("store"));
  const page = Math.min(MAX_PAGE, Math.max(1, Number.parseInt(sp.get("page") ?? "1", 10) || 1));
  return {
    platform: store?.platform ?? (platform === "stockx" || platform === "alias" ? platform : undefined),
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

// Both platforms in one list: the first `page × 20` of each, merged by time (so paging stays short, up to page 25).
async function bothPlatforms<T>(kind: "orders" | "products", q: ListQuery, shape: (r: unknown, p: SellPlatform) => T | null, time: (x: T) => string) {
  const limit = PER * q.page;
  const [a, b] = await Promise.all([
    onePlatform(kind, "stockx", q, limit, 1, shape),
    onePlatform(kind, "alias", q, limit, 1, shape),
  ]);
  const rows = [...a.rows, ...b.rows].sort((x, y) => time(y).localeCompare(time(x))).slice(PER * (q.page - 1), PER * q.page);
  return { page: pageOf(rows, a.total + b.total, q.page, PER), ...oldest(a.r, b.r) };
}

export async function sales(q: ListQuery): Promise<Live<Page<Sale>>> {
  if (!q.platform) {
    const { page, ...live } = await bothPlatforms("orders", q, saleOf, (s) => s.soldAt ?? "");
    return { data: page, ...live };
  }
  const one = await onePlatform("orders", q.platform, q, PER, q.page, saleOf);
  return { data: pageOf(one.rows, one.total, q.page, PER), ...oldest(one.r) };
}

export async function listings(q: ListQuery): Promise<Live<Page<Listing>>> {
  if (!q.platform) {
    const { page, ...live } = await bothPlatforms("products", q, listingOf, (s) => s.at ?? "");
    return { data: page, ...live };
  }
  const one = await onePlatform("products", q.platform, q, PER, q.page, listingOf);
  return { data: pageOf(one.rows, one.total, q.page, PER), ...oldest(one.r) };
}

/** Linked products for one store (default StockX EU): a Picqer product and the marketplace stores it is linked to. */
export async function linked(q: ListQuery): Promise<Live<Page<Linked>>> {
  const key = await storeKey(q.store ?? STORES[0].id);
  const r = await read(`/product-match?${qs({ limit: PER, page: q.page, store: key ?? undefined, search: q.q })}`, 60_000);
  const { rows, total } = listOf(r.data);
  const out = rows.map((x) => {
    const row = linkedOf(x);
    row.detail = remember(row.id, x);
    return row;
  });
  return { data: pageOf(out, total, q.page, PER), ...oldest(r) };
}

/** One product the demo has listed (by its row key): Picqer's record and live stock, its links, its Alias listings. */
export async function product(rowKey: string): Promise<Live<Product> | null> {
  const pid = products.get(rowKey);
  if (!pid) return null;
  const T = 5 * 60_000;
  const [p, stock, matches, al] = await Promise.all([
    read(`/picqer/products/${pid}`, T),
    read(`/picqer/products/${pid}/stock`, T).catch(() => ({ data: null, at: Date.now(), stale: true })),
    read(`/picqer/products/${pid}/matches`, T),
    read(`/alias/products/${pid}/active-listings`, T).catch(() => ({ data: null, at: Date.now(), stale: true })),
  ]);
  return { data: productOf({ product: p.data, stock: stock.data, matches: matches.data, aliasListings: al.data }), ...oldest(p, matches) };
}

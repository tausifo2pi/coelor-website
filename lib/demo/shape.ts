// The live demo's answer shapes (/demo/multi-platform-sync): what every view gets, as lib/demo/sample.ts generates it
// and components/demo reads it. Only the fields the demo shows: neutral store ids, masked order references, no
// database ids, listing ids, bin names, barcodes or prices. Pure (no I/O, no "@/" imports), so
// `node --test lib/demo/shape.test.mts` can check it.

import { CHANNELS, PICQER, isCore, type Channel, type Platform, type SellPlatform } from "./channels.ts";
export type { Platform, SellPlatform };

/** the accounts of lib/demo/channels.ts */
export type StoreId = "sx-eu" | "sx-us" | "al-main" | "al-usa" | "sh-main" | "wn-main";
export type Store = { id: StoreId; platform: SellPlatform; label: string };

export const STORES: Store[] = CHANNELS.flatMap((c) => c.accounts.map((a) => ({ id: a.id as StoreId, platform: c.id, label: a.label })));
const BY_ID = new Map(STORES.map((s) => [s.id, s]));
export const storeById = (id: unknown): Store | null => (typeof id === "string" && BY_ID.get(id as StoreId)) || null;

export const join = (xs: string[]) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);

/* ---------- sales, listings, linked products, one product ---------- */

/** What the sync did for one sale, as the demo tells it. */
export type Step = { kind: "stock" | "pulled" | "restock" | "flag"; text: string };

export type Sale = {
  id: string;
  platform: SellPlatform;
  store: StoreId;
  storeLabel: string;
  product: string;
  style: string;
  size: string;
  /** "•••FSG": enough to look like an order, not enough to find one */
  ref: string;
  /** Sold, Shipped, Being checked or Cancelled */
  state: string;
  soldAt: string | null;
  syncedAt: string | null;
  steps: Step[];
  /** the product can be opened */
  detail: boolean;
};

export type Listing = { id: string; platform: SellPlatform; store: StoreId; storeLabel: string; product: string; style: string; size: string; at: string | null };

export type Linked = {
  id: string;
  code: string;
  /** only when an Alias link gives one (Picqer's own name is in the drawer) */
  name: string;
  color: string;
  us: string;
  eu: string;
  links: { store: StoreId; storeLabel: string; platform: SellPlatform; style: string; size: string }[];
  linkedAt: string | null;
  detail: boolean;
};

/** One product as the drawer shows it: Picqer's record, its stock, the stores it is linked to, its Alias listings. */
export type Product = {
  name: string;
  code: string;
  color: string;
  us: string;
  eu: string;
  /** the product photo: a drawing as an SVG data URL (lib/demo/art.ts), never an address on another site */
  image: string | null;
  photoAt: string | null;
  stock: { free: number; total: number; reserved: number } | null;
  links: { store: StoreId; storeLabel: string; platform: SellPlatform; name: string; style: string; size: string; at: string | null }[];
  aliasListings: { storeLabel: string; count: number }[];
};

/* ---------- jobs and connections ---------- */

export type JobStatus = "ok" | "running" | "late" | "error";
export type Job = { key: string; name: string; platform: Platform; every: string; lastRun: string; status: JobStatus };
export type JobMeta = { name: string; platform: Platform; min: number; every: string };

/** The build's own jobs (StockX, Alias and Picqer), in the order the automations list shows them: the demo's name, the
 * platform it serves, how often it runs. The slots' order and stock jobs are named after their channel
 * (lib/demo/sample.ts). */
export function jobsMeta(channels: readonly Channel[] = CHANNELS): Record<string, JobMeta> {
  return {
    "stockx-orders": { name: "StockX sales into Picqer", platform: "stockx", min: 5, every: "every 5 min" },
    "alias-orders": { name: "Alias sales into Picqer", platform: "alias", min: 7, every: "every 7 min" },
    "zero-stock": { name: `Sold-out sizes pulled from ${join(channels.map((c) => c.name))}`, platform: "picqer", min: 10, every: "every 10 min" },
    "stockx-products": { name: "StockX listings checked", platform: "stockx", min: 8, every: "every 8 min" },
    "alias-listings": { name: "Alias active listings checked", platform: "alias", min: 10, every: "every 10 min" },
    "alias-restock": { name: "Alias cancellations back into stock", platform: "alias", min: 480, every: "every 8 hours" },
    "picqer-products": { name: "New Picqer products linked", platform: "picqer", min: 540, every: "every 9 hours" },
    "picqer-images": { name: "Product photos added in Picqer", platform: "picqer", min: 360, every: "every 6 hours" },
    "alias-products": { name: "Alias catalogue refreshed", platform: "alias", min: 1440, every: "daily" },
  };
}
export const JOBS = jobsMeta();

export type Connection = {
  platform: Platform;
  name: string;
  role: string;
  accounts: string[];
  syncs: string[];
  lastSync: string | null;
  healthy: boolean;
};

/** One card per sales channel that has jobs (the build's own marketplaces always), then Picqer. Every card has the
 * same fields: nothing in the answer tells the channels apart. */
export function connectionsOf(jobs: Job[], channels: readonly Channel[] = CHANNELS): Connection[] {
  const of = (p: Job["platform"]) => jobs.filter((j) => j.platform === p);
  const last = (js: Job[]) => js.reduce<string | null>((a, j) => (!a || j.lastRun > a ? j.lastRun : a), null);
  const ok = (js: Job[]) => js.length > 0 && js.every((j) => j.status === "ok" || j.status === "running");
  const shown = channels.filter((c) => isCore(c.id) || of(c.id).length > 0);
  const pq = of("picqer");
  return [
    ...shown.map((c): Connection => ({
      platform: c.id, name: c.name, role: c.role, accounts: c.accounts.map((a) => a.label), lastSync: last(of(c.id)), healthy: ok(of(c.id)), syncs: c.syncs,
    })),
    { platform: "picqer", name: PICQER.name, role: "Warehouse, counts the stock", accounts: ["1 warehouse"], lastSync: last(jobs), healthy: ok(pq),
      syncs: ["Every sale takes one off the stock", `New products linked to ${join(shown.map((c) => c.name))}`, "Product photos filled in"] },
  ];
}

/* ---------- pages and the overview ---------- */

export type Page<T> = { rows: T[]; total: number; page: number; pages: number };

export function pageOf<T>(rows: T[], total: number, page: number, per: number): Page<T> {
  return { rows, total, page, pages: Math.max(1, Math.ceil(total / per)) };
}

export type Overview = {
  at: string;
  kpis: {
    sales24h: Record<SellPlatform, number> & { more: boolean };
    salesTotal: Record<SellPlatform, number>;
    products: { total: number; linked: number };
    listings: Record<SellPlatform, number>;
    lastSale: Sale | null;
    jobs: { ok: number; total: number };
  };
  connections: Connection[];
  jobs: Job[];
  feed: Sale[];
  /** the live-selling channel's show on air, else its next one (null: none planned; absent: no live channel) */
  nextShow?: { platform: SellPlatform; start: string; end: string; models: number } | null;
};

/** A search term as the page sends it: letters, digits, spaces and dashes only, 40 characters. */
export function searchTerm(q: unknown): string {
  return typeof q === "string" ? q.replace(/[^A-Za-z0-9 \-]/g, " ").replace(/\s+/g, " ").trim().slice(0, 40) : "";
}

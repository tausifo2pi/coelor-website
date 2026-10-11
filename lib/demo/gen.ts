// The live demo's answers (/demo/multi-platform-sync), built where they are asked for: the page's reads of
// /api/demo/{overview,sales,listings,linked,product} are answered by demoGet in the browser, with no network call, from
// the generated world of lib/demo/sample.ts. app/api/demo/[view]/route.ts answers the same paths the same way, for
// pages an older script still has open. Every answer is as of the same 30-second moment, so a page and the dashboard
// agree and paging stays still while a visitor clicks through.
// Pure (no I/O, no "@/" imports): `node --test lib/demo/gen.test.mts`.

import { channel } from "./channels.ts";
import { sampleWorld, type SampleWorld } from "./sample.ts";
import { STORES, pageOf, searchTerm, storeById, type SellPlatform, type StoreId } from "./shape.ts";

export type Live<T> = { data: T; at: string; stale: boolean };

/** answers move on in steps of this (the dashboard reads the overview every 30 seconds) */
export const STEP_MS = 30_000;
export const momentOf = (now: number) => Math.floor(now / STEP_MS) * STEP_MS;
const PER = 20;
/** the pager shows at most 25 pages (components/demo/ui.tsx Pager) */
const MAX_PAGE = 25;

let world: SampleWorld | null = null;
/** built on first use: the days it generates are kept for the visit */
const W = () => (world ??= sampleWorld());

export type ListQuery = { platform?: SellPlatform; store?: StoreId; q?: string; page: number };

/** A list's query as the page sends it: a known channel or account, a cleaned search term, a page from 1 to 25. */
export function listQuery(sp: URLSearchParams): ListQuery {
  const store = storeById(sp.get("store"));
  const page = Math.min(MAX_PAGE, Math.max(1, Number.parseInt(sp.get("page") ?? "1", 10) || 1));
  return { platform: store?.platform ?? channel(sp.get("platform") ?? "")?.id, store: store?.id, q: searchTerm(sp.get("q")) || undefined, page };
}

/** The answer to one view at `now` (null: no such view, or no such product). */
export function demoAnswer(view: string, sp: URLSearchParams, now = Date.now()): Live<unknown> | null {
  const t = momentOf(now);
  const live = <T>(data: T): Live<T> => ({ data, at: new Date(t).toISOString(), stale: false });
  switch (view) {
    case "overview":
      return live(W().overview(t));
    case "sales":
    case "listings": {
      const q = listQuery(sp);
      const args = { now: t, platform: q.platform, store: q.store, q: q.q, offset: PER * (q.page - 1), limit: PER };
      const r = view === "sales" ? W().sales(args) : W().listings(args);
      return live(pageOf<unknown>(r.rows, r.total, q.page, PER));
    }
    case "linked": {
      const q = listQuery(sp);
      // the products page always names its account; without one, the first
      return live(W().linked({ now: t, store: q.store ?? STORES[0].id, q: q.q, page: q.page, per: PER }));
    }
    case "product": {
      const id = sp.get("id") ?? "";
      const p = /^[a-z0-9]{1,10}$/.test(id) ? W().product(id, t) : null;
      return p ? live(p) : null;
    }
    default:
      return null;
  }
}

/** The page's read of an /api/demo/* path ("/api/demo/sales?platform=stockx&page=2"), answered here. A view or product
 * that doesn't exist rejects, as a "not found" did. */
export function demoGet<T>(path: string, now?: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    // after the current event, so a click paints its loading state before the first (larger) answer is built
    setTimeout(() => {
      try {
        const [p, query = ""] = path.split("?");
        const a = demoAnswer(p.replace(/^\/api\/demo\//, "").replace(/\/+$/, ""), new URLSearchParams(query), now ?? Date.now());
        if (a) resolve(a as T);
        else reject(new Error("demo: not found"));
      } catch (err) {
        reject(err);
      }
    }, 0);
  });
}

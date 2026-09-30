// Server-side only (used by server components). Dynamic case study: the platform mix of one outreach email, asked from the lead-outreach service over the server's
// internal network (no public route). Only platform names, a vocabulary and angle codes come back, never anything
// about the reader's own store. No token means the real client's story. A token without an answer (unknown, slow or down
// service) gets the neutral mix: the page told for "your web store" in general words, never the sneaker story. Answers
// are cached, see below.

import { platformInfo } from "@/lib/platforms";

/** own: the reader uses it (lead-outreach v3 sends only those; a record made before v3 may carry others, own false) */
export type CasePlatform = { name: string; slug: string; kind: "sell" | "system"; own?: boolean };
export type CaseWords = { item: string; items: string; variant: string; variants: string };
export type CaseMix = { platforms: CasePlatform[]; words: CaseWords; angle: string[] };

const BASE = process.env.LO_INTERNAL_URL ?? "http://lead-outreach:3100";
const TOKEN = /^[A-Za-z0-9_-]{6,32}$/;
const WORD = /^[a-z][a-z -]{0,23}$/;

const str = (x: unknown, max: number) => (typeof x === "string" && x.length > 0 && x.length <= max ? x : null);

function valid(x: unknown): CaseMix | null {
  if (!x || typeof x !== "object") return null;
  const o = x as Record<string, unknown>;
  const platforms = (Array.isArray(o.platforms) ? o.platforms : [])
    .map((p): CasePlatform | null => {
      const r = (p ?? {}) as Record<string, unknown>;
      const name = str(r.name, 40), slug = str(r.slug, 40), kind = r.kind === "sell" || r.kind === "system" ? r.kind : null;
      // only platforms a page may name (lib/platforms.ts), in the role they have there
      return name && slug && kind && platformInfo(slug)?.kind === kind ? { name, slug, kind, own: r.own !== false } : null;
    })
    .filter((p): p is CasePlatform => p !== null)
    .slice(0, 4);
  const w = (o.words ?? {}) as Record<string, unknown>;
  const words: CaseWords = { item: "item", items: "items", variant: "variant", variants: "variants" };
  for (const k of Object.keys(words) as (keyof CaseWords)[]) if (typeof w[k] === "string" && WORD.test(w[k] as string)) words[k] = w[k] as string;
  const angle = (Array.isArray(o.angle) ? o.angle : []).filter((a): a is string => typeof a === "string" && /^[a-z_]{1,32}$/.test(a)).slice(0, 12);
  return { platforms, words, angle };
}

export const NEUTRAL_MIX: CaseMix = { platforms: [], words: { item: "item", items: "items", variant: "variant", variants: "variants" }, angle: [] };

// The server is small (1 GB): after a quiet spell the first lookup can take ~3 s while the service's code and database
// connection come back into memory. That used to hit a 1.5 s timeout, and a reader saw the neutral page (no logos, no
// demo button) on their first visit. So: wait up to 4 s, keep every answer (fresh 10 min, and as a fallback for a day),
// and keep the lookup warm with a small request every minute (startKeepWarm, from instrumentation.ts).
const TIMEOUT_MS = 4000;
const FRESH_MS = 10 * 60_000;
const KEEP_MS = 24 * 60 * 60_000;
const MAX_CACHED = 5000;
const cache = new Map<string, { at: number; mix: CaseMix }>();

function remember(token: string, mix: CaseMix) {
  cache.delete(token);
  cache.set(token, { at: Date.now(), mix });
  if (cache.size > MAX_CACHED) cache.delete(cache.keys().next().value as string);
}

/** null = no email token (the real client's story); otherwise the reader's mix, or the neutral one. */
export async function fetchCaseMix(token: string | null | undefined, timeoutMs = TIMEOUT_MS): Promise<CaseMix | null> {
  if (!token || !TOKEN.test(token)) return null;
  startKeepWarm();
  const hit = cache.get(token);
  if (hit && Date.now() - hit.at < FRESH_MS) return hit.mix;
  try {
    const res = await fetch(`${BASE}/internal/case/${encodeURIComponent(token)}`, { cache: "no-store", signal: AbortSignal.timeout(timeoutMs) });
    if (res.ok || res.status === 404) {
      // 404: a token the service doesn't know (the neutral page, and no need to ask again for a while)
      const mix = (res.ok ? valid(await res.json()) : null) ?? NEUTRAL_MIX;
      remember(token, mix);
      return mix;
    }
    throw new Error(`lead-outreach ${res.status}`);
  } catch {
    // slow or down: the last answer beats the neutral page (not cached, so the next visit asks again)
    return hit && Date.now() - hit.at < KEEP_MS ? hit.mix : NEUTRAL_MIX;
  }
}

let warming: ReturnType<typeof setInterval> | null = null;
/** Keep the case page in memory: every minute the lookup on lead-outreach with an unknown token (two small reads, no
 * writes), and every other minute this server renders the case page and its preview route for itself (a server-side
 * render logs no tracking event). */
export function startKeepWarm() {
  if (warming || process.env.NODE_ENV !== "production") return;
  const self = `http://127.0.0.1:${process.env.PORT || 3000}`;
  const get = (url: string) => fetch(url, { cache: "no-store", signal: AbortSignal.timeout(15_000) }).then((r) => r.arrayBuffer()).catch(() => {});
  let n = 0;
  const ping = () => {
    get(`${BASE}/internal/case/zzwarm00`);
    if (n++ % 2 === 0) {
      get(`${self}/case-studies/stock-sync`);
      get(`${self}/p/zzwarm00`);
    }
  };
  warming = setInterval(ping, 60_000);
  warming.unref?.();
  setTimeout(ping, 5_000).unref?.();
}

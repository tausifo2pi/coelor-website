// Server-side only (used by server components). Dynamic case study: the platform mix of one outreach email, asked from the lead-outreach service over the server's
// internal network (no public route). Only platform names, a vocabulary and angle codes come back, never anything
// about the reader's own store. No token means the real client's story. A token without an answer (unknown, slow or down
// service) gets the neutral mix: the page told for "your web store" in general words, never the sneaker story.

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

/** null = no email token (the real client's story); otherwise the reader's mix, or the neutral one. */
export async function fetchCaseMix(token: string | null | undefined): Promise<CaseMix | null> {
  if (!token || !TOKEN.test(token)) return null;
  try {
    const res = await fetch(`${BASE}/internal/case/${encodeURIComponent(token)}`, { cache: "no-store", signal: AbortSignal.timeout(1500) });
    return (res.ok ? valid(await res.json()) : null) ?? NEUTRAL_MIX;
  } catch {
    return NEUTRAL_MIX;
  }
}

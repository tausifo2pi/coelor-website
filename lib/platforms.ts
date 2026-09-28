import registry from "@/data/platforms.json";

// The platforms a case page may name, with their icons (data/platforms.json, made from lead-outreach's vocabulary). It is
// also the allowlist: a platform that is not in here (a competitor, a shipping tool, anything unknown) is never shown.

export type PlatformInfo = { name: string; kind: "sell" | "system"; type: string; logo?: string; bleed?: boolean };

const P = registry.platforms as Record<string, PlatformInfo>;

export function platformInfo(slug: string): PlatformInfo | null {
  return Object.prototype.hasOwnProperty.call(P, slug) ? P[slug] : null;
}

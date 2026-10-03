// The shapes the case study's adaptation (lib/case-adapt.ts) is written for. Until 2026-10-03 the page asked the
// lead-outreach service for the platform mix of each reader's email and told the story with their own platforms; the
// user dropped that (no reader platform names on the case study), so the page is static and adaptCase gets null.

/** own: the reader uses it */
export type CasePlatform = { name: string; slug: string; kind: "sell" | "system"; own?: boolean };
export type CaseWords = { item: string; items: string; variant: string; variants: string };
export type CaseMix = { platforms: CasePlatform[]; words: CaseWords; angle: string[] };

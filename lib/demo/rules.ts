// What the Custom rules and Systems pages of both demos (components/demo/workspace/Rules.tsx, Systems.tsx) read from a
// demo client (lib/demo/clients.ts): the group a rule sits in, the systems of the build it touches, its recent runs,
// the build-log entry that shipped it, and the dates as the pages write them. Worked out from the rule's own words and
// the build's systems, so a rule added to clients.ts lands in the right group with the right logos without a second
// list to keep in step. Pure (no I/O, no "@/" imports): node --test loads it (lib/demo/rules.test.mts).
import type { BuildEntry, CustomRule, DemoClient, SystemSpec } from "./clients.ts";

/* ---------- groups ---------- */

export type RuleGroup = "Orders" | "Stock" | "Listings & photos" | "Reports";
export const RULE_GROUPS: readonly RuleGroup[] = ["Orders", "Stock", "Listings & photos", "Reports"];

// read on the rule's name and trigger only (its "then" often says "stock" or "listings" for an order rule too)
const LISTING_WORDS = /\bphotos?\b|\bnew (?:product|piece)\b|\bsize reader\b|\bname\b|\blisted\b/i;
const STOCK_WORDS = /\bsold[- ]out\b|\blast\b|\bguard\b|\bcancel|\breturns?\b|\brestock|\bhold\b|\breaches 0\b|\bstock\b/i;

/** Reports are the rules in reports/; then a rule about products and photos; then one that guards the stock; the
 * rest act on orders (sales coming in, labels, tracking). */
export function groupOf(r: CustomRule): RuleGroup {
  if (r.file.startsWith("reports/")) return "Reports";
  const head = `${r.name}. ${r.when}`;
  if (LISTING_WORDS.test(head)) return "Listings & photos";
  if (STOCK_WORDS.test(head)) return "Stock";
  return "Orders";
}

/* ---------- the systems a rule touches ---------- */

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const says = (text: string, words: string) => new RegExp(`(?:^|[^A-Za-z0-9])${esc(words)}(?![A-Za-z0-9])`, "i").test(text);

/** a place the client sells (a marketplace, a store, a live-selling app), from the system's kind */
export const sellsOn = (s: SystemSpec) => /\bmarketplace|\bstore\b|\bshop\b|\blive\b/i.test(s.kind);

/** The systems of the build a rule works with, in the order the build lists them: the ones it names (by name, or the
 * first word of a longer name like "Loop" for Loop Returns), the ones whose custom part names the rule, every sales
 * channel for "every channel" / "any marketplace" / "everywhere", and the system behind "the web store", "the team
 * chat", "a sheet" (a report lands in the team's sheet) or "the stock" (the warehouse). */
export function touches(r: CustomRule, systems: readonly SystemSpec[]): SystemSpec[] {
  const text = `${r.name}. ${r.when}. ${r.then}`;
  const hit = new Set<string>();
  const add = (pred: (s: SystemSpec) => boolean) => systems.filter(pred).forEach((s) => hit.add(s.slug));
  add((s) => {
    const first = s.name.split(" ")[0];
    return says(text, s.name) || (first !== s.name && first.length >= 4 && says(text, first)) || s.custom.toLowerCase().includes(r.name.toLowerCase());
  });
  if (/\b(?:every|any|its) (?:channel|marketplace)s?\b|\beverywhere\b/i.test(text)) add(sellsOn);
  if (/\bweb store\b/i.test(text)) add((s) => /web store/i.test(s.kind));
  if (/\bteam chat\b/i.test(text)) add((s) => /\bchat\b/i.test(s.kind));
  if (/\bsheet\b/i.test(text) || r.file.startsWith("reports/")) add((s) => /\bsheets?\b/i.test(s.kind));
  if (/\bstock\b/i.test(text)) add((s) => /warehouse/i.test(s.kind));
  return systems.filter((s) => hit.has(s.slug));
}

/** The rules of the build that touch one system (by its logo slug). */
export const rulesUsing = (c: DemoClient, slug: string): CustomRule[] => c.rules.filter((r) => touches(r, c.systems).some((s) => s.slug === slug));

/* ---------- runs ---------- */

/** Minutes between runs from a job's cadence ("every 5 min", "every 8 hours", "every hour", "daily at 7:00"); null for
 * a job that runs on events (webhooks, "real time"). */
export function everyMinutes(every: string): number | null {
  if (/real time/i.test(every)) return null;
  const min = every.match(/every (\d+) min/i);
  if (min) return Number(min[1]);
  const hours = every.match(/every (\d+) hours?/i);
  if (hours) return Number(hours[1]) * 60;
  if (/every hour/i.test(every)) return 60;
  if (/daily|every day/i.test(every)) return 1440;
  if (/weekly|every week/i.test(every)) return 10_080;
  return null;
}

// a small seeded generator (FNV-1a, then xorshift), so a rule's run history is the same on every render
function seed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0 || 1;
}
function next(h: number): number {
  h ^= h << 13;
  h ^= h >>> 17;
  h ^= h << 5;
  return h >>> 0;
}

export type Run = { at: string; secs: number };

/** The last `n` runs of a rule, newest first: the job's last run, then back by its cadence (a job on events: one every
 * 4 to 22 minutes), each with how long it took. Same answer for the same rule and last run. */
export function recentRuns(code: string, lastRun: string, every: string, n = 5): Run[] {
  const step = everyMinutes(every);
  let h = seed(code);
  let t = Date.parse(lastRun);
  const out: Run[] = [];
  for (let i = 0; i < n && Number.isFinite(t); i++) {
    h = next(h);
    out.push({ at: new Date(t).toISOString(), secs: Math.round(4 + (h % 23)) / 10 });
    h = next(h);
    t -= (step ?? 4 + (h % 19)) * 60_000;
  }
  return out;
}

/* ---------- build log and dates ---------- */

/** The build-log entry that shipped a rule (the one that went live on the day it was built). */
export const shippedIn = (c: DemoClient, r: CustomRule): BuildEntry | undefined => c.buildLog.find((b) => b.date === r.built);

/** "Northvale" for Northvale Kicks: how the team's own pages name the business */
export const shortName = (c: DemoClient) => c.name.split(" ")[0];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
// read from the ISO text, not through Date: "2026-03-23" stays the 23rd in every time zone
const ymd = (iso: string) => iso.slice(0, 10).split("-").map(Number) as [number, number, number];

/** "23 Mar 2026" */
export function dayDate(iso: string): string {
  const [y, m, d] = ymd(iso);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

/** "Mar 2026" */
export function monthDate(iso: string): string {
  const [y, m] = ymd(iso);
  return `${MONTHS[m - 1]} ${y}`;
}

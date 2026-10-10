// Small text helpers for the client workspace shell (sidebar head, build log, latest build), shared by the sneaker and
// the store demo. Plain functions, no "use client": the demo pages' metadata (server side) can use them too.
// Dates in lib/demo/clients.ts are plain ISO days ("2026-10-05"): they are read as written, never through Date, so a
// visitor's time zone can't move a release to the day before.
import { FERNHOLLOW, type BuildEntry, type DemoClient } from "@/lib/demo/clients";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function parts(iso: string): [number, number, number] {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return [y, m, d];
}

/** "Jan 2026" */
export function monthYear(iso: string): string {
  const [y, m] = parts(iso);
  return `${MONTHS[m - 1]} ${y}`;
}

/** "5 Oct" */
export function dayMonth(iso: string): string {
  const [, m, d] = parts(iso);
  return `${d} ${MONTHS[m - 1]}`;
}

/** "5 Oct 2026" */
export function fullDate(iso: string): string {
  const [y] = parts(iso);
  return `${dayMonth(iso)} ${y}`;
}

/** "Northvale Kicks' build", "Fernhollow's build": a name that already ends in s takes only the apostrophe. */
export function possessive(name: string): string {
  return /s$/i.test(name) ? `${name}'` : `${name}'s`;
}

/** "live in 1 day", "live in 3 days" (working days from the ask to live) */
export const liveIn = (days: number) => `live in ${days} day${days === 1 ? "" : "s"}`;

/** The build log, newest first (clients.ts keeps it oldest first, the order it was built in). */
export function newestFirst(log: BuildEntry[]): BuildEntry[] {
  return [...log].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

/** Median working days from the ask to live, rounded to whole days. */
export function medianDays(log: BuildEntry[]): number {
  if (!log.length) return 0;
  const xs = log.map((e) => e.days).sort((a, b) => a - b);
  const mid = Math.floor(xs.length / 2);
  return Math.round(xs.length % 2 ? xs[mid] : (xs[mid - 1] + xs[mid]) / 2);
}

/** "v3.2 · 13 releases since Jan 2026 · last change 5 Oct" (the build log's summary, after the build's name) */
export function buildSummary(c: DemoClient): string {
  const last = newestFirst(c.buildLog)[0];
  const n = c.buildLog.length;
  return [`v${c.version}`, `${n} release${n === 1 ? "" : "s"} since ${monthYear(c.since)}`, last ? `last change ${dayMonth(last.date)}` : ""].filter(Boolean).join(" · ");
}

// The store demos' clients by page slug (lib/storedemo/configs.ts). Kept here, next to the shell that shows them, so
// the store configs stay as they are; the sneaker demo (/demo/multi-platform-sync) is always Northvale Kicks.
const STORE_CLIENTS: Record<string, DemoClient> = { "womens-boutique": FERNHOLLOW };

/** The demo client a store demo is shown as; the boutique for a slug it doesn't know (there is one store demo today). */
export const storeClient = (slug: string): DemoClient => STORE_CLIENTS[slug] ?? FERNHOLLOW;

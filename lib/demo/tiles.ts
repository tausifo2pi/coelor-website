// The numbers on the demo dashboards' business tiles (lead-outreach PLAN_followups_custom_demo.md step 5b): what the
// owner of Northvale Kicks or Fernhollow checks first thing, worked out from the data the dashboard already has (the
// sneaker demo's overview; the store engine's orders, products and restocks). No number is made up on the side: each
// one is counted from those rows, or, where the overview only has totals, follows from them by a fixed rule, so the
// same moment always gives the same tiles. Pure (no I/O, no "@/" imports): `node --test lib/demo/tiles.test.mts`.

import { API_CHANNELS, CHANNELS, type SellPlatform } from "./channels.ts";
import type { Overview, Sale } from "./shape.ts";
import type { Happening, Order } from "../storedemo/types.ts";
import { WEEKDAYS, businessDaysAfter, dayStart, fromWall, wallOf, weekStart } from "./fields.ts";

const DAY = 86_400_000;

/* ==================== Northvale Kicks ==================== */

export type Split<K extends string = string> = { id: K; n: number }[];
export type SneakerTiles = {
  /** StockX and Alias sales of the last 24 h that still have to go out (StockX gives 2 business days) */
  toShip: { n: number; by: Split<SellPlatform>; firstDue: number };
  /** sizes the last-pair and sold-out guards pulled since Monday, and the newest one in the feed */
  pulled: { n: number; latest: { product: string; size: string; where: string; at: string | null } | null };
  /** Picqer products not linked to a StockX listing yet (the not-listed report) */
  notListed: { n: number; total: number; linked: number };
  /** pairs sold in the last 24 h, per channel */
  sold: { n: number; more: boolean; by: Split<SellPlatform> };
};

// share of a reseller's sales that are the last pair of a size (a size of one model rarely has more than 2 or 3 on the shelf)
const LAST_PAIR_SHARE = 0.08;

export function sneakerTiles(ov: Overview, now: number, o: { since: string; tz: string }): SneakerTiles {
  const k = ov.kpis;
  const n0 = (r: Partial<Record<SellPlatform, number>>, id: SellPlatform) => r[id] ?? 0;
  const recent = (s: Sale) => !!s.soldAt && now - Date.parse(s.soldAt) < DAY;
  // a pair at authentication has left the shelf; a cancelled one never ships
  const gone = (s: Sale) => s.state === "Shipped" || s.state === "Being checked" || s.state === "Cancelled";

  const toShip = API_CHANNELS.map((id) => ({
    id,
    n: Math.max(0, n0(k.sales24h, id) - ov.feed.filter((s) => s.platform === id && recent(s) && gone(s)).length),
  }));

  // since Monday: the pulls in the feed, or (the feed only holds the newest sales) the week so far at the build's own
  // average, whichever is more
  const monday = weekStart(now, o.tz);
  const days = Math.max(1, (now - Date.parse(o.since)) / DAY);
  const perDay = CHANNELS.reduce((s, c) => s + n0(k.salesTotal, c.id), 0) / days;
  const pulledFeed = ov.feed.filter((s) => s.steps.some((x) => x.kind === "pulled"));
  const thisWeek = pulledFeed.filter((s) => s.soldAt && Date.parse(s.soldAt) >= monday).length;
  const latest = pulledFeed[0];
  const where = latest?.steps.find((x) => x.kind === "pulled")?.text.replace(/^.*pulled from\s*/i, "") ?? "";

  return {
    toShip: { n: toShip.reduce((s, x) => s + x.n, 0), by: toShip, firstDue: businessDaysAfter(now - DAY, 2, o.tz) },
    pulled: {
      n: Math.max(thisWeek, Math.floor(perDay * ((now - monday) / DAY) * LAST_PAIR_SHARE)),
      latest: latest ? { product: latest.product, size: latest.size, where, at: latest.soldAt } : null,
    },
    notListed: { n: Math.max(0, k.products.total - k.products.linked), total: k.products.total, linked: Math.min(k.products.linked, k.products.total) },
    sold: { n: CHANNELS.reduce((s, c) => s + n0(k.sales24h, c.id), 0), more: !!k.sales24h.more, by: CHANNELS.map((c) => ({ id: c.id, n: n0(k.sales24h, c.id) })) },
  };
}

/* ==================== Fernhollow ==================== */

const ordersFrom = (orders: Order[], from: number, now: number) => orders.filter((x) => Date.parse(x.placedAt) >= from && Date.parse(x.placedAt) <= now);

/** Pieces sold since local midnight (cancelled orders left out), the takings, and the split per channel. */
export function soldToday(orders: Order[], now: number, tz: string, channels: { id: string }[]) {
  const today = ordersFrom(orders, dayStart(now, tz), now).filter((x) => x.state !== "Cancelled");
  const pieces = (xs: Order[]) => xs.reduce((s, x) => s + x.lines.length, 0);
  return {
    pieces: pieces(today),
    orders: today.length,
    revenue: Math.round(today.reduce((s, x) => s + x.total, 0)),
    by: channels.map((c) => ({ id: c.id, n: pieces(today.filter((x) => x.channel === c.id)) })),
  };
}

/** Paid orders still waiting for their label (rule F-04), by carrier, and where the day stands against the cut-off. */
export function labelsDue(orders: Order[], now: number, tz: string, cutoffHour: number, carriers: string[]) {
  const waiting = orders.filter((x) => x.state === "Paid");
  const w = wallOf(now, tz);
  const cutoff = fromWall(w.y, w.mo, w.d, cutoffHour, 0, tz);
  // no pickup on Sundays; after Saturday's cut-off the next one is Monday's
  const phase: "before" | "after" | "closed" = w.dow === 0 ? "closed" : now < cutoff ? "before" : "after";
  const nextDay = w.dow === 6 || w.dow === 0 ? "Monday" : "tomorrow";
  return {
    n: waiting.length,
    by: carriers.map((c) => ({ id: c, n: waiting.filter((x) => x.carrier === c).length })),
    cutoff,
    phase,
    nextDay,
  };
}

// a return parcel on its prepaid label reaches the stockroom about 4 days after it was started in the returns app
// (dropped off, then 2–5 days with the carrier); the engine grades it 4–8 days after the start
const BACK_IN_DAYS = 4;

/** Returns started and not back on sale yet (rule F-07): in the stockroom waiting to be graded, and still on the way. */
export function returnsToGrade(orders: Order[], now: number) {
  const open = orders.filter((x) => x.state === "Return started");
  const started = (x: Order) => Date.parse(x.steps.find((s) => s.kind === "return")?.at ?? x.placedAt);
  const inRoom = open.filter((x) => now - started(x) >= BACK_IN_DAYS * DAY);
  return { inRoom: inRoom.length, onWay: open.length - inRoom.length, oldest: inRoom.length ? Math.min(...inRoom.map(started)) : null };
}

/** Today's wholesale restock once received, else the next one, from the engine's own restocks (rule F-08). */
export function nextRestock(happenings: Happening[], now: number, tz: string): { at: number; received: boolean; brand: string; units: number | null; day: string } | null {
  const rs = happenings.filter((h) => h.kind === "restock").map((h) => ({ h, at: Date.parse(h.at) }));
  const from = dayStart(now, tz);
  const got = rs.filter((x) => x.at <= now && x.at >= from).sort((a, b) => b.at - a.at)[0];
  const next = rs.filter((x) => x.at > now).sort((a, b) => a.at - b.at)[0];
  const x = got ?? next;
  if (!x) return null;
  // the engine writes "<brand> · <units> <items> → …"
  const m = /^(.*?)\s·\s(\d+)\s/.exec(x.h.text);
  return { at: x.at, received: !!got, brand: m?.[1] ?? "", units: m ? Number(m[2]) : null, day: WEEKDAYS[wallOf(x.at, tz).dow] };
}

// The streetwear demo client's own tiles and fields (Cinderlot, lib/demo/client-streetwear.ts), worked out from the data
// the store engine already has (lib/storedemo/engine.ts productRows and happenings): the weekly drop (when it opens,
// how much of it sold out and how fast), the pre-owned one-offs (up for sale, sold this week, pulled everywhere), and
// the "Cinderlot fields" of a product drawer (drop, blank, print, production run or wholesale label, reprint rule; for
// a pre-owned piece its condition, consignor and measurements). No number is made up on the side: each is counted
// from those rows or follows from the product id through a hash, so a product shows the same fields wherever it is
// opened. Pure (no I/O, no "@/" imports): `node --test lib/demo/streetwear.test.mts`.
import { WEEKDAYS, fromWall, hash, time12, wallOf } from "./fields.ts";

const DAY = 86_400_000;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const H = (...p: (string | number)[]) => hash(p.join("|"));
const U = (...p: (string | number)[]) => H(...p) / 4294967296;
const pad = (n: number, w: number) => String(n).padStart(w, "0");
function weighted<T>(items: [T, number][], u: number): T {
  let x = u * items.reduce((s, [, w]) => s + w, 0);
  for (const [v, w] of items) {
    x -= w;
    if (x < 0) return v;
  }
  return items[items.length - 1][0];
}

/** "Thu 22 Oct" in the shop's zone */
export function dayLabel(t: number, tz: string): string {
  const w = wallOf(t, tz);
  return `${WEEKDAYS[w.dow]} ${w.d} ${MONTHS[w.mo - 1]}`;
}

/* ---------- the weekly drop ---------- */

export type DropStock = { size: string; color: string; stock: number; soldAt?: string };
export type DropRow = { id: string; title: string; category: string; publishedAt: string; stock: DropStock[] };

/** The drop instants around `now`: the last one that opened (or null) and the next one, at `minute` of the drop days. */
export function dropTimes(now: number, tz: string, dropDays: number[], minute: number): { last: number | null; next: number } {
  const w = wallOf(now, tz);
  let last: number | null = null;
  let next = Infinity;
  for (let k = -7; k <= 7; k++) {
    const u = new Date(Date.UTC(w.y, w.mo - 1, w.d + k));
    if (!dropDays.includes(u.getUTCDay())) continue;
    const t = fromWall(u.getUTCFullYear(), u.getUTCMonth() + 1, u.getUTCDate(), Math.floor(minute / 60), minute % 60, tz);
    if (t <= now) last = last === null ? t : Math.max(last, t);
    else next = Math.min(next, t);
  }
  return { last, next };
}

export type DropTile = {
  /** "soon": the drop opens later today; "live": it opened in the last 3 hours; "after": the days after it */
  phase: "soon" | "live" | "after";
  /** when the last drop opened and the next one opens, and their labels ("Thu 22 Oct", "11 am") */
  last: number | null;
  next: number;
  lastDay: string;
  nextDay: string;
  time: string;
  /** the last drop's pieces, its sizes, the ones sold out by now, and the share */
  pieces: number;
  sizes: number;
  gone: number;
  pct: number;
  /** the first size of it to sell out: which piece, which size, when */
  first: { title: string; size: string; at: number; mins: number } | null;
  /** pieces of it sold since it opened (order lines), and the orders they came in */
  sold: number;
  orders: number;
};

export type DropOrder = { placedAt: string; state: string; lines: { productId: string }[] };

/** The drop tile: the pieces that went live at the last drop (published at that instant, not pre-owned), how many of
 * their sizes are sold out now, and the first one to go. */
export function dropTile(rows: DropRow[], now: number, tz: string, dropDays: number[], minute: number, orders: DropOrder[] = []): DropTile {
  const { last, next } = dropTimes(now, tz, dropDays, minute);
  const at = last === null ? "" : new Date(last).toISOString();
  const drop = rows.filter((r) => r.publishedAt === at && r.category !== "Pre-owned");
  const sizes = drop.reduce((s, r) => s + r.stock.length, 0);
  const gone = drop.reduce((s, r) => s + r.stock.filter((v) => v.stock === 0).length, 0);
  let first: DropTile["first"] = null;
  for (const r of drop) {
    for (const v of r.stock) {
      const t = v.soldAt ? Date.parse(v.soldAt) : NaN;
      if (v.stock === 0 && t <= now && (!first || t < first.at)) first = { title: r.title, size: v.size, at: t, mins: Math.max(1, Math.round((t - (last ?? t)) / 60_000)) };
    }
  }
  const ids = new Set(drop.map((r) => r.id));
  let sold = 0;
  let n = 0;
  for (const o of orders) {
    if (last === null || Date.parse(o.placedAt) < last || Date.parse(o.placedAt) > now || o.state === "Cancelled") continue;
    const k = o.lines.filter((l) => ids.has(l.productId)).length;
    sold += k;
    if (k) n++;
  }
  const soonToday = next - now < DAY && wallOf(next, tz).d === wallOf(now, tz).d;
  const phase = soonToday ? "soon" : last !== null && now - last < 3 * 3_600_000 ? "live" : "after";
  return {
    phase, last, next,
    lastDay: last === null ? "" : dayLabel(last, tz),
    nextDay: dayLabel(next, tz),
    time: time12({ h: Math.floor(minute / 60), mi: minute % 60 }),
    pieces: drop.length, sizes, gone,
    pct: sizes ? Math.round((gone / sizes) * 100) : 0,
    first,
    sold,
    orders: n,
  };
}

/* ---------- pre-owned one-offs ---------- */

export type OneOffRow = { title: string; category: string; soldOut: boolean };
export type Pull = { kind: string; at: string; title: string; text: string; channel?: string };

/** Pre-owned pieces up for sale now, the ones sold in the last 7 days, and the newest sale (of the `pulls` given) with
 * where it was pulled. */
export function oneOffTile(rows: OneOffRow[], pulls: Pull[], now: number) {
  const pre = rows.filter((r) => r.category === "Pre-owned");
  const titles = new Set(pre.map((r) => r.title));
  const sold = pulls.filter((h) => h.kind === "pulled" && titles.has(h.title) && Date.parse(h.at) <= now).sort((a, b) => b.at.localeCompare(a.at));
  const latest = sold[0];
  return {
    up: pre.filter((r) => !r.soldOut).length,
    sold: sold.filter((h) => now - Date.parse(h.at) < 7 * DAY).length,
    latest: latest ? { title: latest.title, channel: latest.channel ?? "", at: latest.at, pulledFrom: /pulled from (.*)$/.exec(latest.text)?.[1] ?? "" } : null,
  };
}

/* ---------- the Cinderlot fields of a product ---------- */

export type DropFields = { kind: "drop"; drop: string; blank: string; print: string; source: string; reprint: string };
export type PreOwnedFields = { kind: "pre-owned"; season: string; condition: string; source: string; measure: string; payout: string | null };

// the blank a piece is printed on, by what it is; the first match wins
const BLANKS: [RegExp, string][] = [
  [/Baggy Jeans|Denim/, "13.5 oz rigid denim, baggy fit"],
  [/Ripstop/, "Cotton ripstop, relaxed fit"],
  [/Nylon (Cargo|Shorts|Coach|Camp)|Windbreaker|Nylon Shorts/, "Nylon taslan, water resistant"],
  [/Double Knee|Carpenter|Canvas|Chore Coat|Painter/, "12 oz cotton duck canvas"],
  [/Parachute/, "Crinkle nylon, elastic cuffs"],
  [/Track|Mesh|Basketball/, "Poly tricot, side stripes"],
  [/Fleece|Sweat/, "13 oz brushed cotton fleece"],
  [/Terry/, "French terry, raw edge"],
  [/Thermal|Waffle Knit Long/, "Cotton waffle thermal"],
  [/Varsity/, "Melton wool body, cowhide sleeves"],
  [/Puffer/, "Nylon shell, recycled fill"],
  [/Vest/, "Nylon shell, quilted lining"],
  [/Satin/, "Satin shell, quilted lining"],
  [/Trucker/, "Foam front, mesh back, snapback"],
  [/Cap|Hat|5-Panel/, "Washed cotton twill, adjustable strap"],
  [/Beanie/, "Acrylic rib knit, one size"],
  [/Hoodie/, "14 oz cotton fleece, dropped shoulder"],
  [/Crewneck/, "13 oz brushed fleece, ribbed hem"],
  [/Long Sleeve/, "7 oz cotton jersey, ribbed cuffs"],
  [/Tee/, "6.5 oz heavyweight cotton jersey, boxy fit"],
];
const PRINTS: [RegExp, string][] = [
  [/Puff Print/, "Puff print, front"],
  [/Embroidered|Chainstitch/, "Embroidered, left chest"],
  [/Chenille/, "Chenille patch, left chest"],
  [/Varsity/, "Chenille patch, felt letters on the back"],
  [/Pigment Dyed|Garment Dyed|Vintage Wash/, "Water-based print, front and back"],
  [/Cap|Hat|5-Panel/, "Embroidered front"],
  [/Beanie/, "Woven label on the cuff"],
  [/Pants|Jeans|Shorts/, "Woven label, back pocket"],
  [/Jacket|Coat|Windbreaker|Vest/, "Screen print, back; woven label"],
];

/** The Cinderlot fields of one product. `own`: the shop's own label (its pieces come from print-shop runs). */
export function streetwearFields(p: { id: string; title: string; category: string; brand: string; publishedAt: string; best: number | null }, tz: string, own = "Cinderlot"): DropFields | PreOwnedFields {
  if (p.category === "Pre-owned") {
    const code = /^(FW|SS)(\d\d)\b/.exec(p.title);
    const season = code ? `${code[1] === "FW" ? "Fall/Winter" : "Spring/Summer"} 20${code[2]}` : "Archive";
    const condition = weighted<string>([["Deadstock, tags on", 2], ["Used, like new (9.5/10)", 3], ["Used, excellent (9/10)", 4], ["Used, very good (8/10)", 2]], U("cond", p.id));
    const consigned = U("consigned", p.id) < 0.62;
    const top = /Hoodie|Crewneck|Tee|Long Sleeve|Jacket|Coat|Windbreaker|Vest/.test(p.title);
    const measure = /Cap|Hat|Beanie|5-Panel/.test(p.title)
      ? "One size, adjustable"
      : top
        ? `Pit to pit ${21 + (H("pit", p.id) % 6)}.${H("pit5", p.id) % 2 ? 5 : 0} in · length ${26 + (H("len", p.id) % 5)} in`
        : `Waist ${30 + 2 * (H("waist", p.id) % 4)} in · inseam ${28 + (H("inseam", p.id) % 5)} in`;
    return {
      kind: "pre-owned",
      season,
      condition,
      source: consigned ? `Consignor CN-${pad(100 + (H("consignor", p.id) % 400), 4)}` : "Shop archive, own stock",
      measure,
      payout: consigned ? `${[70, 75, 80][H("payout", p.id) % 3]}% to the consignor, paid Mondays` : null,
    };
  }
  const t = Date.parse(p.publishedAt);
  const w = wallOf(t, tz);
  const blank = BLANKS.find(([re]) => re.test(p.title))?.[1] ?? "Heavyweight cotton";
  const print = PRINTS.find(([re]) => re.test(p.title))?.[1] ?? (/Hoodie|Crewneck|Tee|Long Sleeve/.test(p.title) ? "Screen print, front and back" : "Woven label");
  const week = Math.floor(t / (7 * DAY));
  const mine = p.brand === own;
  return {
    kind: "drop",
    drop: `${dayLabel(t, tz)} · ${time12(w)}`,
    blank,
    print,
    // one print-shop run per drop for the shop's own label; a stocked label's pieces come in on one wholesale order a week
    source: mine ? `Run PR-${pad(1000 + (H("run", week) % 9000), 4)}` : `Wholesale order WO-${20000 + (H("wo", p.brand, week) % 70000)}`,
    reprint: p.best !== null && mine ? "Core piece: reprinted when a size is down to 2" : mine ? "Limited: no reprint" : `Limited: restocked only if ${p.brand} makes more`,
  };
}

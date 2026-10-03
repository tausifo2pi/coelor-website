// The store around a live catalogue (lib/storedemo/shopify.ts): orders on every channel, the stock count, labels,
// deliveries, returns, sold-out sizes pulled, new products listed, wholesale restocks and the automations, for any
// moment. Deterministic and time-based: everything follows from (config, catalogue, moment) through a hash, so every
// visitor sees the same at the same moment, orders appear as time passes and totals only grow. Only what the store can
// sell today is sold (a size it shows as sold out is never sold again; its last sale and the pull are shown), a product is
// never sold before it was published, and a channel sells only what is listed there. Days follow the shop's time zone:
// a web store is busiest in the evening, live selling comes in bursts on show evenings, a marketplace runs all day.
// Pure (no I/O, no "@/" imports): `node --test lib/storedemo/engine.test.mts`.
import type { Catalog, ChannelCfg, DemoConfig, Happening, Line, Order, Page, Product, Step, Variant } from "./types.ts";

const MIN = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;
const WINDOW_DAYS = 45;

/* ---------- hashing: one stable number per (parts) ---------- */

function hash(s: string): number {
  let x = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    x ^= s.charCodeAt(i);
    x = Math.imul(x, 0x01000193);
  }
  x ^= x >>> 16;
  x = Math.imul(x, 0x85ebca6b);
  x ^= x >>> 13;
  x = Math.imul(x, 0xc2b2ae35);
  x ^= x >>> 16;
  return x >>> 0;
}
const H = (...p: (string | number)[]) => hash(p.join("|"));
/** a stable number in [0, 1) */
const U = (...p: (string | number)[]) => H(...p) / 4294967296;
const between = (lo: number, hi: number, u: number) => lo + Math.floor(u * (hi - lo + 1));
const iso = (t: number) => new Date(t).toISOString();
const join = (xs: string[]) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);

function pickIndex(weights: number[], u: number): number {
  const total = weights.reduce((s, w) => s + w, 0);
  let x = u * total;
  for (let i = 0; i < weights.length; i++) {
    x -= weights[i];
    if (x < 0) return i;
  }
  return weights.length - 1;
}

/* ---------- the shop's clock ---------- */

const offsets = new Map<string, number>();
/** minutes the zone is ahead of UTC at instant t (cached per hour) */
function offsetMin(tz: string, t: number): number {
  const k = `${tz}|${Math.floor(t / HOUR)}`;
  const hit = offsets.get(k);
  if (hit !== undefined) return hit;
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric" }).formatToParts(new Date(t));
  const g = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const wall = Date.UTC(g("year"), g("month") - 1, g("day"), g("hour") % 24, g("minute"));
  const off = Math.round((wall - Math.floor(t / MIN) * MIN) / MIN);
  if (offsets.size > 5000) offsets.clear();
  offsets.set(k, off);
  return off;
}

// orders per local hour: a web store (lunch and evening), a marketplace (all day), US shoppers
const STORE_HOURS = [1.2, 0.7, 0.4, 0.3, 0.3, 0.4, 0.9, 1.8, 2.8, 3.6, 4.4, 5.2, 6.2, 5.8, 5.4, 5.4, 5.6, 6.4, 7.6, 8.8, 9.6, 8.8, 6, 3];
const STEADY_HOURS = [2, 1.4, 1, 0.8, 0.8, 1, 1.8, 2.8, 3.8, 4.6, 5, 5.2, 5.4, 5.2, 5, 5, 5, 5.2, 5.4, 5.6, 5.4, 4.6, 3.6, 2.6];

// where orders ship to: US states by population (the shop sells nationwide)
const STATES: [string, number][] = [
  ["CA", 39], ["TX", 30], ["FL", 22], ["NY", 20], ["PA", 13], ["IL", 12.5], ["OH", 11.8], ["GA", 11], ["NC", 10.7], ["MI", 10],
  ["NJ", 9.3], ["VA", 8.7], ["WA", 7.8], ["AZ", 7.4], ["TN", 7.1], ["MA", 7], ["IN", 6.8], ["MO", 6.2], ["MD", 6.2], ["WI", 5.9],
  ["CO", 5.9], ["MN", 5.7], ["SC", 5.3], ["AL", 5.1], ["LA", 4.6], ["KY", 4.5], ["OR", 4.2], ["OK", 4], ["CT", 3.6], ["UT", 3.4],
  ["IA", 3.2], ["NV", 3.2], ["AR", 3], ["MS", 2.9], ["KS", 2.9], ["NM", 2.1], ["NE", 2], ["ID", 1.9], ["WV", 1.8], ["HI", 1.4],
];
const STATE_W = STATES.map((s) => s[1]);

export type StockRow = Variant & { stock: number; soldToday: number };
export type ProductRow = Product & { stock: StockRow[]; listedOn: string[]; soldToday: number; inStock: number; soldOut: boolean };
export type Rule = { key: string; name: string; when: string; then: string; every: string; lastRun: string; tools: string[] };
export type Kpis = {
  orders24h: Record<string, number>;
  ordersTotal: Record<string, number>;
  unitsShippedToday: number;
  live: Record<string, number>;
  pulled7d: number;
  returnsBack7d: number;
  rules: { ok: number; total: number };
  lastOrder: Order | null;
};
export type Feed = ({ type: "order"; at: string; order: Order } | { type: "happening"; at: string; happening: Happening })[];

export type StoreWorld = ReturnType<typeof storeWorld>;

export function storeWorld(cfg: DemoConfig, cat: Catalog) {
  const [Y, M, D] = cfg.since;
  const START = Date.UTC(Y, M - 1, D); // day 0's local midnight, written as a UTC wall clock
  const START_DOW = new Date(START).getUTCDay();
  const dow = (d: number) => (START_DOW + (d % 7) + 7) % 7;
  const names = Object.fromEntries(cfg.channels.map((c) => [c.id, c.name])) as Record<string, string>;

  /** UTC instant of local minute `m` of day `d` */
  function at(d: number, m: number): number {
    const wall = START + d * DAY + Math.round(m * MIN);
    let t = wall - offsetMin(cfg.tz, wall) * MIN;
    t = wall - offsetMin(cfg.tz, t) * MIN;
    return t;
  }
  const localWall = (t: number) => t + offsetMin(cfg.tz, t) * MIN;
  const dayOf = (t: number) => Math.floor((localWall(t) - START) / DAY);
  const hourOf = (t: number) => Math.floor(((localWall(t) - START) % DAY + DAY) % DAY / HOUR);

  /* ---------- the catalogue: who sells what, how popular ---------- */

  const products = cat.products.slice().sort((a, b) => a.publishedAt.localeCompare(b.publishedAt));
  const byId = new Map(products.map((p) => [p.id, p]));
  const pub = new Map(products.map((p) => [p.id, Date.parse(p.publishedAt)]));
  const nBest = Math.max(1, products.filter((p) => p.best !== null).length);
  const listed = (p: Product, ch: ChannelCfg) => ch.listShare >= 1 || U("list", ch.id, p.id) < ch.listShare;
  const listedOn = (p: Product) => cfg.channels.filter((c) => listed(p, c)).map((c) => c.id);
  const sellable = (p: Product) => p.variants.some((v) => v.available);
  const demand = (p: Product, t: number) => {
    let w = 1;
    if (p.best !== null) w += 1 + 2.5 * (1 - p.best / nBest);
    if (t - pub.get(p.id)! < 14 * DAY) w *= 1.7;
    return w;
  };
  const sizeWeight = (v: Variant) => cfg.sizes[v.size] ?? (v.size === "One size" ? 1 : 0.06);
  const allChannels = join(cfg.channels.map((c) => c.name));
  // "Shopify, TikTok Shop and Amazon", or "all 5 channels" once the list gets long
  const everyChannel = cfg.channels.length > 3 ? `all ${cfg.channels.length} channels` : allChannels;

  // what a channel can sell on day d: listed there, published two hours before the day ends, a size in stock today
  const eligible = new Map<string, { list: Product[]; weights: number[] }>();
  function eligibleOn(ch: ChannelCfg, d: number) {
    const k = `${ch.id}|${d}`;
    let e = eligible.get(k);
    if (!e) {
      const end = at(d + 1, 0) - 2 * HOUR;
      const mid = at(d, 720);
      const list = products.filter((p) => pub.get(p.id)! <= end && listed(p, ch) && sellable(p));
      e = { list, weights: list.map((p) => demand(p, mid)) };
      if (eligible.size > 4000) eligible.clear();
      eligible.set(k, e);
    }
    return e;
  }

  /* ---------- orders ---------- */

  function counts(ch: ChannelCfg, d: number): { base: number; show: number } {
    const wd = dow(d);
    let base = between(ch.perDay[0], ch.perDay[1], U("n", ch.id, d));
    if (ch.rhythm === "store") base = Math.round(base * (wd === 0 || wd === 6 ? 1.15 : wd === 1 ? 0.92 : 1));
    base = Math.round(base * (0.78 + 0.22 * Math.min(1, d / 180))); // a shop that has grown since the sync started
    const show = ch.rhythm === "live" && ch.perShow && ch.showDays?.includes(wd) ? between(ch.perShow[0], ch.perShow[1], U("show", ch.id, d)) : 0;
    return { base, show };
  }
  const countMemo = new Map<string, number>();
  function ordersBefore(ch: ChannelCfg, d: number): number {
    const k = `${ch.id}|${d}`;
    const hit = countMemo.get(k);
    if (hit !== undefined) return hit;
    let n = 0;
    for (let x = 0; x < d; x++) {
      const c = counts(ch, x);
      n += c.base + c.show;
    }
    countMemo.set(k, n);
    return n;
  }

  function minuteOf(ch: ChannelCfg, d: number, i: number, show: boolean): number {
    if (show) return 19 * 60 + Math.floor(Math.pow(U("sm", ch.id, d, i), 1.3) * 125); // the show, 19:00–21:05
    const h = pickIndex(ch.rhythm === "store" ? STORE_HOURS : STEADY_HOURS, U("h", ch.id, d, i));
    return h * 60 + U("m", ch.id, d, i) * 60;
  }

  function lineOf(p: Product, seed: string): Line | null {
    const vs = p.variants.filter((v) => v.available);
    if (!vs.length) return null;
    const v = vs[pickIndex(vs.map(sizeWeight), U("v", seed))];
    return { productId: p.id, title: p.title, brand: p.brand, color: v.color, size: v.size, price: p.price, image: p.image };
  }

  function lastWorkingStart(t: number): number {
    // a label is bought in working hours: before the cut-off on Mon–Sat the same day (from 9:00), else the next working morning
    let d = dayOf(t);
    const h = hourOf(t);
    const same = dow(d) !== 0 && h < cfg.shipping.cutoffHour;
    if (same) return Math.max(t + (25 + U("lw", t) * 115) * MIN, at(d, 9 * 60 + U("lw9", t) * 50));
    do d += 1;
    while (dow(d) === 0);
    return at(d, 9 * 60 + U("lwn", t) * 150);
  }

  function stepsOf(o: { id: string; channel: string; placedAt: number; carrier: number; lines: Line[] }): Step[] {
    const t = o.placedAt;
    const ch = cfg.channels.find((c) => c.id === o.channel)!;
    // webhooks hand the order over within seconds; a channel without them waits for the next read
    const handover = ch.realtime ? (3 + U("s1", o.id) * 12) * 1000 : (5 + U("s1", o.id) * (ch.pollMin ?? 5) * 60) * 1000;
    const steps: Step[] = [{ kind: "stock", at: iso(t + handover), text: `Stock −1 on ${everyChannel}` }];
    if (U("cancel", o.id) < 0.025) {
      steps.push({ kind: "cancel", at: iso(t + (8 + U("c1", o.id) * 42) * MIN), text: "Cancelled by the buyer · stock +1 back everywhere" });
      return steps;
    }
    const car = cfg.shipping.carriers[o.carrier];
    const label = lastWorkingStart(t);
    steps.push({ kind: "label", at: iso(label), text: ch.label ? ch.label.service : `Label in ${cfg.shipping.tool.name} · ${car.service}` });
    const shipped = label + (2 + U("sh", o.id) * 3) * HOUR;
    steps.push({ kind: "shipped", at: iso(shipped), text: `Shipped · tracking sent by ${cfg.tracking.name}${o.channel === "shopify" ? "" : `, marked shipped on ${names[o.channel]}`}` });
    const dd = dayOf(shipped) + between(car.days[0], car.days[1], U("dd", o.id));
    const delivered = at(dd, 11 * 60 + U("dt", o.id) * 480);
    steps.push({ kind: "delivered", at: iso(delivered), text: `Delivered by ${car.name}` });
    if (U("ret", o.id) < cfg.returns.rate) {
      const reason = cfg.returns.reasons[Math.floor(U("rr", o.id) * cfg.returns.reasons.length)];
      const rd = dayOf(delivered) + between(2, 12, U("rd", o.id));
      const started = at(rd, 9 * 60 + U("rt", o.id) * 780);
      steps.push({ kind: "return", at: iso(started), text: `Return started in ${cfg.returns.name} · ${reason}` });
      const back = at(rd + between(4, 8, U("rb", o.id)), 10 * 60 + U("rbt", o.id) * 360);
      steps.push({ kind: "restock", at: iso(back), text: `Back in stock after the check · +1 on ${everyChannel}` });
    }
    return steps;
  }

  type Raw = { id: string; channel: string; placedAt: number; ref: number; shipTo: string; carrier: number; lines: Line[]; steps: Step[] };
  const dayMemo = new Map<number, Raw[]>();

  function makeOrder(ch: ChannelCfg, id: string, t: number, ref: number, lines: Line[]): Raw {
    const carrier = ch.label ? ch.label.carrier : pickIndex(cfg.shipping.carriers.map((c) => c.share), U("car", id));
    const shipTo = STATES[pickIndex(STATE_W, U("st", id))][0];
    const base = { id, channel: ch.id, placedAt: t, carrier, lines };
    return { ...base, ref, shipTo, steps: stepsOf(base) };
  }

  // the last unit of each size the store shows as sold out: sold some days after the product came out, then pulled
  const lastUnits: { raw: Raw; happening: Happening }[] = [];
  for (const p of products) {
    const gone = p.variants.filter((v) => !v.available);
    if (!gone.length) continue;
    const on = cfg.channels.filter((c) => listed(p, c));
    const allGone = gone.length === p.variants.length;
    for (const v of (allGone ? gone.slice(0, 1) : gone.slice(0, 2))) {
      const t = pub.get(p.id)! + (1.5 + U("lu", v.id) * 18) * DAY;
      const ch = on[pickIndex(on.map((c) => (c.rhythm === "store" ? 3 : 1)), U("luc", v.id))] ?? cfg.channels[0];
      const id = `l${v.id}`;
      const raw = makeOrder(ch, id, t, ch.refStart + 900_000 + (H("lur", v.id) % 90_000), [{ productId: p.id, title: p.title, brand: p.brand, color: v.color, size: v.size, price: p.price, image: p.image }]);
      const rest = on.filter((c) => c.id !== ch.id).map((c) => c.name);
      const what = allGone ? `${p.title} sold out` : `Last ${v.size}${v.color ? ` in ${v.color}` : ""} sold`;
      raw.steps.push({ kind: "pulled", at: iso(t + (60 + U("lup", v.id) * 180) * 1000), text: rest.length ? `Last one · pulled from ${join(rest)}` : "Last one · marked sold out" });
      raw.steps.sort((a, b) => a.at.localeCompare(b.at));
      lastUnits.push({
        raw,
        happening: { id: `p${v.id}`, kind: "pulled", at: iso(t + (60 + U("lup", v.id) * 180) * 1000), title: p.title, channel: ch.id, image: p.image,
          text: `${what} on ${ch.name}${rest.length ? ` → pulled from ${join(rest)}` : ""}` },
      });
    }
  }

  function day(d: number): Raw[] {
    const hit = dayMemo.get(d);
    if (hit) return hit;
    const out: Raw[] = [];
    for (const ch of cfg.channels) {
      const e = eligibleOn(ch, d);
      if (!e.list.length) continue;
      const { base, show } = counts(ch, d);
      const before = ordersBefore(ch, d);
      // the day's orders by time, so the channel's order numbers rise with the clock
      const slots = Array.from({ length: base + show }, (_, i) => ({ i, t: at(d, minuteOf(ch, d, i, i >= base)) })).sort((a, b) => a.t - b.t);
      slots.forEach(({ i, t }, rank) => {
        const id = `${ch.id.slice(0, 2)}${d.toString(36)}${i.toString(36)}`;
        const n = U("k", id) < 0.7 ? 1 : U("k2", id) < 0.83 ? 2 : 3;
        const lines: Line[] = [];
        for (let j = 0; j < n; j++) {
          const p = e.list[pickIndex(e.weights, U("p", id, j))];
          if (pub.get(p.id)! > t - HOUR) continue;
          const l = lineOf(p, `${id}|${j}`);
          if (l) lines.push(l);
        }
        if (lines.length) out.push(makeOrder(ch, id, t, ch.refStart + before + rank, lines));
      });
    }
    const lo = at(d, 0);
    const hi = at(d + 1, 0);
    for (const u of lastUnits) if (u.raw.placedAt >= lo && u.raw.placedAt < hi) out.push(u.raw);
    out.sort((a, b) => b.placedAt - a.placedAt);
    if (dayMemo.size > 400) dayMemo.clear();
    dayMemo.set(d, out);
    return out;
  }

  const STATE_OF: Record<Step["kind"], string> = {
    stock: "Paid", pulled: "Paid", label: "Label printed", shipped: "Shipped", delivered: "Delivered", return: "Return started",
    restock: "Returned", cancel: "Cancelled", listed: "Paid",
  };
  function view(r: Raw, now: number): Order {
    const steps = r.steps.filter((s) => Date.parse(s.at) <= now);
    const last = steps[steps.length - 1];
    const mask = String(r.ref);
    return {
      id: r.id,
      channel: r.channel,
      ref: `${r.channel === "shopify" ? "#" : ""}•••${mask.slice(-3)}`,
      placedAt: iso(r.placedAt),
      state: last ? STATE_OF[last.kind] : "Paid",
      shipTo: r.shipTo,
      carrier: cfg.shipping.carriers[r.carrier].name,
      lines: r.lines,
      total: Math.round(r.lines.reduce((s, l) => s + l.price, 0) * 100) / 100,
      steps,
    };
  }

  /** orders placed in (from, now], newest first, over at most WINDOW_DAYS */
  function ordersIn(now: number, from = now - WINDOW_DAYS * DAY): Raw[] {
    const out: Raw[] = [];
    for (let d = dayOf(now); d >= Math.max(0, dayOf(from)); d--) {
      for (const r of day(d)) if (r.placedAt <= now && r.placedAt > from) out.push(r);
    }
    return out;
  }

  /* ---------- stock ---------- */

  function soldTodayMap(now: number): Map<string, number> {
    const m = new Map<string, number>();
    const from = at(dayOf(now), 0);
    for (const r of ordersIn(now, from)) {
      if (r.steps.some((s) => s.kind === "cancel" && Date.parse(s.at) <= now)) continue;
      for (const l of r.lines) {
        const k = `${l.productId}|${l.color}|${l.size}`;
        m.set(k, (m.get(k) ?? 0) + 1);
      }
    }
    return m;
  }

  function rowOf(p: Product, sold: Map<string, number>): ProductRow {
    const stock = p.variants.map((v) => {
      const soldToday = sold.get(`${p.id}|${v.color}|${v.size}`) ?? 0;
      const base = 3 + (H("stock", v.id) % 10) + (v.size === "M" || v.size === "S" ? 3 : 0);
      return { ...v, soldToday, stock: v.available ? Math.max(1, base - soldToday) : 0 };
    });
    return {
      ...p, stock, listedOn: listedOn(p),
      soldToday: stock.reduce((s, v) => s + v.soldToday, 0),
      inStock: stock.reduce((s, v) => s + v.stock, 0),
      soldOut: !sellable(p),
    };
  }

  /* ---------- what else happened: new listings, restocks ---------- */

  function happenings(now: number, from: number): Happening[] {
    const out: Happening[] = [];
    for (const u of lastUnits) {
      const t = Date.parse(u.happening.at);
      if (t <= now && t > from) out.push(u.happening);
    }
    for (const p of products) {
      const t = pub.get(p.id)! + (3 + U("li", p.id) * 11) * MIN;
      if (t > now || t <= from) continue;
      const on = cfg.channels.filter((c) => c.listShare < 1 && listed(p, c)).map((c) => c.name);
      if (!on.length) continue;
      out.push({ id: `n${p.id}`, kind: "listed", at: iso(t), title: p.title, image: p.image, text: `New in ${cfg.channels[0].name} → listed on ${join(on)} with sizes and photos` });
    }
    const brands = [...new Set(products.map((p) => p.brand).filter(Boolean))];
    for (let d = dayOf(now); d >= Math.max(0, dayOf(from)); d--) {
      if (dow(d) !== cfg.restock.weekday || !brands.length) continue;
      const t = at(d, 10 * 60 + U("rs", d) * 150);
      if (t > now || t <= from) continue;
      const brand = brands[H("rsb", d) % brands.length];
      const units = between(12, 48, U("rsu", d));
      out.push({ id: `r${d}`, kind: "restock", at: iso(t), title: `${cfg.restock.name} order received`, text: `${brand} · ${units} ${cfg.items} → stock up on ${everyChannel}` });
    }
    return out.sort((a, b) => b.at.localeCompare(a.at));
  }

  /* ---------- automations ---------- */

  const RULES: { key: string; name: string; when: string; then: string; min: number; every: string; tools: string[] }[] = [
    { key: "orders", name: "Every order into one stock count", when: `An order comes in on ${allChannels}`, then: `Stock −1 on every channel, for that size and colour`, min: 2, every: "every 2 min", tools: cfg.channels.map((c) => c.logo) },
    { key: "soldout", name: "Sold-out sizes pulled", when: "A size reaches 0", then: `Pulled from ${join(cfg.channels.slice(1).map((c) => c.name))}; shown sold out in the web store`, min: 5, every: "every 5 min", tools: cfg.channels.map((c) => c.logo) },
    { key: "listing", name: "New products listed", when: `A new product is published in ${cfg.channels[0].name}`, then: `Listed on ${join(cfg.channels.slice(1).map((c) => c.name))} with every size and the photos`, min: 15, every: "every 15 min", tools: cfg.channels.map((c) => c.logo) },
    { key: "labels", name: "Labels bought", when: "An order is paid on any channel", then: `Label in ${cfg.shipping.tool.name}: ${join(cfg.shipping.carriers.map((c) => c.name))}, by weight and speed${cfg.channels.some((c) => c.label) ? `; ${join(cfg.channels.filter((c) => c.label).map((c) => c.name))} orders on their own prepaid label` : ""}`, min: 10, every: "every 10 min", tools: [cfg.shipping.tool.logo, ...cfg.shipping.carriers.map((c) => c.logo)] },
    { key: "tracking", name: "Tracking to the buyer", when: "A parcel is scanned by the carrier", then: `Tracking page and emails by ${cfg.tracking.name}; the order marked shipped on its channel`, min: 15, every: "every 15 min", tools: [cfg.tracking.logo, ...cfg.channels.slice(1).map((c) => c.logo)] },
    { key: "returns", name: "Returns back into stock", when: `A return is checked in ${cfg.returns.name}`, then: "+1 on every channel, or the exchange size sent", min: 60, every: "every hour", tools: [cfg.returns.logo] },
    { key: "restock", name: "Wholesale restocks", when: `A ${cfg.restock.name} order is received`, then: "New stock on every channel at once", min: 1440, every: "daily", tools: [cfg.restock.logo] },
    { key: "low", name: "Low-stock list", when: "A best seller is down to 2 in a size", then: "On the morning reorder list", min: 1440, every: "daily at 7:00", tools: [cfg.stock.logo] },
  ];

  // the event-driven rules (webhooks) ran with the last thing that happened: the last order handed over, the last
  // new product listed
  const hooked = cfg.channels.filter((c) => c.realtime);
  const polled = cfg.channels.filter((c) => !c.realtime);
  const ordersEvery = hooked.length
    ? `real time (webhooks)${polled.length ? ` · ${join(polled.map((c) => c.name))} every ${polled[0].pollMin ?? 5} min` : ""}`
    : "every 2 min";
  const EVENT: Record<string, string> = { orders: ordersEvery, soldout: "real time, on each sale", listing: `real time (${cfg.channels[0].name} webhook)` };

  function lastHandover(now: number): number | null {
    for (const r of ordersIn(now, now - 2 * DAY)) {
      const s = r.steps.find((x) => x.kind === "stock");
      if (s && Date.parse(s.at) <= now) return Date.parse(s.at);
    }
    return null;
  }

  function rules(now: number): Rule[] {
    const handed = hooked.length ? lastHandover(now) : null;
    const listed = happenings(now, now - 30 * DAY).find((h) => h.kind === "listed");
    return RULES.map((r) => {
      const period = r.min * MIN;
      const off = (H("rule", r.key) % Math.max(1, Math.min(period, 10 * MIN))) + 7000;
      let last = Math.floor((now - off) / period) * period + off;
      if (r.key === "low") last = at(dayOf(now) - (hourOf(now) < 7 ? 1 : 0), 7 * 60) + 4000;
      if (hooked.length && (r.key === "orders" || r.key === "soldout") && handed) last = handed;
      if (hooked.length && r.key === "listing" && listed) last = Date.parse(listed.at);
      const every = hooked.length && EVENT[r.key] ? EVENT[r.key] : r.every;
      return { key: r.key, name: r.name, when: r.when, then: r.then, every, lastRun: iso(Math.min(now, last)), tools: r.tools };
    });
  }

  /* ---------- queries ---------- */

  const match = (r: Raw, q: string) => {
    if (!q) return true;
    const hay = `${r.lines.map((l) => `${l.title} ${l.brand} ${l.color} ${l.size}`).join(" ")} ${r.shipTo} ${names[r.channel]}`.toLowerCase();
    return q.toLowerCase().split(/\s+/).filter(Boolean).every((w) => hay.includes(w));
  };
  const pageOf = <T,>(rows: T[], page: number, per: number): Page<T> => ({
    rows: rows.slice((page - 1) * per, page * per), total: rows.length, page, pages: Math.max(1, Math.ceil(rows.length / per)),
  });

  return {
    channels: cfg.channels,
    products: products.length,
    dayOf,

    /** a live-selling channel's show running now */
    liveNow(now: number): string | null {
      const d = dayOf(now);
      const m = (localWall(now) - START - d * DAY) / MIN;
      const live = cfg.channels.find((c) => c.rhythm === "live" && c.showDays?.includes(dow(d)));
      return live && m >= 19 * 60 && m <= 21 * 60 + 5 ? live.id : null;
    },

    orders(q: { now: number; channel?: string; q?: string; page?: number; per?: number }): Page<Order> {
      const rows = ordersIn(q.now).filter((r) => (!q.channel || r.channel === q.channel) && match(r, q.q ?? ""));
      const p = pageOf(rows, Math.max(1, q.page ?? 1), q.per ?? 20);
      return { ...p, rows: p.rows.map((r) => view(r, q.now)) };
    },

    overview(now: number): { kpis: Kpis; feed: Feed } {
      const day24 = ordersIn(now, now - DAY);
      const orders24h = Object.fromEntries(cfg.channels.map((c) => [c.id, day24.filter((r) => r.channel === c.id).length]));
      const today = dayOf(now);
      const ordersTotal = Object.fromEntries(cfg.channels.map((c) => {
        const n = ordersBefore(c, today) + day(today).filter((r) => r.channel === c.id && r.placedAt <= now && !r.id.startsWith("l")).length;
        return [c.id, n];
      }));
      const from = at(today, 0);
      let shipped = 0;
      for (const r of ordersIn(now, now - 8 * DAY)) {
        const s = r.steps.find((x) => x.kind === "shipped");
        if (s && Date.parse(s.at) <= now && Date.parse(s.at) >= from) shipped += r.lines.length;
      }
      const live = Object.fromEntries(cfg.channels.map((c) => [c.id, products.filter((p) => sellable(p) && listed(p, c)).length]));
      const week = happenings(now, now - 7 * DAY);
      let returnsBack = 0;
      for (const r of ordersIn(now, now - 30 * DAY)) {
        const s = r.steps.find((x) => x.kind === "restock");
        if (s && Date.parse(s.at) <= now && Date.parse(s.at) > now - 7 * DAY) returnsBack += 1;
      }
      const rs = rules(now);
      const recent = ordersIn(now, now - 2 * DAY).slice(0, 14).map((r) => view(r, now));
      const feed: Feed = [
        ...recent.map((o) => ({ type: "order" as const, at: o.placedAt, order: o })),
        ...happenings(now, now - 2 * DAY).slice(0, 8).map((h) => ({ type: "happening" as const, at: h.at, happening: h })),
      ].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 12);
      return {
        kpis: {
          orders24h, ordersTotal, unitsShippedToday: shipped, live,
          pulled7d: week.filter((h) => h.kind === "pulled").length,
          returnsBack7d: returnsBack,
          rules: { ok: rs.length, total: rs.length },
          lastOrder: recent[0] ?? null,
        },
        feed,
      };
    },

    productRows(q: { now: number; q?: string; category?: string; page?: number; per?: number }): Page<ProductRow> & { categories: string[] } {
      const sold = soldTodayMap(q.now);
      const words = (q.q ?? "").toLowerCase().split(/\s+/).filter(Boolean);
      const rows = products
        .filter((p) => pub.get(p.id)! <= q.now && (!q.category || p.category === q.category))
        .filter((p) => words.every((w) => `${p.title} ${p.brand} ${p.category}`.toLowerCase().includes(w)))
        .map((p) => rowOf(p, sold))
        .sort((a, b) => b.soldToday - a.soldToday || (a.best ?? 99) - (b.best ?? 99) || b.publishedAt.localeCompare(a.publishedAt));
      const categories = [...new Set(products.map((p) => p.category))].sort();
      return { ...pageOf(rows, Math.max(1, q.page ?? 1), q.per ?? 24), categories };
    },

    product(id: string, now: number): { row: ProductRow; orders: Order[] } | null {
      const p = byId.get(id);
      if (!p || pub.get(id)! > now) return null;
      const orders = ordersIn(now, now - 30 * DAY).filter((r) => r.lines.some((l) => l.productId === id)).slice(0, 8).map((r) => view(r, now));
      return { row: rowOf(p, soldTodayMap(now)), orders };
    },

    shipping(now: number): { today: Record<string, number>; rows: Order[]; returns: Order[] } {
      const from = at(dayOf(now), 0);
      const today: Record<string, number> = Object.fromEntries(cfg.shipping.carriers.map((c) => [c.name, 0]));
      const labelled: { r: Raw; t: number }[] = [];
      const returned: { r: Raw; t: number }[] = [];
      for (const r of ordersIn(now, now - 30 * DAY)) {
        const l = r.steps.find((s) => s.kind === "label");
        if (l && Date.parse(l.at) <= now) {
          const t = Date.parse(l.at);
          if (t >= from) today[cfg.shipping.carriers[r.carrier].name] += 1;
          if (t > now - 4 * DAY) labelled.push({ r, t });
        }
        const ret = r.steps.find((s) => s.kind === "return");
        if (ret && Date.parse(ret.at) <= now) returned.push({ r, t: Date.parse(ret.at) });
      }
      labelled.sort((a, b) => b.t - a.t);
      returned.sort((a, b) => b.t - a.t);
      return { today, rows: labelled.slice(0, 40).map((x) => view(x.r, now)), returns: returned.slice(0, 20).map((x) => view(x.r, now)) };
    },

    happenings: (now: number, days = 7) => happenings(now, now - days * DAY),
    rules,
  };
}

// node --test lib/demo/tiles.test.mts
// The dashboards' business tiles (lib/demo/tiles.ts): every number adds up with the rest of the demo (the tile's split
// sums to its total, "Sold today" equals the products page's "sold today", the labels waiting are the paid orders), and
// the same moment gives the same tiles.
import { test } from "node:test";
import assert from "node:assert/strict";
import { CHANNELS, CORE_CHANNELS } from "./channels.ts";
import { sampleWorld } from "./sample.ts";
import { dayStart, fromWall, time24, wallOf, weekStart } from "./fields.ts";
import { labelsDue, nextRestock, returnsToGrade, showTile, sneakerTiles, soldToday } from "./tiles.ts";
import { WOMENS_BOUTIQUE as CFG } from "../storedemo/configs.ts";
import { storeWorld } from "../storedemo/engine.ts";
import type { Catalog, Product } from "../storedemo/types.ts";

const DAY = 86_400_000;
const AMS = "Europe/Amsterdam";
const CHI = CFG.tz;

/* ---------- Northvale ---------- */

// the overview the dashboard reads (lib/demo/sample.ts, as lib/demo/gen.ts answers it)
const W = sampleWorld();
const overview = (now: number) => W.overview(now);
const SHIPPING = ["Shipped", "Being checked", "Cancelled"];

test("Northvale's tiles add up with the overview", () => {
  const now = Date.parse("2026-10-14T15:00:00Z"); // a Wednesday afternoon in Amsterdam
  const ov = overview(now);
  const t = sneakerTiles(ov, now, { since: "2026-01-05", tz: AMS });
  assert.deepEqual(sneakerTiles(overview(now), now, { since: "2026-01-05", tz: AMS }), t);
  // sold: the per-channel split is the total
  assert.equal(t.sold.n, t.sold.by.reduce((s, x) => s + x.n, 0));
  assert.deepEqual(t.sold.by.map((x) => x.id), CHANNELS.map((c) => c.id));
  for (const x of t.sold.by) assert.equal(x.n, ov.kpis.sales24h[x.id]);
  // to ship: the marketplaces' sales of the day, less those in the feed already on their way (or cancelled)
  assert.deepEqual(t.toShip.by.map((x) => x.id), [...CORE_CHANNELS]);
  for (const x of t.toShip.by) {
    const gone = ov.feed.filter((s) => s.platform === x.id && now - Date.parse(s.soldAt!) < DAY && SHIPPING.includes(s.state)).length;
    assert.equal(x.n, Math.max(0, ov.kpis.sales24h[x.id] - gone));
    assert.ok(x.n > 0, `${x.id}: nothing to ship`);
  }
  assert.equal(t.toShip.n, t.toShip.by.reduce((s, x) => s + x.n, 0));
  assert.equal(t.toShip.firstDue, fromWall(2026, 10, 15, 17, 0, AMS)); // sold since yesterday 17:00, 2 working days
  // not listed: Picqer products without a link
  const { total, linked } = ov.kpis.products;
  assert.deepEqual(t.notListed, { n: total - linked, total, linked });
  // pulled: at least every pull the feed shows since Monday, and the newest one named
  const monday = weekStart(now, AMS);
  const inFeed = ov.feed.filter((s) => s.soldAt && Date.parse(s.soldAt) >= monday && s.steps.some((x) => x.kind === "pulled")).length;
  assert.ok(t.pulled.n >= inFeed && t.pulled.n > 0);
  if (t.pulled.latest) assert.ok(t.pulled.latest.where.length > 0 && !/pulled/i.test(t.pulled.latest.where));
});

test("the week's pulls only grow through the week, and start again on Monday", () => {
  const mon = Date.parse("2026-10-12T10:00:00Z");
  let last = -1;
  for (let d = 1; d < 7; d++) {
    const now = mon + d * DAY;
    const n = sneakerTiles(overview(now), now, { since: "2026-01-05", tz: AMS }).pulled.n;
    assert.ok(n >= last, `day ${d}: ${n} after ${last}`);
    last = n;
  }
  const next = mon + 7 * DAY + 3_600_000;
  assert.ok(sneakerTiles(overview(next), next, { since: "2026-01-05", tz: AMS }).pulled.n < last);
});

test("the next Whatnot show: the overview's window holds that show's sales, its lineup the models sold", () => {
  const MIN = 60_000;
  const from = Date.parse("2026-08-31T08:00:00Z"); // a Monday, 10:00 in Amsterdam: before any show starts
  const sales = W.sales({ now: from + 43 * DAY, platform: "whatnot", limit: 1e6 }).rows.map((s) => ({ t: Date.parse(s.soldAt!), product: s.product }));
  let shows = 0;
  for (let d = 0; d < 42; d++) {
    const now = from + d * DAY;
    const ov = overview(now);
    assert.equal(ov.nextShow?.platform, "whatnot");
    const show = showTile(ov, now, AMS)!;
    assert.ok(show, `a show within 3 weeks of day ${d}`);
    assert.equal(show.live, false);
    assert.ok(show.start > now && show.end > show.start);
    const local = wallOf(show.start, AMS);
    assert.equal(time24(local), show.time);
    assert.equal(["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][local.dow], show.day);
    assert.ok(["19:00", "19:30", "20:00", "20:30"].includes(show.time), show.time);
    assert.equal(show.today, local.d === wallOf(now, AMS).d);
    const day = sales.filter((s) => s.t >= dayStart(now, AMS) && s.t < dayStart(now, AMS) + DAY);
    if (show.today) {
      shows++;
      // every sale of the evening falls inside the show; the lineup is the models it sold
      const on = sales.filter((s) => s.t >= show.start && s.t <= show.end);
      assert.ok(on.length >= 20, `${show.day} ${show.time}: ${on.length} sales`);
      assert.deepEqual(day.filter((s) => s.t >= dayStart(now, AMS) + 16 * 3_600_000), on, "no sale around the show outside its window");
      assert.equal(new Set(on.map((s) => s.product)).size, show.models, `lineup ${show.models}`);
      assert.ok(show.models >= 7 && show.models <= 20);
      // on air from its start until it ends, then the next one
      for (const t of [show.start, show.start + 10 * MIN, show.end - MIN]) {
        const s = showTile(overview(t), t, AMS)!;
        assert.equal(s.live, true);
        assert.equal(s.start, show.start);
      }
      const after = showTile(overview(show.end + MIN), show.end + MIN, AMS)!;
      assert.ok(after.start > show.end && !after.live);
    } else {
      // no show today: only the buy-now trickle
      assert.ok(day.length <= 3, `day ${d}: ${day.length} sales without a show`);
    }
  }
  assert.ok(shows >= 15 && shows <= 26, `${shows} shows in 6 weeks`);
});

/* ---------- Fernhollow ---------- */

const NOW = Date.parse("2026-10-13T20:00:00Z"); // Tuesday 15:00 in Chicago
function catalog(): Catalog {
  const products: Product[] = [];
  for (let i = 0; i < 60; i++) {
    products.push({
      id: `p${i}`, title: `Product ${i}`, brand: ["Klesis", "Bailey Rose", "Fore Collection"][i % 3], category: ["Tops", "Dresses", "Pants"][i % 3],
      price: 38 + (i % 7) * 9, image: null,
      publishedAt: new Date(NOW - (i < 40 ? i * 0.4 * DAY : 90 * DAY + i * DAY)).toISOString(),
      best: i >= 40 ? i - 40 : null,
      variants: ["S", "M", "L"].map((s) => ({ id: `p${i}${s}`, color: "Sage", size: s, available: !(i % 5 === 0 && s === "S") && i !== 7 })),
    });
  }
  return { products, at: new Date(NOW).toISOString() };
}

test("Sold today is what the products page sells today, split by channel", () => {
  const w = storeWorld(CFG, catalog());
  for (const now of [NOW, NOW + 5 * 3_600_000, fromWall(2026, 10, 14, 0, 20, CHI)]) {
    const orders = w.orders({ now, per: 1e5 }).rows;
    const s = soldToday(orders, now, CHI, CFG.channels);
    assert.equal(s.pieces, s.by.reduce((n, x) => n + x.n, 0));
    assert.equal(s.pieces, w.productRows({ now, per: 1e5 }).rows.reduce((n, p) => n + p.soldToday, 0), new Date(now).toISOString());
    assert.ok(s.orders <= s.pieces && (s.pieces === 0) === (s.revenue === 0));
  }
});

test("labels waiting are the paid orders without one, by carrier, against the 14:00 cut-off", () => {
  const w = storeWorld(CFG, catalog());
  const carriers = CFG.shipping.carriers.map((c) => c.name);
  const at = (d: number, h: number) => fromWall(2026, 10, d, h, 0, CHI);
  const cases: [number, string][] = [[at(13, 10), "before"], [at(13, 16), "after"], [at(17, 15), "after"], [at(18, 10), "closed"]];
  for (const [now, phase] of cases) {
    const orders = w.orders({ now, per: 1e5 }).rows;
    const l = labelsDue(orders, now, CHI, CFG.shipping.cutoffHour, carriers);
    assert.equal(l.phase, phase);
    assert.equal(l.n, orders.filter((o) => o.state === "Paid").length);
    assert.equal(l.n, l.by.reduce((s, x) => s + x.n, 0));
    assert.equal(l.cutoff, fromWall(2026, 10, new Date(now - 5 * 3_600_000).getUTCDate(), 14, 0, CHI));
  }
  // Saturday after the cut-off and Sunday: the next pickup is Monday's
  assert.equal(labelsDue([], at(17, 15), CHI, 14, carriers).nextDay, "Monday");
  assert.equal(labelsDue([], at(13, 16), CHI, 14, carriers).nextDay, "tomorrow");
});

test("returns to grade: started and not back on sale, in the stockroom or on the way", () => {
  const w = storeWorld(CFG, catalog());
  const orders = w.orders({ now: NOW, per: 1e5 }).rows;
  const r = returnsToGrade(orders, NOW);
  assert.equal(r.inRoom + r.onWay, orders.filter((o) => o.state === "Return started").length);
  assert.ok(r.inRoom + r.onWay > 0);
  if (r.oldest !== null) assert.ok(NOW - r.oldest >= 4 * DAY);
});

test("the Faire order: the engine's own restock, on the restock weekday", () => {
  const w = storeWorld(CFG, catalog());
  const brands = new Set(catalog().products.map((p) => p.brand));
  const tue = nextRestock(w.happenings(NOW + 8 * DAY, 9), NOW, CHI)!;
  assert.equal(tue.received, false);
  assert.equal(tue.day, "Mon");
  assert.ok(brands.has(tue.brand) && tue.units !== null && tue.units >= 12 && tue.units <= 48);
  // it is the one the activity feed shows once it lands
  const landed = w.happenings(tue.at + 60_000, 1).find((h) => h.kind === "restock")!;
  assert.equal(landed.text.startsWith(`${tue.brand} · ${tue.units} `), true);
  const after = nextRestock(w.happenings(tue.at + 3_600_000 + 8 * DAY, 9), tue.at + 3_600_000, CHI)!;
  assert.equal(after.received, true);
  assert.equal(after.at, tue.at);
});

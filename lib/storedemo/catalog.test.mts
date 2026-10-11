// node --test lib/storedemo/catalog.test.mts
// The boutique demo's generated catalogue (lib/storedemo/catalog.ts) and its pictures (lib/storedemo/art.ts): the same
// shop day gives the same catalogue, a believable boutique mix, sizes from the config's size curve, pictures drawn here
// (nothing loaded from anywhere), new pieces in drops as time passes, sizes that only sell out once the engine can show
// their last sale, and the engine's rules holding over it.
import { test } from "node:test";
import assert from "node:assert/strict";
import { WOMENS_BOUTIQUE as CFG } from "./configs.ts";
import { ONE_SIZE, catalogAt, catalogStamp } from "./catalog.ts";
import { SHADES, garmentArt } from "./art.ts";
import { storeWorld } from "./engine.ts";
import type { Catalog } from "./types.ts";

const HOUR = 3_600_000;
const DAY = 86_400_000;
const NOW = Date.parse("2026-10-13T20:00:00Z"); // Tuesday 15:00 in Chicago, a drop day
// a year of moments, one a month, at different hours
const YEAR = Array.from({ length: 13 }, (_, i) => Date.parse("2026-03-02T00:00:00Z") + i * 30 * DAY + (i % 5) * 5 * HOUR);
const CATEGORIES = ["Tops", "Dresses", "Sweaters", "Cardigans", "Denim", "Skirts", "Pants", "Sets", "Jackets", "Accessories"];
const SIZE_ORDER = Object.keys(CFG.sizes);

const local = (t: number) => {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: CFG.tz, weekday: "short", hour: "numeric", hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(t));
  const g = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return { weekday: g("weekday"), hour: Number(g("hour")), date: `${g("year")}-${g("month")}-${g("day")}` };
};
const svgOf = (url: string) => decodeURIComponent(url.slice(url.indexOf(",") + 1));

test("the same shop day gives the same catalogue for every visitor; the next day is built again", () => {
  assert.deepEqual(catalogAt(CFG, NOW), catalogAt(CFG, NOW));
  // 06:00 and 23:30 on the same Chicago day: the same catalogue, the same stamp (the shop's midnight)
  const morning = Date.parse("2026-10-13T11:00:00Z");
  const night = Date.parse("2026-10-14T04:30:00Z");
  assert.deepEqual(catalogAt(CFG, morning), catalogAt(CFG, NOW));
  assert.deepEqual(catalogAt(CFG, night), catalogAt(CFG, NOW));
  assert.equal(catalogStamp(CFG, NOW), "2026-10-13T05:00:00.000Z");
  assert.equal(catalogAt(CFG, NOW).at, catalogStamp(CFG, NOW));
  assert.notEqual(catalogStamp(CFG, night + HOUR), catalogStamp(CFG, NOW));
});

test("about 160 pieces of a women's boutique: every kind, a few labels, boutique prices, titles that never repeat", () => {
  for (const t of [NOW, ...YEAR]) {
    const ps = catalogAt(CFG, t).products;
    assert.ok(ps.length >= 145 && ps.length <= 175, `${ps.length} pieces`);
    const by = (f: (p: (typeof ps)[number]) => string) => ps.reduce<Record<string, number>>((m, p) => ((m[f(p)] = (m[f(p)] ?? 0) + 1), m), {});
    const cats = by((p) => p.category);
    for (const c of Object.keys(cats)) assert.ok(CATEGORIES.includes(c), c);
    assert.ok(Object.keys(cats).length >= 9, `categories ${JSON.stringify(cats)}`);
    const main = ((cats.Tops ?? 0) + (cats.Dresses ?? 0)) / ps.length;
    assert.ok(main > 0.25 && main < 0.55, `tops and dresses ${main}`);
    const acc = (cats.Accessories ?? 0) / ps.length;
    assert.ok(acc > 0.06 && acc < 0.2, `accessories ${acc}`);
    const labels = by((p) => p.brand);
    assert.ok(Object.keys(labels).length >= 6 && Object.keys(labels).length <= 8, JSON.stringify(labels));
    for (const [l, n] of Object.entries(labels)) assert.ok(n >= 3 && n / ps.length < 0.3, `${l} ${n}`);
    for (const p of ps) {
      assert.ok(Number.isInteger(p.price) && p.price >= 24 && p.price <= 168, `${p.title} $${p.price}`);
      if (p.compareAt !== undefined) assert.ok(p.compareAt > p.price, `${p.title} compare-at`);
      assert.match(p.title, /^[A-Z][A-Za-z]*( [A-Z][A-Za-z.&]*)+$/);
      assert.ok(p.title.length <= 48, p.title);
    }
    const marked = ps.filter((p) => p.compareAt !== undefined).length / ps.length;
    assert.ok(marked > 0.02 && marked < 0.2, `marked down ${marked}`);
    assert.equal(new Set(ps.map((p) => p.title)).size, ps.length, "a title repeats");
    assert.equal(new Set(ps.map((p) => p.id)).size, ps.length, "an id repeats");
    const best = ps.filter((p) => p.best !== null).map((p) => p.best!).sort((a, b) => a - b);
    assert.deepEqual(best, Array.from({ length: CFG.catalog.best }, (_, i) => i));
  }
});

test("sizes follow the config's size curve; accessories are one size; every colour comes in every size", () => {
  for (const t of [NOW, ...YEAR.slice(0, 4)]) {
    const ps = catalogAt(CFG, t).products;
    const ids = new Set<string>();
    let sizes = 0;
    let gone = 0;
    for (const p of ps) {
      const colours = [...new Set(p.variants.map((v) => v.color))];
      const run = [...new Set(p.variants.map((v) => v.size))];
      assert.equal(p.variants.length, colours.length * run.length, p.title);
      assert.ok(colours.length >= 1 && colours.length <= 3, p.title);
      for (const c of colours) assert.ok(SHADES[c], `${p.title}: colour ${c}`);
      if (p.category === "Accessories") assert.deepEqual(run, [ONE_SIZE]);
      else {
        assert.ok(run.length >= 3 && ["S", "M", "L"].every((s) => run.includes(s)), `${p.title}: ${run}`);
        assert.deepEqual(run, SIZE_ORDER.filter((s) => run.includes(s)), `${p.title}: sizes out of order`);
      }
      for (const v of p.variants) {
        assert.ok(!ids.has(v.id), `variant id ${v.id} repeats`);
        ids.add(v.id);
      }
      sizes += p.variants.length;
      gone += p.variants.filter((v) => !v.available).length;
    }
    assert.ok(gone / sizes > 0.12 && gone / sizes < 0.4, `sold-out sizes ${gone / sizes}`);
    const soldOut = ps.filter((p) => p.variants.every((v) => !v.available)).length;
    assert.ok(soldOut >= 1 && soldOut <= 20, `sold-out pieces ${soldOut}`);
  }
});

test("pictures are drawn here: SVG data URLs, nothing loaded from anywhere, no text, the same piece the same picture", () => {
  const cat = catalogAt(CFG, NOW);
  for (const p of cat.products) {
    assert.ok(p.image?.startsWith("data:image/svg+xml"), p.title);
    const svg = svgOf(p.image!);
    assert.ok(svg.startsWith("<svg ") && svg.endsWith("</svg>"), p.title);
    assert.match(svg, /viewBox='0 0 100 100'/);
    assert.doesNotMatch(svg, /https?:\/\/(?!www\.w3\.org\/2000\/svg')/, `${p.title} links out`);
    assert.doesNotMatch(svg, /<text|<image|href|<script|<foreignObject/i, p.title);
    assert.ok(p.image!.length < 8000, `${p.title} picture ${p.image!.length} bytes`);
  }
  const json = JSON.stringify(cat);
  // no address and no other store's name anywhere in it (the pictures' SVG namespace is URL-encoded)
  assert.ok(!/https?:\/\//.test(json), "an address in the catalogue");
  assert.ok(!/cdn\.|\.com\b|lane\d/i.test(json), "another store's name in the catalogue");
  const later = new Map(catalogAt(CFG, NOW + 5 * DAY).products.map((p) => [p.id, p]));
  for (const p of cat.products) if (later.has(p.id)) assert.equal(later.get(p.id)!.image, p.image, p.title);
  assert.equal(garmentArt("dress", "Sage", { length: "midi" }), garmentArt("dress", "Sage", { length: "midi" }));
  assert.notEqual(garmentArt("dress", "Sage"), garmentArt("dress", "Black"));
  assert.notEqual(garmentArt("dress", "Sage"), garmentArt("skirt", "Sage"));
});

test("new pieces come out in drops on the drop days; the catalogue moves with them and a piece keeps what it is", () => {
  const now = catalogAt(CFG, NOW);
  const later = catalogAt(CFG, NOW + 14 * DAY);
  const newest = now.products[0].publishedAt;
  const fresh = later.products.filter((p) => p.publishedAt > newest);
  assert.ok(fresh.length >= 20 && fresh.length <= 40, `${fresh.length} new pieces in two weeks`);
  assert.ok(Math.abs(later.products.length - now.products.length) <= 15);
  const drops = new Set(CFG.catalog.dropDays.map((d) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d]));
  for (const p of [...now.products, ...later.products]) {
    const l = local(Date.parse(p.publishedAt));
    assert.ok(drops.has(l.weekday), `${p.title} out on a ${l.weekday}`);
    assert.ok(l.hour >= 10 && l.hour <= 11, `${p.title} out at ${l.hour}h`);
  }
  // today's drop is in the catalogue all day, published at 10:30 onwards
  const today = now.products.filter((p) => local(Date.parse(p.publishedAt)).date === "2026-10-13");
  assert.ok(today.length >= CFG.catalog.perDrop[0], `${today.length} pieces in today's drop`);
  const was = new Map(now.products.map((p) => [p.id, p]));
  let same = 0;
  for (const p of later.products) {
    const q = was.get(p.id);
    if (!q) continue;
    same++;
    assert.deepEqual([p.title, p.brand, p.category, p.publishedAt, p.image], [q.title, q.brand, q.category, q.publishedAt, q.image]);
    assert.deepEqual(p.variants.map((v) => [v.id, v.color, v.size]), q.variants.map((v) => [v.id, v.color, v.size]));
  }
  assert.ok(same > 100, `${same} pieces in both`);
});

test("a size sells out only once the piece has been out three weeks, and stays sold out", () => {
  for (const t of [NOW, ...YEAR]) {
    const cat = catalogAt(CFG, t);
    for (const p of cat.products) {
      if (p.variants.every((v) => v.available)) continue;
      // the engine dates a sold-out size's last sale up to 19.5 days after the piece came out: it has happened
      assert.ok(Date.parse(cat.at) - Date.parse(p.publishedAt) >= 19.5 * DAY, `${p.title} sold out too early`);
    }
  }
  const a = catalogAt(CFG, NOW);
  const b = new Map(catalogAt(CFG, NOW + 5 * DAY).products.map((p) => [p.id, p]));
  let checked = 0;
  for (const p of a.products) {
    const q = b.get(p.id);
    if (!q || p.best !== null || q.best !== null) continue;
    for (const v of p.variants) {
      if (v.available) continue;
      checked++;
      assert.equal(q.variants.find((x) => x.id === v.id)!.available, false, `${p.title} ${v.size} back in stock`);
    }
  }
  assert.ok(checked > 20, `${checked} sold-out sizes followed`);
});

test("the engine over the generated catalogue: only sizes in stock sold, never before a piece is out, today's drop shown from its time", () => {
  const before = Date.parse("2026-10-13T13:00:00Z"); // Tuesday 08:00 in Chicago, before the 10:30 drop
  const cat: Catalog = catalogAt(CFG, before);
  const w = storeWorld(CFG, cat);
  const byId = new Map(cat.products.map((p) => [p.id, p]));
  const coming = cat.products.filter((p) => Date.parse(p.publishedAt) > before);
  assert.ok(coming.length >= CFG.catalog.perDrop[0], "today's drop is in the catalogue");
  const shown = new Set(w.productRows({ now: before, per: 1000 }).rows.map((p) => p.id));
  for (const p of coming) {
    assert.ok(!shown.has(p.id), `${p.title} shown before it is out`);
    assert.equal(w.product(p.id, before), null);
  }
  const after = before + 6 * HOUR;
  const shownAfter = new Set(w.productRows({ now: after, per: 1000 }).rows.map((p) => p.id));
  for (const p of coming) assert.ok(shownAfter.has(p.id), `${p.title} not shown after it came out`);
  assert.ok(w.happenings(after, 1).some((h) => h.kind === "listed"), "today's drop listed on the other channels");

  const rows = w.orders({ now: after, per: 5000 }).rows;
  assert.ok(rows.length > 300, `${rows.length} orders`);
  for (const o of rows) {
    for (const l of o.lines) {
      const p = byId.get(l.productId)!;
      const v = p.variants.find((x) => x.color === l.color && x.size === l.size)!;
      if (!o.id.startsWith("l")) assert.ok(v.available, `${o.id} sold a sold-out size`);
      assert.ok(Date.parse(p.publishedAt) < Date.parse(o.placedAt), `${o.id} sold ${p.title} before it came out`);
      assert.equal(l.image, p.image);
    }
  }
  // the same orders all day: built from the same catalogue, the morning's orders keep their content
  const morning = new Map(w.orders({ now: before, per: 2000 }).rows.map((o) => [o.id, o]));
  const again = storeWorld(CFG, catalogAt(CFG, after));
  for (const o of again.orders({ now: before, per: 2000 }).rows.slice(0, 300)) assert.deepEqual(o.lines, morning.get(o.id)?.lines);
});

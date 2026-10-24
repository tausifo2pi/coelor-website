// node --test lib/storedemo/jewellery.test.mts
// The jewelry demo (/demo/jewellery-shop): its config (lib/storedemo/jewellery-config.ts), its generated catalogue
// (lib/storedemo/jewellery.ts) and pictures (lib/storedemo/jewellery-art.ts), the store engine over it (wholesale orders
// on Faire, sold-out ring sizes in words), its assistant (read-only, the studio's own routines) and its client Larkmoor
// (lib/demo/larkmoor.ts: rules, systems, fields, tile numbers). Fictional shop, generated numbers, no competitor tools.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { answer, parse, scriptOf, verifyOf } from "../demo/schedule.ts";
import { RULE_GROUPS, groupOf, shippedIn, touches } from "../demo/rules.ts";
import { LARKMOOR, larkmoorFields, resizesOpen, wholesaleOpen } from "../demo/larkmoor.ts";
import { STORE_DEMOS, WOMENS_BOUTIQUE, demoBySlug } from "./configs.ts";
import { JEWELLERY_SHOP as CFG } from "./jewellery-config.ts";
import { BIRTHSTONES, COLLECTIONS, LENGTHS, ONE_SIZE, RING_SIZES, jewelleryCatalogAt } from "./jewellery.ts";
import { METALS, jewelleryArt } from "./jewellery-art.ts";
import { catalogAt, catalogStamp } from "./catalog.ts";
import { storeWorld } from "./engine.ts";
import { storeAssistant } from "./assistant.ts";

const HOUR = 3_600_000;
const DAY = 86_400_000;
const NOW = Date.parse("2026-10-22T18:00:00Z"); // Thursday 14:00 in New York, a drop day
const YEAR = Array.from({ length: 13 }, (_, i) => Date.parse("2026-04-06T00:00:00Z") + i * 30 * DAY + (i % 5) * 5 * HOUR);
const CATEGORIES = ["Rings", "Necklaces", "Earrings", "Bracelets", "Charms"];
const root = new URL("../../", import.meta.url);
const read = (rel: string) => readFileSync(new URL(rel, root), "utf8");
const svgOf = (url: string) => decodeURIComponent(url.slice(url.indexOf(",") + 1));
const local = (t: number) => {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: CFG.tz, weekday: "short", hour: "numeric", hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(t));
  const g = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return { weekday: g("weekday"), hour: Number(g("hour")), date: `${g("year")}-${g("month")}-${g("day")}` };
};

/* ---------- the config ---------- */

test("the jewelry demo is a store demo of its own: /demo/jewellery-shop, its own generator, the boutique left as it was", () => {
  assert.equal(demoBySlug("jewellery-shop"), CFG);
  assert.ok(STORE_DEMOS.includes(CFG) && STORE_DEMOS.includes(WOMENS_BOUTIQUE));
  assert.equal(new Set(STORE_DEMOS.map((d) => d.slug)).size, STORE_DEMOS.length);
  assert.equal(CFG.catalog.build, jewelleryCatalogAt);
  assert.deepEqual(catalogAt(CFG, NOW), jewelleryCatalogAt(CFG, NOW));
  assert.equal(WOMENS_BOUTIQUE.catalog.build, undefined);
  assert.equal(WOMENS_BOUTIQUE.assistant, undefined);
  assert.ok(catalogAt(WOMENS_BOUTIQUE, NOW).products.every((p) => p.id.startsWith("p")), "the boutique keeps its own catalogue");
});

test("channels jewelry makers use: web store, Etsy, Amazon Handmade, eBay, Faire wholesale; every logo exists", () => {
  assert.deepEqual(CFG.channels.map((c) => c.name), ["Shopify", "Etsy", "Amazon Handmade", "eBay", "Faire"]);
  assert.equal(CFG.channels[0].listShare, 1, "the web store lists everything");
  const platforms = JSON.parse(read("data/platforms.json")).platforms as Record<string, { logo?: string }>;
  const marks = new Set([...read("components/demo/ui.tsx").matchAll(/^ {2}"?([a-z-]+)"?: \{ bg:/gm)].map((m) => m[1]));
  const logos = [...CFG.channels.map((c) => c.logo), CFG.stock.logo, CFG.shipping.tool.logo, ...CFG.shipping.carriers.map((c) => c.logo), CFG.tracking.logo, CFG.returns.logo, CFG.restock.logo, ...CFG.tools.map((t) => t.slug), ...LARKMOOR.systems.map((s) => s.slug)];
  for (const l of logos) assert.ok(marks.has(l) || platforms[l]?.logo, `no logo for ${l}`);
  const faire = CFG.channels.find((c) => c.id === "faire")!;
  assert.deepEqual([faire.lines, faire.priceShare, faire.label?.carrier], [[6, 14], 0.5, 1]);
  assert.equal(CFG.shipping.carriers[1].name, "UPS");
  // email-only page: no case study of its own, links go to the homepage's process and contact form
  assert.equal(CFG.caseHref, "/#process");
  assert.equal(CFG.contactHref, "/#contact");
});

test("no competitor tools, no shop counter, no sample words, no other goods' words", () => {
  const text = JSON.stringify({ ...CFG, catalog: { ...CFG.catalog, build: null }, assistant: null }) + JSON.stringify(LARKMOOR) + JSON.stringify(storeAssistant(CFG));
  for (const re of [/sellbrite/i, /linnworks/i, /channel\s?advisor/i, /zentail/i, /webgility/i, /channel\s?engine/i, /base\s?linker/i, /codisto/i, /marketplace connect/i, /litcommerce/i, /veeqo/i, /syncio/i, /\bTrunk\b/, /stock sync/i, /zapier/i, /\bsquare\b/i, /lightspeed/i, /\bpos\b/i]) {
    assert.doesNotMatch(text, re);
  }
  assert.doesNotMatch(text, /\bsample\b|\bdummy\b|demo data|real data|real orders/i);
  assert.doesNotMatch(text, /sneaker|stockx|\bdress|jeans|poshmark|tiktok live/i);
});

/* ---------- the catalogue ---------- */

test("the same shop day gives the same catalogue for every visitor; it is built again at New York's midnight", () => {
  assert.deepEqual(jewelleryCatalogAt(CFG, NOW), jewelleryCatalogAt(CFG, NOW));
  const morning = Date.parse("2026-10-22T10:00:00Z"); // 06:00 in New York
  const night = Date.parse("2026-10-23T03:30:00Z"); // 23:30
  assert.deepEqual(jewelleryCatalogAt(CFG, morning), jewelleryCatalogAt(CFG, NOW));
  assert.deepEqual(jewelleryCatalogAt(CFG, night), jewelleryCatalogAt(CFG, NOW));
  assert.equal(catalogStamp(CFG, NOW), "2026-10-22T04:00:00.000Z");
  assert.equal(jewelleryCatalogAt(CFG, NOW).at, catalogStamp(CFG, NOW));
  assert.notEqual(catalogStamp(CFG, night + HOUR), catalogStamp(CFG, NOW));
});

test("about 130 pieces of a jewelry studio: every category, its collections, studio prices, titles that never repeat", () => {
  for (const t of [NOW, ...YEAR]) {
    const ps = jewelleryCatalogAt(CFG, t).products;
    assert.ok(ps.length >= 120 && ps.length <= 150, `${ps.length} pieces`);
    const by = (f: (p: (typeof ps)[number]) => string) => ps.reduce<Record<string, number>>((m, p) => ((m[f(p)] = (m[f(p)] ?? 0) + 1), m), {});
    const cats = by((p) => p.category);
    for (const c of Object.keys(cats)) assert.ok(CATEGORIES.includes(c), c);
    assert.ok(Object.keys(cats).length === 5, `categories ${JSON.stringify(cats)}`);
    const main = ((cats.Rings ?? 0) + (cats.Necklaces ?? 0) + (cats.Earrings ?? 0)) / ps.length;
    assert.ok(main > 0.65 && main < 0.92, `rings, necklaces and earrings ${main}`);
    const colls = by((p) => p.brand);
    for (const c of Object.keys(colls)) assert.ok((COLLECTIONS as readonly string[]).includes(c), c);
    assert.ok(Object.keys(colls).length >= 5, JSON.stringify(colls));
    assert.equal(Object.entries(colls).sort((a, b) => b[1] - a[1])[0][0], "Everyday", JSON.stringify(colls));
    for (const p of ps) {
      assert.ok(Number.isInteger(p.price) && p.price >= 18 && p.price <= 890, `${p.title} $${p.price}`);
      if (p.compareAt !== undefined) assert.ok(p.compareAt > p.price, `${p.title} compare-at`);
      if (p.brand === "Heirloom 14k") assert.ok(p.price >= 95, `${p.title}: solid gold at $${p.price}`);
      assert.match(p.title, /^[A-Z][a-z]+( [A-Z][A-Za-z]*)+$/);
      assert.ok(p.title.length <= 48, p.title);
      assert.match(p.title, /(Ring|Band|Ring Set|Necklace|Choker|Earrings|Studs|Huggies|Hoops|Threaders|Ear Cuff|Bracelet|Bangle|Cuff|Charm)$/, p.title);
    }
    const marked = ps.filter((p) => p.compareAt !== undefined).length / ps.length;
    assert.ok(marked < 0.1, `last-chance prices ${marked}`);
    assert.equal(new Set(ps.map((p) => p.title)).size, ps.length, "a title repeats");
    assert.equal(new Set(ps.map((p) => p.id)).size, ps.length, "an id repeats");
    const best = ps.filter((p) => p.best !== null).map((p) => p.best!).sort((a, b) => a - b);
    assert.deepEqual(best, Array.from({ length: CFG.catalog.best }, (_, i) => i));
  }
});

test("ring sizes on rings only, chain lengths on some necklaces, one size elsewhere; metals or birthstones as variants", () => {
  for (const t of [NOW, ...YEAR.slice(0, 5)]) {
    const ps = jewelleryCatalogAt(CFG, t).products;
    const ids = new Set<string>();
    let variants = 0;
    let gone = 0;
    let lengths = 0;
    for (const p of ps) {
      const colours = [...new Set(p.variants.map((v) => v.color))];
      const sizes = [...new Set(p.variants.map((v) => v.size))];
      assert.equal(p.variants.length, colours.length * sizes.length, p.title);
      if (p.category === "Rings") {
        assert.ok(sizes.length >= 4 && sizes.every((s) => RING_SIZES.includes(s)), `${p.title}: ${sizes}`);
        assert.deepEqual(sizes, RING_SIZES.filter((s) => sizes.includes(s)), `${p.title}: sizes out of order`);
        assert.ok(colours.length <= 2, `${p.title}: ${colours.length} metals`);
      } else if (p.category === "Necklaces" && sizes.length > 1) {
        assert.deepEqual(sizes, LENGTHS, p.title);
        lengths++;
      } else assert.deepEqual(sizes, [ONE_SIZE], p.title);
      if (/Birthstone/.test(p.title)) assert.deepEqual(colours, BIRTHSTONES, p.title);
      else for (const c of colours) assert.ok(METALS[c], `${p.title}: metal ${c}`);
      if (p.brand === "Heirloom 14k") assert.ok(colours.every((c) => /^14k (Yellow|White|Rose) Gold$/.test(c)), `${p.title}: ${colours}`);
      for (const v of p.variants) {
        assert.ok(!ids.has(v.id), `variant id ${v.id} repeats`);
        ids.add(v.id);
      }
      variants += p.variants.length;
      gone += p.variants.filter((v) => !v.available).length;
    }
    assert.ok(lengths >= 2, `${lengths} necklaces in lengths`);
    assert.ok(gone / variants > 0.08 && gone / variants < 0.35, `sold-out variants ${gone / variants}`);
    const soldOut = ps.filter((p) => p.variants.every((v) => !v.available)).length;
    assert.ok(soldOut >= 1 && soldOut <= 18, `sold-out pieces ${soldOut}`);
  }
});

test("pictures are jewelry drawn here: SVG data URLs in the piece's metal, nothing loaded, no text, the same piece the same picture", () => {
  const cat = jewelleryCatalogAt(CFG, NOW);
  for (const p of cat.products) {
    assert.ok(p.image?.startsWith("data:image/svg+xml"), p.title);
    const svg = svgOf(p.image!);
    assert.ok(svg.startsWith("<svg ") && svg.endsWith("</svg>"), p.title);
    assert.match(svg, /viewBox='0 0 100 100'/);
    assert.match(svg, /<linearGradient id='m'/, `${p.title}: no metal`);
    assert.doesNotMatch(svg, /https?:\/\/(?!www\.w3\.org\/2000\/svg')/, `${p.title} links out`);
    assert.doesNotMatch(svg, /<text|<image|href|<script|<foreignObject/i, p.title);
    assert.ok(p.image!.length < 8000, `${p.title} picture ${p.image!.length} bytes`);
    if (!/Birthstone/.test(p.title)) assert.ok(svg.includes(METALS[p.variants[0].color].mid), `${p.title}: picture not in its first metal`);
  }
  const json = JSON.stringify(cat);
  assert.ok(!/https?:\/\//.test(json), "an address in the catalogue");
  assert.ok(!/cdn\.|\.com\b/i.test(json), "another store's name in the catalogue");
  const later = new Map(jewelleryCatalogAt(CFG, NOW + 5 * DAY).products.map((p) => [p.id, p]));
  for (const p of cat.products) if (later.has(p.id)) assert.equal(later.get(p.id)!.image, p.image, p.title);
  assert.equal(jewelleryArt("ring", "Gold Vermeil", { ring: "solitaire", stone: "Moonstone" }), jewelleryArt("ring", "Gold Vermeil", { ring: "solitaire", stone: "Moonstone" }));
  assert.notEqual(jewelleryArt("ring", "Gold Vermeil"), jewelleryArt("ring", "Sterling Silver"));
  assert.notEqual(jewelleryArt("ring", "Gold Vermeil"), jewelleryArt("necklace", "Gold Vermeil"));
  for (const kind of ["ring", "necklace", "earring", "bracelet", "charm"] as const) {
    assert.ok(cat.products.some((p) => p.category.toLowerCase().startsWith(kind)), `no ${kind} in the catalogue`);
  }
});

test("new pieces come out in Thursday drops at 10:00 New York time; a piece keeps what it is", () => {
  const now = jewelleryCatalogAt(CFG, NOW);
  const later = jewelleryCatalogAt(CFG, NOW + 14 * DAY);
  const newest = now.products[0].publishedAt;
  const fresh = later.products.filter((p) => p.publishedAt > newest);
  assert.ok(fresh.length >= 8 && fresh.length <= 14, `${fresh.length} new pieces in two weeks`);
  for (const p of [...now.products, ...later.products]) {
    const l = local(Date.parse(p.publishedAt));
    assert.equal(l.weekday, "Thu", `${p.title} out on a ${l.weekday}`);
    assert.equal(l.hour, 10, `${p.title} out at ${l.hour}h`);
  }
  const today = now.products.filter((p) => local(Date.parse(p.publishedAt)).date === "2026-10-22");
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

test("a size or metal sells out only once the piece has been out three weeks, and stays sold out", () => {
  for (const t of [NOW, ...YEAR]) {
    const cat = jewelleryCatalogAt(CFG, t);
    for (const p of cat.products) {
      if (p.variants.every((v) => v.available)) continue;
      assert.ok(Date.parse(cat.at) - Date.parse(p.publishedAt) >= 19.5 * DAY, `${p.title} sold out too early`);
    }
  }
  const a = jewelleryCatalogAt(CFG, NOW);
  const b = new Map(jewelleryCatalogAt(CFG, NOW + 5 * DAY).products.map((p) => [p.id, p]));
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
  assert.ok(checked > 20, `${checked} sold-out variants followed`);
});

/* ---------- the engine over it ---------- */

test("the engine over the catalogue: only what is in stock sold, never before a piece is out, today's drop shown from 10:00", () => {
  const before = Date.parse("2026-10-22T12:00:00Z"); // Thursday 08:00 in New York, before the drop
  const cat = jewelleryCatalogAt(CFG, before);
  const w = storeWorld(CFG, cat);
  const byId = new Map(cat.products.map((p) => [p.id, p]));
  const coming = cat.products.filter((p) => Date.parse(p.publishedAt) > before);
  assert.ok(coming.length >= CFG.catalog.perDrop[0], "today's drop is in the catalogue");
  const shown = new Set(w.productRows({ now: before, per: 1000 }).rows.map((p) => p.id));
  for (const p of coming) assert.ok(!shown.has(p.id), `${p.title} shown before it is out`);
  const after = before + 6 * HOUR;
  assert.ok(w.happenings(after, 1).some((h) => h.kind === "listed"), "today's drop listed on the other channels");
  const rows = w.orders({ now: after, per: 5000 }).rows;
  assert.ok(rows.length > 300, `${rows.length} orders`);
  for (const o of rows) {
    for (const l of o.lines) {
      const p = byId.get(l.productId)!;
      const v = p.variants.find((x) => x.color === l.color && x.size === l.size)!;
      if (!o.id.startsWith("l")) assert.ok(v.available, `${o.id} sold a sold-out variant`);
      assert.ok(Date.parse(p.publishedAt) < Date.parse(o.placedAt), `${o.id} sold ${p.title} before it came out`);
    }
  }
});

test("Faire orders are wholesale: many pieces at half the retail price, on Faire's prepaid UPS label; retail orders are 1 to 3 at retail", () => {
  const cat = jewelleryCatalogAt(CFG, NOW);
  const w = storeWorld(CFG, cat);
  const byId = new Map(cat.products.map((p) => [p.id, p]));
  const rows = w.orders({ now: NOW, per: 5000 }).rows.filter((o) => !o.id.startsWith("l"));
  const faire = rows.filter((o) => o.channel === "faire");
  assert.ok(faire.length >= 20, `${faire.length} Faire orders`);
  for (const o of faire) {
    assert.ok(o.lines.length >= 4 && o.lines.length <= 14, `${o.id}: ${o.lines.length} pieces`);
    for (const l of o.lines) assert.equal(l.price, Math.round(byId.get(l.productId)!.price * 0.5), `${o.id} ${l.title}`);
    assert.equal(o.carrier, "UPS");
    const label = o.steps.find((s) => s.kind === "label");
    if (label) assert.match(label.text, /^Faire prepaid label · UPS Ground$/);
  }
  for (const o of rows.filter((x) => x.channel !== "faire")) {
    assert.ok(o.lines.length <= 3, `${o.id}: ${o.lines.length} pieces`);
    for (const l of o.lines) assert.equal(l.price, byId.get(l.productId)!.price);
  }
  const k = w.overview(NOW).kpis.ordersTotal;
  assert.ok(k.shopify > k.etsy && k.etsy > k.amazon && k.amazon > k.ebay && k.ebay > k.faire, JSON.stringify(k));
});

test("webhooks for Shopify and Amazon, a 5-minute read for Etsy, eBay and Faire; a sold-out ring size reads as a size", () => {
  const w = storeWorld(CFG, jewelleryCatalogAt(CFG, NOW));
  for (const o of w.orders({ now: NOW, per: 3000 }).rows) {
    const s = o.steps.find((x) => x.kind === "stock");
    if (!s) continue;
    const d = Date.parse(s.at) - Date.parse(o.placedAt);
    if (o.channel === "shopify" || o.channel === "amazon") assert.ok(d >= 3_000 && d <= 15_000, `${o.id} webhook ${d}`);
    else assert.ok(d >= 5_000 && d <= 5 * 60_000 + 5_000, `${o.id} poll ${d}`);
  }
  assert.equal(w.rules(NOW).find((r) => r.key === "orders")!.every, "real time (webhooks) · Etsy, eBay and Faire every 5 min");
  const pulls = w.happenings(NOW, 400).filter((h) => h.kind === "pulled").map((h) => h.text);
  assert.ok(pulls.length > 10, `${pulls.length} pulls`);
  for (const t of pulls) {
    assert.match(t, /^(Last size \d+(\.5)? in .+ sold|Last [0-9]+" length in .+ sold|Last one in .+ sold|.+ sold out) on /, t);
    assert.doesNotMatch(t, /Last One size|Last \d+ in /, t);
  }
  assert.ok(pulls.some((t) => /^Last size /.test(t)), "no ring size pulled");
});

/* ---------- the assistant ---------- */

const P = storeAssistant(CFG);

test("the assistant speaks the studio's words and adds its own routines, in New York time", () => {
  for (const c of P.startChips) {
    const a = answer(c.text, null, NOW, P);
    assert.ok(a.ok, c.text);
    if (a.ok) assert.ok(P.kinds[a.kind], a.kind);
  }
  assert.equal(parse("ring size report every monday at 8", P).kind, "ring-sizes");
  assert.equal(parse("faire wholesale orders sheet every weekday", P).kind, "wholesale");
  assert.equal(parse("sizes running low every morning", P).kind, "reorder-list");
  assert.equal(parse("post sales to slack daily at 18:00", P).kind, "daily-summary");
  assert.equal(parse("returns report on mondays", P).kind, "returns-report");
  assert.equal(parse("amazon price check every 6 hours", P).kind, "price-check");
  assert.equal(P.kinds["price-check"].name, "Amazon Handmade price check");
  assert.ok(!P.kinds["live-lineup"], "no live channel, no lineup sheet");
  assert.ok(!storeAssistant(WOMENS_BOUTIQUE).kinds["ring-sizes"], "the boutique keeps its own routines");
  const a = answer("Ring size report every Monday at 8:00", null, NOW, P);
  assert.ok(a.ok);
  if (!a.ok) return;
  const s = scriptOf(a.schedule, P);
  assert.match(s.code, /tz: "America\/New_York"/);
  assert.match(verifyOf(a.schedule, NOW, P)[1].detail, /Google Sheets/);
  assert.ok(P.seeded.every((x) => P.kinds[x.kind]), "a seeded routine without its kind");
  assert.ok(!P.seeded.some((x) => x.share === "the buyer"), "a maker has no buyer");
});

test("beta: the studio's assistant refuses changes and posts only to the team's sheets and chat", () => {
  for (const t of ["list new pieces on Faire every morning", "push new rings to Etsy every hour", "hide sold-out sizes on eBay", "lower prices on Amazon every night", "update stock on Shopify"]) {
    const a = answer(t, null, NOW, P);
    assert.equal(a.ok, false, t);
    if (!a.ok) {
      assert.equal(a.refused, true, t);
      for (const c of a.chips) assert.ok(answer(c.text, null, NOW, P).ok, c.text);
    }
  }
  for (const s of P.seeded) assert.match(scriptOf(s, P).code, /sheets\.write|slack\.post/, s.id);
  // reads only: no call that writes to a channel or the stock (orders.list is a read)
  for (const k of Object.values(P.kinds)) assert.doesNotMatch(k.body.join("\n"), /\.(update|set|delete|publish|hide|push|adjust|reprice)\(/, k.name);
});

/* ---------- the client: Larkmoor ---------- */

test("Larkmoor's rules each sit in a group, touch a system of the build, shipped in a build-log entry, asked by the team", () => {
  for (const r of LARKMOOR.rules) {
    assert.ok(RULE_GROUPS.includes(groupOf(r)), r.code);
    assert.ok(touches(r, LARKMOOR.systems).length > 0, `${r.code} touches nothing`);
    assert.ok(shippedIn(LARKMOOR, r), `${r.code}: no build-log entry on ${r.built}`);
    assert.ok(LARKMOOR.team.some((m) => m.name === r.by), `${r.code}: ${r.by} is not on the team`);
    assert.ok(r.job === null || ["orders", "soldout", "listing", "labels", "tracking", "returns", "restock", "low"].includes(r.job), `${r.code}: job ${r.job}`);
  }
  const group = (code: string) => groupOf(LARKMOOR.rules.find((r) => r.code === code)!);
  assert.deepEqual(["J-01", "J-02", "J-03", "J-04", "J-07", "J-09", "J-10"].map(group), ["Orders", "Stock", "Listings & photos", "Orders", "Stock", "Stock", "Reports"]);
  const names = (code: string) => touches(LARKMOOR.rules.find((r) => r.code === code)!, LARKMOOR.systems).map((s) => s.name);
  assert.deepEqual(names("J-01"), ["Shopify", "Etsy", "Amazon Handmade", "eBay", "Faire"]);
  assert.ok(names("J-07").includes("Loop Returns"));
  assert.ok(names("J-08").includes("Faire"));
  assert.ok(names("J-09").includes("Casting house"));
  assert.ok(!names("J-11").includes("Casting house"));
  for (const b of LARKMOOR.buildLog) assert.ok(b.date >= LARKMOOR.since && LARKMOOR.team.some((m) => m.name === b.by), b.version);
  assert.equal(LARKMOOR.version, LARKMOOR.buildLog[LARKMOOR.buildLog.length - 1].version);
  const [y, m, d] = CFG.since;
  assert.equal(LARKMOOR.since, `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
});

test("Larkmoor fields follow the piece: metal, stone, sizing, batch, wholesale price, return and repair rule", () => {
  const w = storeWorld(CFG, jewelleryCatalogAt(CFG, NOW));
  const rows = w.productRows({ now: NOW, per: 1000 }).rows;
  for (const p of rows) {
    const f = larkmoorFields(p, 0.5);
    assert.deepEqual(larkmoorFields(p, 0.5), f, p.title);
    assert.match(f.batch, /^CB-\d{4}$/);
    if (p.category === "Rings") assert.match(f.sizing, /^US \d/);
    if (p.category === "Earrings") assert.match(f.care, /hygiene seal/);
    if (p.brand === "Heirloom 14k") assert.match(f.metal, /solid 14k/i);
    if (/Pearl|Opal|Moonstone|Lab Diamond|Sapphire|Birthstone/.test(p.title)) assert.ok(f.stone, `${p.title}: no stone`);
    assert.equal(f.wholesale, p.listedOn.includes("faire") ? `$${Math.round(p.price * 0.5)} on Faire · minimum 2` : "Retail only", p.title);
  }
  const ring = larkmoorFields({ id: "x", title: "Ada Hammered Band", category: "Rings", brand: "Everyday", price: 48, variants: ["5", "5.5", "6"].map((size) => ({ color: "Gold Vermeil", size })) });
  assert.equal(ring.sizing, "US 5–6 with half sizes · one free resize within 60 days");
  assert.equal(ring.metal, "18k gold vermeil on 925 silver");
});

test("the tiles' own numbers: open Faire orders and ring resizes, counted from the orders", () => {
  const w = storeWorld(CFG, jewelleryCatalogAt(CFG, NOW));
  const orders = w.orders({ now: NOW, per: 100_000 }).rows;
  const open = wholesaleOpen(orders);
  const faire = orders.filter((o) => o.channel === "faire" && (o.state === "Paid" || o.state === "Label printed"));
  assert.equal(open.orders, faire.length);
  assert.equal(open.pieces, faire.reduce((s, o) => s + o.lines.length, 0));
  const returning = orders.filter((o) => o.state === "Return started").length;
  const resizes = resizesOpen(orders);
  assert.ok(resizes >= 0 && resizes <= returning, `${resizes} of ${returning}`);
});

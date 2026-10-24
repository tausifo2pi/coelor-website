// node --test lib/storedemo/streetwear.test.mts
// The streetwear demo (/demo/streetwear-shop): its config (channels, carriers and tools streetwear shops use, no
// competitor tools, no shop counter), its generated catalogue (lib/storedemo/catalog-streetwear.ts: the same all day,
// a believable streetwear mix under invented labels, no real brand's names, sizes S–XXL, caps one size, pictures drawn
// here), its sell-outs (a hot drop sells out in minutes, every size at its own moment, shown by the engine at that
// moment and never sold after it), its one-of-a-kind pre-owned pieces (one unit, sold once, pulled from the other
// apps), the drop-day rush on the web store, the production runs, and its assistant (beta, read-only).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { STORE_DEMOS, STREETWEAR_SHOP as CFG, WOMENS_BOUTIQUE, demoBySlug } from "./configs.ts";
import { catalogAt, catalogStamp } from "./catalog.ts";
import { DROP_MINUTE, ONE_SIZE, OWN_LABEL, PRE_OWNED, streetwearCatalogAt } from "./catalog-streetwear.ts";
import { STREET_SHADES, streetArt } from "./art-streetwear.ts";
import { storeWorld } from "./engine.ts";
import { storeAssistant } from "./assistant.ts";
import { streetwearRoutines } from "./assistant-streetwear.ts";
import { answer, parse, scriptOf, verifyOf } from "../demo/schedule.ts";
import { CINDERLOT } from "../demo/client-streetwear.ts";

const HOUR = 3_600_000;
const DAY = 86_400_000;
// Thursday 22 Oct 2026, 12:30 in Los Angeles (PDT): a drop day, an hour and a half after the drop opened
const DROP = Date.parse("2026-10-22T19:30:00Z");
const NOW = Date.parse("2026-10-24T18:00:00Z"); // Saturday 11:00 in Los Angeles
const YEAR = Array.from({ length: 13 }, (_, i) => Date.parse("2026-04-20T00:00:00Z") + i * 29 * DAY + (i % 5) * 5 * HOUR);
const CATEGORIES = ["Tees", "Long Sleeves", "Hoodies", "Crewnecks", "Pants", "Shorts", "Outerwear", "Headwear", PRE_OWNED];
const SIZES = ["S", "M", "L", "XL", "XXL"];
const platforms = JSON.parse(readFileSync(new URL("../../data/platforms.json", import.meta.url), "utf8")).platforms as Record<string, { logo?: string }>;
// marks drawn in components/demo/ui.tsx (MARKS) for tools without a logo file
const MARKS = new Set(["ups", "usps", "fedex", "aftership", "shipstation", "loop", "stockroom", "discord", "slack", "excel"]);
const hasLogo = (slug: string) => MARKS.has(slug) || !!platforms[slug]?.logo;

const local = (t: number) => {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: CFG.tz, weekday: "short", hour: "numeric", minute: "numeric", hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(t));
  const g = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return { weekday: g("weekday"), hour: Number(g("hour")), minute: Number(g("minute")), date: `${g("year")}-${g("month")}-${g("day")}` };
};
const svgOf = (url: string) => decodeURIComponent(url.slice(url.indexOf(",") + 1));

// competitor tools (inventory / multichannel sync, listing tools), and real streetwear labels: never on this demo
const COMPETITORS = /sellbrite|linnworks|channel\s?advisor|rithum|zentail|webgility|channel\s?engine|base\s?linker|codisto|marketplace connect|litcommerce|lengow|channable|veeqo|sumtracker|\btrunk\b|syncio|stock sync|copyt|consignr|consigncloud|vendoo|list perfectly|crosslist|zapier|make\.com|celigo|shopify (marketplace connect|collective)/i;
const REAL_LABELS = /supreme|st[uü]ssy|palace|kith|bape|a bathing ape|off-white|fear of god|essentials|corteiz|crtz|trapstar|carhartt|dickies|champion|nike|adidas|jordan|new balance|bodega|undefeated|aim[eé] leon dore|denim tears|chrome hearts|hellstar|sp5der|gallery dept|rhude|anti social|brain dead|online ceramics|pleasures|the hundreds|\bhuf\b|obey|diamond supply|billionaire boys|ice ?cream|vlone|amiri|kaws|human made|stone island|cav empt|noah\b|aape|palm angels|broken planet/i;

test("the streetwear demo is a store demo of its own, on its own page", () => {
  assert.ok(STORE_DEMOS.includes(CFG));
  assert.equal(demoBySlug("streetwear-shop"), CFG);
  assert.equal(demoBySlug("womens-boutique"), WOMENS_BOUTIQUE);
  assert.equal(new Set(STORE_DEMOS.map((d) => d.slug)).size, STORE_DEMOS.length);
  assert.notEqual(CFG.slug, "multi-platform-sync");
  assert.equal(CFG.catalog.build, streetwearCatalogAt);
  assert.equal(CFG.assistant, streetwearRoutines);
  assert.equal(CINDERLOT.name, OWN_LABEL);
  assert.equal(CINDERLOT.id, "streetwear");
  // email-only: the demo links back to the site's own pages, never to another case study's goods
  assert.ok(CFG.caseHref.startsWith("/") && !CFG.caseHref.includes("womens"));
  assert.ok(CFG.contactHref.startsWith("/") && CFG.contactHref.endsWith("#contact"));
});

test("channels, carriers and tools are what streetwear shops use; every one has a logo; no competitor, no shop counter", () => {
  const ids = CFG.channels.map((c) => c.id);
  assert.deepEqual(ids, ["shopify", "tiktok", "ebay", "grailed", "depop"]);
  for (const c of CFG.channels) assert.ok(hasLogo(c.logo), c.logo);
  for (const t of [CFG.stock, CFG.shipping.tool, ...CFG.shipping.carriers, CFG.tracking, CFG.returns, CFG.restock]) assert.ok(hasLogo(t.logo), t.logo);
  for (const t of CFG.tools) assert.ok(hasLogo(t.slug), t.slug);
  for (const s of CINDERLOT.systems) assert.ok(hasLogo(s.slug), s.slug);
  const text = JSON.stringify(CFG) + JSON.stringify(CINDERLOT);
  assert.doesNotMatch(text, COMPETITORS);
  assert.doesNotMatch(text, /\bpos\b|point of sale|lightspeed|square\b|shop counter|\btill\b/i);
  assert.doesNotMatch(text, /\bsample\b|dummy|fake|demo data|real data|real client/i);
  // the web store lists everything; pre-owned pieces stay off the social shop and are on every resale app
  assert.equal(CFG.channels[0].listShare, 1);
  assert.ok(CFG.channels.find((c) => c.id === "tiktok")!.never?.includes(PRE_OWNED));
  for (const id of ["ebay", "grailed", "depop"]) assert.ok(CFG.channels.find((c) => c.id === id)!.always?.includes(PRE_OWNED), id);
});

test("the same shop day gives the same catalogue; the next day is built again", () => {
  assert.deepEqual(catalogAt(CFG, NOW), catalogAt(CFG, NOW));
  assert.deepEqual(catalogAt(CFG, NOW), streetwearCatalogAt(CFG, NOW));
  const morning = Date.parse("2026-10-24T08:00:00Z"); // 01:00 in LA
  const night = Date.parse("2026-10-25T06:30:00Z"); // 23:30 in LA
  assert.deepEqual(catalogAt(CFG, morning), catalogAt(CFG, NOW));
  assert.deepEqual(catalogAt(CFG, night), catalogAt(CFG, NOW));
  assert.equal(catalogStamp(CFG, NOW), "2026-10-24T07:00:00.000Z");
  assert.equal(catalogAt(CFG, NOW).at, catalogStamp(CFG, NOW));
  assert.notEqual(catalogStamp(CFG, night + HOUR), catalogStamp(CFG, NOW));
});

test("about 150 pieces of a streetwear shop: every kind, its own label first, invented names only, titles that never repeat", () => {
  for (const t of [NOW, DROP, ...YEAR]) {
    const ps = catalogAt(CFG, t).products;
    assert.ok(ps.length >= 145 && ps.length <= 185, `${ps.length} pieces`);
    const by = (f: (p: (typeof ps)[number]) => string) => ps.reduce<Record<string, number>>((m, p) => ((m[f(p)] = (m[f(p)] ?? 0) + 1), m), {});
    const cats = by((p) => p.category);
    for (const c of Object.keys(cats)) assert.ok(CATEGORIES.includes(c), c);
    assert.ok(Object.keys(cats).length >= 8, `categories ${JSON.stringify(cats)}`);
    const tops = ((cats.Tees ?? 0) + (cats.Hoodies ?? 0) + (cats.Crewnecks ?? 0) + (cats["Long Sleeves"] ?? 0)) / ps.length;
    assert.ok(tops > 0.35 && tops < 0.7, `tops ${tops}`);
    const pre = (cats[PRE_OWNED] ?? 0) / ps.length;
    assert.ok(pre > 0.06 && pre < 0.22, `pre-owned ${pre}`);
    const labels = by((p) => p.brand);
    assert.equal(Object.keys(labels).length, 5, JSON.stringify(labels));
    const own = labels[OWN_LABEL] / ps.length;
    assert.ok(own > 0.45 && own < 0.8, `own label ${own}`);
    for (const p of ps) {
      assert.ok(Number.isInteger(p.price) && p.price >= 30 && p.price <= 380, `${p.title} $${p.price}`);
      if (p.compareAt !== undefined) assert.ok(p.compareAt > p.price, `${p.title} compare-at`);
      assert.match(p.title, /^(?:(?:FW|SS)\d\d )?[A-Z][A-Za-z]*(?: [A-Z0-9][A-Za-z0-9-]*)+$/, p.title);
      assert.ok(p.title.length <= 48, p.title);
      assert.doesNotMatch(`${p.title} ${p.brand}`, REAL_LABELS, p.title);
      assert.doesNotMatch(`${p.title} ${p.brand}`, /\bsneaker|\bkicks?\b|\bshoes?\b|\bpairs?\b/i, p.title);
    }
    assert.equal(new Set(ps.map((p) => p.title)).size, ps.length, "a title repeats");
    assert.equal(new Set(ps.map((p) => p.id)).size, ps.length, "an id repeats");
    const best = ps.filter((p) => p.best !== null).map((p) => p.best!).sort((a, b) => a - b);
    assert.deepEqual(best, Array.from({ length: CFG.catalog.best }, (_, i) => i));
    assert.ok(ps.every((p) => p.best === null || p.category !== PRE_OWNED), "a pre-owned best seller");
  }
});

test("sizes S–XXL in order, caps and beanies one size; a pre-owned piece is one unit of one size", () => {
  for (const t of [NOW, ...YEAR.slice(0, 5)]) {
    const ps = catalogAt(CFG, t).products;
    const ids = new Set<string>();
    for (const p of ps) {
      const colours = [...new Set(p.variants.map((v) => v.color))];
      const run = [...new Set(p.variants.map((v) => v.size))];
      assert.equal(p.variants.length, colours.length * run.length, p.title);
      for (const c of colours) assert.ok(STREET_SHADES[c], `${p.title}: colour ${c}`);
      if (p.category === PRE_OWNED) {
        assert.equal(p.oneOff, true, p.title);
        assert.equal(p.variants.length, 1, p.title);
        assert.match(p.title, /^(FW|SS)\d\d /);
      } else {
        assert.ok(!p.oneOff, p.title);
        if (/Cap|Hat|Beanie|5-Panel/.test(p.title)) assert.deepEqual(run, [ONE_SIZE], p.title);
        else {
          assert.ok(run.length >= 4 && ["S", "M", "L", "XL"].every((s) => run.includes(s)), `${p.title}: ${run}`);
          assert.deepEqual(run, SIZES.filter((s) => run.includes(s)), `${p.title}: sizes out of order`);
        }
      }
      for (const v of p.variants) {
        assert.ok(!ids.has(v.id), `variant id ${v.id} repeats`);
        ids.add(v.id);
      }
    }
  }
});

test("pictures are streetwear, drawn here: SVG data URLs, nothing loaded from anywhere, no text, the same piece the same picture", () => {
  const cat = catalogAt(CFG, NOW);
  for (const p of cat.products) {
    assert.ok(p.image?.startsWith("data:image/svg+xml"), p.title);
    const svg = svgOf(p.image!);
    assert.ok(svg.startsWith("<svg ") && svg.endsWith("</svg>"), p.title);
    assert.match(svg, /viewBox='0 0 100 100'/);
    assert.doesNotMatch(svg, /https?:\/\/(?!www\.w3\.org\/2000\/svg')/, `${p.title} links out`);
    assert.doesNotMatch(svg, /<text|<image|href|<script|<foreignObject/i, p.title);
    assert.ok(p.image!.length < 9000, `${p.title} picture ${p.image!.length} bytes`);
  }
  assert.ok(!/https?:\/\//.test(JSON.stringify(cat)), "an address in the catalogue");
  const later = new Map(catalogAt(CFG, NOW + 5 * DAY).products.map((p) => [p.id, p]));
  for (const p of cat.products) if (later.has(p.id)) assert.equal(later.get(p.id)!.image, p.image, p.title);
  assert.equal(streetArt("hoodie", "Black", { graphic: "big", mark: 1 }), streetArt("hoodie", "Black", { graphic: "big", mark: 1 }));
  assert.notEqual(streetArt("hoodie", "Black"), streetArt("crewneck", "Black"));
  assert.notEqual(streetArt("cap", "Black", { cap: "six" }), streetArt("cap", "Black", { cap: "trucker" }));
  // not the boutique's pictures: its own canvas colour
  assert.match(svgOf(streetArt("tee", "Black")), /#ececea/);
});

test("drops go live at 11:00 on the drop day, all at once; pre-owned pieces go up on Monday afternoons", () => {
  const now = catalogAt(CFG, NOW);
  const later = catalogAt(CFG, NOW + 14 * DAY);
  const newest = now.products[0].publishedAt;
  const fresh = later.products.filter((p) => p.publishedAt > newest);
  assert.ok(fresh.length >= 18 && fresh.length <= 36, `${fresh.length} new pieces in two weeks`);
  for (const p of [...now.products, ...later.products]) {
    const l = local(Date.parse(p.publishedAt));
    if (p.category === PRE_OWNED) assert.ok(l.weekday === "Mon" && l.hour === 16, `${p.title} up ${l.weekday} ${l.hour}h`);
    else assert.deepEqual([l.weekday, l.hour * 60 + l.minute], ["Thu", DROP_MINUTE], `${p.title} out ${l.weekday} ${l.hour}:${l.minute}`);
  }
  const drop = catalogAt(CFG, DROP).products.filter((p) => local(Date.parse(p.publishedAt)).date === "2026-10-22");
  assert.ok(drop.length >= CFG.catalog.perDrop[0] && drop.length <= CFG.catalog.perDrop[1], `${drop.length} pieces in the drop`);
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

test("every size sells out at its own moment: before today = sold out, later today = still for sale until then, and it stays sold out", () => {
  for (const t of [NOW, DROP, ...YEAR]) {
    const cat = catalogAt(CFG, t);
    const start = Date.parse(cat.at);
    for (const p of cat.products) {
      for (const v of p.variants) {
        if (!v.soldAt) {
          assert.ok(v.available, `${p.title} ${v.size} sold out without a moment`);
          continue;
        }
        const at = Date.parse(v.soldAt);
        assert.ok(at > Date.parse(p.publishedAt), `${p.title} ${v.size} sold before it came out`);
        if (v.available) assert.ok(at >= start && at < start + 25 * HOUR, `${p.title} ${v.size} later today`);
        else assert.ok(at < start, `${p.title} ${v.size} sold out before its moment`);
      }
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
  assert.ok(checked > 30, `${checked} sold-out sizes followed`);
});

test("limited drops sell out fast: every drop's first size goes within the hour, a good part of it within two days", () => {
  let total = 0;
  let gone = 0;
  for (let w = 0; w < 10; w++) {
    const opened = Date.parse("2026-08-13T18:00:00Z") + w * 7 * DAY; // Thursdays 11:00 PDT
    const cat = catalogAt(CFG, opened + 2 * DAY);
    const drop = cat.products.filter((p) => p.publishedAt === new Date(opened).toISOString());
    assert.ok(drop.length >= CFG.catalog.perDrop[0], `${drop.length} pieces on ${new Date(opened).toISOString()}`);
    const times = drop.flatMap((p) => p.variants.filter((v) => v.soldAt).map((v) => Date.parse(v.soldAt!)));
    assert.ok(Math.min(...times) - opened < HOUR, `first sell-out ${(Math.min(...times) - opened) / 60_000} min in`);
    total += drop.reduce((s, p) => s + p.variants.length, 0);
    gone += times.filter((t) => t <= opened + 2 * DAY).length;
  }
  assert.ok(gone / total > 0.3 && gone / total < 0.85, `${Math.round((gone / total) * 100)}% of sizes gone in two days`);
});

test("the engine over the catalogue: nothing sold after its moment, pre-owned only once, listed only where it may be", () => {
  for (const t of [NOW, DROP + 3 * HOUR]) {
    const cat = catalogAt(CFG, t);
    const w = storeWorld(CFG, cat);
    const byId = new Map(cat.products.map((p) => [p.id, p]));
    const rows = w.orders({ now: t, per: 10_000 }).rows;
    assert.ok(rows.length > 600, `${rows.length} orders`);
    const oneOffSales = new Map<string, number>();
    for (const o of rows) {
      for (const l of o.lines) {
        const p = byId.get(l.productId)!;
        const v = p.variants.find((x) => x.color === l.color && x.size === l.size)!;
        assert.ok(Date.parse(p.publishedAt) <= Date.parse(o.placedAt), `${o.id} sold ${p.title} before it came out`);
        if (o.id.startsWith("l")) assert.equal(o.placedAt, new Date(Date.parse(v.soldAt!)).toISOString(), `${o.id} last unit off its moment`);
        else {
          assert.ok(v.available, `${o.id} sold a sold-out size`);
          if (v.soldAt) assert.ok(Date.parse(o.placedAt) < Date.parse(v.soldAt), `${o.id} sold ${p.title} ${v.size} after its last unit`);
        }
        if (p.oneOff) {
          assert.ok(o.id.startsWith("l"), `${o.id}: a one-off sold twice`);
          oneOffSales.set(p.id, (oneOffSales.get(p.id) ?? 0) + 1);
        }
      }
    }
    for (const [id, n] of oneOffSales) assert.equal(n, 1, id);
    const listed = new Map(w.productRows({ now: t, per: 1000 }).rows.map((p) => [p.id, p]));
    for (const o of rows) for (const l of o.lines) assert.ok(listed.get(l.productId)!.listedOn.includes(o.channel), `${o.id} not listed on ${o.channel}`);
    for (const p of listed.values()) {
      if (p.category === PRE_OWNED) {
        assert.deepEqual(p.listedOn, ["shopify", "ebay", "grailed", "depop"], p.title);
        assert.ok(p.stock.every((v) => v.stock === (v.soldAt && Date.parse(v.soldAt) <= t ? 0 : 1)), `${p.title} stock`);
      }
      for (const v of p.stock) if (v.soldAt && Date.parse(v.soldAt) <= t) assert.equal(v.stock, 0, `${p.title} ${v.size} still in stock after its last unit`);
      assert.equal(p.soldOut, p.stock.every((v) => v.stock === 0));
    }
  }
});

test("a sell-out shows its last sale and the pull at its moment, also later today; a one-off sale pulls the other apps", () => {
  const cat = catalogAt(CFG, DROP);
  const w = storeWorld(CFG, cat);
  const opened = Date.parse("2026-10-22T18:00:00Z");
  const later = cat.products.flatMap((p) => p.variants.filter((v) => v.available && v.soldAt).map((v) => ({ p, v, at: Date.parse(v.soldAt!) })));
  assert.ok(later.length > 0, "nothing sells out later on drop day");
  for (const { p, v, at } of later.slice(0, 6)) {
    const row = (t: number) => w.product(p.id, t)!.row.stock.find((x) => x.id === v.id)!;
    assert.ok(row(at - 60_000).stock > 0, `${p.title} ${v.size} gone before its moment`);
    assert.equal(row(at + 60_000).stock, 0, `${p.title} ${v.size} still there after its moment`);
    const pulls = w.happenings(at + 10 * 60_000, 1).filter((h) => h.kind === "pulled" && h.title === p.title);
    assert.ok(pulls.length > 0, `${p.title}: no pull shown`);
    assert.equal(w.happenings(at - 60_000, 1).filter((h) => h.kind === "pulled" && h.title === p.title && Date.parse(h.at) >= at).length, 0);
  }
  assert.ok(later.some((x) => x.at - opened < HOUR), "no size of the drop sold out in its first hour");
  const pre = storeWorld(CFG, catalogAt(CFG, NOW)).happenings(NOW, 45).filter((h) => h.kind === "pulled" && /^(FW|SS)\d\d /.test(h.title));
  assert.ok(pre.length >= 3, `${pre.length} one-off sales`);
  for (const h of pre) {
    assert.match(h.text, /sold on (Shopify|eBay|Grailed|Depop)/, h.text);
    assert.doesNotMatch(h.text, /TikTok/, h.text);
  }
});

test("drop day: the web store's rush at 11:00 is the drop's own pieces; other days have none", () => {
  const cat = catalogAt(CFG, DROP + 4 * HOUR);
  const w = storeWorld(CFG, cat);
  const opened = Date.parse("2026-10-22T18:00:00Z");
  const drop = new Set(cat.products.filter((p) => p.publishedAt === new Date(opened).toISOString()).map((p) => p.id));
  const shop = w.orders({ now: DROP + 4 * HOUR, channel: "shopify", per: 10_000 }).rows;
  const rush = shop.filter((o) => Date.parse(o.placedAt) >= opened && Date.parse(o.placedAt) < opened + HOUR);
  assert.ok(rush.length >= 25, `${rush.length} orders in the drop's first hour`);
  assert.ok(rush.filter((o) => o.lines.some((l) => drop.has(l.productId))).length / rush.length > 0.8, "the rush is not the drop");
  const week = Date.parse("2026-10-20T18:00:00Z"); // Tuesday 11:00
  const quiet = shop.filter((o) => Date.parse(o.placedAt) >= week && Date.parse(o.placedAt) < week + HOUR);
  assert.ok(quiet.length < rush.length / 4, `${quiet.length} orders at 11:00 on a Tuesday`);
  const k = w.overview(DROP + 4 * HOUR).kpis.orders24h;
  assert.ok(k.shopify > k.tiktok + k.ebay + k.grailed + k.depop, JSON.stringify(k));
});

test("restocks are the shop's own production runs; the rules say so", () => {
  const w = storeWorld(CFG, catalogAt(CFG, NOW));
  const runs = w.happenings(NOW, 30).filter((h) => h.kind === "restock");
  assert.ok(runs.length >= 3, `${runs.length} runs`);
  for (const r of runs) {
    assert.equal(r.title, "Production run received");
    assert.match(r.text, new RegExp(`^${OWN_LABEL} · \\d+ pieces → stock up on all 5 channels$`));
  }
  const rules = Object.fromEntries(w.rules(NOW).map((r) => [r.key, r]));
  assert.equal(rules.restock.name, "Production runs");
  assert.match(rules.restock.when, /production sheet/);
  assert.match(rules.orders.every, /^real time \(webhooks\) · Grailed and Depop every 10 min$/);
  // the boutique keeps its wholesale wording
  const b = storeWorld(WOMENS_BOUTIQUE, catalogAt(WOMENS_BOUTIQUE, NOW));
  assert.equal(Object.fromEntries(b.rules(NOW).map((r) => [r.key, r])).restock.name, "Wholesale restocks");
});

test("Grailed and Depop orders ship on their own prepaid USPS labels; the rest through ShipStation", () => {
  const w = storeWorld(CFG, catalogAt(CFG, NOW));
  const rows = w.orders({ now: NOW, per: 10_000 }).rows;
  for (const id of ["grailed", "depop"]) {
    const os = rows.filter((o) => o.channel === id);
    assert.ok(os.length > 20, `${id} ${os.length}`);
    for (const o of os) {
      assert.equal(o.carrier, "USPS");
      const l = o.steps.find((s) => s.kind === "label");
      if (l) assert.match(l.text, id === "grailed" ? /Grailed prepaid label/ : /Depop shipping label/);
    }
  }
  const other = rows.find((o) => o.channel === "ebay" && o.steps.some((s) => s.kind === "label"))!;
  assert.match(other.steps.find((s) => s.kind === "label")!.text, /ShipStation/);
});

test("the assistant: the shop's own routines (drop recap, consignor payouts, reprint list), in Los Angeles time, read-only", () => {
  const P = storeAssistant(CFG);
  assert.equal(WOMENS_BOUTIQUE.assistant, undefined);
  assert.match(storeAssistant(WOMENS_BOUTIQUE).greeting, /low-stock reorder list/);
  assert.equal(P.tz, "America/Los_Angeles");
  for (const c of [...P.startChips, ...P.insteadChips]) {
    const a = answer(c.text, null, NOW, P);
    assert.ok(a.ok, c.text);
  }
  assert.equal(parse("drop recap to discord every thursday at 6pm", P).kind, "drop-recap");
  assert.equal(parse("consignor payouts every monday", P).kind, "consignor-sheet");
  assert.equal(parse("reprint list every morning", P).kind, "reorder-list");
  assert.equal(parse("tiktok live lineup at 6:30pm", P).kind, "live-lineup");
  assert.equal(parse("ebay price check every 6 hours", P).kind, "price-check");
  const recap = P.seeded.find((s) => s.kind === "drop-recap")!;
  assert.deepEqual(recap.freq, { type: "weekly", day: 4, at: { h: 18, m: 0 } });
  const s = scriptOf(recap, P);
  assert.match(s.code, /discord\.post\(CHANNEL/);
  assert.match(s.code, /const CHANNEL = discord\.channel\("#drops"\)/);
  assert.match(s.code, /tz: "America\/Los_Angeles"/);
  assert.doesNotMatch(JSON.stringify(P.seeded.map((x) => scriptOf(x, P).code)), /picqer|stockx|alias|amazon|walmart|poshmark|faire/i);
  assert.match(verifyOf(recap, NOW, P)[1].detail, /Discord/);
  for (const x of P.seeded) assert.match(scriptOf(x, P).code, /sheets\.write|discord\.post/, x.id);
  for (const t of ["list the new drop on Grailed every morning", "hide sold-out sizes on Depop", "lower prices on eBay every night", "push new products to every channel every 15 minutes"]) {
    const a = answer(t, null, NOW, P);
    assert.equal(a.ok, false, t);
    if (!a.ok) {
      assert.equal(a.refused, true, t);
      for (const c of a.chips) assert.ok(answer(c.text, null, NOW, P).ok, c.text);
    }
  }
});

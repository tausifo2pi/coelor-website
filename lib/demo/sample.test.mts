// node --test lib/demo/sample.test.mts
// The generated channels (lib/demo/sample.ts): deterministic, time-based, the volumes and rhythm of a web store and of
// live selling, the same shape as the real rows (nothing in the answer tells them apart), nothing identifying the
// client, and every name and label taken from the channel config (so a slot can be flipped to another platform).
import { test } from "node:test";
import assert from "node:assert/strict";
import { CHANNELS, fromApi, type Channel } from "./channels.ts";
import { SAMPLE_START, isSampleKey, rhythmOf, sampleWorld } from "./sample.ts";
import { linkedOf, overviewOf, productOf, rowId, saleOf, type Overview, type Sale } from "./shape.ts";

const NOW = Date.parse("2026-09-30T19:50:00Z"); // a Wednesday evening
const WEEK = Date.parse("2026-09-21T00:00:00Z"); // Monday
const DAY = 86_400_000;
const ids = CHANNELS.filter((c) => !fromApi(c.id)).map((c) => c.id);
const [WEB, LIVE] = ids; // the web store and the live-selling slot as channels.ts has them
const everything = (w = sampleWorld(), platform?: string, now = NOW) => w.sales({ now, platform, limit: 1e6 }).rows;
const byDay = (rows: Sale[], from: number, days: number) => {
  const n = Array.from({ length: days }, () => 0);
  for (const r of rows) {
    const d = Math.floor((Date.parse(r.soldAt!) - from) / DAY);
    if (d >= 0 && d < days) n[d]++;
  }
  return n;
};

// a real overview as lib/demo/shape.ts builds it (two real jobs, one real sale)
const page = (rows: unknown[], total: number) => ({ data: { page: { totalIndex: total }, data: rows } });
const stockxOrder = {
  _id: "x1", orderNumber: "04-AAAAAAAAAA", dateCreated: "2026-09-30T19:30:03.796Z", store: "stockx_eu", status: "CREATED", createdAt: "2026-09-30T19:28:12.027Z",
  product: { productName: "adidas BadBo 1.0 Bad Bunny Night Navy", styleId: "LB5996" }, variant: { variantValue: "8.5" }, picqerStockLog: "stock updated -1 from X",
};
const realOverview = (now = NOW): Overview => overviewOf({
  cron: { jobs: [
    { key: "stockx-orders", lastStatus: "success", lastRun: new Date(now - 60_000).toISOString() },
    { key: "alias-orders", lastStatus: "success", lastRun: new Date(now - 120_000).toISOString() },
    { key: "stockx-products", lastStatus: "success", lastRun: new Date(now - 180_000).toISOString() },
  ] },
  stats: { data: { total: 31671, withMatches: 11970 } },
  sx: page([stockxOrder], 38768), al: page([], 16829), sxListings: page([], 14821), alListings: page([], 9095),
}, now);

// Nothing the page must not show (as lib/demo/shape.test.mts): the client's name, internal field names, the real
// fixtures' ids and order numbers, bins. And nothing that says the rows are made up.
const FORBIDDEN = [/6ab[0-9a-f]{21}/, /aa6672eb/, /01a08037/, /019f8b47/, /01a001e2/, /K0XWGJAFSG/, /514350456/, /\b(1A|4D|5B)\b/, /9140/, /12519068/,
  /51886739|50740666|51886908/, /anthony/i, /kicks/i, /picqerProductId|localProductId|listingId|orderNumber|variantId|idwarehouse|barcode/,
  /fake|dummy|demo|made.up|generated|placeholder|lorem/i, /"sample"/];
function clean(label: string, v: unknown) {
  // nothing in an answer may say what the data is
  const s = JSON.stringify(v).replace(new RegExp(`"(${ids.join("|")})(-[a-z]+)?"`, "g"), '"id"');
  for (const re of [...FORBIDDEN, /sample/i]) assert.ok(!re.test(s), `${label} leaks ${re}: ${s.slice(0, 400)}`);
}

test("deterministic: the same now gives the same rows, from a fresh start too", () => {
  const a = sampleWorld();
  const b = sampleWorld();
  const snap = (w: ReturnType<typeof sampleWorld>) => {
    const s = w.sales({ now: NOW, limit: 40 });
    const k = w.linked({ now: NOW, store: "wn-main", page: 2, per: 20 });
    return JSON.stringify({
      s, l: w.listings({ now: NOW, q: "jordan", offset: 20, limit: 20 }), k, j: w.jobs(NOW),
      p: [...s.rows.slice(0, 5), ...k.rows.slice(0, 5)].map((r) => w.product(r.id, NOW)), o: w.overview(realOverview(), NOW),
    });
  };
  assert.equal(snap(a), snap(b));
  // later, every earlier row is still there with the same key (orders only get added)
  const before = new Set(everything(a, WEB).map((r) => r.id));
  const later = new Set(everything(b, WEB, NOW + DAY).map((r) => r.id));
  for (const id of before) assert.ok(later.has(id), "an order disappeared");
  assert.ok(later.size >= before.size + 5, "a day later: most of a day's orders more");
});

test("a web store: 8–14 orders a day, most in the evening, few at night", () => {
  for (let w = 0; w < 8; w++) {
    const from = WEEK - w * 7 * DAY;
    for (const n of byDay(everything(sampleWorld(), WEB, from + 7 * DAY), from, 7)) assert.ok(n >= 8 && n <= 14, `${n} orders on a day`);
  }
  const week = everything(sampleWorld(), WEB, WEEK + 7 * DAY).filter((r) => Date.parse(r.soldAt!) >= WEEK);
  const hour = (r: Sale) => (new Date(r.soldAt!).getUTCHours() + 2) % 24; // Amsterdam summer time
  const evening = week.filter((r) => hour(r) >= 17).length / week.length;
  const night = week.filter((r) => hour(r) < 7).length / week.length;
  assert.ok(evening >= 0.35, `evening share ${evening}`);
  assert.ok(night <= 0.12, `night share ${night}`);
});

test("live selling: 3–4 evening shows a week of 20–60 sales within about two hours, a trickle otherwise", () => {
  for (let w = 0; w < 12; w++) {
    const from = WEEK - w * 7 * DAY;
    const rows = everything(sampleWorld(), LIVE, from + 7 * DAY);
    const counts = byDay(rows, from, 7);
    const shows = counts.filter((n) => n >= 20);
    assert.ok(shows.length >= 3 && shows.length <= 4, `week ${w}: ${counts}`);
    assert.ok(counts.every((n) => n >= 20 ? n <= 63 : n <= 3), `week ${w}: ${counts}`);
    counts.forEach((n, d) => {
      if (n < 20) return;
      const ts = rows.map((r) => Date.parse(r.soldAt!)).filter((t) => t >= from + d * DAY && t < from + (d + 1) * DAY).sort((x, y) => x - y);
      let best = 0;
      for (let i = 0, j = 0; i < ts.length; i++) {
        while (ts[i] - ts[j] > 135 * 60_000) j++;
        best = Math.max(best, i - j + 1);
      }
      assert.ok(best >= n - 3 && best >= 20, `show on day ${d}: ${best} of ${n} within 2h15`);
      const start = new Date(ts[ts.length - best]);
      assert.ok(start.getUTCHours() >= 16 && start.getUTCHours() <= 19, `a show starts at ${start.toISOString()}`);
    });
  }
});

test("totals: thousands since the start, only ever growing, and the 24-hour count matches the rows", () => {
  const w = sampleWorld();
  const total = (id: string, now: number) => w.sales({ now, platform: id, limit: 0 }).total;
  const listed = (id: string, now: number) => w.listings({ now, platform: id, limit: 0 }).total;
  assert.ok(total(WEB, NOW) >= 2000 && total(WEB, NOW) <= 4000, `web store ${total(WEB, NOW)}`);
  assert.ok(total(LIVE, NOW) >= 4000 && total(LIVE, NOW) <= 8000, `live ${total(LIVE, NOW)}`);
  assert.equal(total(WEB, SAMPLE_START - 1), 0);
  for (const id of ids) {
    let last = 0;
    let lastL = 0;
    for (let t = SAMPLE_START; t < NOW + 30 * DAY; t += 7 * 3_600_000 + 13 * 60_000) {
      const n = total(id, t);
      const l = listed(id, t);
      assert.ok(n >= last && l >= lastL, `${id} went down at ${new Date(t).toISOString()}`);
      last = n;
      lastL = l;
    }
    // minute by minute through a show evening
    last = 0;
    for (let t = Date.parse("2026-09-28T16:00:00Z"); t < Date.parse("2026-09-28T22:00:00Z"); t += 60_000) {
      const n = total(id, t);
      assert.ok(n >= last);
      last = n;
    }
  }
  const o = w.overview(realOverview(), NOW);
  for (const id of ids) {
    const day = everything(w, id).filter((r) => Date.parse(r.soldAt!) > NOW - DAY).length;
    assert.equal(o.kpis.sales24h[id as "shopify"], day);
    assert.equal(o.kpis.salesTotal[id as "shopify"], total(id, NOW));
    assert.equal(o.kpis.listings[id as "shopify"], listed(id, NOW));
  }
});

test("rows look like the real ones: same fields, masked refs, sync lag, known states and steps", () => {
  const w = sampleWorld();
  const real = saleOf(stockxOrder, "stockx")!;
  const rows = everything(w);
  assert.ok(rows.length > 5000);
  const lag = new Map(CHANNELS.map((c) => [c.id as string, c.ordersMin]));
  const steps = /^(Picqer stock −1|Not linked in Picqer yet, flagged|Picqer had 0 left, flagged|Last pair: pulled from .+|Buyer cancelled, stock \+1 back)$/;
  for (const r of rows) {
    assert.deepEqual(Object.keys(r), Object.keys(real));
    assert.match(r.ref, /^•••[A-Z0-9]{3}$/);
    assert.match(r.soldAt!, /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/);
    const d = Date.parse(r.syncedAt!) - Date.parse(r.soldAt!);
    if (CHANNELS.find((c) => c.id === r.platform)?.realtime) assert.ok(d >= 2_000 && d <= 12_000, `webhook lag ${d}`);
    else assert.ok(d >= 20_000 && d <= lag.get(r.platform)! * 60_000 + 30_000, `lag ${d}`);
    assert.ok(["Sold", "Shipped", "Cancelled"].includes(r.state));
    for (const s of r.steps) assert.match(s.text, steps);
    assert.equal(r.detail, r.steps[0].text !== "Not linked in Picqer yet, flagged");
    if (r.state === "Cancelled") assert.equal(r.steps[r.steps.length - 1].kind, "restock");
  }
  const share = (f: (r: Sale) => boolean) => rows.filter(f).length / rows.length;
  assert.ok(share((r) => r.state === "Sold") > 0.75, "mostly Sold");
  assert.ok(share((r) => r.state === "Cancelled") < 0.04);
  assert.ok(share((r) => r.steps[0].kind === "flag") < 0.05);
  assert.ok(share((r) => r.steps.some((s) => s.kind === "pulled")) > 0.1);
  // a last pair is pulled from the other stores it is listed on, by their labels
  const pulled = rows.find((r) => r.platform === LIVE && r.steps.some((s) => s.kind === "pulled"))!;
  assert.match(pulled.steps[1].text, /^Last pair: pulled from (StockX EU|StockX US|Alias|Alias USA|Shopify)/);
  assert.ok(!pulled.steps[1].text.includes(pulled.storeLabel));

  const l = w.listings({ now: NOW, limit: 1 }).rows[0];
  assert.deepEqual(Object.keys(l), ["id", "platform", "store", "storeLabel", "product", "style", "size", "at"]);
  const k = w.linked({ now: NOW, store: "sh-main", page: 1, per: 20 }).rows[0];
  assert.deepEqual(Object.keys(k), Object.keys(linkedOf({})));
  const p = w.product(k.id, NOW)!;
  assert.deepEqual(Object.keys(p), Object.keys(productOf({ product: null, stock: null, matches: null, aliasListings: null })));
  assert.match(p.code, /^[A-Z0-9-]+-\d+(\.5)?( \d\/3)?$/);
  assert.ok(p.image === null || /^https:\/\/images\.stockx\.com\/images\/[A-Za-z0-9-]+-Product\.jpg$/.test(p.image));
});

test("keys look like real row keys, open their own product, and nothing else", () => {
  const w = sampleWorld();
  const sales = everything(w);
  const lists = w.listings({ now: NOW, limit: 3000 }).rows;
  const links = [...w.linked({ now: NOW, store: "sh-main", page: 1, per: 1000 }).rows, ...w.linked({ now: NOW, store: "wn-main", page: 1, per: 1000 }).rows];
  const keys = [...sales, ...lists, ...links].map((r) => r.id);
  for (const k of keys) {
    assert.match(k, /^[a-z0-9]{1,7}$/, "a real row key is FNV-1a in base 36 (at most 7 characters)");
    assert.ok(isSampleKey(k));
  }
  assert.equal(new Set(keys).size, keys.length, "keys are unique");
  // the same length spread as real keys (a 32-bit number is 7 base-36 characters about half the time)
  const long = keys.filter((k) => k.length === 7).length / keys.length;
  assert.ok(long > 0.44 && long < 0.56, `7-character share ${long}`);

  for (const s of sales.slice(0, 300)) {
    const p = w.product(s.id, NOW);
    if (!s.detail) assert.equal(p, null);
    else {
      assert.ok(p, `no product for ${s.id}`);
      assert.equal(p!.name, s.product);
      assert.ok(p!.links.some((l) => l.store === s.store), "the product is linked to the store it sold on");
    }
  }
  for (const r of links.slice(0, 100)) assert.equal(w.product(r.id, NOW)?.code, r.code);
  // real keys, made-up keys and a future row open nothing
  const fake = Array.from({ length: 5000 }, (_, i) => rowId("stockx", `6abd${i}`, `04-${i}`));
  assert.ok(fake.filter(isSampleKey).length < 50, "few real keys even decode");
  assert.equal(fake.filter((k) => w.product(k, NOW)).length, 0);
  for (const k of ["", "zzzzzzzz", "abc", "0abc12", "ZZZ", "1a-b"]) assert.equal(w.product(k, NOW), null);
  const future = everything(w, WEB, NOW + DAY).find((r) => Date.parse(r.syncedAt!) > NOW)!;
  assert.equal(w.product(future.id, NOW), null, "a sale not yet synced opens nothing");
});

test("linked products: real rows get the generated channels by product code, the same in their drawer", () => {
  const w = sampleWorld();
  let s1 = 0;
  let s2 = 0;
  const N = 3000;
  for (let i = 0; i < N; i++) {
    const code = `DD${1000 + i}-100-${40 + (i % 9)}`;
    const row = w.withLinks({ id: "x", code, name: "", color: "", us: "9", eu: "42.5", detail: true, linkedAt: "2026-09-25T07:00:10.353Z",
      links: [{ store: "sx-eu", storeLabel: "StockX EU", platform: "stockx", style: `DD${1000 + i}-100`, size: "9" }, { store: "al-usa", storeLabel: "Alias USA", platform: "alias", style: `DD${1000 + i} 100`, size: "9" }] });
    const has = (id: string) => row.links.some((l) => l.store === id);
    if (has("sh-main")) s1++;
    if (has("wn-main")) s2++;
    assert.deepEqual(row.links.map((l) => l.store), ["sx-eu", "al-usa", "sh-main", "wn-main"].filter((x) => x === "sx-eu" || x === "al-usa" || has(x)), "sorted like the stores");
    for (const l of row.links.filter((x) => x.platform !== "stockx" && x.platform !== "alias")) assert.equal(l.style, `DD${1000 + i}-100`);
    if (i < 200) {
      const p = w.withProductLinks({ name: "Nike Dunk Low", code, color: "", us: "9", eu: "42.5", image: null, photoAt: null, stock: null, aliasListings: [],
        links: [{ store: "sx-eu", storeLabel: "StockX EU", platform: "stockx", name: "Nike Dunk Low", style: `DD${1000 + i}-100`, size: "9", at: "2026-09-25T07:00:10.353Z" }] });
      assert.deepEqual(p.links.map((l) => l.store).filter((x) => x.startsWith("s")).filter((x) => x !== "sx-eu"), row.links.map((l) => l.store).filter((x) => x.startsWith("s") && x !== "sx-eu"));
      const last = p.links.map((l) => l.at!).sort().pop();
      assert.equal(last, row.linkedAt, "the drawer's newest link is the row's linked time");
    }
  }
  assert.ok(Math.abs(s1 / N - 0.7) < 0.04, `web store ${s1 / N}`);
  assert.ok(Math.abs(s2 / N - 0.4) < 0.04, `live ${s2 / N}`);
  // a generated store's tab: its own products, newest link first, searchable, 20 a page
  const tab = w.linked({ now: NOW, store: "wn-main", page: 1, per: 20 });
  assert.equal(tab.rows.length, 20);
  assert.ok(tab.total > 150 && tab.pages === Math.ceil(tab.total / 20));
  for (const r of tab.rows) assert.ok(r.links.some((l) => l.store === "wn-main") && r.detail);
  assert.deepEqual(tab.rows.map((r) => r.linkedAt), tab.rows.map((r) => r.linkedAt).sort().reverse());
  const q = w.linked({ now: NOW, store: "sh-main", q: "samba", page: 1, per: 20 });
  assert.ok(q.total > 0 && q.rows.every((r) => /samba/i.test(r.name) || /^B7580[67]/.test(r.code)));
  // named only when an Alias link gives the name, as the real rows
  for (const r of w.linked({ now: NOW, store: "sh-main", page: 1, per: 600 }).rows) assert.equal(r.name !== "", r.links.some((l) => l.platform === "alias"));
});

test("listings: newest first, 20 a page, searchable; sales pages continue each other", () => {
  const w = sampleWorld();
  const p1 = w.listings({ now: NOW, limit: 20 });
  const p2 = w.listings({ now: NOW, offset: 20, limit: 20 });
  const times = [...p1.rows, ...p2.rows].map((r) => r.at!);
  assert.deepEqual(times, [...times].sort().reverse());
  assert.equal(new Set([...p1.rows, ...p2.rows].map((r) => r.id)).size, 40);
  assert.ok(p1.rows.every((r) => Date.parse(r.at!) <= NOW));
  const q = w.listings({ now: NOW, platform: WEB, q: "dd1391", limit: 1e6 });
  assert.ok(q.total > 0 && q.total === q.rows.length && q.rows.every((r) => r.style.startsWith("DD1391") && r.platform === WEB));
  assert.equal(w.listings({ now: NOW, store: "wn-main", limit: 0 }).total, w.listings({ now: NOW, platform: LIVE, limit: 0 }).total);
  assert.equal(w.listings({ now: NOW, platform: "stockx", limit: 5 }).total, 0, "a real platform has no generated rows");
  const s = w.sales({ now: NOW, platform: LIVE, limit: 40 }).rows;
  assert.deepEqual(w.sales({ now: NOW, platform: LIVE, offset: 20, limit: 20 }).rows, s.slice(20));
});

test("the overview: counts, feed, automations and connection cards, shaped like the real ones", () => {
  const w = sampleWorld();
  const real = realOverview();
  const o = w.overview(real, NOW);
  assert.equal(o.feed.length, 12);
  assert.deepEqual(o.feed.map((s) => s.soldAt), o.feed.map((s) => s.soldAt).sort().reverse());
  assert.ok(o.feed.some((s) => s.platform === "stockx") && o.feed.some((s) => ids.includes(s.platform)));
  assert.equal(o.kpis.lastSale, o.feed[0]);
  assert.deepEqual(o.jobs.map((j) => j.key), ["stockx-orders", "alias-orders", ...ids.map((id) => `${id}-orders`), "stockx-products", ...ids.map((id) => `${id}-stock`)]);
  for (const c of CHANNELS.filter((x) => !fromApi(x.id))) {
    const j = o.jobs.find((x) => x.key === `${c.id}-orders`)!;
    assert.deepEqual(Object.keys(j), Object.keys(real.jobs[0]));
    assert.equal(j.every, c.realtime ? "real time · webhook" : c.ordersEvery);
    assert.equal(j.status, "ok");
    const age = NOW - Date.parse(j.lastRun);
    // a webhook channel's job ran with its last order; the others within one interval
    assert.ok(age >= 0 && age <= (c.realtime ? 6 * 3_600_000 : c.ordersMin * 60_000 + 10_000), `${j.key} ran ${age} ms ago`);
    assert.match(j.name, new RegExp(`^${c.name} (orders|sales) into Picqer$`));
  }
  assert.deepEqual(o.kpis.jobs, { ok: o.jobs.length, total: o.jobs.length });
  assert.deepEqual(o.connections.map((c) => c.platform), [...CHANNELS.map((c) => c.id), "picqer"]);
  for (const c of o.connections) assert.deepEqual(Object.keys(c), Object.keys(o.connections[0]), "every card has the same fields");
  const card = o.connections.find((c) => c.platform === WEB)!;
  const cfg = CHANNELS.find((c) => c.id === WEB)!;
  assert.deepEqual([card.name, card.role, card.accounts, card.syncs, card.healthy], [cfg.name, cfg.role, cfg.accounts.map((a) => a.label), cfg.syncs, true]);
  assert.ok(JSON.stringify(o).length < 16_000, "the overview stays small");
  clean("overview", o);
});

test("nothing identifying the client and nothing that says made up, on any page", () => {
  const w = sampleWorld();
  const s = w.sales({ now: NOW, limit: 500 });
  clean("sales", s);
  clean("listings", w.listings({ now: NOW, limit: 500 }));
  const k1 = w.linked({ now: NOW, store: "sh-main", page: 1, per: 200 });
  clean("linked", [k1, w.linked({ now: NOW, store: "wn-main", page: 3, per: 20 })]);
  clean("products", [...s.rows.slice(0, 100), ...k1.rows.slice(0, 50)].map((r) => w.product(r.id, NOW)));
  clean("jobs", w.jobs(NOW));
});

test("flipping a slot: names, labels, cadence and rhythm follow channels.ts", () => {
  const flipped: Channel[] = CHANNELS.map((c) =>
    c.id === WEB ? { ...c, name: "WooCommerce", logo: "woocommerce", accounts: [{ id: c.accounts[0].id, label: "WooCommerce" }], ordersEvery: "every 4 min", ordersMin: 4, realtime: false }
    : c.id === LIVE ? { ...c, name: "eBay", logo: "ebay", role: "Marketplace", accounts: [{ id: c.accounts[0].id, label: "eBay" }], syncs: ["Sales come in every 3 minutes"] }
    : c);
  assert.equal(rhythmOf(flipped.find((c) => c.id === LIVE)!), "store", "a marketplace sells steadily, without shows");
  assert.equal(rhythmOf({ ...flipped[0], role: "Live shopping" }), "live");
  const w = sampleWorld(flipped);
  const o = w.overview(realOverview(), NOW);
  const s = w.sales({ now: NOW, limit: 300 });
  const all = JSON.stringify([o, s, w.listings({ now: NOW, limit: 100 }), w.linked({ now: NOW, store: "wn-main", page: 1, per: 50 }), s.rows.slice(0, 50).map((r) => w.product(r.id, NOW))]);
  for (const old of CHANNELS.filter((c) => !fromApi(c.id)).flatMap((c) => [c.name, ...c.accounts.map((a) => a.label)])) assert.ok(!all.includes(old), `${old} is still shown`);
  assert.ok(all.includes("WooCommerce orders into Picqer") && all.includes("eBay orders into Picqer"));
  assert.ok(o.connections.some((c) => c.name === "eBay" && c.role === "Marketplace" && c.accounts[0] === "eBay"));
  assert.equal(o.jobs.find((j) => j.key === `${WEB}-orders`)!.every, "every 4 min");
  assert.ok(s.rows.some((r) => r.steps.some((x) => /pulled from .*(WooCommerce|eBay)/.test(x.text))), "pulled lists use the new labels");
  // the web-store slot keeps its data, only relabelled
  const before = sampleWorld().sales({ now: NOW, platform: WEB, limit: 50 }).rows;
  const after = w.sales({ now: NOW, platform: WEB, limit: 50 }).rows;
  assert.deepEqual(after.map((r) => [r.id, r.product, r.size, r.soldAt]), before.map((r) => [r.id, r.product, r.size, r.soldAt]));
  assert.ok(after.every((r) => r.storeLabel === "WooCommerce"));
  // the marketplace slot now sells steadily
  for (const n of byDay(everything(w, LIVE, WEEK + 7 * DAY), WEEK, 7)) assert.ok(n >= 8 && n <= 14, `${n} a day`);
});

test("fast: a few milliseconds a request once the days are built", () => {
  const w = sampleWorld();
  let t = performance.now();
  w.overview(realOverview(), NOW);
  const cold = performance.now() - t;
  assert.ok(cold < 400, `first request ${cold} ms`);
  t = performance.now();
  for (let i = 0; i < 10; i++) {
    w.overview(realOverview(), NOW + i * 1000);
    w.sales({ now: NOW, limit: 20, offset: 480 });
    w.listings({ now: NOW, q: "jordan 4", limit: 20 });
    w.linked({ now: NOW, store: "sh-main", page: 3, per: 20 });
  }
  const warm = (performance.now() - t) / 10;
  assert.ok(warm < 15, `a request ${warm} ms`);
});

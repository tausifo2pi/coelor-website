// node --test lib/demo/sample.test.mts
// The sneaker demo's generated world (lib/demo/sample.ts): deterministic and time-based, the volumes and rhythm of the
// two marketplaces, a web store and live selling, every job on schedule, the rows shaped as the pages read them,
// nothing identifying anyone, no address on another site, and every name and label taken from the channel config (so a
// slot can be flipped to another platform).
import { test } from "node:test";
import assert from "node:assert/strict";
import { CHANNELS, isCore, type Channel } from "./channels.ts";
import { NORTHVALE } from "./clients.ts";
import { SAMPLE_START, isSampleKey, rhythmOf, sampleWorld } from "./sample.ts";
import { STORES, type Sale } from "./shape.ts";

const NOW = Date.parse("2026-09-30T19:50:00Z"); // a Wednesday evening
const WEEK = Date.parse("2026-09-21T00:00:00Z"); // Monday
const DAY = 86_400_000;
const HOUR = 3_600_000;
const slots = CHANNELS.filter((c) => !isCore(c.id)).map((c) => c.id);
const [WEB, LIVE] = slots; // the web store and the live-selling slot as channels.ts has them
const [MARKET, MARKET2] = CHANNELS.filter((c) => isCore(c.id)).map((c) => c.id);
const W = sampleWorld();
const everything = (platform?: string, now = NOW, w = W) => w.sales({ now, platform, limit: 1e6 }).rows;
const byDay = (rows: Sale[], from: number, days: number) => {
  const n = Array.from({ length: days }, () => 0);
  for (const r of rows) {
    const d = Math.floor((Date.parse(r.soldAt!) - from) / DAY);
    if (d >= 0 && d < days) n[d]++;
  }
  return n;
};
const sinceOf = (c: Channel) => Date.parse(`${NORTHVALE.systems.find((s) => s.slug === c.id || s.slug === c.logo)?.since ?? NORTHVALE.since}T00:00:00Z`);

// The page must show nothing about a real business (the earlier demo's client, its ids and order numbers), nothing
// that says the rows are made up, and no address on another site.
const FORBIDDEN = [/anthony/i, /kicks/i, /6ab[0-9a-f]{21}/, /K0XWGJAFSG/, /514350456/, /picqerProductId|localProductId|listingId|orderNumber|variantId|idwarehouse|barcode/,
  /fake|dummy|demo|made.up|generated|placeholder|lorem|mock|sample|\btest\b/i, /yeezy/i, /images\.stockx|cloudfront|cdn\./i];
function clean(label: string, v: unknown) {
  // a drawing is checked on its own (lib/demo/art.test.mts); everything else is text a visitor can read
  const s = JSON.stringify(v).replace(/"data:image\/svg\+xml,[^"]*"/g, '"img"');
  for (const re of FORBIDDEN) assert.ok(!re.test(s), `${label} shows ${re}: ${s.slice(0, 300)}`);
  assert.ok(!/https?:\/\//.test(s), `${label} has an address on another site`);
}

test("deterministic: the same now gives the same rows, from a fresh start too", () => {
  const snap = (w: ReturnType<typeof sampleWorld>) => {
    const s = w.sales({ now: NOW, limit: 40 });
    const k = w.linked({ now: NOW, store: "al-main", page: 2, per: 20 });
    return JSON.stringify({
      s, l: w.listings({ now: NOW, q: "jordan", offset: 20, limit: 20 }), k, j: w.jobs(NOW),
      p: [...s.rows.slice(0, 5), ...k.rows.slice(0, 5)].map((r) => w.product(r.id, NOW)), o: w.overview(NOW),
    });
  };
  // a fresh world asked in another order gives the same answers
  const b = sampleWorld();
  b.linked({ now: NOW + DAY, store: "sx-us", page: 3, per: 20 });
  b.sales({ now: NOW - 40 * DAY, q: "dunk", limit: 5 });
  assert.equal(snap(W), snap(b));
  // later, every earlier row is still there with the same key (orders only get added)
  for (const p of [MARKET, WEB, LIVE]) {
    const before = new Set(everything(p).map((r) => r.id));
    const later = new Set(everything(p, NOW + DAY).map((r) => r.id));
    for (const id of before) assert.ok(later.has(id), `${p}: an order disappeared`);
    assert.ok(later.size > before.size, `${p}: a day later, more orders`);
  }
});

test("the marketplaces: steady sales every day, the first busier, the US accounts on US hours", () => {
  for (let w = 0; w < 8; w++) {
    const from = WEEK - w * 7 * DAY;
    for (const n of byDay(everything(MARKET, from + 7 * DAY), from, 7)) assert.ok(n >= 35 && n <= 85, `${MARKET}: ${n} sales on a day`);
    for (const n of byDay(everything(MARKET2, from + 7 * DAY), from, 7)) assert.ok(n >= 15 && n <= 45, `${MARKET2}: ${n} sales on a day`);
  }
  const month = everything(MARKET).filter((r) => Date.parse(r.soldAt!) > NOW - 28 * DAY);
  const [eu, us] = CHANNELS.find((c) => c.id === MARKET)!.accounts.map((a) => month.filter((r) => r.store === a.id));
  assert.ok(eu.length > us.length * 1.2, `first account ${eu.length}, second ${us.length}`);
  // 00:00–06:00 UTC is night in Amsterdam and evening in New York
  const night = (rows: Sale[]) => rows.filter((r) => new Date(r.soldAt!).getUTCHours() < 6).length / rows.length;
  assert.ok(night(us) > 0.25 && night(eu) < 0.15, `US ${night(us)}, EU ${night(eu)}`);
});

test("a web store: 8–14 orders a day, most in the evening, few at night", () => {
  for (let w = 0; w < 8; w++) {
    const from = WEEK - w * 7 * DAY;
    for (const n of byDay(everything(WEB, from + 7 * DAY), from, 7)) assert.ok(n >= 8 && n <= 14, `${n} orders on a day`);
  }
  const week = everything(WEB, WEEK + 7 * DAY).filter((r) => Date.parse(r.soldAt!) >= WEEK);
  const hour = (r: Sale) => (new Date(r.soldAt!).getUTCHours() + 2) % 24; // Amsterdam summer time
  const evening = week.filter((r) => hour(r) >= 17).length / week.length;
  const night = week.filter((r) => hour(r) < 7).length / week.length;
  assert.ok(evening >= 0.35, `evening share ${evening}`);
  assert.ok(night <= 0.12, `night share ${night}`);
});

test("live selling: 3–4 evening shows a week of 20–60 sales within about two hours, a trickle otherwise", () => {
  for (let w = 0; w < 12; w++) {
    const from = WEEK - w * 7 * DAY;
    const rows = everything(LIVE, from + 7 * DAY);
    const counts = byDay(rows, from, 7);
    const shows = counts.filter((n) => n >= 20);
    assert.ok(shows.length >= 3 && shows.length <= 4, `week ${w}: ${counts}`);
    assert.ok(counts.every((n) => (n >= 20 ? n <= 63 : n <= 3)), `week ${w}: ${counts}`);
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

test("each channel starts the day it joined the build, and a rule shows from the day it was built", () => {
  for (const c of CHANNELS) {
    const rows = everything(c.id);
    const first = Math.min(...rows.map((r) => Date.parse(r.soldAt!)));
    const since = Math.max(SAMPLE_START, sinceOf(c));
    assert.ok(first >= since && first < since + 3 * DAY, `${c.id} starts ${new Date(first).toISOString()}`);
  }
  const all = everything();
  const built = (job: string | null, re = /./) => Date.parse(`${NORTHVALE.rules.find((r) => r.job === job && re.test(r.file))!.built}T00:00:00Z`);
  const flagged = all.filter((r) => r.steps.some((s) => s.text === "Not linked in Picqer yet, flagged"));
  assert.ok(flagged.length > 0 && flagged.every((r) => Date.parse(r.soldAt!) >= built(null, /unmatched/)), "unmatched orders flagged only once that rule was built");
  assert.ok(all.filter((r) => r.steps.some((s) => s.kind === "pulled")).every((r) => Date.parse(r.soldAt!) >= built("zero-stock")));
  const photos = all.slice(0, 400).map((r) => W.product(r.id, NOW)).filter((p) => p?.photoAt);
  assert.ok(photos.length > 300 && photos.every((p) => Date.parse(p!.photoAt!) >= built("picqer-images")));
});

test("totals: thousands since the start, only ever growing, and the overview's counts match the rows", () => {
  const total = (id: string, now: number) => W.sales({ now, platform: id, limit: 0 }).total;
  const listed = (id: string, now: number) => W.listings({ now, platform: id, limit: 0 }).total;
  assert.ok(total(MARKET, NOW) > 10_000 && total(MARKET, NOW) < 20_000, `${MARKET} ${total(MARKET, NOW)}`);
  assert.ok(total(MARKET2, NOW) > 5_000 && total(MARKET2, NOW) < 10_000, `${MARKET2} ${total(MARKET2, NOW)}`);
  assert.ok(total(WEB, NOW) >= 1500 && total(WEB, NOW) <= 3500, `web store ${total(WEB, NOW)}`);
  assert.ok(total(LIVE, NOW) >= 2500 && total(LIVE, NOW) <= 6000, `live ${total(LIVE, NOW)}`);
  assert.equal(total(MARKET, SAMPLE_START - 1), 0);
  for (const c of CHANNELS) {
    let last = 0;
    let lastL = 0;
    for (let t = SAMPLE_START; t < NOW + 30 * DAY; t += 7 * HOUR + 13 * 60_000) {
      const n = total(c.id, t);
      const l = listed(c.id, t);
      assert.ok(n >= last && l >= lastL, `${c.id} went down at ${new Date(t).toISOString()}`);
      last = n;
      lastL = l;
    }
    // minute by minute through a show evening
    last = 0;
    for (let t = Date.parse("2026-09-28T16:00:00Z"); t < Date.parse("2026-09-28T22:00:00Z"); t += 60_000) {
      const n = total(c.id, t);
      assert.ok(n >= last);
      last = n;
    }
  }
  const o = W.overview(NOW);
  for (const c of CHANNELS) {
    const day = everything(c.id).filter((r) => Date.parse(r.soldAt!) > NOW - DAY).length;
    assert.equal(o.kpis.sales24h[c.id], day);
    assert.equal(o.kpis.salesTotal[c.id], total(c.id, NOW));
    assert.equal(o.kpis.listings[c.id], listed(c.id, NOW));
  }
  assert.equal(o.kpis.sales24h.more, false);
  // Picqer: a third or so of its products linked, both counts only growing
  const { total: pt, linked } = o.kpis.products;
  assert.ok(pt > 12_000 && pt < 20_000 && linked / pt > 0.22 && linked / pt < 0.4, `${linked} of ${pt}`);
  let prev = { total: 0, linked: 0 };
  for (let t = SAMPLE_START; t < NOW + 60 * DAY; t += 3 * DAY + 5 * HOUR) {
    const p = W.overview(t).kpis.products;
    assert.ok(p.total >= prev.total && p.linked >= prev.linked && p.linked <= p.total);
    prev = p;
  }
});

test("rows look like the pages expect: fields, masked refs, sync on the job's runs, known states and steps", () => {
  const rows = everything();
  assert.ok(rows.length > 20_000);
  const keys = ["id", "platform", "store", "storeLabel", "product", "style", "size", "ref", "state", "soldAt", "syncedAt", "steps", "detail"];
  const steps = /^(Picqer stock −1|Not linked in Picqer yet, flagged|Picqer had 0 left, flagged|Last pair: pulled from .+|Buyer cancelled, stock \+1 back)$/;
  for (const r of rows) {
    assert.deepEqual(Object.keys(r), keys);
    assert.match(r.ref, /^•••[A-Z0-9]{3}$/);
    assert.match(r.soldAt!, /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/);
    const c = CHANNELS.find((x) => x.id === r.platform)!;
    const lag = Date.parse(r.syncedAt!) - Date.parse(r.soldAt!);
    if (c.realtime) assert.ok(lag >= 2_000 && lag <= 12_000, `webhook lag ${lag}`);
    else {
      assert.ok(lag >= 20_000 && lag <= c.ordersMin * 60_000 + 30_000, `lag ${lag}`);
      // picked up by a run of the channel's order job: a few seconds past its interval
      const past = Date.parse(r.syncedAt!) % (c.ordersMin * 60_000);
      assert.ok(past >= 1200 && past < 8200, `${c.id} synced ${past} ms past a run`);
    }
    assert.ok(["Sold", "Shipped", "Being checked", "Cancelled"].includes(r.state));
    if (r.state === "Being checked") assert.ok(isCore(r.platform), "only the marketplaces check a pair");
    for (const s of r.steps) assert.match(s.text, steps);
    assert.equal(r.detail, r.steps[0].text !== "Not linked in Picqer yet, flagged");
    if (r.steps.some((s) => s.kind === "restock")) assert.equal(r.state, "Cancelled");
    if (r.platform === "alias") assert.match(r.style, /^[A-Z0-9 ]+$/, "Alias spaces its style codes");
    else assert.ok(!/ /.test(r.style));
  }
  const share = (f: (r: Sale) => boolean) => rows.filter(f).length / rows.length;
  assert.ok(share((r) => r.state === "Cancelled") < 0.03);
  assert.ok(share((r) => r.steps[0].kind === "flag") < 0.02);
  assert.ok(share((r) => r.steps.some((s) => s.kind === "pulled")) > 0.1);
  // the last few days: a marketplace's pairs on their way, being checked, done
  const recent = everything(MARKET).filter((r) => Date.parse(r.soldAt!) > NOW - 6 * DAY);
  for (const st of ["Sold", "Shipped", "Being checked"]) assert.ok(recent.some((r) => r.state === st), st);
  // a last pair is pulled from the other stores it is linked to, by their labels
  const pulled = rows.find((r) => r.platform === LIVE && r.steps.some((s) => s.kind === "pulled"))!;
  assert.match(pulled.steps[1].text, /^Last pair: pulled from (StockX EU|StockX US|Alias|Alias USA|Shopify)/);
  assert.ok(!pulled.steps[1].text.includes(pulled.storeLabel));
  // names as each platform writes them: StockX's, Alias's slug made readable
  assert.ok(rows.some((r) => r.platform === "alias" && /^Air Jordan \d+ Retro/.test(r.product)));
  assert.ok(rows.some((r) => r.platform === "stockx" && /^Jordan \d+ Retro/.test(r.product)));
});

test("listings: newest first, 20 a page, searchable, a marketplace's picked up by the build's listing job", () => {
  const p1 = W.listings({ now: NOW, limit: 20 });
  const p2 = W.listings({ now: NOW, offset: 20, limit: 20 });
  const times = [...p1.rows, ...p2.rows].map((r) => r.at!);
  assert.deepEqual(times, [...times].sort().reverse());
  assert.equal(new Set([...p1.rows, ...p2.rows].map((r) => r.id)).size, 40);
  assert.ok(p1.rows.every((r) => Date.parse(r.at!) <= NOW));
  assert.deepEqual(Object.keys(p1.rows[0]), ["id", "platform", "store", "storeLabel", "product", "style", "size", "at"]);
  const q = W.listings({ now: NOW, platform: WEB, q: "dd1391", limit: 1e6 });
  assert.ok(q.total > 0 && q.total === q.rows.length && q.rows.every((r) => r.style.startsWith("DD1391") && r.platform === WEB));
  assert.equal(W.listings({ now: NOW, store: "wn-main", limit: 0 }).total, W.listings({ now: NOW, platform: LIVE, limit: 0 }).total);
  for (const l of W.listings({ now: NOW, platform: "stockx", limit: 500 }).rows) {
    const past = Date.parse(l.at!) % (8 * 60_000); // stockx-products, every 8 minutes
    assert.ok(past >= 2000 && past < 10_000, `picked up ${past} ms past a run`);
  }
  const s = W.sales({ now: NOW, platform: LIVE, limit: 40 }).rows;
  assert.deepEqual(W.sales({ now: NOW, platform: LIVE, offset: 20, limit: 20 }).rows, s.slice(20));
  const all = W.sales({ now: NOW, limit: 60 }).rows;
  assert.deepEqual(all.map((r) => r.soldAt), all.map((r) => r.soldAt).sort().reverse());
  assert.ok(new Set(all.map((r) => r.platform)).size >= 2, "every channel in one list");
});

test("keys look like row keys, open their own product, and nothing else", () => {
  const sales = everything();
  const lists = W.listings({ now: NOW, limit: 3000 }).rows;
  const links = STORES.flatMap((s) => W.linked({ now: NOW, store: s.id, page: 1, per: 300 }).rows);
  const keys = [...sales, ...lists].map((r) => r.id);
  for (const k of [...keys, ...links.map((r) => r.id)]) {
    assert.match(k, /^[a-z0-9]{1,7}$/);
    assert.ok(isSampleKey(k));
  }
  assert.equal(new Set(keys).size, keys.length, "keys are unique");
  const long = keys.filter((k) => k.length === 7).length / keys.length;
  assert.ok(long > 0.44 && long < 0.56, `7-character share ${long}`);

  for (const s of sales.slice(0, 300)) {
    const p = W.product(s.id, NOW);
    if (!s.detail) assert.equal(p, null);
    else {
      assert.ok(p, `no product for ${s.id}`);
      assert.ok(p!.links.some((l) => l.store === s.store), "the product is linked to the store it sold on");
      assert.equal(p!.links.find((l) => l.store === s.store)!.name, s.product, "named as the store names it");
    }
  }
  for (const l of lists.slice(0, 100)) assert.ok(W.product(l.id, NOW)?.links.some((x) => x.store === l.store));
  for (const r of links.slice(0, 200)) {
    const p = W.product(r.id, NOW)!;
    assert.equal(p.code, r.code);
    assert.deepEqual(p.links.map((l) => l.store), r.links.map((l) => l.store));
    assert.equal(p.links.map((l) => l.at!).sort().pop(), r.linkedAt, "the drawer's newest link is the row's linked time");
  }
  // made-up keys rarely even read back, and malformed ones and a future row open nothing
  let decoded = 0;
  for (let i = 0; i < 5000; i++) if (isSampleKey(((Math.imul(i + 1, 2654435761) >>> 0) % 4294967295).toString(36))) decoded++;
  assert.ok(decoded < 60, `${decoded} random keys read back`);
  for (const k of ["", "zzzzzzzz", "abc", "0abc12", "ZZZ", "1a-b"]) assert.equal(W.product(k, NOW), null);
  const future = everything(WEB, NOW + DAY).find((r) => Date.parse(r.syncedAt!) > NOW)!;
  assert.equal(W.product(future.id, NOW), null, "a sale not yet synced opens nothing");
});

test("linked products: each account's share of the catalogue, newest link first, searchable", () => {
  const tab = (store: string, page = 1, q?: string) => W.linked({ now: NOW, store, q, page, per: 20 });
  const totals = STORES.map((s) => tab(s.id).total);
  const all = W.overview(NOW).kpis.products.linked;
  assert.ok(totals[0] > all * 0.9, `the first account has nearly everything: ${totals[0]} of ${all}`);
  for (const t of totals) assert.ok(t > 1000 && t <= all, `${t}`);
  for (const s of STORES) {
    const r = tab(s.id);
    assert.equal(r.rows.length, 20);
    assert.equal(r.pages, Math.ceil(r.total / 20));
    for (const row of r.rows) assert.ok(row.links.some((l) => l.store === s.id) && row.detail && Date.parse(row.linkedAt!) <= NOW);
    const at = [...r.rows, ...tab(s.id, 2).rows].map((x) => x.linkedAt);
    assert.deepEqual(at, [...at].sort().reverse());
  }
  const q = tab("sx-eu", 1, "samba");
  assert.ok(q.total > 0 && q.rows.every((r) => /^(B7580[67]|IG6175|IE3437|JI2724|JI1350|GY5752)-/.test(r.code)));
  assert.ok(tab("sx-eu", 1, "42.5").rows.every((r) => r.code.endsWith("-42.5")), "a size searches the codes");
  // named only when an Alias link gives the name
  for (const r of W.linked({ now: NOW, store: "sh-main", page: 1, per: 600 }).rows) assert.equal(r.name !== "", r.links.some((l) => l.platform === "alias"));
  // a new release is linked the day it comes in, not before
  const rel = Date.parse("2026-06-13T00:00:00Z"); // Jordan 1 Retro High OG Bred Reimagined
  const find = (now: number) => W.linked({ now, store: "sx-eu", q: "DZ5485-061", page: 1, per: 50 }).total;
  assert.equal(find(rel - DAY), 0);
  assert.ok(find(rel + 2 * DAY) > 5);
});

test("the drawer: Picqer's record, stock, links, Alias listings and a drawn photo (no image host)", () => {
  const rows = W.linked({ now: NOW, store: "al-main", page: 1, per: 200 }).rows;
  const keys = ["name", "code", "color", "us", "eu", "image", "photoAt", "stock", "links", "aliasListings"];
  let photos = 0;
  for (const r of rows) {
    const p = W.product(r.id, NOW)!;
    assert.deepEqual(Object.keys(p), keys);
    assert.match(p.code, /^[A-Z0-9-]+-\d+(\.5)?( \d\/3)?$/);
    assert.ok(!/\((Women's|GS)\)$/.test(p.name) || /W$|Y$/.test(p.us), "women's and kids' sizes as StockX writes them");
    assert.ok(p.stock && p.stock.free >= 0 && p.stock.total >= p.stock.free);
    if (p.image) {
      photos++;
      assert.match(p.image, /^data:image\/svg\+xml,/);
      assert.ok(Date.parse(p.photoAt!) <= NOW);
    } else assert.equal(p.photoAt, null);
    assert.ok(p.aliasListings.length > 0, "linked to Alias, listed on Alias");
    for (const a of p.aliasListings) assert.ok(a.count >= 1 && a.count <= 3 && /^Alias/.test(a.storeLabel));
  }
  assert.ok(photos / rows.length > 0.9, `photos ${photos} of ${rows.length}`);
  clean("products", rows.slice(0, 50).map((r) => W.product(r.id, NOW)));
});

test("automations: every job on schedule at any moment, the connection cards healthy", () => {
  for (let i = 0; i < 300; i++) {
    const now = Date.parse("2026-05-01T00:00:00Z") + ((i * 7919) % 300) * 16 * 60 * 60_000 + i * 61_123;
    const o = W.overview(now);
    for (const j of o.jobs) {
      assert.equal(j.status, "ok");
      const age = now - Date.parse(j.lastRun);
      const n = /(\d+) (min|hours)/.exec(j.every);
      // a webhook job runs on each order: a web store can go from one evening to the next afternoon without one
      const every = j.every.startsWith("real time") ? 20 * HOUR : j.every === "daily" ? DAY : Number(n![1]) * (n![2] === "hours" ? HOUR : 60_000);
      assert.ok(age >= 0 && age <= every + 10_000, `${j.key} ran ${age} ms before ${new Date(now).toISOString()}`);
    }
    assert.ok(o.connections.every((c) => c.healthy && c.lastSync && Date.parse(c.lastSync) <= now));
    assert.deepEqual(o.kpis.jobs, { ok: o.jobs.length, total: o.jobs.length });
  }
});

test("the overview: counts, feed, automations and connection cards", () => {
  const o = W.overview(NOW);
  assert.equal(o.at, new Date(NOW).toISOString());
  assert.equal(o.feed.length, 12);
  assert.deepEqual(o.feed.map((s) => s.soldAt), o.feed.map((s) => s.soldAt).sort().reverse());
  assert.equal(o.kpis.lastSale, o.feed[0]);
  assert.deepEqual(o.jobs.map((j) => j.key), [
    ...CHANNELS.map((c) => `${c.id}-orders`), "zero-stock", "stockx-products", "alias-listings", "alias-restock", "picqer-products", "picqer-images", "alias-products",
    ...slots.map((id) => `${id}-stock`),
  ]);
  for (const c of CHANNELS.filter((x) => !isCore(x.id))) {
    const j = o.jobs.find((x) => x.key === `${c.id}-orders`)!;
    assert.equal(j.every, c.realtime ? "real time · webhook" : c.ordersEvery);
    assert.match(j.name, new RegExp(`^${c.name} (orders|sales) into Picqer$`));
  }
  assert.deepEqual(o.connections.map((c) => c.platform), [...CHANNELS.map((c) => c.id), "picqer"]);
  for (const c of o.connections) assert.deepEqual(Object.keys(c), ["platform", "name", "role", "accounts", "lastSync", "healthy", "syncs"]);
  const card = o.connections.find((c) => c.platform === WEB)!;
  const cfg = CHANNELS.find((c) => c.id === WEB)!;
  assert.deepEqual([card.name, card.role, card.accounts, card.syncs, card.healthy], [cfg.name, cfg.role, cfg.accounts.map((a) => a.label), cfg.syncs, true]);
  assert.ok(JSON.stringify(o).length < 16_000, "the overview stays small");
  clean("overview", o);
});

test("nothing identifying anyone and nothing that says made up, on any page", () => {
  const s = W.sales({ now: NOW, limit: 500 });
  clean("sales", s);
  clean("listings", W.listings({ now: NOW, limit: 500 }));
  const k = STORES.map((x) => W.linked({ now: NOW, store: x.id, page: 1, per: 100 }));
  clean("linked", k);
  clean("drawer", [...s.rows.slice(0, 100), ...k.flatMap((x) => x.rows.slice(0, 10))].map((r) => W.product(r.id, NOW)));
  clean("jobs", W.jobs(NOW));
});

test("flipping a slot: names, labels, cadence and rhythm follow channels.ts", () => {
  const flipped: Channel[] = CHANNELS.map((c) =>
    c.id === WEB ? { ...c, name: "WooCommerce", logo: "woocommerce", accounts: [{ id: c.accounts[0].id, label: "WooCommerce" }], ordersEvery: "every 4 min", ordersMin: 4, realtime: false }
    : c.id === LIVE ? { ...c, name: "eBay", logo: "ebay", role: "Marketplace", accounts: [{ id: c.accounts[0].id, label: "eBay" }], syncs: ["Sales come in every 3 minutes"] }
    : c);
  assert.equal(rhythmOf(flipped.find((c) => c.id === LIVE)!), "store", "a marketplace slot sells steadily, without shows");
  assert.equal(rhythmOf({ ...flipped[2], role: "Live shopping" }), "live");
  assert.equal(rhythmOf(flipped[0]), "market");
  const w = sampleWorld(flipped);
  const o = w.overview(NOW);
  const s = w.sales({ now: NOW, limit: 300 });
  const all = JSON.stringify([o, s, w.listings({ now: NOW, limit: 100 }), w.linked({ now: NOW, store: "wn-main", page: 1, per: 50 }), s.rows.slice(0, 50).map((r) => w.product(r.id, NOW))]);
  for (const old of CHANNELS.filter((c) => !isCore(c.id)).flatMap((c) => [c.name, ...c.accounts.map((a) => a.label)])) assert.ok(!all.includes(old), `${old} is still shown`);
  assert.ok(all.includes("WooCommerce orders into Picqer") && all.includes("eBay orders into Picqer"));
  assert.ok(o.connections.some((c) => c.name === "eBay" && c.role === "Marketplace" && c.accounts[0] === "eBay"));
  assert.equal(o.jobs.find((j) => j.key === `${WEB}-orders`)!.every, "every 4 min");
  assert.ok(s.rows.some((r) => r.steps.some((x) => /pulled from .*(WooCommerce|eBay)/.test(x.text))), "pulled lists use the new labels");
  // the web-store slot keeps its data, only relabelled
  const before = W.sales({ now: NOW, platform: WEB, limit: 50 }).rows;
  const after = w.sales({ now: NOW, platform: WEB, limit: 50 }).rows;
  assert.deepEqual(after.map((r) => [r.id, r.product, r.size, r.soldAt]), before.map((r) => [r.id, r.product, r.size, r.soldAt]));
  assert.ok(after.every((r) => r.storeLabel === "WooCommerce"));
  for (const n of byDay(everything(LIVE, WEEK + 7 * DAY, w), WEEK, 7)) assert.ok(n >= 8 && n <= 14, `${n} a day`);
});

test("fast: the first answer within a few hundred ms, then a few ms a request", () => {
  const w = sampleWorld();
  let t = performance.now();
  w.overview(NOW);
  const cold = performance.now() - t;
  assert.ok(cold < 400, `first request ${cold} ms`);
  t = performance.now();
  for (let i = 0; i < 10; i++) {
    w.overview(NOW + i * 30_000);
    w.sales({ now: NOW, limit: 20, offset: 480 });
    w.listings({ now: NOW, q: "jordan 4", limit: 20 });
    w.linked({ now: NOW, store: "sx-eu", page: 3, per: 20 });
  }
  const warm = (performance.now() - t) / 10;
  assert.ok(warm < 25, `a round of requests ${warm} ms`);
});

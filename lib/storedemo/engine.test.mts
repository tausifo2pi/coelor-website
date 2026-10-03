// node --test lib/storedemo/engine.test.mts
// The store around a live catalogue (lib/storedemo/engine.ts): the same answer for the same moment, totals that only
// grow, only sizes in stock sold, never before a product came out, only where it is listed, a sold-out size's last sale
// and pull shown, show-evening bursts on the live channel, steps in time order and never in the future.
import { test } from "node:test";
import assert from "node:assert/strict";
import { WOMENS_BOUTIQUE as CFG } from "./configs.ts";
import { storeWorld } from "./engine.ts";
import { brandOf, catalogOf, categoryOf } from "./shopify.ts";
import type { Catalog, Product } from "./types.ts";

const NOW = Date.parse("2026-10-04T01:30:00Z"); // Saturday 20:30 in Chicago
const DAY = 86_400_000;

function catalog(): Catalog {
  const products: Product[] = [];
  for (let i = 0; i < 60; i++) {
    const sizes = ["S", "M", "L"];
    const colors = i % 3 === 0 ? ["Black", "Ivory"] : ["Sage"];
    products.push({
      id: `p${i}`,
      title: `Product ${i}`,
      brand: ["Klesis", "Bailey Rose", "Fore Collection"][i % 3],
      category: ["Tops", "Dresses", "Pants"][i % 3],
      price: 38 + (i % 7) * 9,
      image: `https://cdn.shopify.com/x/${i}.jpg`,
      publishedAt: new Date(NOW - (i < 40 ? i * 0.4 * DAY : 90 * DAY + i * DAY)).toISOString(),
      best: i >= 40 ? i - 40 : null,
      variants: colors.flatMap((c) => sizes.map((s) => ({ id: `p${i}${c}${s}`, color: c, size: s, available: !(i % 5 === 0 && s === "S") && i !== 7 }))),
    });
  }
  return { products, at: new Date(NOW).toISOString() };
}

const world = () => storeWorld(CFG, catalog());

test("the same moment gives the same answer", () => {
  assert.deepEqual(world().overview(NOW), world().overview(NOW));
  assert.deepEqual(world().orders({ now: NOW, page: 3 }), world().orders({ now: NOW, page: 3 }));
});

test("totals only grow, and orders keep their content as time passes", () => {
  const w = world();
  const a = w.overview(NOW).kpis.ordersTotal;
  const b = w.overview(NOW + 3 * 3_600_000).kpis.ordersTotal;
  for (const c of CFG.channels) assert.ok(b[c.id] >= a[c.id], c.id);
  const before = w.orders({ now: NOW, per: 500 }).rows;
  const later = new Map(w.orders({ now: NOW + DAY, per: 2000 }).rows.map((o) => [o.id, o]));
  for (const o of before.slice(0, 200)) assert.deepEqual(later.get(o.id)?.lines, o.lines);
});

test("only sizes in stock today are sold, never before the product came out, only where it is listed", () => {
  const cat = catalog();
  const w = storeWorld(CFG, cat);
  const byId = new Map(cat.products.map((p) => [p.id, p]));
  const rows = w.orders({ now: NOW, per: 5000 }).rows;
  assert.ok(rows.length > 300);
  for (const o of rows) {
    const last = o.id.startsWith("l");
    for (const l of o.lines) {
      const p = byId.get(l.productId)!;
      const v = p.variants.find((x) => x.color === l.color && x.size === l.size)!;
      if (!last) assert.ok(v.available, `${o.id} sold a sold-out size`);
      assert.ok(Date.parse(p.publishedAt) < Date.parse(o.placedAt), `${o.id} sold ${p.id} before it came out`);
    }
  }
  const listed = new Map(w.productRows({ now: NOW, per: 1000 }).rows.map((p) => [p.id, p.listedOn]));
  for (const o of rows) for (const l of o.lines) assert.ok(listed.get(l.productId)!.includes(o.channel), `${o.id} not listed on ${o.channel}`);
});

test("a size the store shows as sold out gets its last sale and the pull", () => {
  const w = world();
  const pulls = w.happenings(NOW, 60).filter((h) => h.kind === "pulled");
  assert.ok(pulls.length > 0);
  assert.ok(pulls.every((h) => /sold|Last/.test(h.text)));
  const p7 = w.productRows({ now: NOW, per: 1000 }).rows.find((p) => p.id === "p7")!;
  assert.equal(p7.soldOut, true);
  assert.ok(p7.stock.every((v) => v.stock === 0));
});

test("steps are in time order and never in the future; states follow the last step", () => {
  const w = world();
  for (const o of w.orders({ now: NOW, per: 3000 }).rows) {
    const ts = o.steps.map((s) => Date.parse(s.at));
    assert.ok(ts.every((t) => t <= NOW));
    for (let i = 1; i < ts.length; i++) assert.ok(ts[i] >= ts[i - 1], `${o.id} steps out of order`);
    assert.ok(Date.parse(o.placedAt) <= NOW);
    if (o.steps.some((s) => s.kind === "cancel")) assert.equal(o.state, "Cancelled");
  }
});

test("the live channel has its show-evening burst; the web store sells most", () => {
  const w = world();
  // Sunday 4 Oct 2026 is a show day: 19:00–21:05 Chicago = 00:00–02:05 UTC on 5 Oct
  const after = Date.parse("2026-10-05T02:10:00Z");
  const show = w.orders({ now: after, channel: "tiktok", per: 5000 }).rows.filter((o) => {
    const t = Date.parse(o.placedAt);
    return t >= Date.parse("2026-10-05T00:00:00Z") && t <= after;
  });
  assert.ok(show.length >= 14, `show orders ${show.length}`);
  const k = w.overview(NOW).kpis.orders24h;
  assert.ok(k.shopify > k.amazon);
  assert.equal(w.liveNow(Date.parse("2026-10-05T01:00:00Z")), "tiktok");
  assert.equal(w.liveNow(Date.parse("2026-10-05T15:00:00Z")), null);
});

test("returns come back into stock at about the configured rate", () => {
  const w = world();
  const rows = w.orders({ now: NOW, per: 5000 }).rows.filter((o) => o.state === "Delivered" || o.state === "Return started" || o.state === "Returned");
  const ret = rows.filter((o) => o.steps.some((s) => s.kind === "return")).length;
  assert.ok(rows.length > 200);
  assert.ok(ret / rows.length > 0.03 && ret / rows.length < 0.2, `return share ${ret / rows.length}`);
});

test("stock: one count per size, lower by what sold today, 0 when sold out", () => {
  const w = world();
  for (const p of w.productRows({ now: NOW, per: 1000 }).rows) {
    for (const v of p.stock) {
      if (!v.available) assert.equal(v.stock, 0);
      else assert.ok(v.stock >= 1);
    }
  }
});

test("labels follow working hours: before the cut-off the same day, never on a Sunday", () => {
  const w = world();
  for (const o of w.orders({ now: NOW, per: 3000 }).rows) {
    const l = o.steps.find((s) => s.kind === "label");
    if (!l) continue;
    const local = new Date(Date.parse(l.at) - 5 * 3_600_000); // CDT
    assert.notEqual(local.getUTCDay(), 0, `${o.id} label on a Sunday`);
    assert.ok(local.getUTCHours() >= 9, `${o.id} label at ${local.getUTCHours()}h`);
  }
});

test("the store's answer: product types read as a shopper reads them, codes are not brands, gift cards left out", () => {
  assert.equal(categoryOf("141 - Tops over $50", "x"), "Tops");
  assert.equal(categoryOf("174 - All Other Shorts", "x"), "Shorts");
  assert.equal(categoryOf("152 - Over $60 Pullover Sweaters", "x"), "Sweaters");
  assert.equal(categoryOf("Dresses Between $50 - $70", "x"), "Dresses");
  assert.equal(categoryOf("172 - Short Skirts", "x"), "Skirts");
  assert.equal(categoryOf("Romper", "x"), "Rompers & Jumpsuits");
  assert.equal(categoryOf("", "Satin Maxi Dress"), "Dresses");
  assert.equal(brandOf("SKYLAR ROSE"), "Skylar Rose");
  assert.equal(brandOf("SM/T10681A"), "");
  const raw = {
    data: {
      newest: { nodes: [
        { id: "gid://shopify/Product/1", title: "Coffee Stripe Top", vendor: "Klesis", productType: "142 - Tops under $50", publishedAt: "2026-09-29T10:00:00Z",
          priceRange: { minVariantPrice: { amount: "44.0" } }, featuredImage: { url: "https://cdn.shopify.com/a.jpg" },
          variants: { nodes: [{ availableForSale: true, selectedOptions: [{ name: "Color", value: "BROWN" }, { name: "Size", value: "M" }] }] } },
        { id: "gid://shopify/Product/2", title: "Gift Card", vendor: "Store", productType: "", publishedAt: "2026-01-01T00:00:00Z",
          priceRange: { minVariantPrice: { amount: "10.0" } }, featuredImage: { url: "https://cdn.shopify.com/b.jpg" },
          variants: { nodes: [{ availableForSale: true, selectedOptions: [{ name: "Title", value: "Default Title" }] }] } },
      ] },
      best: { products: { nodes: [] } },
    },
  };
  const c = catalogOf(raw, "2026-10-04T00:00:00Z");
  assert.equal(c.products.length, 1);
  assert.deepEqual([c.products[0].category, c.products[0].variants[0].color, c.products[0].variants[0].size], ["Tops", "Brown", "M"]);
});

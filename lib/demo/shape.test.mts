// node --test lib/demo/shape.test.mts
// The answer shapes' helpers (lib/demo/shape.ts): the stores and jobs as the channel config names them, the connection
// cards, pages and the search term the page sends.
import { test } from "node:test";
import assert from "node:assert/strict";
import { CHANNELS, type Channel } from "./channels.ts";
import { JOBS, STORES, connectionsOf, jobsMeta, pageOf, searchTerm, storeById, type Job } from "./shape.ts";

test("stores: one per account of the channel config, found by id only", () => {
  assert.deepEqual(STORES.map((s) => s.id), CHANNELS.flatMap((c) => c.accounts.map((a) => a.id)));
  assert.equal(storeById("sx-us")?.label, "StockX US");
  assert.equal(storeById("al-usa")?.platform, "alias");
  assert.equal(storeById("stockx_eu"), null);
  assert.equal(storeById(undefined), null);
});

test("jobs: the build's own, the sold-out job named after every channel", () => {
  assert.deepEqual(Object.keys(JOBS), ["stockx-orders", "alias-orders", "zero-stock", "stockx-products", "alias-listings", "alias-restock", "picqer-products", "picqer-images", "alias-products"]);
  assert.equal(JOBS["zero-stock"].name, "Sold-out sizes pulled from StockX, Alias, Shopify and Whatnot");
  const two: Channel[] = CHANNELS.slice(0, 2);
  assert.equal(jobsMeta(two)["zero-stock"].name, "Sold-out sizes pulled from StockX and Alias");
  for (const j of Object.values(JOBS)) assert.ok(j.min > 0 && j.every.length > 0);
});

test("connection cards: one per channel with jobs, then Picqer; healthy only when every job is", () => {
  const at = "2026-10-11T10:00:00.000Z";
  const job = (key: string, platform: Job["platform"], status: Job["status"] = "ok", lastRun = at): Job => ({ key, name: key, platform, every: "every 5 min", lastRun, status });
  const jobs = [job("stockx-orders", "stockx"), job("alias-orders", "alias", "late"), job("shopify-orders", "shopify", "ok", "2026-10-11T10:01:00.000Z"), job("zero-stock", "picqer", "running")];
  const cards = connectionsOf(jobs);
  assert.deepEqual(cards.map((c) => c.platform), ["stockx", "alias", "shopify", "picqer"], "a slot without jobs has no card");
  assert.deepEqual(cards.map((c) => c.healthy), [true, false, true, true]);
  assert.equal(cards[3].lastSync, "2026-10-11T10:01:00.000Z", "Picqer's last sync is the newest job's");
  assert.equal(cards[3].syncs[1], "New products linked to StockX, Alias and Shopify");
  for (const c of cards) assert.deepEqual(Object.keys(c), ["platform", "name", "role", "accounts", "lastSync", "healthy", "syncs"]);
});

test("helpers", () => {
  assert.deepEqual(pageOf([1, 2], 41, 3, 20), { rows: [1, 2], total: 41, page: 3, pages: 3 });
  assert.equal(pageOf([], 0, 1, 20).pages, 1);
  assert.equal(searchTerm("jordan (4)*.+ [bred]"), "jordan 4 bred");
  assert.equal(searchTerm({}), "");
  assert.equal(searchTerm("a".repeat(80)).length, 40);
});

// node --test lib/demo/shape.test.mts
// The demo shows a real client's live data on a public page: nothing that identifies the client, an order, a listing
// or a bin may leave the server. Samples are shaped like the API's answers (2026-09-30).
import { test } from "node:test";
import assert from "node:assert/strict";
import { jobsOf, linkedOf, listingOf, maskRef, overviewOf, prettySlug, productOf, saleOf, searchTerm, storeOf } from "./shape.ts";

const CLIENT_STORE = "alias_" + "anthony_kicks"; // the main Alias account's key carries the client's name

const stockxOrder = {
  _id: "6abd471b5bf16fb6e8a743c4", orderNumber: "04-K0XWGJAFSG", dateCreated: "2026-09-30T17:30:03.796Z", store: "stockx_eu",
  listingId: "aa6672eb-260f-4052-85c1-b82bbe9026a2", status: "CREATED", createdAt: "2026-09-30T17:28:12.027Z",
  product: { productId: "019f8b47-7e79-7b93-884e-27790c96380e", productName: "adidas BadBo 1.0 Bad Bunny Night Navy", styleId: "LB5996" },
  variant: { variantId: "019f8b47-e501-736b-a256-59cd34362d6f", variantName: "adidas-BadBo-10:10", variantValue: "8.5" },
  quantity: 1, picqerProductId: "51886739", picqerProductCode: "LB5996-42",
  picqerStockLog: "stock updated -1 from 1A Stockx Eu order number: 04-K0XWGJAFSG", picqerStockAction: true,
};
const aliasOrder = {
  _id: "6abd32075bf16fb6e8a743bf", orderNumber: "514350456", dateCreated: "2026-09-30T16:00:07.577Z", store: CLIENT_STORE,
  listingId: "01a08037-2dfa-709d-b858-8379a8d52d55", status: "ORDER_STATUS_UNDER_REVIEW", createdAt: "2026-09-30T15:57:10.903Z",
  product: { productId: "vans-old-skool-36-souvenir-black-white-vn000e8vemv", productName: "vans-old-skool-36-souvenir-black-white-vn000e8vemv", styleId: "VN000E8VEMV" },
  variant: { variantValue: "6" }, picqerProductId: "50740666", picqerLocationId: 6857134, picqerLocationName: "5B",
  picqerStockLog: "stock updated -1 from 5B Alias USA order number: 514350456 · stock updated +1 to 5B — customer cancelled order",
  stockxLog: "stockx_eu: deactivated, stockx_us: deactivated", stockxAction: true,
  aliasLog: { action: true, message: "Deactivated 9 listing(s) on Alias for VN000E8VEMV 6" },
  stock: { idwarehouse: 9140, freestock: 1, locations: [{ idlocation: 12519068, name: "4D" }] },
};
const match = {
  _id: "6ab58128611a902858dedd74", picqerProductId: "51886908", productcode: "LC5466-47 1/3", usSize: "12.5", euSize: "47 1/3", color: "Chalk White",
  matches: [
    { source: "stockx_eu", productId: "01a001e2-b93a", variantId: "01a001e2-f306", styleId: "LC5466", variantValue: "12.5", localProductId: "6ab575186feb1b5a9d451336", matchedAt: "2026-09-24T19:59:36.853Z" },
    { source: CLIENT_STORE, productId: "adidas-badbo-1-0-chalk-white-lc5466", styleId: "LC5466", variantValue: "12.5", localProductId: "6ab5b989", matchedAt: "2026-09-25T00:00:15.516Z" },
    { source: "some_other_tool", productId: "x", styleId: "LC5466" },
  ],
};

// Nothing the page must not show: ids, listing ids, full order numbers, bins, warehouse, barcodes, the client's name.
const FORBIDDEN = [/6ab[0-9a-f]{21}/, /aa6672eb/, /01a08037/, /019f8b47/, /01a001e2/, /K0XWGJAFSG/, /514350456/, /\b(1A|4D|5B)\b/, /9140/, /12519068/,
  /51886739|50740666|51886908/, /anthony/i, /kicks/i, /picqerProductId|localProductId|listingId|orderNumber|variantId|idwarehouse|barcode/];
function clean(label: string, v: unknown) {
  const s = JSON.stringify(v);
  for (const re of FORBIDDEN) assert.ok(!re.test(s), `${label} leaks ${re}: ${s}`);
}

test("stores: the API's keys become neutral ids; unknown keys are dropped", () => {
  assert.equal(storeOf("stockx_eu")?.id, "sx-eu");
  assert.equal(storeOf("alias_USA")?.label, "Alias USA");
  assert.equal(storeOf(CLIENT_STORE)?.label, "Alias");
  assert.equal(storeOf("ebay_main"), null);
  assert.equal(storeOf(undefined), null);
});

test("a StockX sale: what the sync did, nothing identifying", () => {
  const s = saleOf(stockxOrder, "stockx")!;
  assert.equal(s.storeLabel, "StockX EU");
  assert.equal(s.product, "adidas BadBo 1.0 Bad Bunny Night Navy");
  assert.equal(s.size, "8.5");
  assert.equal(s.ref, "•••FSG");
  assert.deepEqual(s.steps.map((x) => x.kind), ["stock"]);
  clean("stockx sale", s);
  assert.equal(saleOf(stockxOrder, "alias"), null, "a StockX store is never an Alias sale");
});

test("an Alias sale: last pair pulled everywhere, cancelled and restocked, slug name made readable", () => {
  const s = saleOf(aliasOrder, "alias")!;
  assert.equal(s.storeLabel, "Alias");
  assert.equal(s.product, "Vans Old Skool 36 Souvenir Black White");
  assert.equal(s.state, "Being checked");
  assert.deepEqual(s.steps.map((x) => x.kind), ["stock", "pulled", "restock"]);
  assert.equal(s.steps[1].text, "Last pair: pulled from StockX EU, StockX US and Alias");
  clean("alias sale", s);
});

test("flagged sales say so", () => {
  const f = saleOf({ ...stockxOrder, picqerStockLog: "Failed to match product Stockx Eu order number: 04-K0XWGJAFSG" }, "stockx")!;
  assert.equal(f.steps[0].kind, "flag");
  const z = saleOf({ ...stockxOrder, picqerStockLog: "No stock left Stockx Us order number: 04-K0XWGJAFSG" }, "stockx")!;
  assert.equal(z.steps[0].text, "Picqer had 0 left, flagged");
});

test("a linked product: known stores only, sorted, name from the Alias slug", () => {
  const l = linkedOf(match);
  assert.deepEqual(l.links.map((x) => x.storeLabel), ["StockX EU", "Alias"]);
  assert.equal(l.name, "Adidas Badbo 1 0 Chalk White");
  assert.equal(l.code, "LC5466-47 1/3");
  clean("linked", l);
});

test("a listing", () => {
  const l = listingOf({ _id: "6abd17ca5bf16fb6e8a74388", listingIds: ["aa6672eb"], identifier: "79b3-f8b2-stockx_us", store: "stockx_us", createdAt: "2026-09-30T14:04:43.709Z",
    product: { productId: "79b34699", productName: "Nike Dunk Low Stranger Things Phantom", styleId: "IH6766-001" }, variant: { variantId: "f8b2", variantValue: "5.5" } }, "stockx")!;
  assert.equal(l.storeLabel, "StockX US");
  assert.equal(l.size, "5.5");
  clean("listing", l);
});

test("a product: live stock, photo from an allowed host only, Alias listings counted per store", () => {
  const p = productOf({
    product: { data: { _id: "6ab58127611a902858dedd5d", idproduct: "51886908", name: "adidas BadBo 1.1 Bad Bunny Chalk White - EU47 1/3 (US12.5)", productcode: "LC5466-47 1/3", barcode: "8712345678901",
      color: "Chalk White", images: ["https://images.stockx.com/images/adidas-badbo-11.jpg"], imagePicqerAt: "2026-09-25T00:00:05.676Z" } },
    stock: { data: { idproduct: "51886908", stock: 5, reserved: 0, freestock: 5 } },
    matches: { data: match },
    aliasListings: { data: [{ store: CLIENT_STORE, listingId: "01a0d3e0-be9e" }, { store: CLIENT_STORE, listingId: "01a0d3e0-badd" }] },
  });
  assert.deepEqual(p.stock, { free: 5, total: 5, reserved: 0 });
  assert.equal(p.image, "https://images.stockx.com/images/adidas-badbo-11.jpg");
  assert.deepEqual(p.aliasListings, [{ storeLabel: "Alias", count: 2 }]);
  clean("product", p);
  const q = productOf({ product: { data: { images: ["https://evil.example/x.jpg"] } }, stock: null, matches: null, aliasListings: null });
  assert.equal(q.image, null);
  assert.equal(q.stock, null);
});

test("jobs: known ones that ran; late and error states; no error text", () => {
  const now = Date.parse("2026-09-30T18:00:00Z");
  const jobs = jobsOf({ enabled: true, jobs: [
    { key: "stockx-orders", name: "StockX Orders", running: false, lastStatus: "success", lastRun: "2026-09-30T17:58:00Z", lastError: null },
    { key: "alias-orders", name: "Alias Orders", running: false, lastStatus: "error", lastRun: "2026-09-30T17:55:00Z", lastError: "E11000 dup key mongodb+srv://user:pw@x" },
    { key: "zero-stock", name: "Zero-Stock", running: false, lastStatus: "success", lastRun: "2026-09-30T16:00:00Z" },
    { key: "stockx-listings", name: "never runs", lastStatus: "idle", lastRun: null },
    { key: "secret-job", name: "x", lastStatus: "success", lastRun: "2026-09-30T17:59:00Z" },
  ] }, now);
  assert.deepEqual(jobs.map((j) => [j.key, j.status]), [["stockx-orders", "ok"], ["alias-orders", "error"], ["zero-stock", "late"]]);
  assert.ok(!JSON.stringify(jobs).includes("mongodb"));
});

test("the overview counts the last 24 hours and marks a full page as more", () => {
  const now = Date.parse("2026-09-30T18:00:00Z");
  const page = (rows: unknown[], total: number) => ({ data: { page: { totalIndex: total }, data: rows } });
  const o = overviewOf({
    cron: { jobs: [] }, stats: { data: { total: 31671, withMatches: 11970 } },
    sx: page([stockxOrder, { ...stockxOrder, _id: "b", createdAt: "2026-09-28T10:00:00Z" }], 38768),
    al: page([aliasOrder], 16829), sxListings: page([], 14821), alListings: page([], 9095),
  }, now);
  assert.deepEqual(o.kpis.sales24h, { stockx: 1, alias: 1, shopify: 0, whatnot: 0, more: false });
  assert.equal(o.kpis.lastSale?.storeLabel, "StockX EU");
  assert.deepEqual(o.kpis.products, { total: 31671, linked: 11970 });
  assert.equal(o.feed.length, 3);
  clean("overview", o);
  const full = overviewOf({ cron: {}, stats: {}, sx: page([stockxOrder], 5), al: page([], 0), sxListings: {}, alListings: {}, limit: 1 }, now);
  assert.equal(full.kpis.sales24h.more, true);
});

test("helpers", () => {
  assert.equal(maskRef("12"), "");
  assert.equal(prettySlug("air-jordan-4-retro-x-union-fv5029-006", "FV5029 006"), "Air Jordan 4 Retro x Union");
  assert.equal(searchTerm("jordan (4)*.+ [bred]"), "jordan 4 bred");
  assert.equal(searchTerm({}), "");
  assert.equal(searchTerm("a".repeat(80)).length, 40);
});

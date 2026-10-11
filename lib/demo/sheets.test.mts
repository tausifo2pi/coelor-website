// node --test lib/demo/sheets.test.mts
// The "Extra" section's sample sheets: laid out like the real ones, numbers that add up, and nothing from the client.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  FLEX_EVERY_MIN, FLEX_LISTINGS, HEADERS, LIVE_EVERY_MIN, PARTNERS, STOCK_SIZES, USD_PER_EUR, byName, colLetter, flexGrid, flexReport, flexSummary,
  flexUpdatedAt, lastRun, liveGrid, liveUpdatedAt, sheetTime, stockRows, type Grid,
} from "./sheets.ts";

const NOW = Date.parse("2026-10-01T11:47:20Z");

/** Every column of every row is drawn by exactly one cell: spans and merges cover what they claim, and no more. */
function assertTiles(g: Grid) {
  const n = g.widths.length;
  const owner: (string | null)[][] = g.rows.map(() => Array<string | null>(n).fill(null));
  g.rows.forEach((row, r) => {
    assert.equal(row.cells.length, n, `row ${r + 1} has ${row.cells.length} columns, not ${n}`);
    row.cells.forEach((cell, c) => {
      if (!cell) return;
      for (let dr = 0; dr < (cell.rows ?? 1); dr++) {
        for (let dc = 0; dc < (cell.span ?? 1); dc++) {
          assert.ok(r + dr < g.rows.length && c + dc < n, `${colLetter(c)}${r + 1} runs off the sheet`);
          assert.equal(owner[r + dr][c + dc], null, `${colLetter(c + dc)}${r + dr + 1} is drawn twice`);
          owner[r + dr][c + dc] = `${colLetter(c)}${r + 1}`;
          if (dr || dc) assert.equal(g.rows[r + dr].cells[c + dc], null, `${colLetter(c + dc)}${r + dr + 1} is under ${colLetter(c)}${r + 1} but not empty`);
        }
      }
    });
  });
  owner.forEach((cols, r) => cols.forEach((o, c) => assert.ok(o, `${colLetter(c)}${r + 1} is drawn by nobody`)));
}

test("column letters", () => {
  assert.deepEqual([0, 1, 8, 9, 25, 26, 27].map(colLetter), ["A", "B", "I", "J", "Z", "AA", "AB"]);
});

test("the stock preview: 12 to 20 rows over 4 to 6 products, sorted by product name, prices that agree", () => {
  const rows = stockRows();
  assert.ok(rows.length >= 12 && rows.length <= 20, `${rows.length} rows`);
  const products = new Set(rows.map((r) => r.sku));
  assert.ok(products.size >= 4 && products.size <= 6, `${products.size} products`);
  assert.deepEqual(rows.map((r) => r.name), byName(rows).map((r) => r.name));
  // a product's sizes sit together, in size order
  const seen: string[] = [];
  for (const r of rows) if (seen.at(-1) !== r.sku) { assert.ok(!seen.includes(r.sku), `${r.sku} split`); seen.push(r.sku); }
  for (const r of rows) {
    assert.ok(r.eu && r.us, `${r.skuSize} has both sizes`);
    assert.equal(r.skuSize, `${r.sku}-${r.eu}`);
    assert.ok(Number.isInteger(r.qty) && r.qty >= 1 && r.qty <= 6, `${r.skuSize} qty ${r.qty}`);
    assert.equal(r.usd, Math.round(r.eur * USD_PER_EUR));
    assert.ok(r.usd > r.eur && r.usd < r.eur * 1.1);
  }
  for (const sku of products) {
    const us = rows.filter((r) => r.sku === sku).map((r) => Number(r.us));
    assert.deepEqual(us, [...us].sort((a, b) => a - b), `${sku} sizes in order`);
  }
});

test("the live sheet: A1 'Last Updated', the header in row 2 (frozen), one photo merged per product", () => {
  const at = liveUpdatedAt(NOW);
  const g = liveGrid(at, true);
  assertTiles(g);
  assert.equal(g.frozen, 2);
  assert.equal(g.rows[0].cells[0]!.text, `Last Updated: ${sheetTime(at)}`);
  assert.deepEqual(g.rows[1].cells.map((c) => c!.text), [...HEADERS]);
  const rows = stockRows();
  const data = g.rows.slice(2);
  assert.equal(data.length, rows.length);
  // the photo column: one cell per product, as tall as its sizes
  const photos = data.map((r) => r.cells[1]).filter((c) => c);
  assert.equal(photos.length, new Set(rows.map((r) => r.sku)).size);
  for (const p of photos) assert.match(p!.formula!, /^=IMAGE\(VLOOKUP\(C\d+, Photos!A:B, 2, FALSE\), 1\)$/);
  assert.equal(photos.reduce((n, p) => n + (p!.rows ?? 1), 0), rows.length);
  // formats: € and $ with cents, quantity as a number
  const first = data[0].cells;
  assert.match(first[7]!.text, /^€\d{1,3}(,\d{3})*\.\d{2}$/);
  assert.match(first[8]!.text, /^\$\d{1,3}(,\d{3})*\.\d{2}$/);
  assert.equal(first[6]!.align, "right");
  assert.match(g.more!, new RegExp(`^${STOCK_SIZES - rows.length} more rows`));
});

test("the tab without photos has the same rows minus the Image column", () => {
  const at = liveUpdatedAt(NOW);
  const withImg = liveGrid(at, true);
  const plain = liveGrid(at, false);
  assertTiles(plain);
  assert.deepEqual(plain.rows[1].cells.map((c) => c!.text), HEADERS.filter((h) => h !== "Image"));
  assert.equal(plain.widths.length, withImg.widths.length - 1);
  plain.rows.slice(2).forEach((row, i) => {
    const full = withImg.rows[i + 2].cells.filter((_, c) => c !== 1).map((c) => c!.text);
    assert.deepEqual(row.cells.map((c) => c!.text), full);
    assert.ok(row.h < withImg.rows[i + 2].h);
  });
});

test("the Flex report adds up", () => {
  const r = flexReport();
  assert.equal(r.missing.length + r.onFlex + r.unchecked.length, r.checked);
  assert.equal(r.checked, STOCK_SIZES);
  assert.ok(r.missing.length >= 6 && r.missing.length <= 10);
  assert.ok(r.unchecked.length >= 2 && r.unchecked.length <= 3);
  assert.equal(r.pairs, r.missing.reduce((n, m) => n + m.qty, 0));
  assert.equal(r.value, r.missing.reduce((n, m) => n + m.qty * m.eur, 0));
  assert.deepEqual(r.missing.map((m) => m.name), byName(r.missing).map((m) => m.name));
  for (const m of r.missing) assert.ok(m.us && m.eu);
  for (const u of r.unchecked) {
    assert.equal(u.us, "", "only sizes without a US size can't be checked (flex.gs)");
    assert.equal(u.why, u.eu ? "US size missing in our product data" : "No sizes in our product data (new product?)");
  }
  assert.ok(FLEX_LISTINGS.counted < FLEX_LISTINGS.total);
  // a size that is in the stock preview shows the same stock and price in the report
  const live = new Map(stockRows().map((s) => [s.skuSize, s]));
  for (const m of r.missing) {
    const s = live.get(m.skuSize);
    if (s) assert.deepEqual({ qty: m.qty, eur: m.eur, usd: m.usd }, { qty: s.qty, eur: s.eur, usd: s.usd });
  }
  assert.ok(r.missing.some((m) => live.has(m.skuSize)), "some listed sizes are in the preview");

  const summary = flexSummary(r);
  assert.deepEqual(summary.map(([k]) => k), ["Not on Flex", "On Flex", "Couldn't check", "Checked", "Counts as on Flex"]);
  assert.equal(summary[0][1], `${r.missing.length} sizes · ${r.pairs} pairs · €${Math.round(r.value).toLocaleString("en-US")} at Picqer price`);
  assert.equal(summary[2][1], `${r.unchecked.length} sizes — listed below`);
});

test("the Flex sheet: title, update line, summary, couldn't-check block, then the list", () => {
  const at = flexUpdatedAt(NOW);
  const g = flexGrid(at);
  assertTiles(g);
  const r = flexReport();
  const text = (row: number, col = 0) => g.rows[row - 1].cells[col]?.text;
  assert.equal(text(1), "StockX US Flex — not listed");
  assert.equal(text(2), `Updated ${sheetTime(at)} · refreshes every 2 hours`);
  assert.deepEqual([3, 4, 5, 6, 7].map((n) => text(n)), ["Not on Flex", "On Flex", "Couldn't check", "Checked", "Counts as on Flex"]);
  assert.equal(g.rows[2].cells[1]!.bold, true);
  assert.equal(text(8), "");
  assert.match(text(9)!, new RegExp(`^Couldn't check \\(${r.unchecked.length}\\)`));
  assert.deepEqual(g.rows[9].cells.map((c) => c?.text), [...HEADERS, "Why not checked"]);
  const listTitle = 9 + 2 + r.unchecked.length + 1;
  assert.equal(text(listTitle), `Not on StockX US Flex — ${r.missing.length} sizes · ${r.pairs} pairs`);
  assert.deepEqual(g.rows[listTitle].cells.slice(0, HEADERS.length).map((c) => c?.text), [...HEADERS]);
  assert.equal(g.rows.length, listTitle + 1 + r.missing.length);
  assert.equal(g.frozen, 0, "the list header sits below row 12, so nothing is frozen");
  assert.equal(g.gridlines, false);
  // the list is banded, a merged photo takes its first row's colour
  const bands = g.rows.slice(listTitle + 1).map((row) => row.cells[0]!.bg);
  bands.forEach((b, i) => assert.equal(b, i % 2 ? "#f3f3f3" : "#ffffff"));
});

test("sheet time: the sheets' own format, in Amsterdam time (summer and winter)", () => {
  assert.equal(sheetTime(Date.parse("2026-10-01T11:32:00Z")), "13:32, 01 October 26");
  assert.equal(sheetTime(Date.parse("2026-12-05T08:05:00Z")), "09:05, 05 December 26");
  assert.equal(sheetTime(Date.parse("2026-09-30T22:05:00Z")), "00:05, 01 October 26");
});

test("last runs: never in the future, within one period, stable", () => {
  for (const now of [NOW, NOW + 7 * 60_000, Date.parse("2026-10-01T12:01:00Z"), Date.parse("2026-10-01T12:01:40Z")]) {
    for (const [at, every] of [[liveUpdatedAt(now), LIVE_EVERY_MIN], [flexUpdatedAt(now), FLEX_EVERY_MIN]] as const) {
      assert.ok(at <= now && now - at < every * 60_000, `${new Date(at).toISOString()} for ${new Date(now).toISOString()}`);
    }
    assert.equal(liveUpdatedAt(now), liveUpdatedAt(now));
  }
  assert.equal(lastRun(Date.parse("2026-10-01T11:47:20Z"), 30, 95_000), Date.parse("2026-10-01T11:31:35Z"));
  // the Flex report is written at the tail of a stock sync
  const flex = flexUpdatedAt(NOW);
  assert.equal(flex - lastRun(flex, LIVE_EVERY_MIN, 95_000), 48_000);
});

test("nothing from the client: made-up partners, no client names, keys, bins or real sheet names", () => {
  const all = JSON.stringify([liveGrid(liveUpdatedAt(NOW), true), liveGrid(liveUpdatedAt(NOW), false), flexGrid(flexUpdatedAt(NOW)), PARTNERS]);
  for (const bad of [/anthony/i, /kicks/i, /\bAK\b/, /9140/, /picqer\.com/i, /coelor/i, /docs\.google/i]) {
    assert.doesNotMatch(all, bad);
  }
  for (const p of Object.values(PARTNERS)) assert.doesNotMatch(p, /nike|adidas|jordan|stockx|goat|alias|kicks|sneaker|sole/i);
});

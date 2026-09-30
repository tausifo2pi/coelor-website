// node --test lib/demo/sheets.test.mts
// The demo's "Extra" section: the Google Sheets the sync keeps filled from the Picqer stock and shares with partners.
// Two sheets, laid out like the real ones: the live stock sheet (column order, € and $ formats, rows A to Z by product,
// one photo merged down a product's sizes, a second tab without photos) and the StockX US Flex "not listed" report
// (title, summary block, the sizes it couldn't check, then the list). Everything in them is SAMPLE data: an imaginary
// supplier, an imaginary consignment partner and made-up stock. Nothing comes from the client. Pure and deterministic,
// so the server and the browser draw the same sheet.

export const PARTNERS = { supplier: "Harbourline Wholesale", consign: "Kiln Street Consign" } as const;

export const USD_PER_EUR = 1.08;
export const LIVE_EVERY_MIN = 30;
export const FLEX_EVERY_MIN = 120;

/** Sizes with free stock in the whole sample sheet; the preview shows its first rows. */
export const STOCK_SIZES = 214;
/** StockX US Flex listings that count as on Flex now, and all of them. */
export const FLEX_LISTINGS = { counted: 486, total: 1129 };

/** Colours for a product's placeholder photo, roughly its colourway. */
export type Tone = { bg: string; fg: string };
export type StockRow = { skuSize: string; sku: string; name: string; eu: string; us: string; qty: number; eur: number; usd: number; tone: Tone };
export type Unchecked = StockRow & { why: string };

type Model = { sku: string; name: string; tone: Tone; sizes: [eu: string, us: string, qty: number, eur: number][] };

// The first rows of the sheet, A to Z by product name (what the preview shows).
const IN_VIEW: Model[] = [
  { sku: "HQ8708", name: "adidas Campus 00s Core Black", tone: { bg: "#1f2937", fg: "#f8fafc" }, sizes: [["41 1/3", "8", 2, 95], ["42 2/3", "9", 3, 95], ["44", "10", 1, 98]] },
  { sku: "B75806", name: "adidas Samba OG Cloud White Core Black", tone: { bg: "#f1f5f9", fg: "#111827" }, sizes: [["40 2/3", "7.5", 2, 105], ["42", "8.5", 4, 110], ["43 1/3", "9.5", 2, 110], ["44 2/3", "10.5", 1, 108]] },
  { sku: "DZ5485-612", name: "Air Jordan 1 High OG Lost and Found", tone: { bg: "#fee2e2", fg: "#b91c1c" }, sizes: [["42.5", "9", 1, 265], ["44", "10", 2, 255], ["45", "11", 1, 249]] },
  { sku: "FV5029-006", name: "Air Jordan 4 Retro Bred Reimagined", tone: { bg: "#1f2937", fg: "#f87171" }, sizes: [["41", "8", 2, 225], ["42.5", "9", 3, 235], ["44", "10", 2, 230]] },
  { sku: "1201A789-020", name: "ASICS Gel-NYC Graphite Grey Black", tone: { bg: "#e5e7eb", fg: "#374151" }, sizes: [["42", "8.5", 2, 135], ["43.5", "9.5", 1, 139], ["44.5", "10.5", 1, 132]] },
];

// Further down the sheet: only the sizes the Flex report lists. An empty US size is a gap in the product data, which
// the report can't check (as in flex.gs).
const FURTHER: Model[] = [
  { sku: "U9060GRY", name: "New Balance 9060 Rain Cloud Grey", tone: { bg: "#d1d5db", fg: "#4b5563" }, sizes: [["42", "8.5", 1, 149], ["44.5", "10.5", 2, 145]] },
  { sku: "CW2288-111", name: "Nike Air Force 1 '07 White", tone: { bg: "#f8fafc", fg: "#94a3b8" }, sizes: [["43", "9.5", 1, 99]] },
  { sku: "DQ3989-100", name: "Nike Air Max 1 '86 Big Bubble Red", tone: { bg: "#fee2e2", fg: "#dc2626" }, sizes: [["43", "", 1, 139], ["44", "", 1, 142]] },
  { sku: "DD1391-100", name: "Nike Dunk Low Retro White Black", tone: { bg: "#f1f5f9", fg: "#0f172a" }, sizes: [["42.5", "9", 3, 112], ["45", "11", 1, 109]] },
  { sku: "L41086600", name: "Salomon XT-6 Black Phantom", tone: { bg: "#111827", fg: "#9ca3af" }, sizes: [["", "", 2, 165]] },
];

// Sizes with a US size but no StockX US Flex listing that counts (SKU+Size).
const NOT_ON_FLEX = new Set(["B75806-44 2/3", "FV5029-006-41", "FV5029-006-44", "U9060GRY-42", "U9060GRY-44.5", "CW2288-111-43", "DD1391-100-42.5", "DD1391-100-45"]);

export const usd = (eur: number) => Math.round(eur * USD_PER_EUR);

function rowsOf(models: Model[]): StockRow[] {
  return models.flatMap((m) =>
    m.sizes.map(([eu, us, qty, eur]) => ({ skuSize: eu ? `${m.sku}-${eu}` : m.sku, sku: m.sku, name: m.name, eu, us, qty, eur, usd: usd(eur), tone: m.tone })),
  );
}

/** The sheet's order: by product name, case-insensitive, numbers as numbers; a product's sizes stay in order. */
export function byName<T extends { name: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base", numeric: true }));
}

/** The rows the stock sheet preview shows. */
export function stockRows(): StockRow[] {
  return byName(rowsOf(IN_VIEW));
}

export type FlexReport = { missing: StockRow[]; unchecked: Unchecked[]; onFlex: number; checked: number; pairs: number; value: number };

export function flexReport(): FlexReport {
  const known = rowsOf([...IN_VIEW, ...FURTHER]);
  const missing = byName(known.filter((r) => r.us && NOT_ON_FLEX.has(r.skuSize)));
  const unchecked = byName(known.filter((r) => !r.us).map((r) => ({ ...r, why: r.eu ? "US size missing in our product data" : "No sizes in our product data (new product?)" })));
  return {
    missing,
    unchecked,
    onFlex: STOCK_SIZES - missing.length - unchecked.length,
    checked: STOCK_SIZES,
    pairs: missing.reduce((n, r) => n + r.qty, 0),
    value: missing.reduce((n, r) => n + r.qty * r.eur, 0),
  };
}

/* ---------- time ---------- */

/** The last run of a job that runs every `everyMin` minutes, `afterMs` past each slot. Never after `now`. */
export function lastRun(now: number, everyMin: number, afterMs: number): number {
  const p = everyMin * 60_000;
  return Math.floor((now - afterMs) / p) * p + afterMs;
}
/** How long after each slot the stock sync writes the sheet; the Flex report is written at the end of every fourth. */
export const LIVE_AFTER_MS = 95_000;
export const FLEX_AFTER_MS = 143_000;
export const liveUpdatedAt = (now: number) => lastRun(now, LIVE_EVERY_MIN, LIVE_AFTER_MS);
export const flexUpdatedAt = (now: number) => lastRun(now, FLEX_EVERY_MIN, FLEX_AFTER_MS);

// numbers only from Intl, names from here: month and day names differ between ICU versions ("Sep" / "Sept"), and the
// server and the browser must print the same thing
const TIME = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Amsterdam", hourCycle: "h23", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric" });
export const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** "13:32, 01 October 26": the sheets' timestamp, in the sheet's time zone. */
export function sheetTime(ms: number): string {
  const p: Record<string, number> = {};
  for (const x of TIME.formatToParts(new Date(ms))) if (x.type !== "literal") p[x.type] = Number(x.value);
  const two = (n: number) => String(n).padStart(2, "0");
  return `${two(p.hour % 24)}:${two(p.minute)}, ${two(p.day)} ${MONTHS[p.month - 1]} ${two(p.year % 100)}`;
}

/* ---------- the grid ---------- */

/** One cell as the sheet shows it. `span` lets text run over the empty cells to its right; `rows` merges it down. */
export type Cell = {
  text: string;
  formula?: string; // what the formula bar shows, when it isn't the text
  span?: number;
  rows?: number;
  image?: Tone;
  align?: "left" | "center" | "right";
  bold?: boolean;
  color?: string;
  size?: number;
  bg?: string;
};
/** `null` = covered by a cell to the left (span) or above (merge). */
export type Row = { h: number; cells: (Cell | null)[] };
export type Grid = { widths: number[]; rows: Row[]; frozen: number; gridlines: boolean; more?: string };

export const HEADERS = ["SKU+Size", "Image", "SKU", "Product", "EU Size", "US Size", "Quantity", "Price EUR", "Price USD"] as const;
const WIDTH: Record<string, number> = { "SKU+Size": 120, Image: 56, SKU: 96, Product: 250, "EU Size": 58, "US Size": 58, Quantity: 66, "Price EUR": 80, "Price USD": 80, "Why not checked": 220 };
const IMAGE_ROW = 34;
const ROW = 21;

export const COLORS = { header: "#f1f3f4", muted: "#5f6368", summary: "#f8f9fa", alert: "#c5221f", uncheckedTitle: "#fce8b2", uncheckedHeader: "#fef7e0", listTitle: "#e8f0fe", band: "#f3f3f3" };

export function colLetter(i: number): string {
  let s = "";
  for (let n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
  return s;
}

const money = (sym: string, n: number) => sym + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const empty = (n: number): Cell[] => Array.from({ length: n }, () => ({ text: "" }));
const header = (names: readonly string[], bg: string): Cell[] => names.map((text) => ({ text, bold: true, bg }));

/** A row in the stock tabs' format: sizes as text, quantity as a number, prices as money. */
function stockCells(r: StockRow, images: boolean, bg?: string): Cell[] {
  const cells: Cell[] = [
    { text: r.skuSize, bg },
    { text: "", bg }, // the photo, filled per product by mergeImages
    { text: r.sku, bg },
    { text: r.name, bg },
    { text: r.eu, bg },
    { text: r.us, bg },
    { text: String(r.qty), align: "right", bg },
    { text: money("€", r.eur), formula: String(r.eur), align: "right", bg },
    { text: money("$", r.usd), formula: String(r.usd), align: "right", bg },
  ];
  if (!images) cells.splice(1, 1);
  return cells;
}

// the product photo address as the sheets write it (the catalogue's image host, named after the product)
const imageUrl = (name: string) =>
  `https://images.stockx.com/images/${name.replace(/[()'’]/g, "").trim().replace(/\s+/g, "-")}.jpg`;

/** One photo per product: runs of the same SKU share one merged cell (as live.gs imageGroups). */
export function mergeImages(rows: StockRow[], cells: (Cell | null)[][], col = 1) {
  for (let start = 0; start < rows.length; ) {
    let end = start + 1;
    while (end < rows.length && rows[end].sku === rows[start].sku) end++;
    const first = cells[start][col]!;
    cells[start][col] = { ...first, image: rows[start].tone, rows: end - start > 1 ? end - start : undefined, align: "center", formula: `=IMAGE("${imageUrl(rows[start].name)}", 1)` };
    for (let i = start + 1; i < end; i++) cells[i][col] = null;
    start = end;
  }
}

/** The live stock sheet: "Last Updated" in A1, the header in row 2 (frozen), then the stock. */
export function liveGrid(updatedAt: number, images: boolean): Grid {
  const names = images ? HEADERS : HEADERS.filter((h) => h !== "Image");
  const stock = stockRows();
  const body: (Cell | null)[][] = stock.map((r) => stockCells(r, images));
  if (images) mergeImages(stock, body);
  const n = names.length;
  return {
    widths: names.map((h) => WIDTH[h]),
    frozen: 2,
    gridlines: true,
    rows: [
      { h: ROW, cells: [{ text: `Last Updated: ${sheetTime(updatedAt)}`, span: n }, ...Array<null>(n - 1).fill(null)] },
      { h: ROW, cells: header(names, COLORS.header) },
      ...body.map((cells) => ({ h: images ? IMAGE_ROW : ROW, cells })),
    ],
    more: `${(STOCK_SIZES - stock.length).toLocaleString("en-US")} more rows below, ${STOCK_SIZES.toLocaleString("en-US")} sizes in stock in all`,
  };
}

const count = (n: number) => n.toLocaleString("en-US");

export function flexSummary(r: FlexReport): [string, string][] {
  return [
    ["Not on Flex", `${count(r.missing.length)} sizes · ${count(r.pairs)} pairs · €${count(Math.round(r.value))} at Picqer price`],
    ["On Flex", `${count(r.onFlex)} sizes`],
    ["Couldn't check", r.unchecked.length ? `${count(r.unchecked.length)} sizes — listed below` : "0 sizes"],
    ["Checked", `${count(r.checked)} Picqer sizes with free stock against ${count(FLEX_LISTINGS.counted)} StockX US Flex listings on Flex now (of ${count(FLEX_LISTINGS.total)} in total)`],
    ["Counts as on Flex", "Listed, unlisted, ready to ship, processing, delivered, being authenticated, sold in progress. Sold, returned, lost and canceled don't count."],
  ];
}

/** The StockX US Flex report, top to bottom: title, last update, summary, the sizes it couldn't check, then the list. */
export function flexGrid(updatedAt: number): Grid {
  const r = flexReport();
  const cols = HEADERS.length;
  const width = cols + 1; // the "Why not checked" column
  const pad = (cells: (Cell | null)[]) => [...cells, ...empty(width - cells.length)];
  const line = (cell: Cell, n = width) => pad([{ ...cell, span: n }, ...Array<null>(n - 1).fill(null)]);
  const blank = { h: ROW, cells: empty(width) };

  const rows: Row[] = [
    { h: 32, cells: line({ text: "StockX US Flex — not listed", bold: true, size: 18 }) },
    { h: ROW, cells: line({ text: `Updated ${sheetTime(updatedAt)} · refreshes every ${FLEX_EVERY_MIN / 60} hours`, color: COLORS.muted, size: 12 }) },
    ...flexSummary(r).map(([label, value], i) => ({
      h: ROW,
      cells: pad([
        { text: label, bold: true, color: COLORS.muted, bg: COLORS.summary },
        { text: value, span: cols - 1, bg: COLORS.summary, ...(i === 0 ? { bold: true, color: COLORS.alert } : {}) },
        ...Array<null>(cols - 2).fill(null),
      ]),
    })),
    blank,
  ];

  if (r.unchecked.length) {
    const body: (Cell | null)[][] = r.unchecked.map((u) => [...stockCells(u, true), { text: u.why }]);
    mergeImages(r.unchecked, body);
    rows.push(
      { h: ROW, cells: line({ text: `Couldn't check (${r.unchecked.length}) — fix the product data and these are checked on the next update`, bold: true, bg: COLORS.uncheckedTitle }) },
      { h: ROW, cells: header([...HEADERS, "Why not checked"], COLORS.uncheckedHeader) },
      ...body.map((cells) => ({ h: IMAGE_ROW, cells })),
      blank,
    );
  }

  const body: (Cell | null)[][] = r.missing.map((m, i) => pad(stockCells(m, true, i % 2 ? COLORS.band : "#ffffff")));
  mergeImages(r.missing, body);
  rows.push(
    { h: ROW, cells: line({ text: `Not on StockX US Flex — ${count(r.missing.length)} sizes · ${count(r.pairs)} pairs`, bold: true, bg: COLORS.listTitle }, cols) },
    { h: ROW, cells: pad(header(HEADERS, COLORS.header)) },
    ...body.map((cells) => ({ h: IMAGE_ROW, cells })),
  );

  // flex.gs freezes down to the list header only while that stays within 12 rows; here it doesn't
  const headerRow = rows.length - body.length;
  return { widths: [...HEADERS.map((h) => WIDTH[h]), WIDTH["Why not checked"]], rows, frozen: headerRow <= 12 ? headerRow : 0, gridlines: false };
}

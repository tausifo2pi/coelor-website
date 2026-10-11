// node --test lib/demo/fields.test.mts
// The demo clients' own fields and calendars (lib/demo/fields.ts): the same values for the same product every time,
// plausible and consistent (a consignor only on consigned pairs, a floor above the cost), and the TikTok LIVE exactly as
// the store engine sells it. (The Whatnot show comes with the overview: lib/demo/tiles.test.mts.)
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  BOX, SOURCES, boutiqueFields, businessDaysAfter, dayStart, fromWall, liveLineup, lotOf, nextLive, sneakerFields, splitCode,
  storeLive, time12, time24, wallOf, weekStart,
} from "./fields.ts";
import { WOMENS_BOUTIQUE as CFG } from "../storedemo/configs.ts";
import { storeWorld } from "../storedemo/engine.ts";
import type { Catalog, Product } from "../storedemo/types.ts";

const MIN = 60_000;
const DAY = 86_400_000;
const AMS = "Europe/Amsterdam";
const CHI = "America/Chicago";

/* ---------- the shop's clock ---------- */

test("wall clock helpers work in the shop's zone", () => {
  const t = fromWall(2026, 10, 13, 19, 0, CHI);
  assert.equal(new Date(t).toISOString(), "2026-10-14T00:00:00.000Z");
  assert.deepEqual(wallOf(t, CHI), { y: 2026, mo: 10, d: 13, h: 19, mi: 0, dow: 2 });
  assert.equal(dayStart(t, CHI), fromWall(2026, 10, 13, 0, 0, CHI));
  assert.equal(weekStart(t, CHI), fromWall(2026, 10, 12, 0, 0, CHI)); // Monday
  assert.equal(weekStart(fromWall(2026, 10, 11, 23, 0, AMS), AMS), fromWall(2026, 10, 5, 0, 0, AMS)); // a Sunday belongs to the week before
  // Friday + 2 working days = Tuesday, same time
  assert.equal(businessDaysAfter(fromWall(2026, 10, 9, 15, 30, AMS), 2, AMS), fromWall(2026, 10, 13, 15, 30, AMS));
  assert.equal(time12({ h: 19, mi: 0 }), "7 pm");
  assert.equal(time12({ h: 21, mi: 5 }), "9:05 pm");
  assert.equal(time12({ h: 0, mi: 30 }), "12:30 am");
  assert.equal(time24({ h: 9, mi: 5 }), "09:05");
});

/* ---------- Northvale ---------- */

const MODELS: [string, string][] = [
  ["DD1391-100", "Nike Dunk Low Retro White Black Panda"], ["FV5029-006", "Jordan 4 Retro Bred Reimagined"], ["B75806", "adidas Samba OG Cloud White Core Black"],
  ["CD4487-100", "Jordan 1 Retro High OG SP Travis Scott Mocha"], ["HQ6448", "adidas Yeezy Slide Onyx"], ["U9060GRY", "New Balance 9060 Rain Cloud Grey"],
  ["CT8012-116", "Jordan 11 Retro Cherry (2022)"], ["CW2288-111", "Nike Air Force 1 Low '07 White"],
];
const EU = ["38.5", "40", "41", "42", "42.5", "43", "44", "44.5", "45", "46", "47.5", "42 2/3"];
const CODES = MODELS.flatMap(([style, name]) => EU.map((eu) => ({ code: `${style}-${eu}`, name, style })));

test("Picqer codes split into style and EU size", () => {
  assert.deepEqual(splitCode("DD1391-100-42"), { style: "DD1391-100", eu: "42" });
  assert.deepEqual(splitCode("B75806-42 2/3"), { style: "B75806", eu: "42 2/3" });
  assert.deepEqual(splitCode("HQ4540-40.5"), { style: "HQ4540", eu: "40.5" });
  assert.deepEqual(splitCode("NOSIZE"), { style: "NOSIZE", eu: "" });
});

test("a pair's Northvale fields are the same every time, and plausible", () => {
  const seen = { box: new Set<string>(), source: new Set<string>() };
  for (const { code, name } of CODES) {
    const f = sneakerFields(code, name);
    assert.deepEqual(sneakerFields(code, name), f);
    assert.match(f.bin, /^[A-F]-(0[1-9]|1\d|2[0-4])-0[1-8]$/);
    assert.ok((BOX as readonly string[]).includes(f.box));
    assert.ok((SOURCES as readonly string[]).includes(f.source));
    // a consignor only on a consigned pair, and always on one
    assert.equal(f.consignor !== null, f.source === "Kiln Street consignment", code);
    if (f.consignor) assert.match(f.consignor, /^KS-\d{4}$/);
    assert.ok(Number.isInteger(f.cost) && f.cost > 30, `${code} cost ${f.cost}`);
    assert.equal(f.floor % 5, 0);
    assert.ok(f.floor >= f.cost + 15, `${code}: floor ${f.floor} over cost ${f.cost}`);
    seen.box.add(f.box);
    seen.source.add(f.source);
  }
  assert.equal(seen.box.size, BOX.length);
  assert.equal(seen.source.size, SOURCES.length);
});

test("a model's sizes share a zone and a rack; the price follows the model", () => {
  for (const [style, name] of MODELS) {
    const fs = EU.map((eu) => sneakerFields(`${style}-${eu}`, name));
    assert.equal(new Set(fs.map((f) => f.bin.slice(0, 4))).size, 1, style);
  }
  const avg = (name: string, style: string) => EU.reduce((s, eu) => s + sneakerFields(`${style}-${eu}`, name).floor, 0) / EU.length;
  assert.ok(avg("Jordan 1 Retro High OG SP Travis Scott Mocha", "CD4487-100") > 3 * avg("Nike Dunk Low Retro White Black Panda", "DD1391-100"));
  assert.ok(avg("adidas Yeezy Slide Onyx", "HQ6448") < avg("Jordan 4 Retro Bred Reimagined", "FV5029-006"));
});

/* ---------- Fernhollow ---------- */

const NOW = Date.parse("2026-10-13T20:00:00Z"); // Tuesday 15:00 in Chicago, a show day
function catalog(): Catalog {
  const products: Product[] = [];
  const cats = ["Tops", "Dresses", "Denim", "Sweaters", "Pants", "Accessories"];
  for (let i = 0; i < 90; i++) {
    products.push({
      id: `p${i}`,
      title: i % 11 === 0 ? `Ivory Lace Top ${i}` : i % 13 === 0 ? `Gold Hoop Earrings ${i}` : `Piece ${i}`,
      brand: ["Klesis", "Bailey Rose", "Fore Collection", "Fernhollow"][i % 4],
      category: cats[i % cats.length],
      price: 38 + (i % 7) * 9,
      image: null,
      publishedAt: new Date(NOW - (i < 60 ? i * 0.5 * DAY : 90 * DAY + i * DAY)).toISOString(),
      best: i >= 70 ? i - 70 : null,
      variants: ["S", "M", "L"].map((s) => ({ id: `p${i}${s}`, color: "Sage", size: s, available: i % 9 !== 4 })),
    });
  }
  return { products, at: new Date(NOW).toISOString() };
}

test("a piece's Fernhollow fields are the same every time and fit the piece", () => {
  const cat = catalog();
  for (const p of cat.products) {
    const f = boutiqueFields(p);
    assert.deepEqual(boutiqueFields(p), f);
    assert.ok(f.fit && f.fabric && f.grade);
    if (p.brand === "Fernhollow") assert.equal(f.faire, "Own label");
    else assert.match(f.faire, /^FP-\d{5}$/);
  }
  assert.match(boutiqueFields({ id: "a", title: "Ivory Lace Top", category: "Tops", brand: "Klesis" }).fabric, /lace/);
  assert.match(boutiqueFields({ id: "a", title: "Ivory Lace Top", category: "Tops", brand: "Klesis" }).grade, /any mark/);
  assert.match(boutiqueFields({ id: "b", title: "Wide Leg Jeans", category: "Denim", brand: "Klesis" }).fabric, /cotton/);
  assert.equal(boutiqueFields({ id: "c", title: "Gold Hoop Earrings", category: "Accessories", brand: "Klesis" }).fit, "One size");
  assert.match(boutiqueFields({ id: "c", title: "Gold Hoop Earrings", category: "Accessories", brand: "Klesis" }).grade, /Final sale/);
  // one brand's pieces published the same week came in on one Faire PO
  const a = boutiqueFields({ id: "x1", title: "A", category: "Tops", brand: "Klesis", publishedAt: "2026-10-05T15:00:00Z" });
  const b = boutiqueFields({ id: "x2", title: "B", category: "Dresses", brand: "Klesis", publishedAt: "2026-10-06T10:00:00Z" });
  assert.equal(a.faire, b.faire);
});

test("the LIVE follows the store engine's show evenings and its hold", () => {
  const w = storeWorld(CFG, catalog());
  const live = CFG.channels.find((c) => c.rhythm === "live")!;
  const at = (h: number, m = 0) => fromWall(2026, 10, 13, h, m, CHI); // Tuesday
  assert.equal(nextLive(at(15), CHI, live.showDays)?.phase, "today");
  assert.equal(nextLive(at(17, 30), CHI, live.showDays)?.phase, "hold");
  assert.equal(nextLive(at(19, 30), CHI, live.showDays)?.phase, "live");
  const after = nextLive(at(21, 30), CHI, live.showDays)!;
  assert.equal(after.phase, "next");
  assert.equal(after.day, "Thu");
  assert.equal(after.time, "7 pm");
  assert.equal(after.holdTime, "5 pm");
  // "live" exactly when the engine says a show is on (the header's LIVE badge)
  for (let t = at(0); t < at(0) + 7 * DAY; t += 10 * MIN) {
    assert.equal(nextLive(t, CHI, live.showDays)?.phase === "live", w.liveNow(t) !== null, new Date(t).toISOString());
  }
});

test("the lineup: the same for the tile and the drawer, in stock, listed on the live channel, lot by lot", () => {
  const w = storeWorld(CFG, catalog());
  const rows = w.productRows({ now: NOW, per: 1e5 }).rows;
  const a = storeLive(rows, CFG.channels, CFG.tz, NOW)!;
  const b = storeLive(w.productRows({ now: NOW + 15_000, per: 1e5 }).rows, CFG.channels, CFG.tz, NOW + 15_000)!;
  assert.deepEqual(a.lineup.map((p) => p.id), b.lineup.map((p) => p.id));
  assert.equal(a.channel.id, "tiktok");
  assert.deepEqual(a.holdFrom.map((c) => c.id), ["amazon", "walmart"]);
  assert.ok(a.lineup.length >= 6 && a.lineup.length <= 30, `${a.lineup.length} pieces`);
  for (const p of a.lineup) {
    assert.ok(!p.soldOut && p.listedOn.includes("tiktok"));
    assert.ok(Date.parse(p.publishedAt) <= a.show.start - DAY);
  }
  for (const p of a.held) assert.ok(a.lineup.includes(p) && p.listedOn.some((c) => c === "amazon" || c === "walmart"));
  assert.ok(a.held.length < a.lineup.length || a.lineup.every((p) => p.listedOn.includes("amazon") || p.listedOn.includes("walmart")));
  // another show, another lineup
  const thu = liveLineup(rows, "tiktok", { key: "2026-10-15", start: a.show.start + 2 * DAY }, [16, 38]);
  assert.notDeepEqual(thu.map((p) => p.id), a.lineup.map((p) => p.id));
  assert.equal(lotOf(6), "Lot 07");
});

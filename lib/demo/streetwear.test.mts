// node --test lib/demo/streetwear.test.mts
// The streetwear demo's client (Cinderlot, lib/demo/client-streetwear.ts) and its own tiles and fields
// (lib/demo/streetwear.ts): every rule in a group, on the systems it names and shipped by a build-log entry; the drop
// tile before, during and after a drop, counted from the engine's rows; the pre-owned tile; the product fields, the
// same every time and fitting the piece.
import { test } from "node:test";
import assert from "node:assert/strict";
import { CINDERLOT } from "./client-streetwear.ts";
import { FERNHOLLOW, NORTHVALE } from "./clients.ts";
import { RULE_GROUPS, groupOf, rulesUsing, shippedIn, touches } from "./rules.ts";
import { dropTile, dropTimes, oneOffTile, streetwearFields } from "./streetwear.ts";
import { STREETWEAR_SHOP as CFG } from "../storedemo/configs.ts";
import { catalogAt } from "../storedemo/catalog.ts";
import { DROP_MINUTE } from "../storedemo/catalog-streetwear.ts";
import { storeWorld } from "../storedemo/engine.ts";

const DAY = 86_400_000;
const HOUR = 3_600_000;
const TZ = CFG.tz;
const names = (code: string) => touches(CINDERLOT.rules.find((r) => r.code === code)!, CINDERLOT.systems).map((s) => s.name);

test("Cinderlot: its own business, team, build log and rules, apart from the other demo shops", () => {
  assert.notEqual(CINDERLOT.name, NORTHVALE.name);
  assert.notEqual(CINDERLOT.name, FERNHOLLOW.name);
  assert.notEqual(CINDERLOT.accent, NORTHVALE.accent);
  assert.notEqual(CINDERLOT.accent, FERNHOLLOW.accent);
  assert.equal(new Set(CINDERLOT.rules.map((r) => r.code)).size, CINDERLOT.rules.length);
  assert.equal(CINDERLOT.version, CINDERLOT.buildLog[CINDERLOT.buildLog.length - 1].version);
  assert.equal(CINDERLOT.since, `${CFG.since[0]}-${String(CFG.since[1]).padStart(2, "0")}-${String(CFG.since[2]).padStart(2, "0")}`);
  for (const e of CINDERLOT.buildLog) {
    assert.ok(e.date >= CINDERLOT.since && e.date <= "2026-10-24", e.version);
    assert.ok(CINDERLOT.team.some((m) => m.name === e.by), `${e.version}: ${e.by}`);
  }
  for (const s of CINDERLOT.systems) assert.ok(s.since >= CINDERLOT.since, s.slug);
  // the channels of the build are the config's
  const sells = CINDERLOT.systems.filter((s) => /store|shop|marketplace/i.test(s.kind)).map((s) => s.slug);
  assert.deepEqual(sells, CFG.channels.map((c) => c.logo));
});

test("every rule has a group, touches a system of its build, was shipped by a build-log entry and asked for by the team", () => {
  for (const r of CINDERLOT.rules) {
    assert.ok(RULE_GROUPS.includes(groupOf(r)), r.code);
    assert.ok(touches(r, CINDERLOT.systems).length > 0, `${r.code} touches nothing`);
    assert.ok(shippedIn(CINDERLOT, r), `${r.code}: no build-log entry on ${r.built}`);
    assert.ok(CINDERLOT.team.some((m) => m.name === r.by), `${r.code}: ${r.by}`);
    assert.ok(r.job === null || ["orders", "soldout", "listing", "labels", "tracking", "returns", "restock", "low"].includes(r.job), `${r.code}: job ${r.job}`);
  }
  assert.equal(groupOf(CINDERLOT.rules.find((r) => r.code === "C-02")!), "Stock");
  assert.equal(groupOf(CINDERLOT.rules.find((r) => r.code === "C-04")!), "Listings & photos");
  assert.equal(groupOf(CINDERLOT.rules.find((r) => r.code === "C-05")!), "Orders");
  assert.equal(groupOf(CINDERLOT.rules.find((r) => r.code === "C-10")!), "Reports");
  // pre-owned pieces are never on TikTok Shop: the one-off rule touches the resale apps and the web store only
  assert.deepEqual(names("C-03"), ["Shopify", "eBay", "Grailed", "Depop"]);
  assert.deepEqual(names("C-07"), ["TikTok Shop", "eBay", "Grailed", "Depop"]);
  assert.ok(names("C-02").includes("Discord"));
  assert.deepEqual(rulesUsing(CINDERLOT, "loop").map((r) => r.code), ["C-08"]);
});

test("the drop's instants: the last one that opened and the next, Thursdays 11:00 in Los Angeles", () => {
  const thu = Date.parse("2026-10-22T18:00:00Z"); // Thu 11:00 PDT
  const sat = Date.parse("2026-10-24T18:00:00Z");
  assert.deepEqual(dropTimes(sat, TZ, [4], DROP_MINUTE), { last: thu, next: thu + 7 * DAY });
  assert.deepEqual(dropTimes(thu - 60_000, TZ, [4], DROP_MINUTE), { last: thu - 7 * DAY, next: thu });
  assert.deepEqual(dropTimes(thu, TZ, [4], DROP_MINUTE), { last: thu, next: thu + 7 * DAY });
});

test("the drop tile: counting down before it opens, units sold while it is live, how much sold out after", () => {
  const thu = Date.parse("2026-10-22T18:00:00Z");
  const tile = (t: number) => {
    const w = storeWorld(CFG, catalogAt(CFG, t));
    return dropTile(w.productRows({ now: t, per: 100_000 }).rows, t, TZ, CFG.catalog.dropDays, DROP_MINUTE, w.orders({ now: t, per: 100_000 }).rows);
  };
  const before = tile(thu - 2 * HOUR);
  assert.equal(before.phase, "soon");
  assert.equal(before.time, "11 am");
  assert.equal(before.next, thu);
  const live = tile(thu + 90 * 60_000);
  assert.equal(live.phase, "live");
  assert.ok(live.pieces >= CFG.catalog.perDrop[0], `${live.pieces} pieces`);
  assert.ok(live.sold >= 25 && live.orders >= 20 && live.orders <= live.sold, `${live.sold} sold in ${live.orders} orders`);
  assert.ok(live.first && live.first.mins < 60, `first sell-out ${live.first?.mins} min in`);
  const after = tile(thu + 2 * DAY);
  assert.equal(after.phase, "after");
  assert.equal(after.lastDay, "Thu 22 Oct");
  assert.equal(after.nextDay, "Thu 29 Oct");
  assert.ok(after.gone >= live.gone && after.sizes === live.sizes, `${live.gone} → ${after.gone} of ${after.sizes}`);
  assert.equal(after.pct, Math.round((after.gone / after.sizes) * 100));
});

test("the pre-owned tile: up for sale now, sold this week, the newest sale and where it was pulled", () => {
  const now = Date.parse("2026-10-24T18:00:00Z");
  const w = storeWorld(CFG, catalogAt(CFG, now));
  const rows = w.productRows({ now, per: 100_000 }).rows;
  const t = oneOffTile(rows, w.happenings(now, 30), now);
  assert.equal(t.up, rows.filter((r) => r.category === "Pre-owned" && !r.soldOut).length);
  assert.ok(t.up > 0);
  assert.ok(t.latest, "no pre-owned sale in 30 days");
  assert.match(t.latest!.title, /^(FW|SS)\d\d /);
  assert.ok(["shopify", "ebay", "grailed", "depop"].includes(t.latest!.channel), t.latest!.channel);
  assert.doesNotMatch(t.latest!.pulledFrom, /TikTok/);
  assert.equal(oneOffTile(rows, [], now).latest, null);
});

test("the Cinderlot fields of a product: the same every time, fitting the piece", () => {
  const now = Date.parse("2026-10-24T18:00:00Z");
  const cat = catalogAt(CFG, now);
  for (const p of cat.products) {
    const f = streetwearFields(p, TZ);
    assert.deepEqual(streetwearFields(p, TZ), f);
    if (p.category === "Pre-owned") {
      assert.equal(f.kind, "pre-owned");
      if (f.kind !== "pre-owned") continue;
      assert.match(f.season, /^(Fall\/Winter|Spring\/Summer) 20\d\d$/);
      assert.match(f.source, /^Consignor CN-\d{4}$|^Shop archive, own stock$/);
      assert.equal(f.payout === null, f.source.startsWith("Shop archive"));
    } else {
      assert.equal(f.kind, "drop");
      if (f.kind !== "drop") continue;
      assert.match(f.drop, /^Thu \d{1,2} [A-Z][a-z]{2} · 11 am$/, f.drop);
      assert.match(f.source, p.brand === "Cinderlot" ? /^Run PR-\d{4}$/ : /^Wholesale order WO-\d{5}$/);
      if (p.brand !== "Cinderlot") assert.match(f.reprint, new RegExp(p.brand));
      if (p.best !== null && p.brand === "Cinderlot") assert.match(f.reprint, /^Core piece/);
    }
  }
  const tee = streetwearFields({ id: "x", title: "Night Shift Heavyweight Tee", category: "Tees", brand: "Cinderlot", publishedAt: "2026-10-22T18:00:00Z", best: null }, TZ);
  assert.equal(tee.kind === "drop" && tee.blank, "6.5 oz heavyweight cotton jersey, boxy fit");
  const hoodie = streetwearFields({ id: "y", title: "Rooftop Puff Print Hoodie", category: "Hoodies", brand: "Cinderlot", publishedAt: "2026-10-22T18:00:00Z", best: 2 }, TZ);
  assert.ok(hoodie.kind === "drop" && hoodie.print === "Puff print, front" && /^Core piece/.test(hoodie.reprint));
  // pieces of one drop came in on one print-shop run
  const a = streetwearFields({ id: "a", title: "A Tee", category: "Tees", brand: "Cinderlot", publishedAt: "2026-10-22T18:00:00Z", best: null }, TZ);
  const b = streetwearFields({ id: "b", title: "B Hoodie", category: "Hoodies", brand: "Cinderlot", publishedAt: "2026-10-22T18:00:00Z", best: null }, TZ);
  assert.equal(a.kind === "drop" && a.source, b.kind === "drop" && b.source);
});

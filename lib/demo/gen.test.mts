// node --test lib/demo/gen.test.mts
// The demo's answers (lib/demo/gen.ts): every path the page reads answered locally in the shape the views expect, as
// of one 30-second moment, never stale, paging and filters as the page sends them, and "not found" as a rejection.
import { test } from "node:test";
import assert from "node:assert/strict";
import { CHANNELS } from "./channels.ts";
import { STEP_MS, demoAnswer, demoGet, listQuery, momentOf, type Live } from "./gen.ts";
import { STORES, type Linked, type Listing, type Overview, type Page, type Product, type Sale } from "./shape.ts";

const NOW = Date.parse("2026-10-11T14:23:17Z");
const ask = <T>(path: string, now = NOW) => {
  const [view, q = ""] = path.split("?");
  return demoAnswer(view, new URLSearchParams(q), now) as Live<T> | null;
};

test("every view answers in the page's shape, as of the same moment, never stale", () => {
  const at = new Date(momentOf(NOW)).toISOString();
  const o = ask<Overview>("overview")!;
  assert.deepEqual(Object.keys(o), ["data", "at", "stale"]);
  assert.equal(o.at, at);
  assert.equal(o.stale, false);
  assert.equal(o.data.at, at);
  assert.ok(o.data.feed.every((s) => Date.parse(s.syncedAt!) <= Date.parse(at)), "nothing newer than the answer");
  for (const v of ["sales", "listings", "linked"]) {
    const a = ask<Page<unknown>>(`${v}?page=1`)!;
    assert.equal(a.at, at);
    assert.equal(a.stale, false);
    assert.deepEqual(Object.keys(a.data), ["rows", "total", "page", "pages"]);
    assert.equal(a.data.rows.length, 20);
  }
  // within one step every answer is the same; the next step moves on
  assert.deepEqual(ask("overview", momentOf(NOW) + 1), ask("overview", momentOf(NOW) + STEP_MS - 1));
  assert.notEqual(ask<Overview>("overview", NOW + STEP_MS)!.at, o.at);
});

test("lists: channel and account filters, search, pages up to 25", () => {
  for (const c of CHANNELS) {
    const s = ask<Page<Sale>>(`sales?platform=${c.id}&page=2`)!.data;
    assert.equal(s.page, 2);
    assert.ok(s.rows.every((r) => r.platform === c.id));
    const l = ask<Page<Listing>>(`listings?platform=${c.id}`)!.data;
    assert.ok(l.rows.length > 0 && l.rows.every((r) => r.platform === c.id));
  }
  const p1 = ask<Page<Sale>>("sales?page=1")!.data;
  const p2 = ask<Page<Sale>>("sales?page=2")!.data;
  assert.equal(p1.total, p2.total);
  assert.ok(p1.rows[19].soldAt! >= p2.rows[0].soldAt!, "page 2 continues page 1");
  assert.equal(ask<Page<Sale>>("sales?platform=nowhere")!.data.total, p1.total, "an unknown channel lists every channel");
  const us = ask<Page<Sale>>("sales?store=sx-us")!.data;
  assert.ok(us.rows.every((r) => r.store === "sx-us"));
  assert.ok(ask<Page<Sale>>("sales?q=samba")!.data.rows.every((r) => /samba/i.test(r.product)));
  assert.equal(ask<Page<Sale>>("sales?q=(((")!.data.total, p1.total, "a term with nothing left searches nothing");
  assert.equal(ask<Page<Sale>>("sales?page=400")!.data.page, 25);
  assert.equal(ask<Page<Sale>>("sales?page=-3")!.data.page, 1);
  assert.deepEqual(listQuery(new URLSearchParams("store=al-usa&platform=stockx&q=dunk%20low!&page=3")), { platform: "alias", store: "al-usa", q: "dunk low", page: 3 });
});

test("linked products: the first account by default, each account on its own", () => {
  const first = ask<Page<Linked>>("linked")!.data;
  assert.deepEqual(first, ask<Page<Linked>>(`linked?store=${STORES[0].id}`)!.data);
  for (const s of STORES) {
    const r = ask<Page<Linked>>(`linked?store=${s.id}&page=3`)!.data;
    assert.equal(r.page, 3);
    assert.ok(r.rows.every((x) => x.links.some((l) => l.store === s.id)));
  }
});

test("products open by their row key only; anything else is not found", () => {
  const o = ask<Overview>("overview")!.data;
  const rows = [...o.feed.filter((s) => s.detail), ...ask<Page<Linked>>("linked?store=wn-main")!.data.rows, ...ask<Page<Listing>>("listings")!.data.rows];
  for (const r of rows) {
    const p = ask<Product>(`product?id=${r.id}`);
    assert.ok(p && p.data.code && p.stale === false, `no product for ${r.id}`);
  }
  for (const id of ["", "x", "ABC", "../../etc", "a".repeat(11), "zzzzzz"]) assert.equal(ask(`product?id=${encodeURIComponent(id)}`), null);
  assert.equal(ask("nothing"), null);
  assert.equal(ask("product"), null);
});

test("demoGet: the page's paths answered locally, a missing one rejected", async () => {
  const a = await demoGet<Live<Overview>>("/api/demo/overview", NOW);
  assert.deepEqual(a, ask("overview"));
  const s = await demoGet<Live<Page<Sale>>>("/api/demo/sales?platform=whatnot&q=jordan&page=1", NOW);
  assert.deepEqual(s, ask("sales?platform=whatnot&q=jordan&page=1"));
  await assert.rejects(demoGet("/api/demo/product?id=zzzzzz", NOW));
  await assert.rejects(demoGet("/api/demo/unknown", NOW));
  // without a moment it answers as of now
  const live = await demoGet<Live<Overview>>("/api/demo/overview");
  assert.ok(Math.abs(Date.parse(live.at) - Date.now()) <= STEP_MS);
});

test("answers are plain JSON (what the API route sends is what the page gets)", () => {
  for (const p of ["overview", "sales?page=3", "listings?platform=alias", "linked?store=sh-main&page=2"]) {
    const a = ask(p);
    assert.deepEqual(JSON.parse(JSON.stringify(a)), a, p);
  }
});

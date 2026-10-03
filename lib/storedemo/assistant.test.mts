// node --test lib/storedemo/assistant.test.mts
// A store demo's assistant (lib/storedemo/assistant.ts): the chips and plain requests pick the shop's routines, scripts
// and checks name the shop's own channels and time zone, routines run in that zone, and the sneaker assistant is
// unchanged by the shared engine.
import { test } from "node:test";
import assert from "node:assert/strict";
import { SNEAKER, answer, nextRun, parse, scriptOf, verifyOf } from "../demo/schedule.ts";
import { WOMENS_BOUTIQUE as CFG } from "./configs.ts";
import { storeAssistant } from "./assistant.ts";

const P = storeAssistant(CFG);
const NOW = Date.parse("2026-10-04T15:00:00Z"); // Sunday 10:00 in Chicago

test("every start chip becomes a scheduled routine of the shop", () => {
  for (const c of P.startChips) {
    const a = answer(c.text, null, NOW, P);
    assert.ok(a.ok, c.text);
    if (a.ok) assert.ok(P.kinds[a.kind], a.kind);
  }
});

test("plain requests pick the right routine; unclear ones ask what or when", () => {
  assert.equal(parse("send me the sizes running low every morning", P).kind, "reorder-list");
  assert.equal(parse("tiktok live lineup at 6:30pm", P).kind, "live-lineup");
  assert.equal(parse("post sales to slack daily at 18:00", P).kind, "daily-summary");
  assert.equal(parse("list new arrivals everywhere every 15 minutes", P).kind, "new-arrivals");
  assert.equal(parse("returns report on mondays", P).kind, "returns-report");
  assert.equal(parse("pick list every weekday at 8", P).kind, "pickup");
  assert.equal(parse("brand sheet every day", P).kind, "custom");
  const what = answer("every 2 hours", null, NOW, P);
  assert.equal(what.ok, false);
  const when = answer("low stock list", null, NOW, P);
  assert.equal(when.ok, false);
  if (!when.ok) assert.equal(when.kind, "reorder-list");
});

test("scripts and checks use the shop's channels and time zone", () => {
  const a = answer("New arrivals to every channel every 15 minutes", null, NOW, P);
  assert.ok(a.ok);
  if (!a.ok) return;
  const s = scriptOf(a.schedule, P);
  assert.match(s.code, /tz: "America\/Chicago"/);
  for (const c of CFG.channels.slice(1)) assert.match(s.code, new RegExp(c.id.replace(/[^a-z]/g, "")));
  assert.doesNotMatch(s.code, /picqer|stockx|alias/i);
  const checks = verifyOf(a.schedule, NOW, P);
  assert.match(checks[1].detail, /TikTok Shop/);
  const sale = answer("pick list after every sale", null, NOW, P);
  assert.ok(sale.ok);
  if (sale.ok) assert.match(verifyOf(sale.schedule, NOW, P)[3].detail, /Shopify, TikTok Shop/);
});

test("a daily routine runs at its hour in the shop's zone, not Amsterdam's", () => {
  const next = nextRun({ freq: { type: "daily", at: { h: 7, m: 0 } }, anchor: 0 }, NOW, P.tz)!;
  assert.equal(new Date(next).toISOString(), "2026-10-05T12:00:00.000Z"); // 07:00 CDT
  assert.equal(new Date(nextRun({ freq: { type: "daily", at: { h: 7, m: 0 } }, anchor: 0 }, NOW)!).toISOString(), "2026-10-05T05:00:00.000Z"); // the sneaker store's 07:00 in Amsterdam
});

test("the sneaker assistant keeps its own routines and words", () => {
  assert.equal(parse("Hide sold-out sizes on Shopify every 15 minutes").kind, "shopify-stock");
  assert.equal(SNEAKER.tz, "Europe/Amsterdam");
  assert.ok(P.seeded.every((s) => P.kinds[s.kind]));
});

// node --test lib/demo/rules.test.mts
// The Custom rules and Systems pages' reading of the demo clients: every rule in a group and on at least one system of
// the build, the systems a rule touches, the build-log entry that shipped it, run histories and dates.
import { test } from "node:test";
import assert from "node:assert/strict";
import { FERNHOLLOW, NORTHVALE } from "./clients.ts";
import { RULE_GROUPS, dayDate, everyMinutes, groupOf, monthDate, recentRuns, rulesUsing, shippedIn, touches } from "./rules.ts";

const CLIENTS = [NORTHVALE, FERNHOLLOW];
const names = (c: typeof NORTHVALE, code: string) => touches(c.rules.find((r) => r.code === code)!, c.systems).map((s) => s.name);

test("every rule has a group, touches a system of its build and was shipped by a build-log entry", () => {
  for (const c of CLIENTS) {
    for (const r of c.rules) {
      assert.ok(RULE_GROUPS.includes(groupOf(r)), r.code);
      assert.ok(touches(r, c.systems).length > 0, `${r.code} touches nothing`);
      assert.ok(shippedIn(c, r), `${r.code}: no build-log entry on ${r.built}`);
      assert.ok(c.team.some((m) => m.name === r.by), `${r.code}: ${r.by} is not on the team`);
    }
  }
});

test("rules land in the group a reader expects", () => {
  const group = (c: typeof NORTHVALE, code: string) => groupOf(c.rules.find((r) => r.code === code)!);
  assert.equal(group(NORTHVALE, "R-01"), "Orders"); // "StockX" is not the word "stock"
  assert.equal(group(NORTHVALE, "R-07"), "Stock");
  assert.equal(group(NORTHVALE, "R-11"), "Listings & photos");
  assert.equal(group(NORTHVALE, "R-14"), "Reports");
  assert.equal(group(FERNHOLLOW, "F-04"), "Orders");
  assert.equal(group(FERNHOLLOW, "F-06"), "Stock");
  assert.equal(group(FERNHOLLOW, "F-03"), "Listings & photos");
  assert.equal(group(FERNHOLLOW, "F-09"), "Reports");
});

test("a rule touches the systems it names, every sales channel for 'every channel', the chat and the sheet", () => {
  assert.deepEqual(names(NORTHVALE, "R-07"), ["StockX", "Alias"]);
  assert.deepEqual(names(NORTHVALE, "R-05"), ["Picqer", "StockX", "Alias", "Shopify", "Whatnot", "Discord"]);
  assert.ok(names(NORTHVALE, "R-14").includes("Google Sheets"));
  // the LIVE hold is TikTok against Amazon and Walmart only, not every channel
  assert.deepEqual(names(FERNHOLLOW, "F-06"), ["TikTok Shop", "Amazon", "Walmart"]);
  assert.deepEqual(names(FERNHOLLOW, "F-01"), ["Shopify", "TikTok Shop", "Amazon", "Walmart", "Poshmark"]);
  assert.ok(names(FERNHOLLOW, "F-07").includes("Loop Returns")); // "checked in Loop"
  assert.deepEqual(rulesUsing(NORTHVALE, "whatnot").map((r) => r.code), ["R-04", "R-05"]);
});

test("cadence and run history", () => {
  assert.equal(everyMinutes("every 7 min"), 7);
  assert.equal(everyMinutes("every 8 hours"), 480);
  assert.equal(everyMinutes("every hour"), 60);
  assert.equal(everyMinutes("daily at 7:00"), 1440);
  assert.equal(everyMinutes("real time · webhook"), null);
  const last = "2026-10-11T10:00:00.000Z";
  const runs = recentRuns("R-07", last, "every 7 min");
  assert.equal(runs.length, 5);
  assert.equal(runs[0].at, last);
  assert.equal(Date.parse(runs[0].at) - Date.parse(runs[1].at), 7 * 60_000);
  assert.deepEqual(recentRuns("R-07", last, "every 7 min"), runs, "the same history on every render");
  for (const r of recentRuns("R-03", last, "real time · webhook")) assert.ok(r.secs >= 0.4 && r.secs <= 2.6);
  const ev = recentRuns("R-03", last, "real time · webhook");
  for (let i = 1; i < ev.length; i++) {
    const gap = (Date.parse(ev[i - 1].at) - Date.parse(ev[i].at)) / 60_000;
    assert.ok(gap >= 4 && gap <= 22, `gap ${gap}`);
  }
});

test("dates read from the ISO text, the same in every time zone", () => {
  assert.equal(dayDate("2026-03-23"), "23 Mar 2026");
  assert.equal(monthDate("2026-01-05"), "Jan 2026");
});

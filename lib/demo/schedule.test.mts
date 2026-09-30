// node --test lib/demo/schedule.test.mts
// The sheet assistant's parser and the scheduler's run times (Europe/Amsterdam, weekdays, weekly, every N, per sale).
import { test } from "node:test";
import assert from "node:assert/strict";
import { SEEDED, START_CHIPS, answer, describe, freqKey, fromWall, inText, nextRun, parse, prevRun, runLabel, timeOf, type Freq, type Schedule } from "./schedule.ts";
import { flexUpdatedAt, liveUpdatedAt } from "./sheets.ts";

const ams = (y: number, mo: number, d: number, h: number, mi = 0) => fromWall(y, mo, d, h, mi);
// Thursday 1 October 2026, 13:47 in Amsterdam (UTC+2)
const THU = ams(2026, 10, 1, 13, 47);
const sched = (freq: Freq, anchor = 0): Pick<Schedule, "freq" | "anchor"> => ({ freq, anchor });

test("Amsterdam wall clock: summer and winter time", () => {
  assert.equal(new Date(ams(2026, 10, 1, 13, 47)).toISOString(), "2026-10-01T11:47:00.000Z");
  assert.equal(new Date(ams(2026, 12, 5, 9, 5)).toISOString(), "2026-12-05T08:05:00.000Z");
  assert.equal(new Date(ams(2026, 10, 26, 8)).toISOString(), "2026-10-26T07:00:00.000Z"); // the Monday after the clocks go back
  assert.equal(runLabel(ams(2026, 10, 2, 8)), "Fri 2 Oct, 08:00");
  assert.equal(runLabel(ams(2026, 9, 30, 22, 31)), "Wed 30 Sep, 22:31");
  assert.equal(runLabel(ams(2027, 1, 1, 0, 5)), "Fri 1 Jan, 00:05");
});

test("the chips parse to what they say", () => {
  const got = START_CHIPS.map((c) => {
    const p = parse(c.text);
    return [p.kind, p.freq && describe(p.freq)];
  });
  assert.deepEqual(got, [
    ["pickup", "every weekday at 08:00"],
    ["location", "after every sale"],
    ["supplier", "every Monday at 09:00"],
    ["consignment", "every 6 hours"],
  ]);
});

test("sheet kinds", () => {
  const kind = (s: string) => parse(s).kind;
  assert.equal(kind("pick-up list for the warehouse"), "pickup");
  assert.equal(kind("orders to pick with their bins"), "pickup");
  assert.equal(kind("where each size sits"), "location");
  assert.equal(kind("Bin sheet"), "location");
  assert.equal(kind("inventory for our wholesale partner"), "supplier");
  assert.equal(kind("Supplier sheet with bin locations"), "supplier", "the word before 'sheet' decides");
  assert.equal(kind("Location sheet for the supplier"), "location");
  assert.equal(kind("what is not on Flex"), "consignment");
  assert.equal(kind("stock not consigned yet"), "consignment");
  const custom = parse("Returns report every Friday at 17:00");
  assert.deepEqual([custom.kind, custom.name], ["custom", "Returns report"]);
  assert.equal(kind("make me a sheet"), null);
  assert.equal(kind("hello"), null);
});

test("frequencies and times", () => {
  const f = (s: string) => {
    const p = parse(s).freq;
    return p && describe(p);
  };
  assert.equal(f("every weekday at 8:00"), "every weekday at 08:00");
  assert.equal(f("Monday to Friday at 7.30"), "every weekday at 07:30");
  assert.equal(f("working days at 6pm"), "every weekday at 18:00");
  assert.equal(f("every Tuesday at 9am"), "every Tuesday at 09:00");
  assert.equal(f("on Sundays at noon"), "every Sunday at 12:00");
  assert.equal(f("weekly"), "every Monday at 08:00");
  assert.equal(f("daily at 7"), "every day at 07:00");
  assert.equal(f("every evening"), "every day at 18:00");
  assert.equal(f("at 6:15"), "every day at 06:15");
  assert.equal(f("every 30 min"), "every 30 minutes");
  assert.equal(f("every 90 minutes"), "every 90 minutes");
  assert.equal(f("every 120 minutes"), "every 2 hours");
  assert.equal(f("every half hour"), "every 30 minutes");
  assert.equal(f("each two hours"), "every 2 hours");
  assert.equal(f("every 6h"), "every 6 hours");
  assert.equal(f("hourly"), "every hour");
  assert.equal(f("every hour"), "every hour");
  assert.equal(f("after every sale"), "after every sale");
  assert.equal(f("whenever a pair sells"), "after every sale");
  assert.equal(f("on each order"), "after every sale");
  assert.equal(f("every month"), null);
  assert.equal(f("soon"), null);
  const tooShort = parse("pickup sheet every 2 minutes");
  assert.equal(tooShort.freq && describe(tooShort.freq), "every 5 minutes");
  assert.match(tooShort.note!, /shortest/);
  assert.deepEqual(timeOf("12am"), { h: 0, m: 0 });
  assert.deepEqual(timeOf("12:30 pm"), { h: 12, m: 30 });
  assert.equal(timeOf("25:00"), null);
  assert.equal(timeOf("size 10.5"), null);
});

test("share with", () => {
  const s = (t: string) => parse(t).share;
  assert.equal(s("Pickup sheet every weekday at 8:00, share with the warehouse"), "the warehouse");
  assert.equal(s("share it with Harbourline Wholesale every Monday"), "Harbourline Wholesale");
  assert.equal(s("Share a pickup sheet with Anna at 8"), "Anna");
  assert.equal(s("send it to Tom daily"), "Tom");
  assert.equal(s("share the orders to pick with Anna"), "Anna");
  assert.equal(s("Pickup sheet with bin locations every day"), null);
  assert.ok(s(`share with ${"x".repeat(80)}`)!.length <= 40);
});

test("next run: weekdays skip the weekend", () => {
  const f: Freq = { type: "weekdays", at: { h: 8, m: 0 } };
  assert.equal(nextRun(sched(f), THU), ams(2026, 10, 2, 8)); // Fri
  assert.equal(nextRun(sched(f), ams(2026, 10, 1, 7, 59)), ams(2026, 10, 1, 8)); // later today
  assert.equal(nextRun(sched(f), ams(2026, 10, 2, 9)), ams(2026, 10, 5, 8)); // Fri after 8 → Mon
  assert.equal(nextRun(sched(f), ams(2026, 10, 3, 12)), ams(2026, 10, 5, 8)); // Sat → Mon
  assert.equal(nextRun(sched(f), ams(2026, 10, 2, 8)), ams(2026, 10, 5, 8)); // exactly at the run → the next one
  assert.equal(prevRun(sched(f), THU), ams(2026, 10, 1, 8));
  assert.equal(prevRun(sched(f), ams(2026, 10, 5, 7)), ams(2026, 10, 2, 8)); // Mon before 8 → last Fri
});

test("next run: weekly, daily, across the clock change", () => {
  const mon: Freq = { type: "weekly", day: 1, at: { h: 9, m: 0 } };
  assert.equal(nextRun(sched(mon), THU), ams(2026, 10, 5, 9));
  assert.equal(nextRun(sched(mon), ams(2026, 10, 5, 8, 59)), ams(2026, 10, 5, 9));
  assert.equal(nextRun(sched(mon), ams(2026, 10, 5, 9)), ams(2026, 10, 12, 9));
  assert.equal(prevRun(sched(mon), THU), ams(2026, 9, 28, 9));
  const thu: Freq = { type: "weekly", day: 4, at: { h: 18, m: 0 } };
  assert.equal(nextRun(sched(thu), THU), ams(2026, 10, 1, 18)); // later today
  assert.equal(nextRun(sched(thu), ams(2026, 10, 1, 18)), ams(2026, 10, 8, 18));
  const daily: Freq = { type: "daily", at: { h: 8, m: 0 } };
  assert.equal(nextRun(sched(daily), THU), ams(2026, 10, 2, 8));
  // clocks go back on Sun 25 Oct 2026: 08:00 stays 08:00 local
  assert.equal(new Date(nextRun(sched(daily), ams(2026, 10, 25, 9))!).toISOString(), "2026-10-26T07:00:00.000Z");
});

test("next run: every N minutes or hours from the start, and after every sale", () => {
  const start = THU;
  const h6: Freq = { type: "hours", n: 6 };
  assert.equal(nextRun(sched(h6, start), start), start + 6 * 3_600_000);
  assert.equal(nextRun(sched(h6, start), start + 7 * 3_600_000), start + 12 * 3_600_000);
  assert.equal(nextRun(sched(h6, start), start - 10_000), start + 6 * 3_600_000, "a clock a little behind still gives the first run");
  assert.equal(prevRun(sched(h6, start), start + 7 * 3_600_000), start + 6 * 3_600_000);
  assert.equal(prevRun(sched(h6, start), start - 1), null);
  const m30: Freq = { type: "minutes", n: 30 };
  assert.equal(nextRun(sched(m30, start), start + 29 * 60_000), start + 30 * 60_000);
  assert.equal(nextRun(sched({ type: "sale" }), THU), null);
  const sale = prevRun(sched({ type: "sale" }, 41_000), THU)!;
  assert.ok(sale <= THU && THU - sale < 5 * 60_000);
});

test("the seeded schedules match the sheets", () => {
  const live = SEEDED.find((s) => s.id === "live")!;
  const flex = SEEDED.find((s) => s.id === "flex")!;
  for (const now of [THU, THU + 17 * 60_000, THU + 3 * 3_600_000]) {
    assert.equal(prevRun(live, now), liveUpdatedAt(now));
    assert.equal(prevRun(flex, now), flexUpdatedAt(now));
    assert.equal(nextRun(live, now)! - prevRun(live, now)!, 30 * 60_000);
  }
  assert.deepEqual(SEEDED.map((s) => describe(s.freq)), ["every 30 minutes", "every 2 hours", "every weekday at 08:00", "after every sale"]);
  for (const s of SEEDED) assert.ok(prevRun(s, THU)! <= THU);
});

test("answers: done, or one question with chips, and the answer to it", () => {
  const done = answer("Pickup sheet every weekday at 8:00, share with the warehouse", null, THU);
  assert.ok(done.ok);
  assert.equal(done.text.split(" It lists")[0], "Done. Pickup sheet — every weekday at 08:00, shared with the warehouse. Next run: Fri 2 Oct, 08:00.");
  assert.equal(done.schedule.anchor, THU);
  assert.equal(freqKey(done.schedule.freq), "weekdays");

  const sale = answer("Location sheet after every sale", null, THU);
  assert.ok(sale.ok);
  assert.match(sale.text, /^Done\. Location sheet — after every sale\. Next run: with the next sale\./);

  const when = answer("a consignment check please", null, THU);
  assert.ok(!when.ok);
  assert.equal(when.kind, "consignment");
  assert.match(when.text, /^When should the consignment check run\?/);
  assert.ok(when.chips.length >= 3);
  const then = answer(when.chips.find((c) => c.id === "when-2h")!.text, when.pending, THU);
  assert.ok(then.ok);
  assert.equal(then.kind, "consignment");
  assert.equal(freqKey(then.schedule.freq), "2h");

  const what = answer("every Monday at 9:00, share with Harbourline", null, THU);
  assert.ok(!what.ok);
  assert.match(what.text, /every Monday at 09:00/);
  const then2 = answer("Supplier stock sheet", what.pending, THU);
  assert.ok(then2.ok);
  assert.equal(then2.schedule.share, "Harbourline");
  assert.equal(freqKey(then2.schedule.freq), "weekly-mon");

  const lost = answer("hello", null, THU);
  assert.ok(!lost.ok);
  assert.equal(lost.kind, null);
});

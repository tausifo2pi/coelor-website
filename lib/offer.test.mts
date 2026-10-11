// node --test lib/offer.test.mts
// The offer (lib/offer.ts): $500 per connection, one-time, 3 for the price of 2, live in about a day once we have
// access, and the free trial "your first link" (two platforms, 7 days, no card); and the copy in data/pricing.json and
// data/site-content.json says the same (no old "from $1,200", "set up in 1 day" or "1 connection" trial left; every
// dollar amount is a real price of the offer, or one of the few non-offer figures the rebuild brief states on purpose).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  HOSTING,
  OFFER,
  OFFER_EXAMPLES,
  OFFER_LINES,
  PREFILL,
  TRIAL,
  TRIAL_KEPT,
  TRIAL_WHAT,
  breakdown,
  perMonth,
  priceRange,
  quote,
  usd,
  withPlan,
} from "./offer.ts";

const read = (f: string) => JSON.parse(readFileSync(new URL(`../${f}`, import.meta.url), "utf8"));
/** The copy without its `_note` (the note may name old wording on purpose). */
const copyText = (f: string) => {
  const { _note, ...copy } = read(f);
  return JSON.stringify(copy);
};

test("quote: $500 each; from 3 connections on, one is free", () => {
  assert.deepEqual([1, 2, 3, 4, 5, 6].map(quote), [500, 1000, 1000, 1500, 2000, 2500]);
  assert.equal(quote(0), 0);
  assert.equal(quote(2.5), 0);
  assert.equal(usd(quote(3)), "$1,000");
  assert.deepEqual(OFFER_EXAMPLES, [
    { n: 2, price: "$1,000", free: false },
    { n: 3, price: "$1,000", free: true },
    { n: 4, price: "$1,500", free: true },
  ]);
  assert.deepEqual(OFFER_LINES, {
    price: "$500 per connection, one-time",
    free: "3 connections for the price of 2",
    setup: "Live in about a day once we have access",
    trial: "Try your first link free for 7 days",
  });
  assert.equal(priceRange([3, 4, 3]), "$1,000–1,500");
  assert.equal(priceRange([2]), "$1,000");
  assert.equal(usd(perMonth(quote(3))), "$42");
});

test("the trial: your first link, two platforms, 7 days, billed as normal if kept", () => {
  assert.deepEqual(TRIAL, { days: 7, connections: 2, label: "your first link" });
  assert.equal(TRIAL_WHAT, "two of your platforms connected, no card");
  assert.equal(TRIAL_KEPT, 1000);
  assert.equal(PREFILL.trial, "I'd like the 7-day free trial: my first link. The two platforms to connect: ");
});

test("breakdown: the quote's invoice lines", () => {
  assert.deepEqual(breakdown(1), { n: 1, gross: 500, discount: 0, total: 500, toFree: 2 });
  assert.deepEqual(breakdown(2), { n: 2, gross: 1000, discount: 0, total: 1000, toFree: 1 });
  assert.deepEqual(breakdown(3), { n: 3, gross: 1500, discount: 500, total: 1000, toFree: 0 });
  assert.deepEqual(breakdown(5), { n: 5, gross: 2500, discount: 500, total: 2000, toFree: 0 });
  assert.equal(PREFILL.quote(3), "I'd like a quote for 3 connections ($1,000 one-time). Our platforms: ");
  for (const t of [PREFILL.trial, PREFILL.quote(1)]) assert.ok(t.trim().length >= 12, "passes the form's 'a sentence' check");
  assert.equal(withPlan("/case-studies/stock-sync#contact", "trial"), "/case-studies/stock-sync?plan=trial#contact");
  assert.equal(withPlan("/pricing", 3), "/pricing?plan=3");
  assert.equal(withPlan("/x?a=1#contact", 2), "/x?a=1&plan=2#contact");
});

// Dollar amounts the copy may show. Our prices: $0 and every quote of 1 to 6 connections. Not our prices, stated on
// purpose (REBUILD_BRIEF_2026-10-11 "Comparison" and decision 2), each at most as the low end of a range:
// the client's hosting ($5–20 a month), monthly apps ($20–330 a month), a freelancer ($1,500–8,000 per integration),
// an agency ($5,000–25,000) and a typical setup over two years (about $42 a month). Add one here only deliberately.
const OUR_PRICES = [0, OFFER.perConnection, ...[1, 2, 3, 4, 5, 6].map(quote)];
const NOT_OURS = [HOSTING.low, HOSTING.high, 20, 330, 1500, 8000, 5000, 25000, perMonth(quote(3))];
const ALLOWED = new Set([...OUR_PRICES, ...NOT_OURS].map(usd));

test("the site copy agrees with the offer", () => {
  for (const f of ["data/pricing.json", "data/site-content.json"]) {
    const text = copyText(f);
    assert.doesNotMatch(text, /1,200|\bfrom \$(?!500\b)|fixed, one-time price/i, `${f}: an old price line`);
    assert.doesNotMatch(text, /try 1 connection|1 connection free|with 1 connection|trial with one connection/i, `${f}: the old 1-connection trial`);
    assert.doesNotMatch(text, /set[- ]?up in 1 day/i, `${f}: "set up in 1 day" is now "${OFFER_LINES.setup}"`);
    for (const m of text.matchAll(/\$\d{1,3}(?:,\d{3})*/g)) assert.ok(ALLOWED.has(m[0]), `${f}: ${m[0]} is not a price of the offer`);
    assert.match(text, /\$500 per connection, one-time/, f);
    assert.match(text, /3 connections for the price of 2/, f);
    assert.match(text, /try your first link free for 7 days/i, f);
  }
});

test("/pricing: the offer's words, the trial, the example setups and the questions", () => {
  const p = read("data/pricing.json");
  const text = copyText("data/pricing.json");
  assert.ok(text.includes(OFFER_LINES.setup), `pricing.json says "${OFFER_LINES.setup}"`);
  assert.ok(text.includes(OFFER_LINES.trial), `pricing.json says "${OFFER_LINES.trial}"`);
  // the brief's copy rules: none of the old product words or idioms, US spelling
  assert.doesNotMatch(text, /same engine|reusable engine|your version|nothing hidden|best value|pick a size|in step|runs by itself|counts once|licence|catalogue/i);
  assert.equal(p.plans, undefined, "no plan tiles: every build is scoped for one business");
  assert.doesNotMatch(text, /\/demo|\/case-studies/, "the demo and the case studies are for email readers only");
  assert.ok((text.match(/\bengine\b/gi) ?? []).length <= 1, "'engine' at most once");

  // three example setups; their totals come from quote(), and the typical line is their range
  const counts = (p.setups.items as { parts: unknown[] }[]).map((s) => s.parts.length);
  assert.deepEqual(counts.map((n) => usd(quote(n))), ["$1,000", "$1,500", "$1,000"]);
  assert.ok(p.setups.typical.includes(`A typical setup: ${priceRange(counts)}`), p.setups.typical);
  assert.ok(p.compare.monthly.startsWith(`${usd(quote(3))} once is about ${usd(perMonth(quote(3)))} a month over two years`), p.compare.monthly);

  // the trial section
  assert.equal(p.trial.headline, `${OFFER_LINES.trial}.`);
  assert.match(p.trial.body, /two of your platforms/);
  const kept = (p.trial.points as { title: string; body: string }[]).find((x) => /^Keep it/.test(x.title))!.body;
  assert.match(kept, /\$500 each, one-time.*3 for the price of 2/);

  const faq = p.faq.items as { q: string; a: string }[];
  assert.equal(new Set(faq.map((x) => x.q)).size, faq.length, "no question twice");
  const ask = (q: RegExp) => faq.find((x) => q.test(x.q))!.a;
  const deal = ask(/3 for the price of 2/);
  for (const n of [2, 3, 4, 5]) assert.match(deal, new RegExp(`${n} (?:connections )?are ${usd(quote(n)).replace("$", "\\$")}`), `FAQ price of ${n}`);
  assert.match(ask(/free trial run/), /two of your platforms.*7 days/);
  assert.match(ask(/after the 7 days/), /\$500 each, one-time.*3 for the price of 2.*pay nothing/);
  assert.match(ask(/When do we pay/), /after it runs and before handover.*don't pay/);
  assert.match(ask(/after handover/), /90 days of fixes.*fixed price.*source code/);
  assert.match(ask(/changes its API/), /90 days/);
  assert.match(ask(/hosting/), /own cloud account.*\$5–20 a month.*nothing monthly/);
  assert.match(ask(/access/), /API keys.*revoke.*passwords/);
});

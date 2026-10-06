// node --test lib/offer.test.mts
// The offer (lib/offer.ts): $500 per connection, one-time, 3 for the price of 2, set up in 1 day; and the copy in
// data/pricing.json and data/site-content.json says the same (no old "from $1,200" left, every dollar amount is a real
// price of the offer).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { OFFER, OFFER_EXAMPLES, OFFER_LINES, PREFILL, TRIAL, breakdown, quote, usd, withPlan } from "./offer.ts";

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
    setup: "Set up in 1 day",
    trial: "Try 1 connection free for 7 days",
  });
});

test("breakdown: the quote's invoice lines", () => {
  assert.deepEqual(breakdown(1), { n: 1, gross: 500, discount: 0, total: 500, toFree: 2 });
  assert.deepEqual(breakdown(2), { n: 2, gross: 1000, discount: 0, total: 1000, toFree: 1 });
  assert.deepEqual(breakdown(3), { n: 3, gross: 1500, discount: 500, total: 1000, toFree: 0 });
  assert.deepEqual(breakdown(5), { n: 5, gross: 2500, discount: 500, total: 2000, toFree: 0 });
  assert.equal(TRIAL.days, 7);
  assert.equal(PREFILL.quote(3), "I'd like a quote for 3 connections ($1,000 one-time). Our platforms: ");
  assert.match(PREFILL.trial, /7-day free trial with 1 connection/);
  for (const t of [PREFILL.trial, PREFILL.quote(1)]) assert.ok(t.trim().length >= 12, "passes the form's 'a sentence' check");
  assert.equal(withPlan("/case-studies/stock-sync#contact", "trial"), "/case-studies/stock-sync?plan=trial#contact");
  assert.equal(withPlan("/pricing", 3), "/pricing?plan=3");
  assert.equal(withPlan("/x?a=1#contact", 2), "/x?a=1&plan=2#contact");
});

test("the site copy agrees with the offer", () => {
  const prices = new Set([0, OFFER.perConnection, ...[1, 2, 3, 4, 5, 6].map(quote)].map(usd));
  for (const f of ["data/pricing.json", "data/site-content.json"]) {
    const { _note, ...copy } = JSON.parse(readFileSync(new URL(`../${f}`, import.meta.url), "utf8")); // the note may name the old price
    const text = JSON.stringify(copy);
    assert.doesNotMatch(text, /1,200|\bfrom \$|fixed, one-time price/i, f);
    for (const m of text.matchAll(/\$\d{1,3}(?:,\d{3})*/g)) assert.ok(prices.has(m[0]), `${f}: ${m[0]} is not a price of the offer`);
    assert.match(text, /\$500 per connection, one-time/, f);
    assert.match(text, /3 connections for the price of 2/, f);
    assert.match(text, /Set up in 1 day/, f);
    assert.match(text, /try 1 connection free for 7 days/i, f);
  }
  const faq = JSON.parse(readFileSync(new URL("../data/pricing.json", import.meta.url), "utf8")).faq.items as { q: string; a: string }[];
  const deal = faq.find((x) => /3 for the price of 2/.test(x.q))!.a;
  const ask = (q: RegExp) => faq.find((x) => q.test(x.q))!.a;
  assert.match(ask(/free trial work/), /7 days/);
  assert.match(ask(/after the 7 days/), /\$500 one-time.*counts toward 3 for the price of 2.*pay nothing/);
  assert.match(ask(/When do we pay/), /after it runs and before handover/);
  for (const n of [2, 3, 4, 5]) assert.match(deal, new RegExp(`${n} (?:connections )?are ${usd(quote(n)).replace("$", "\\$")}`), `FAQ price of ${n}`);
});

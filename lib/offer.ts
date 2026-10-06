// The offer, one place for its numbers (USD, one-time): $500 per connection; take 3 connections or more and one of
// them is free (3 for the price of 2); set up in 1 day (user, 2026-10-07; it replaced "from $1,200"). The copy in
// data/pricing.json and data/site-content.json spells these out in words: lib/offer.test.mts checks that they agree.
// Pure (no "@/"), so node --test can run it.

export const OFFER = { perConnection: 500, freeAt: 3, setupDays: 1, currency: "USD" } as const;

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: OFFER.currency, maximumFractionDigits: 0 });

/** 1000 → "$1,000" */
export const usd = (n: number) => money.format(n);

/** What n connections cost, one-time: $500 each, and from 3 connections on one of them is free. */
export function quote(n: number): number {
  if (!Number.isInteger(n) || n < 1) return 0;
  return (n >= OFFER.freeAt ? n - 1 : n) * OFFER.perConnection;
}

const days = `${OFFER.setupDays} day${OFFER.setupDays === 1 ? "" : "s"}`;

/** The offer in short lines, for the demo pages. */
export const OFFER_LINES = {
  price: `${usd(OFFER.perConnection)} per connection, one-time`,
  free: `${OFFER.freeAt} connections for the price of ${OFFER.freeAt - 1}`,
  setup: `Set up in ${days}`,
} as const;

/** The price of n connections in a few setups, for the small price tables on the demo pages. */
export const OFFER_EXAMPLES = [2, 3, 4].map((n) => ({ n, price: usd(quote(n)), free: n >= OFFER.freeAt }));

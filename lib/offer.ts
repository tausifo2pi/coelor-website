// The offer, one place for its numbers (USD, one-time): $500 per connection; take 3 connections or more and one of
// them is free (3 for the price of 2); set up in 1 day (user, 2026-10-07; it replaced "from $1,200"). Free trial: 1
// connection for 7 days, no card; keep it and it is a normal $500 connection (it counts toward 3 for 2), or it is
// switched off and nothing is paid. Payment: once, after it runs and before handover. The copy in
// data/pricing.json and data/site-content.json spells these out in words: lib/offer.test.mts checks that they agree.
// Pure (no "@/"), so node --test can run it.

export const OFFER = { perConnection: 500, freeAt: 3, setupDays: 1, currency: "USD" } as const;
export const TRIAL = { days: 7, connections: 1 } as const;

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: OFFER.currency, maximumFractionDigits: 0 });

/** 1000 → "$1,000" */
export const usd = (n: number) => money.format(n);

/** What n connections cost, one-time: $500 each, and from 3 connections on one of them is free. */
export function quote(n: number): number {
  if (!Number.isInteger(n) || n < 1) return 0;
  return (n >= OFFER.freeAt ? n - 1 : n) * OFFER.perConnection;
}

const days = `${OFFER.setupDays} day${OFFER.setupDays === 1 ? "" : "s"}`;

/** A quote as invoice lines: n × $500, minus the free one from 3 on, and how many more until one is free. */
export function breakdown(n: number) {
  const gross = Number.isInteger(n) && n > 0 ? n * OFFER.perConnection : 0;
  const total = quote(n);
  return { n, gross, discount: gross - total, total, toFree: n > 0 && n < OFFER.freeAt ? OFFER.freeAt - n : 0 };
}

/** The offer in short lines, for the demo pages. */
export const OFFER_LINES = {
  price: `${usd(OFFER.perConnection)} per connection, one-time`,
  free: `${OFFER.freeAt} connections for the price of ${OFFER.freeAt - 1}`,
  setup: `Set up in ${days}`,
  trial: `Try ${TRIAL.connections} connection free for ${TRIAL.days} days`,
} as const;

/** Messages the contact form is filled in with when a visitor picks the trial or a quote (they can edit them). */
export const PREFILL = {
  trial: `I'd like the ${TRIAL.days}-day free trial with ${TRIAL.connections} connection. The platform to connect: `,
  quote: (n: number) => `I'd like a quote for ${n} connection${n === 1 ? "" : "s"} (${usd(quote(n))} one-time). Our platforms: `,
};

/** The price of n connections in a few setups, for the small price tables on the demo pages. */
export const OFFER_EXAMPLES = [2, 3, 4].map((n) => ({ n, price: usd(quote(n)), free: n >= OFFER.freeAt }));

/** "/case-studies/x#contact" + "trial" → "/case-studies/x?plan=trial#contact": that page's form starts filled in. */
export function withPlan(href: string, plan: "trial" | number): string {
  const [path, hash = ""] = href.split("#");
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}plan=${plan}${hash ? `#${hash}` : ""}`;
}

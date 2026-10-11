// The offer, one place for its numbers (USD, one-time): $500 per connection; take 3 connections or more and one of
// them is free (3 for the price of 2) (user, 2026-10-07; it replaced "from $1,200"). Live in about a day once we have
// access to the accounts (some marketplaces approve API access first; it replaced "set up in 1 day", 2026-10-11).
// Free trial (user, 2026-10-11): "your first link", two of the reader's platforms connected for 7 days, no card; keep
// it and those connections are billed as normal ($500 each, and they count toward 3 for 2), or it is switched off and
// nothing is paid. Payment: once, after it runs and before handover. After handover: 90 days of fixes included, also
// when a platform changes its API; then a fixed price per fix, agreed first. Hosting: the client's own cloud account,
// billed by the host (usually $5–20 a month); we charge nothing monthly. The copy in data/pricing.json and
// data/site-content.json spells these out in words: lib/offer.test.mts checks that they agree.
// Pure (no "@/"), so node --test can run it.

export const OFFER = { perConnection: 500, freeAt: 3, setupDays: 1, fixDays: 90, currency: "USD" } as const;
export const TRIAL = { days: 7, connections: 2, label: "your first link" } as const;
/** What the client's own host usually bills a month (USD); not ours, we charge nothing monthly. */
export const HOSTING = { low: 5, high: 20 } as const;

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: OFFER.currency, maximumFractionDigits: 0 });

/** 1000 → "$1,000" */
export const usd = (n: number) => money.format(n);

const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
/** 2 → "two" (small counts in a sentence) */
export const word = (n: number) => WORDS[n] ?? String(n);

/** What n connections cost, one-time: $500 each, and from 3 connections on one of them is free. */
export function quote(n: number): number {
  if (!Number.isInteger(n) || n < 1) return 0;
  return (n >= OFFER.freeAt ? n - 1 : n) * OFFER.perConnection;
}

/** A quote as invoice lines: n × $500, minus the free one from 3 on, and how many more until one is free. */
export function breakdown(n: number) {
  const gross = Number.isInteger(n) && n > 0 ? n * OFFER.perConnection : 0;
  const total = quote(n);
  return { n, gross, discount: gross - total, total, toFree: n > 0 && n < OFFER.freeAt ? OFFER.freeAt - n : 0 };
}

/** The totals of a few setups (n connections each) as one range: [3, 4, 3] → "$1,000–1,500". */
export function priceRange(counts: number[]): string {
  const totals = counts.map(quote);
  const lo = Math.min(...totals);
  const hi = Math.max(...totals);
  return lo === hi ? usd(lo) : `${usd(lo)}–${usd(hi).slice(1)}`;
}

/** A one-time price spread over months, rounded: 1000 over 24 → 42 ("about $42 a month over two years"). */
export const perMonth = (total: number, months = 24) => Math.round(total / months);

const live = `about ${OFFER.setupDays === 1 ? "a day" : `${OFFER.setupDays} days`}`;

/** The offer in short lines, for the demo pages (the same words as /pricing and the homepage). */
export const OFFER_LINES = {
  price: `${usd(OFFER.perConnection)} per connection, one-time`,
  free: `${OFFER.freeAt} connections for the price of ${OFFER.freeAt - 1}`,
  setup: `Live in ${live} once we have access`,
  trial: `Try ${TRIAL.label} free for ${TRIAL.days} days`,
} as const;

/** What the trial is, after OFFER_LINES.trial: "two of your platforms connected, no card". */
export const TRIAL_WHAT = `${word(TRIAL.connections)} of your platforms connected, no card`;

/** What keeping the trial costs: its connections at the normal price ($1,000 for two). */
export const TRIAL_KEPT = quote(TRIAL.connections);

/** Messages the contact form is filled in with when a visitor picks the trial or a quote (they can edit them). */
export const PREFILL = {
  trial: `I'd like the ${TRIAL.days}-day free trial: ${TRIAL.label.replace(/^your\b/, "my")}. The ${word(TRIAL.connections)} platforms to connect: `,
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

import { quote, usd } from "@/lib/offer";

// Figures the homepage copy names that are not prices of our offer: what the alternatives cost, by category (rebuild
// brief 2026-10-11; never a brand name), and what the client's own cloud host bills. data/site-content.json writes them
// as {tokens}, because lib/offer.test.mts allows only the offer's own prices as dollar amounts in that file. {total} and
// {monthly} come from the offer: two connections, and that price spread over 24 months ($1,000 → $42).

const FIGURES: Record<string, string> = {
  hosting: "$5–20 a month",
  apps: "$20–330 a month, or 1–1.5% of sales",
  freelancer: "$1,500–8,000 per integration",
  agency: "$5,000–25,000 plus upkeep",
  total: usd(quote(2)),
  monthly: usd(Math.round(quote(2) / 24)),
};

/** "usually {hosting}" → "usually $5–20 a month". `extra` adds tokens of its own (e.g. {n}); an unknown token stays as written. */
export function fill(text: string, extra: Record<string, string | number> = {}): string {
  return text.replace(/\{(\w+)\}/g, (m, k: string) => String(extra[k] ?? FIGURES[k] ?? m));
}

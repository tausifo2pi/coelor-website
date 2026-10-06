import data from "@/data/pricing.json";
import { OFFER, quote, usd } from "@/lib/offer";

// The /pricing copy (data/pricing.json) and the one rule the page computes: a tier's price line, from the offer in
// lib/offer.ts ($500 per connection, one-time; from 3 connections on, one of them is free).

export const pricing = data;

export type PriceLine = { title: string; unit: string; free: boolean };

/** 2 → "$1,000" · "one-time · 2 × $500"; 3 → "$1,000" · "one-time · 3 × $500, 1 free";
 * 4 and more (`plus`) → "$1,500" · "one-time for 4 · +$500 for each one after". */
export function priceLine(count: number, plus = false): PriceLine {
  const { price } = data;
  const free = count >= OFFER.freeAt;
  const title = usd(quote(count));
  if (plus) {
    const unit = `${price.plusFor.replace("{n}", String(count))} · ${price.plusEach.replace("{price}", usd(OFFER.perConnection))}`;
    return { title, unit, free };
  }
  return { title, unit: `${price.unit} · ${count} × ${usd(OFFER.perConnection)}${free ? `, ${price.free}` : ""}`, free };
}

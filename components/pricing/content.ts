import data from "@/data/pricing.json";

// The /pricing copy (data/pricing.json) and the one rule the page computes: a tier's price line. A tier's `from` stays
// null until the owner fills in a number; until then the card says "Fixed price, after a 30-minute call".

export const pricing = data;

export type PriceLine = { title: string; unit: string; set: boolean };

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: data.currency, maximumFractionDigits: 0 });

/** "From $1,200 · one-time" when a price is filled in; "Fixed price · after a 30-minute call" while it is null. */
export function priceLine(from: number | string | null | undefined): PriceLine {
  const { price } = data;
  const amount = typeof from === "number" && Number.isFinite(from) && from > 0 ? money.format(from) : typeof from === "string" && from.trim() ? from.trim() : "";
  if (!amount) return { title: price.unsetTitle, unit: price.unsetUnit, set: false };
  return { title: `${price.fromLabel} ${amount}`, unit: price.unit, set: true };
}

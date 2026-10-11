import data from "@/data/pricing.json";

// The /pricing copy (data/pricing.json). The numbers come from lib/offer.ts: the quote, the example setups' totals
// (quote() of their number of parts) and the trial; lib/offer.test.mts checks that the sentences agree with them.

export const pricing = data;
export { IDS } from "./ids";

/** A section's frame: a rule on top and the site's gutters, with shorter padding on phones. */
export const SECTION = "scroll-mt-20 border-t border-rule";
export const INNER = "mx-auto max-w-site px-5 py-9 md:px-10 md:py-16 lg:px-20 lg:py-[88px]";

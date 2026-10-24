// Larkmoor, the jewelry demo's client (/demo/jewellery-shop, lib/storedemo/jewellery-config.ts): a demo jewelry studio
// that designs and sells its own line, shown as ONE business's heavily customised build like Northvale Kicks and
// Fernhollow (lib/demo/clients.ts, same shape and rules: invented name, checked 2026-10-24 that no jewelry shop by that
// name shows up in a web search; every number generated). Here: who the studio is, its team (first names only), the
// build log, its custom rules (`job` = the store engine's rule keys) and the systems in its build; the "Larkmoor
// fields" of a piece in the product drawer (metal, stone, sizing, casting batch, wholesale price, return and repair
// rule), each following from the product through a hash, so the same piece always shows the same values; and the
// numbers of its dashboard tiles that lib/demo/tiles.ts does not already count.
// Pure (no I/O, no "@/" imports): node --test loads it (lib/storedemo/jewellery.test.mts).
import type { DemoClient } from "./clients.ts";
import type { Order } from "../storedemo/types.ts";

const DAY = 86_400_000;

export const LARKMOOR: DemoClient = {
  id: "jewellery",
  name: "Larkmoor",
  monogram: "LM",
  accent: "#a16207",
  accentSoft: "#fef9c3",
  accentInk: "#713f12",
  about: "Jewelry studio: a Shopify store, Etsy, Amazon Handmade, eBay and Faire wholesale, one studio",
  since: "2026-04-06",
  version: "2.3",
  repo: "larkmoor-ops",
  team: [
    { name: "Noor", role: "Owner and designer" },
    { name: "Ellis", role: "Operations and wholesale" },
    { name: "Priya", role: "Bench jeweler" },
    { name: "Sam", role: "Packing and shipping" },
  ],
  noticeWho: "a jewelry studio",
  noticeSetup: "their Shopify store, Etsy, Amazon Handmade, eBay and Faire wholesale, their studio stock, their carriers and their own rules",
  buildLog: [
    { version: "1.0", date: "2026-04-06", title: "Every order on one count", asked: "Five channels sell the same rings. Make the numbers agree.", by: "Noor",
      done: "Orders from Shopify and Amazon Handmade arrive by webhook, Etsy, eBay and Faire every 5 minutes; every ring size and metal on one count.", days: 2 },
    { version: "1.1", date: "2026-04-20", title: "Last one off everywhere", asked: "We sold the last size 7 twice in one evening.", by: "Ellis",
      done: "A ring size or metal at 0 comes off every channel on the sale that emptied it; the web store shows it sold out.", days: 1 },
    { version: "1.2", date: "2026-05-11", title: "Labels by value", asked: "I pick the carrier and the insurance for every parcel by hand.", by: "Sam",
      done: "Labels bought in ShipStation by weight and value: parcels over $300 insured with a signature; Faire orders on Faire's prepaid label.", days: 2 },
    { version: "1.3", date: "2026-06-01", title: "New pieces everywhere", asked: "Listing a new ring on five channels takes an afternoon.", by: "Noor",
      done: "A piece published in Shopify is listed on Etsy, Amazon Handmade, eBay and Faire with every ring size, metal and the photos.", days: 2 },
    { version: "1.4", date: "2026-06-22", title: "Resizes as exchanges", asked: "Half our returns are just the wrong ring size.", by: "Priya",
      done: "A ring that didn't fit is exchanged in Loop: the new size goes out the day the old one is scanned back.", days: 2 },
    { version: "2.0", date: "2026-07-20", title: "Wholesale reserve", asked: "Stockists order twenty pieces at once and empty the tray.", by: "Ellis",
      done: "Faire orders only take stock above 3 of a piece; the last 3 stay for the web store, Etsy and Amazon Handmade.", days: 3 },
    { version: "2.1", date: "2026-08-17", title: "Casting batches", asked: "When a batch comes back from the caster, everything should be on sale that day.", by: "Noor",
      done: "A casting batch checked in at the studio is on every channel the same day; best sellers down to 2 land on Monday's casting order.", days: 2 },
    { version: "2.2", date: "2026-09-07", title: "Assistant routines", asked: "Let Ellis pull a report without waiting on anyone.", by: "Ellis",
      done: "Routines written from a chat that read the data and post to Slack and Google Sheets. Read-only by design.", days: 3 },
    { version: "2.3", date: "2026-10-05", title: "Repair tickets", asked: "Repairs live in my inbox. Put them where we can all see them.", by: "Priya",
      done: "A repair request from the web store becomes a ticket in the repairs sheet with the order, the piece and its casting batch.", days: 1 },
  ],
  rules: [
    { code: "J-01", name: "One count for every order", when: "An order comes in on any channel", then: "Stock −1 on every channel, for that ring size and metal",
      why: "Five channels, one tray of stock", by: "Noor", built: "2026-04-06", job: "orders", file: "rules/order-in.ts" },
    { code: "J-02", name: "Last one off everywhere", when: "A ring size or metal reaches 0", then: "Pulled from Etsy, Amazon Handmade, eBay and Faire; shown sold out in the web store",
      why: "The last size 7 sold twice in one evening", by: "Ellis", built: "2026-04-20", job: "soldout", file: "rules/sold-out.ts" },
    { code: "J-03", name: "New piece listed", when: "A new product is published in Shopify", then: "Listed on Etsy, Amazon Handmade, eBay and Faire with every ring size, metal and the photos",
      why: "Listing one ring five times by hand", by: "Noor", built: "2026-06-01", job: "listing", file: "rules/list-new.ts" },
    { code: "J-04", name: "Label picker", when: "An order is paid on any channel", then: "Label in ShipStation by weight and value; Faire orders on Faire's prepaid UPS label",
      why: "Sam picked every carrier by hand", by: "Sam", built: "2026-05-11", job: "labels", file: "rules/labels.ts" },
    { code: "J-05", name: "Insured over $300", when: "A parcel holds $300 or more of jewelry", then: "Label in ShipStation with insurance and a signature on delivery; never left at the door",
      why: "A $540 chain went missing from a porch", by: "Sam", built: "2026-05-11", job: "labels", file: "rules/insured.ts" },
    { code: "J-06", name: "Tracking to the buyer", when: "A parcel is scanned by the carrier", then: "AfterShip tracking page and emails; the order marked shipped on its channel",
      why: "Where-is-my-order emails", by: "Ellis", built: "2026-05-11", job: "tracking", file: "rules/tracking.ts" },
    { code: "J-07", name: "Resize as an exchange", when: "A return for a ring that didn't fit is started in Loop", then: "The new size goes out the day the old one is scanned back; the old ring goes back on sale after the bench check",
      why: "Half the returns were the wrong ring size", by: "Priya", built: "2026-06-22", job: "returns", file: "rules/resize.ts" },
    { code: "J-08", name: "Wholesale reserve", when: "A Faire order would take a piece's stock below 3", then: "Faire gets what is above 3; the last 3 stay for the web store, Etsy and Amazon Handmade",
      why: "Stockists emptied the tray of best sellers", by: "Ellis", built: "2026-07-20", job: "orders", file: "rules/wholesale-reserve.ts" },
    { code: "J-09", name: "Casting batch restock", when: "A casting house batch is checked in at the studio", then: "New stock on every channel the same day",
      why: "Batches sat in trays for days", by: "Noor", built: "2026-08-17", job: "restock", file: "rules/casting-restock.ts" },
    { code: "J-10", name: "Reorder list", when: "A best seller is down to 2 in a ring size or metal", then: "On the Monday casting order sheet for the casting house",
      why: "Casting orders came from memory", by: "Noor", built: "2026-08-17", job: "low", file: "reports/reorder.ts" },
    { code: "J-11", name: "Repair ticket", when: "A buyer asks for a repair on the web store", then: "A ticket in the repairs sheet with the order, the piece and its batch number; the team chat hears about it",
      why: "Repairs lived in one inbox", by: "Priya", built: "2026-10-05", job: null, cadence: "With every request", file: "rules/repairs.ts" },
  ],
  systems: [
    { slug: "shopify", name: "Shopify", kind: "Web store", how: "Webhook, real time", custom: "Ring sizes and metals shown, new pieces listed everywhere from here, repair requests", since: "2026-04-06" },
    { slug: "etsy", name: "Etsy", kind: "Handmade marketplace", how: "API, orders every 5 min (no webhooks)", custom: "Personalization notes copied onto the order and the packing slip", since: "2026-04-06" },
    { slug: "amazon", name: "Amazon Handmade", kind: "Handmade marketplace (US)", how: "SP-API notifications", custom: "Ring sizes mapped to Amazon's size list", since: "2026-04-06" },
    { slug: "ebay", name: "eBay", kind: "Marketplace (US)", how: "API, orders every 5 min", custom: "Every ring size and metal on one listing", since: "2026-04-06" },
    { slug: "faire", name: "Faire", kind: "Wholesale marketplace (stockists)", how: "API, orders every 5 min", custom: "Wholesale reserve, Faire's prepaid UPS label", since: "2026-04-06" },
    { slug: "shipstation", name: "ShipStation", kind: "Labels: USPS, UPS, FedEx", how: "API", custom: "Carrier by weight and value, insured over $300, 14:00 cutoff", since: "2026-05-11" },
    { slug: "aftership", name: "AfterShip", kind: "Tracking page and emails", how: "Webhook on every carrier scan", custom: "Order marked shipped on its own channel", since: "2026-05-11" },
    { slug: "loop", name: "Loop Returns", kind: "Returns, exchanges and resizes", how: "Webhook", custom: "Ring resizes as exchanges, bench check before restock", since: "2026-06-22" },
    { slug: "casting", name: "Casting house", kind: "Casting batches", how: "Batch sheet by email, checked in at the studio", custom: "Same-day restock on every channel, Monday casting order", since: "2026-08-17" },
    { slug: "slack", name: "Slack", kind: "Team chat and alerts", how: "Bot", custom: "Sold-out best sellers, Faire orders, repair tickets", since: "2026-04-20" },
    { slug: "google-sheets", name: "Google Sheets", kind: "Casting and repairs sheets", how: "Sheets API", custom: "Monday casting order, ring sizes, repair tickets", since: "2026-08-17" },
  ],
};

/* ---------- hashing: one stable number per (parts), the same function as the store engine ---------- */

function hash(s: string): number {
  let x = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    x ^= s.charCodeAt(i);
    x = Math.imul(x, 0x01000193);
  }
  x ^= x >>> 16;
  x = Math.imul(x, 0x85ebca6b);
  x ^= x >>> 13;
  x = Math.imul(x, 0xc2b2ae35);
  x ^= x >>> 16;
  return x >>> 0;
}
const H = (...p: (string | number)[]) => hash(p.join("|"));

/* ---------- the Larkmoor fields of a piece ---------- */

export type LarkmoorFields = {
  metal: string;
  /** the stone, or null for a piece in plain metal */
  stone: string | null;
  sizing: string;
  /** "CB-2614": the casting batch it came in, one per collection per week */
  batch: string;
  /** what a stockist pays on Faire, or "Retail only" */
  wholesale: string;
  /** what happens to a return of this piece, and its repair promise */
  care: string;
};

const METAL_WORDS: Record<string, string> = {
  "Gold Vermeil": "18k gold vermeil on 925 silver",
  "Rose Gold Vermeil": "18k rose gold vermeil on 925 silver",
  "Sterling Silver": "925 sterling silver",
  "14k Gold Fill": "14k gold-filled",
  "14k Yellow Gold": "solid 14k yellow gold",
  "14k White Gold": "solid 14k white gold",
  "14k Rose Gold": "solid 14k rose gold",
};
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// the stone a title names, as the studio describes it
const STONE_WORDS: [RegExp, (id: string) => string][] = [
  [/Baroque Pearl/, () => "Baroque freshwater pearls, 7–9 mm"],
  [/Pearl/, () => "Freshwater pearl, 6–7 mm"],
  [/Opal/, () => "Lab-created opal, 5 mm"],
  [/Moonstone/, () => "Rainbow moonstone, 6 mm"],
  [/Blue Topaz/, () => "Swiss blue topaz, 6 mm round"],
  [/Lab Diamond/, (id) => `Lab-grown diamond, ${["0.10", "0.15", "0.25", "0.50"][H("ct", id) % 4]} ct total, VS1 F`],
  [/Sapphire/, () => "Lab-created sapphire, 5 mm"],
  [/Birthstone/, () => "The buyer's birthstone, 4 mm (lab-created where natural is out of reach)"],
  [/Daisy/, () => "Citrine center, 3 mm"],
  [/Evil Eye/, () => "Blue enamel eye"],
];

/** The Larkmoor fields of one piece (its variants' colours are its metals or its birthstones). `wholesaleShare`: what
 * Faire pays of the retail price (the config's priceShare). */
export function larkmoorFields(
  p: { id: string; title: string; category: string; brand: string; price: number; publishedAt?: string; variants: { color: string; size: string }[]; listedOn?: string[] },
  wholesaleShare = 0.5,
): LarkmoorFields {
  const colours = [...new Set(p.variants.map((v) => v.color))];
  const sizes = [...new Set(p.variants.map((v) => v.size))];
  const birthstone = /Birthstone/.test(p.title);
  const metals = birthstone ? ["Gold Vermeil"] : colours;
  const metal = cap(metals.map((m) => METAL_WORDS[m] ?? m.toLowerCase()).join(" · "));
  const stone = STONE_WORDS.find(([re]) => re.test(p.title))?.[1](p.id) ?? null;
  const solid = metals.some((m) => m.startsWith("14k ") && !/Fill/.test(m));

  const sizing =
    p.category === "Rings"
      ? `US ${sizes[0]}–${sizes[sizes.length - 1]}${sizes.some((s) => s.includes(".")) ? " with half sizes" : ""} · one free resize within 60 days`
      : sizes.length > 1
        ? `${sizes.join(", ")} · extender on request`
        : p.category === "Necklaces"
          ? 'Adjustable 16–18" chain'
          : p.category === "Earrings"
            ? `Sold as a pair · ${solid ? "14k" : "nickel-free"} posts`
            : p.category === "Bracelets"
              ? /Bangle|Cuff/.test(p.title) ? "One size, fits most wrists" : 'Adjustable 6–7.5"'
              : "Fits our chains and hoops, 2–4 mm";

  // one casting batch per collection per week: a collection's pieces published in the same week came in the same batch
  const week = Math.floor((Date.parse(p.publishedAt ?? "") || 0) / (7 * DAY));
  const batch = `CB-${2400 + (H("batch", p.brand, week) % 700)}`;
  const onFaire = !p.listedOn || p.listedOn.includes("faire");
  const wholesale = onFaire ? `$${Math.round(p.price * wholesaleShare)} on Faire · minimum 2` : "Retail only";

  const care = p.category === "Earrings"
    ? "Back on sale only with the hygiene seal intact · otherwise refunded and the metal recycled"
    : solid
      ? "Checked under the loupe and re-polished before it goes back on sale · lifetime repairs"
      : p.category === "Rings"
        ? "Wrong size: exchanged for the right one in Loop · worn: polished at the bench, back on sale · repairs free for a year"
        : "Unworn in its pouch: back on sale · a broken clasp or chain is repaired free for a year";
  return { metal, stone, sizing, batch, wholesale, care };
}

/* ---------- dashboard numbers of its own ---------- */

/** Faire orders paid and not shipped yet: orders, pieces to pull and their wholesale value. */
export function wholesaleOpen(orders: Order[], channel = "faire") {
  const open = orders.filter((o) => o.channel === channel && (o.state === "Paid" || o.state === "Label printed"));
  return { orders: open.length, pieces: open.reduce((s, o) => s + o.lines.length, 0), value: Math.round(open.reduce((s, o) => s + o.total, 0)) };
}

/** Returns started and not back yet that are a ring that didn't fit (rule J-07: a resize, sent as an exchange). */
export function resizesOpen(orders: Order[]): number {
  return orders.filter((o) => o.state === "Return started" && /\b(Ring|Band|Ring Set)$/.test(o.lines[0]?.title ?? "") && o.steps.some((s) => s.kind === "return" && /Didn't fit/.test(s.text))).length;
}

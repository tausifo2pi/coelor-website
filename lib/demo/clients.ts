// The demo workspaces' clients (lead-outreach PLAN_followups_custom_demo.md step 5b, user 2026-10-11): each live demo is
// shown as ONE business's heavily customised build, made around their own platforms, rules and team, so a reader sees a
// custom build, not a product to pick. The businesses are demo shops (invented names, checked 2026-10-11 that no shop
// by that name shows up in a web search) and every number in the demos is generated (user decision: fully generated,
// no client data, no third-party store's catalogue). The pages say so plainly (components/demo/CustomNotice.tsx); no
// "sample" badges on channels (memory: demo-no-sample-labels), no "real data" claim.
//
// One entry per demo: who the business is, its team (first names only), the build log (what they asked for, when it
// was delivered), its custom rules (named, coded, with who asked and when it was built; `job` ties a rule to the job
// whose last run the Automations page shows) and the systems in its build (how each is wired). Dates sit on or after
// the demo's start (sneaker: lib/demo/sample.ts SAMPLE_START = 2026-01-05; boutique: configs.ts since = 2026-03-02).
// Pure data (no I/O, no "@/" imports): node --test can load it.

export type TeamMember = { name: string; role: string };
export type BuildEntry = {
  version: string;
  /** ISO date it went live */
  date: string;
  title: string;
  /** what the client asked for, in their words */
  asked: string;
  /** who asked (a team member's first name) */
  by: string;
  /** what was built */
  done: string;
  /** working days from the request to live */
  days: number;
};
export type CustomRule = {
  /** short code shown on the rule ("R-07") */
  code: string;
  name: string;
  when: string;
  then: string;
  /** why the client wanted it, one line */
  why: string;
  by: string;
  /** ISO date it was built */
  built: string;
  /** the job whose last run the page shows (lib/demo/shape.ts job keys / storedemo engine rule keys); null = on demand */
  job: string | null;
  /** where it lives in the client's code */
  file: string;
};
export type SystemSpec = {
  /** logo slug (components/demo/ui.tsx BrandMark / Logo) */
  slug: string;
  name: string;
  /** its place in this build */
  kind: string;
  /** how it is wired: API, webhook, sheet, export… */
  how: string;
  /** the custom part for this client */
  custom: string;
  /** ISO date it joined the build */
  since: string;
};
export type DemoClient = {
  id: "sneaker" | "boutique";
  name: string;
  /** two letters for the client's mark */
  monogram: string;
  /** the client's own colours (the workspace accent); hex */
  accent: string;
  accentSoft: string;
  accentInk: string;
  /** one line about the business */
  about: string;
  /** ISO date the build went live */
  since: string;
  /** current version of their build (the newest build log entry) */
  version: string;
  repo: string;
  team: TeamMember[];
  /** the notice (CustomNotice): whose kind of build and what it is made around */
  noticeWho: string;
  noticeSetup: string;
  buildLog: BuildEntry[];
  rules: CustomRule[];
  systems: SystemSpec[];
};

export const NORTHVALE: DemoClient = {
  id: "sneaker",
  name: "Northvale Kicks",
  monogram: "NK",
  accent: "#0f766e",
  accentSoft: "#ccfbf1",
  accentInk: "#134e4a",
  about: "Sneaker reseller: StockX, Alias, a Shopify store and Whatnot shows, one warehouse in Picqer",
  since: "2026-01-05",
  version: "3.2",
  repo: "northvale-ops",
  team: [
    { name: "Dani", role: "Owner" },
    { name: "Marco", role: "Operations" },
    { name: "Jules", role: "Warehouse" },
    { name: "Tasha", role: "Whatnot show host" },
  ],
  noticeWho: "a sneaker reseller",
  noticeSetup: "their StockX and Alias accounts, their Picqer warehouse, their suppliers and their own rules",
  buildLog: [
    { version: "1.0", date: "2026-01-05", title: "StockX and Alias sales into Picqer", asked: "Stop typing every marketplace sale into Picqer by hand.", by: "Dani",
      done: "Sales from StockX EU, StockX US, Alias and Alias USA come off the Picqer stock on their own, matched by style code and size.", days: 1 },
    { version: "1.1", date: "2026-01-19", title: "Sold-out sizes pulled everywhere", asked: "We sold the same pair twice on a Sunday. Never again.", by: "Dani",
      done: "When a size hits 0 in Picqer its listings come down on StockX and Alias within 10 minutes, and the team chat hears about it.", days: 2 },
    { version: "1.2", date: "2026-02-09", title: "Bin picker", asked: "Take the sold pair from the bin with the most stock, not the first one.", by: "Jules",
      done: "Every sale is booked from the bin with the most free stock, so the pick list matches the shelves.", days: 1 },
    { version: "1.3", date: "2026-03-02", title: "Shopify on the same count", asked: "Put the web store on the same stock as the marketplaces.", by: "Marco",
      done: "Shopify orders arrive by webhook; stock levels are pushed after every sale and sold-out sizes are hidden in the store.", days: 2 },
    { version: "1.4", date: "2026-03-23", title: "Last-pair guard", asked: "When the last pair goes on Alias, pull it from StockX before someone buys it there.", by: "Marco",
      done: "The last pair selling on Alias pulls that size from StockX EU and StockX US at once.", days: 1 },
    { version: "2.0", date: "2026-04-20", title: "Whatnot shows", asked: "Tasha's show sales have to hit Picqer before the next show starts.", by: "Tasha",
      done: "Show sales come in every 3 minutes; only sizes in stock go into a show; a pair sold on air is pulled everywhere.", days: 3 },
    { version: "2.1", date: "2026-05-18", title: "Size reader", asked: "Our Picqer names are messy. Read the size and colour out of them.", by: "Jules",
      done: "A language model reads size, width and colourway from the Picqer product name; anything unsure is flagged for a look.", days: 2 },
    { version: "2.2", date: "2026-06-15", title: "Photo finder", asked: "Half the new products have no photo.", by: "Marco",
      done: "A product without a photo gets the sneaker's product shot added in Picqer every 6 hours.", days: 1 },
    { version: "2.3", date: "2026-07-13", title: "Harbourline stock sheet", asked: "Harbourline wants our live stock with EUR and USD prices.", by: "Dani",
      done: "A live stock sheet shared with Harbourline Wholesale, refreshed every 30 minutes.", days: 1 },
    { version: "2.4", date: "2026-08-10", title: "Kiln Street consignment report", asked: "Which pairs at Kiln Street are not listed on StockX Flex yet?", by: "Marco",
      done: "A not-listed report for the StockX US Flex consignment, every 2 hours, shared with Kiln Street Consign.", days: 2 },
    { version: "3.0", date: "2026-09-07", title: "Assistant routines", asked: "Let us ask for a report in plain words instead of waiting for a developer.", by: "Dani",
      done: "Routines written from a chat that read the data and post to the team's sheets and chat. Read-only by design.", days: 4 },
    { version: "3.1", date: "2026-09-28", title: "Unmatched-order flag", asked: "If an order can't be matched, don't guess. Show it to me.", by: "Jules",
      done: "An order that matches no product is flagged in the orders list and the stock is left alone.", days: 1 },
    { version: "3.2", date: "2026-10-05", title: "Lowest-ask check", asked: "Tell us when we're no longer the lowest ask on our best sellers.", by: "Dani",
      done: "Every 6 hours the best sellers' StockX lowest ask is checked and the list goes to the team's sheet.", days: 1 },
  ],
  rules: [
    { code: "R-01", name: "StockX sale off the shelf", when: "A pair sells on StockX EU or StockX US", then: "One off the Picqer stock, from the bin with the most free stock",
      why: "The pick list must match the shelves", by: "Jules", built: "2026-02-09", job: "stockx-orders", file: "rules/stockx-sale.ts" },
    { code: "R-02", name: "Alias sale confirmed", when: "A pair sells on Alias or Alias USA", then: "One off the Picqer stock, and the order confirmed on Alias",
      why: "Alias cancels unconfirmed orders", by: "Dani", built: "2026-01-05", job: "alias-orders", file: "rules/alias-sale.ts" },
    { code: "R-03", name: "Web store order", when: "An order is placed on Shopify", then: "One off the Picqer stock the moment it is placed (webhook)",
      why: "The web store sells the same pairs", by: "Marco", built: "2026-03-02", job: "shopify-orders", file: "rules/shopify-order.ts" },
    { code: "R-04", name: "Show sales", when: "A pair sells in a Whatnot show", then: "One off the Picqer stock, read every 3 minutes during and after the show",
      why: "Shows sell fast; stock must follow", by: "Tasha", built: "2026-04-20", job: "whatnot-orders", file: "rules/whatnot-show.ts" },
    { code: "R-05", name: "Sold-out guard", when: "A size reaches 0 in Picqer", then: "Listings pulled on StockX, Alias, Shopify and Whatnot; the team chat is told",
      why: "No pair sold twice", by: "Dani", built: "2026-01-19", job: "zero-stock", file: "rules/sold-out.ts" },
    { code: "R-07", name: "Last-pair guard", when: "The last pair of a size sells on Alias", then: "That size pulled from StockX EU and StockX US at once",
      why: "Alias and StockX buyers move faster than a 10-minute check", by: "Marco", built: "2026-03-23", job: "alias-orders", file: "rules/last-pair.ts" },
    { code: "R-08", name: "Cancel back to its bin", when: "An Alias buyer cancels", then: "The pair goes back into stock, in the bin it came from",
      why: "Cancelled pairs got lost on the shelves", by: "Jules", built: "2026-02-09", job: "alias-restock", file: "rules/alias-cancel.ts" },
    { code: "R-09", name: "New product linked", when: "A product is added in Picqer", then: "Linked to the same size on StockX and Alias, by style code and size",
      why: "Listing by hand took an afternoon a week", by: "Marco", built: "2026-01-05", job: "picqer-products", file: "rules/link-product.ts" },
    { code: "R-10", name: "Size reader", when: "A Picqer name has no clear size or colour", then: "Read by a language model; unsure ones flagged for a look",
      why: "Names typed in a hurry", by: "Jules", built: "2026-05-18", job: "picqer-products", file: "rules/size-reader.ts" },
    { code: "R-11", name: "Photo finder", when: "A Picqer product has no photo", then: "The sneaker's product shot is found and added in Picqer",
      why: "Listings without photos don't sell", by: "Marco", built: "2026-06-15", job: "picqer-images", file: "rules/photo-finder.ts" },
    { code: "R-12", name: "Unmatched order", when: "An order matches no product", then: "Flagged in the orders list; the stock is left as it is",
      why: "A wrong guess costs more than a look", by: "Jules", built: "2026-09-28", job: null, file: "rules/unmatched.ts" },
    { code: "R-14", name: "Not-listed report", when: "Someone asks in the team chat", then: "A sheet of stock in Picqer not listed on StockX or Alias yet",
      why: "Find money sitting on the shelves", by: "Dani", built: "2026-08-10", job: null, file: "reports/not-listed.ts" },
  ],
  systems: [
    { slug: "picqer", name: "Picqer", kind: "Warehouse: the one stock count", how: "API, every bin", custom: "Bin picker, size reader, photo finder", since: "2026-01-05" },
    { slug: "stockx", name: "StockX", kind: "Marketplace · EU and US accounts", how: "API, sales every 5 min, listings every 8 min", custom: "Last-pair guard, Flex consignment report, lowest-ask check", since: "2026-01-05" },
    { slug: "alias-goat", name: "Alias", kind: "Marketplace · Alias and Alias USA", how: "API, sales every 7 min", custom: "Auto-confirm, cancel back to its bin", since: "2026-01-05" },
    { slug: "shopify", name: "Shopify", kind: "Web store", how: "Webhook, real time", custom: "Sold-out sizes hidden, stock pushed after every sale", since: "2026-03-02" },
    { slug: "whatnot", name: "Whatnot", kind: "Live shows", how: "Read every 3 min", custom: "Only sizes in stock go into a show", since: "2026-04-20" },
    { slug: "google-sheets", name: "Google Sheets", kind: "Partner and team sheets", how: "Sheets API", custom: "Harbourline live stock (EUR/USD), Kiln Street not-listed report", since: "2026-07-13" },
    { slug: "discord", name: "Discord", kind: "Team chat", how: "Bot", custom: "Sold-out alerts, reports on request", since: "2026-01-19" },
  ],
};

export const FERNHOLLOW: DemoClient = {
  id: "boutique",
  name: "Fernhollow",
  monogram: "FH",
  accent: "#9f1239",
  accentSoft: "#ffe4e6",
  accentInk: "#881337",
  about: "Women's boutique: a Shopify store, TikTok Shop LIVE, Amazon, Walmart and Poshmark, one stockroom",
  since: "2026-03-02",
  version: "2.3",
  repo: "fernhollow-ops",
  team: [
    { name: "Mara", role: "Owner and buyer" },
    { name: "Celeste", role: "Operations" },
    { name: "Bri", role: "TikTok LIVE host" },
    { name: "Luis", role: "Stockroom and shipping" },
  ],
  noticeWho: "a women's boutique",
  noticeSetup: "their Shopify store, TikTok Shop, Amazon, Walmart and Poshmark, their stockroom, their carriers and their own rules",
  buildLog: [
    { version: "1.0", date: "2026-03-02", title: "Every order on one count", asked: "Five channels, one stockroom. Make the numbers agree.", by: "Mara",
      done: "Orders from Shopify, TikTok Shop, Amazon and Walmart arrive by webhook, Poshmark every 10 minutes; every size on one count.", days: 2 },
    { version: "1.1", date: "2026-03-16", title: "Sold-out sizes pulled", asked: "Stop selling the last medium on two channels at once.", by: "Celeste",
      done: "A size at 0 comes off every channel on the sale that emptied it; the web store shows it sold out.", days: 1 },
    { version: "1.2", date: "2026-04-06", title: "Labels by weight and speed", asked: "Luis picks the carrier for every parcel by hand.", by: "Luis",
      done: "Labels bought in ShipStation by weight and promised speed; Poshmark orders ship on Poshmark's own prepaid label.", days: 2 },
    { version: "1.3", date: "2026-04-27", title: "LIVE hold", asked: "Pieces in tonight's LIVE keep selling on Amazon before the show.", by: "Bri",
      done: "Two hours before a TikTok LIVE the show's pieces are held back from Amazon and Walmart, and released after.", days: 2 },
    { version: "1.4", date: "2026-05-18", title: "Returns back into stock", asked: "Returns sit in a pile for a week.", by: "Luis",
      done: "A return checked in Loop goes back on every channel, or the exchange size is sent.", days: 1 },
    { version: "2.0", date: "2026-06-22", title: "Faire restocks", asked: "When a Faire order lands, everything should be on sale the same day.", by: "Mara",
      done: "A received Faire order puts the new stock on every channel at once; new products are listed with every size and the photos.", days: 3 },
    { version: "2.1", date: "2026-07-20", title: "Low-stock list", asked: "Tell me what to reorder before the Monday buying call.", by: "Mara",
      done: "A best seller down to 2 in a size lands on the 7:00 reorder list.", days: 1 },
    { version: "2.2", date: "2026-08-31", title: "Assistant routines", asked: "Let Celeste ask for a report without waiting on anyone.", by: "Celeste",
      done: "Routines written from a chat that read the data and post to Slack and Google Sheets. Read-only by design.", days: 3 },
    { version: "2.3", date: "2026-09-21", title: "Return grading", asked: "Worn returns went straight back on sale.", by: "Luis",
      done: "Each return is graded in the stockroom first: back on sale, to Poshmark as pre-loved, or written off.", days: 2 },
  ],
  rules: [
    { code: "F-01", name: "One count for every order", when: "An order comes in on any channel", then: "Stock −1 on every channel, for that size and colour",
      why: "Five channels, one stockroom", by: "Mara", built: "2026-03-02", job: "orders", file: "rules/order-in.ts" },
    { code: "F-02", name: "Last size off everywhere", when: "A size reaches 0", then: "Pulled from every marketplace; shown sold out in the web store",
      why: "No double-sold mediums", by: "Celeste", built: "2026-03-16", job: "soldout", file: "rules/sold-out.ts" },
    { code: "F-03", name: "New piece listed", when: "A new product is published in Shopify", then: "Listed on TikTok Shop, Amazon, Walmart and Poshmark with every size and the photos",
      why: "Listing five times by hand", by: "Mara", built: "2026-06-22", job: "listing", file: "rules/list-new.ts" },
    { code: "F-04", name: "Label picker", when: "An order is paid on any channel", then: "Label in ShipStation by weight and promised speed; Poshmark on its own prepaid label",
      why: "Carrier picked by hand", by: "Luis", built: "2026-04-06", job: "labels", file: "rules/labels.ts" },
    { code: "F-05", name: "Tracking to the buyer", when: "A parcel is scanned by the carrier", then: "AfterShip tracking page and emails; the order marked shipped on its channel",
      why: "Where-is-my-order emails", by: "Celeste", built: "2026-04-06", job: "tracking", file: "rules/tracking.ts" },
    { code: "F-06", name: "LIVE hold", when: "A TikTok LIVE starts in 2 hours", then: "The show's pieces held back from Amazon and Walmart until it ends",
      why: "Show pieces sold out before the show", by: "Bri", built: "2026-04-27", job: "orders", file: "rules/live-hold.ts" },
    { code: "F-07", name: "Return graded, then restocked", when: "A return is checked in Loop", then: "Graded first: +1 on every channel, to Poshmark as pre-loved, or written off",
      why: "Worn returns went back on sale", by: "Luis", built: "2026-09-21", job: "returns", file: "rules/returns.ts" },
    { code: "F-08", name: "Faire restock", when: "A Faire order is received", then: "New stock on every channel the same day",
      why: "Restocks sat in boxes", by: "Mara", built: "2026-06-22", job: "restock", file: "rules/faire-restock.ts" },
    { code: "F-09", name: "Reorder list", when: "A best seller is down to 2 in a size", then: "On the 7:00 reorder list for the Monday buying call",
      why: "Reordering from memory", by: "Mara", built: "2026-07-20", job: "low", file: "reports/reorder.ts" },
  ],
  systems: [
    { slug: "shopify", name: "Shopify", kind: "Web store", how: "Webhook, real time", custom: "Sold-out sizes shown, new pieces listed everywhere from here", since: "2026-03-02" },
    { slug: "tiktok-shop", name: "TikTok Shop", kind: "Social shop and LIVE", how: "Webhook, real time", custom: "LIVE hold before every show", since: "2026-03-02" },
    { slug: "amazon", name: "Amazon", kind: "Marketplace (US)", how: "SP-API notifications", custom: "Held back during LIVE shows", since: "2026-03-02" },
    { slug: "walmart", name: "Walmart", kind: "Marketplace (US)", how: "Webhook, real time", custom: "Held back during LIVE shows", since: "2026-03-02" },
    { slug: "poshmark", name: "Poshmark", kind: "Fashion marketplace", how: "Read every 10 min (no seller API)", custom: "Prepaid label, pre-loved returns", since: "2026-03-02" },
    { slug: "shipstation", name: "ShipStation", kind: "Labels: USPS, UPS, FedEx", how: "API", custom: "Carrier by weight and promised speed, 14:00 cutoff", since: "2026-04-06" },
    { slug: "loop", name: "Loop Returns", kind: "Returns and exchanges", how: "Webhook", custom: "Grading step before restock", since: "2026-05-18" },
    { slug: "faire", name: "Faire", kind: "Wholesale restocks", how: "API", custom: "Same-day restock on every channel", since: "2026-06-22" },
    { slug: "slack", name: "Slack", kind: "Team alerts", how: "Bot", custom: "Sold-out best sellers, LIVE results, returns", since: "2026-03-16" },
    { slug: "google-sheets", name: "Google Sheets", kind: "Buying sheet", how: "Sheets API", custom: "Every size, sold and left, for the buying call", since: "2026-07-20" },
  ],
};

export const DEMO_CLIENTS = { sneaker: NORTHVALE, boutique: FERNHOLLOW } as const;

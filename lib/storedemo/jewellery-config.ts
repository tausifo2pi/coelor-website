// The jewelry demo (/demo/jewellery-shop): Larkmoor, a demo jewelry studio (lib/demo/larkmoor.ts) that designs and sells
// its own line. Its channels, carriers and tools follow what independent US jewelry makers use (lead-outreach
// research_notes/platform_map_2026-10-04.md, US jewelry: Etsy 17 %, eBay 9 %, Amazon 4 %, Faire 4 % next to the web
// store; USPS, UPS, FedEx through ShipStation; AfterShip and Loop Returns): a Shopify store, Etsy, Amazon Handmade and
// eBay for retail, Faire for wholesale to stockists (bigger orders at half the retail price, shipped on Faire's prepaid
// label), and new stock from the casting house each week. No shop counter (lead-outreach v6 rule) and no competitor
// tools. Shopify and Amazon send webhooks (orders in real time); Etsy, eBay and Faire are read every 5 minutes.
// No "@/" imports: node --test loads it.
import type { KindDef, Profile } from "../demo/schedule.ts";
import { jewelleryCatalogAt } from "./jewellery.ts";
import type { DemoConfig } from "./types.ts";

/** The store assistant (lib/storedemo/assistant.ts) in the studio's words, with two routines of its own: the ring size
 * report for the casting order and the Faire wholesale orders sheet. Still read-only: every routine posts to a sheet or
 * the team chat. */
export function jewelleryAssistant(p: Profile, cfg: DemoConfig): Profile {
  const chat = p.posts.find((x) => x.slug === "slack" || x.slug === "discord")?.name ?? "Slack";
  const market = cfg.channels.find((c) => c.id === "amazon")?.name ?? "Amazon";
  const kinds: Record<string, KindDef> = {
    ...p.kinds,
    "reorder-list": {
      ...p.kinds["reorder-list"],
      what: "Best sellers down to 2 or less in a ring size or metal, with the collection and last week's sales, in a sheet for the next casting order.",
      body: [
        "const low = await stock.sizes({ left: \"<=2\", bestSellers: true });",
        "const rows = low.map((s) => [s.collection, s.title, s.metal, s.size, s.left, s.soldLastWeek]);",
        "await sheets.write(SHEET, \"Casting order\", [[\"Collection\", \"Piece\", \"Metal\", \"Size\", \"Left\", \"Sold last week\"], ...rows]);",
      ],
    },
    pickup: {
      ...p.kinds.pickup,
      what: "Today's orders to pack from every channel, with the ring size and metal of each piece, tray by tray in the studio.",
      body: [
        "const open = await orders.list({ status: \"paid\", channel: \"any\" });",
        "const rows = open.flatMap((o) => o.lines.map((l) => [o.channel, o.ref, l.title, l.metal, l.size]));",
        "await sheets.write(SHEET, \"Pick list\", [[\"Channel\", \"Order\", \"Piece\", \"Metal\", \"Size\"], ...rows]);",
      ],
    },
    "returns-report": {
      ...p.kinds["returns-report"],
      what: `Last week's returns from ${cfg.returns.name} by piece and reason, ring resizes apart, in a sheet for the bench.`,
    },
    "ring-sizes": {
      name: "Ring size report",
      what: "Ring sizes sold in the last four weeks, by style and metal, in a sheet for the casting order.",
      logo: "google-sheets",
      uses: ["orders", "sheets"],
      body: [
        "const sold = await orders.lines({ created: \"last 4 weeks\", category: \"Rings\" });",
        "const bySize = sold.countBy((l) => [l.title, l.metal, l.size]);",
        "await sheets.write(SHEET, \"Ring sizes\", [[\"Ring\", \"Metal\", \"Size\", \"Sold\"], ...bySize]);",
      ],
      dry: (n) => `${n * 4 + 30} rings sold in 4 weeks, size 7 the most`,
    },
    wholesale: {
      name: "Faire wholesale orders sheet",
      what: "Open Faire orders from stockists, the pieces to pull and the ship-by date, in a sheet for packing.",
      logo: "faire",
      uses: ["faire", "stock", "sheets"],
      body: [
        "const open = await faire.orders({ state: \"accepted\" });",
        "const rows = open.flatMap((o) => o.items.map((i) => [o.retailer, o.shipBy, i.title, i.metal, i.size, i.quantity]));",
        "await sheets.write(SHEET, \"Faire orders\", [[\"Stockist\", \"Ship by\", \"Piece\", \"Metal\", \"Size\", \"Qty\"], ...rows]);",
      ],
      dry: (n) => `${Math.max(2, Math.round(n / 5))} open Faire orders, ${n + 14} pieces to pull`,
    },
  };
  const named = (kind: string) => ({ kind, name: kinds[kind].name });
  const share: Record<string, string> = { reorder: "the casting order", returns: "the bench" };
  const at = (h: number, m = 0) => ({ h, m });
  return {
    ...p,
    kinds,
    kindOf: (t) => {
      if (/\bring ?sizes?\b/.test(t) && !/\b(low|reorder|re-order|running)\b/.test(t)) return named("ring-sizes");
      if (/\b(faire|wholesale|stockists?)\b/.test(t)) return named("wholesale");
      return p.kindOf(t);
    },
    greeting: `Hi! I'm in beta: I build routines that get data from your build and post it to your team, in Google Sheets, Excel, ${chat} or ${chat === "Slack" ? "Discord" : "Slack"}. Tell me what you need and when. I write the routine's script, test it without changing anything, and put it on a schedule. For example: a low-stock reorder list every morning, a ring size report for the casting order, or a daily sales summary to ${chat}.`,
    startChips: [
      { id: "reorder-morning", text: "Low-stock reorder list every morning at 7:00" },
      { id: "ring-sizes-monday", text: "Ring size report every Monday at 8:00" },
      { id: "wholesale-weekdays", text: "Faire wholesale orders sheet every weekday at 8:30" },
      { id: "summary-daily", text: `Daily sales summary to ${chat} at 18:00` },
      { id: "arrivals-morning", text: "New arrivals check every morning at 9:00" },
    ],
    whatChips: [
      { id: "what-reorder", text: "Low-stock reorder list" },
      { id: "what-ring-sizes", text: "Ring size report" },
      { id: "what-wholesale", text: "Faire wholesale orders sheet" },
      { id: "what-summary", text: "Daily sales summary" },
      { id: "what-pick", text: "Pick list" },
    ],
    askWhat: `What should run? A sheet (low-stock reorder list, ring size report, pick list, returns report), a check on a channel (Faire wholesale orders, new arrivals check, ${market} price check), or a sales summary for ${chat}.`,
    askWhatWhen: (when) => `Sure, ${when}. What should run: a sheet (reorder list, ring size report, pick list) or a check on a channel, like the Faire wholesale orders?`,
    seeded: [
      ...p.seeded.map((s) => (share[s.id] ? { ...s, share: share[s.id] } : s)),
      { id: "wholesale", kind: "wholesale", name: kinds.wholesale.name, freq: { type: "weekdays", at: at(8, 30) }, share: "packing", seeded: true, anchor: 0 },
      { id: "ringsizes", kind: "ring-sizes", name: kinds["ring-sizes"].name, freq: { type: "weekly", day: 1, at: at(8) }, share: "the casting order", seeded: true, anchor: 0 },
    ],
  };
}

export const JEWELLERY_SHOP: DemoConfig = {
  slug: "jewellery-shop",
  label: "Custom build",
  goods: "Jewelry",
  who: "one jewelry studio",
  setup: "their Shopify store, Etsy, Amazon Handmade, eBay and Faire wholesale, their studio stock, their carriers and their own rules",
  item: "piece",
  items: "pieces",
  catalog: { seed: "jewellery-shop-1", newest: 120, best: 30, dropDays: [4], perDrop: [4, 7], build: jewelleryCatalogAt },
  tz: "America/New_York",
  since: [2026, 4, 6],
  stock: { name: "Studio", logo: "stockroom", role: "Counts the stock", detail: "1 studio · every ring size and metal on one count" },
  channels: [
    { id: "shopify", name: "Shopify", logo: "shopify", role: "Web store", account: "Online store", rhythm: "store", perDay: [10, 16], listShare: 1, refStart: 6_120, every: "real time", realtime: true },
    { id: "etsy", name: "Etsy", logo: "etsy", role: "Handmade marketplace", account: "Etsy shop", rhythm: "steady", perDay: [8, 13], listShare: 0.92, refStart: 3_418_200_000, every: "every 5 min", pollMin: 5 },
    { id: "amazon", name: "Amazon Handmade", logo: "amazon", role: "Handmade marketplace", account: "Handmade (US)", rhythm: "steady", perDay: [3, 6], listShare: 0.55, refStart: 112_400, every: "real time", realtime: true },
    { id: "ebay", name: "eBay", logo: "ebay", role: "Marketplace", account: "eBay store (US)", rhythm: "steady", perDay: [2, 4], listShare: 0.42, refStart: 18_204_000, every: "every 5 min", pollMin: 5 },
    { id: "faire", name: "Faire", logo: "faire", role: "Wholesale to stockists", account: "Brand portal", rhythm: "steady", perDay: [0, 2], listShare: 0.68, refStart: 7_310_000, every: "every 5 min", pollMin: 5,
      lines: [6, 14], priceShare: 0.5, label: { service: "Faire prepaid label · UPS Ground", carrier: 1 } },
  ],
  shipping: {
    tool: { name: "ShipStation", logo: "shipstation", role: "Labels and packing slips" },
    carriers: [
      { name: "USPS", service: "USPS Ground Advantage", logo: "usps", share: 0.68, days: [2, 5] },
      { name: "UPS", service: "UPS Ground", logo: "ups", share: 0.24, days: [1, 5] },
      { name: "FedEx", service: "FedEx 2Day", logo: "fedex", share: 0.08, days: [1, 2] },
    ],
    cutoffHour: 14,
  },
  tracking: { name: "AfterShip", logo: "aftership", role: "Tracking page and emails" },
  returns: { name: "Loop Returns", logo: "loop", role: "Returns, exchanges and resizes", rate: 0.07, reasons: ["Didn't fit", "Changed my mind", "Smaller than expected", "Metal tone not as expected", "Gift, exchanging"] },
  restock: { name: "Casting house", logo: "casting", role: "Casting batches", weekday: 3 },
  // engine weights per size: ring sizes by how often US buyers wear them, 18" the chain length most buy
  sizes: { "5": 0.06, "5.5": 0.05, "6": 0.16, "6.5": 0.12, "7": 0.2, "7.5": 0.11, "8": 0.14, "8.5": 0.06, "9": 0.07, "10": 0.03, '16"': 0.3, '18"': 0.5, '20"': 0.2, "One size": 1 },
  more: [
    { slug: "tiktok-shop", name: "TikTok Shop", why: "short videos and LIVE" },
    { slug: "instagram", name: "Instagram", why: "shoppable posts" },
    { slug: "walmart", name: "Walmart", why: "a bigger marketplace" },
  ],
  // the team's tools: the assistant's routines post to the connected chat (lib/storedemo/assistant.ts)
  tools: [
    { slug: "google-sheets", name: "Google Sheets", role: "Casting and repairs sheets", detail: "Reorder list for the casting order, ring sizes, repair tickets", on: true },
    { slug: "slack", name: "Slack", role: "Team alerts", detail: "Sold-out best sellers, Faire orders and repairs", on: true },
  ],
  // no jewelry case study: "How it works" is the homepage's process, "Plan my own build" its contact form
  caseHref: "/#process",
  contactHref: "/#contact",
  pitch: "web store, Etsy, Amazon Handmade, eBay, Faire wholesale, studio stock and carriers",
  assistant: jewelleryAssistant,
};

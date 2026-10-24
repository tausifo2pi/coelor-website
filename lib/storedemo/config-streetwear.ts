// The streetwear demo (/demo/streetwear-shop): one independent streetwear shop, the demo shop Cinderlot
// (lib/demo/client-streetwear.ts), with its own label, a few small labels it stocks and some pre-owned archive pieces
// (lib/storedemo/catalog-streetwear.ts). Its channels, carriers and tools follow what streetwear sellers use
// (lead-outreach research_notes/platform_map_2026-10-04.md, apparel/streetwear: TikTok Shop is the top marketplace next
// to the web store, then eBay; USPS and UPS, ShipStation, AfterShip and Loop Returns; resale of pre-owned pieces on
// eBay, Depop and Grailed; live selling on TikTok). A weekly drop on the web store, Thursday 11:00 Pacific, sells out
// fast; pre-owned pieces are one unit each, listed on the web store and the resale apps, and pulled everywhere on a
// sale. No shop counter (the v6 rule: a shop's till is never shown as something we connect), no StockX or GOAT (they
// list only catalogue products of the big labels, not a shop's own label), no competitor tools.
// Shopify, TikTok Shop and eBay send order notifications (real time); Grailed has no seller API and Depop is read on a
// schedule (every 10 min). Grailed and Depop sell on their own prepaid USPS labels.
// No "@/" imports: node --test loads it.
import { streetwearRoutines } from "./assistant-streetwear.ts";
import { streetwearCatalogAt } from "./catalog-streetwear.ts";
import type { DemoConfig } from "./types.ts";

export const STREETWEAR_SHOP: DemoConfig = {
  slug: "streetwear-shop",
  label: "Custom build",
  goods: "Streetwear",
  who: "one streetwear shop",
  setup: "their Shopify drops, TikTok Shop, eBay, Grailed and Depop, their stockroom, their carriers and their own rules",
  item: "piece",
  items: "pieces",
  catalog: { seed: "streetwear-shop-1", newest: 150, best: 30, dropDays: [4], perDrop: [9, 12], build: streetwearCatalogAt },
  tz: "America/Los_Angeles",
  since: [2026, 4, 6],
  stock: { name: "Stockroom", logo: "stockroom", role: "Counts the stock", detail: "1 location · every size on one count" },
  channels: [
    { id: "shopify", name: "Shopify", logo: "shopify", role: "Web store and drops", account: "Online store", rhythm: "store", perDay: [14, 24], listShare: 1, refStart: 31_480, every: "real time", realtime: true,
      burst: { at: 11 * 60, span: 150, orders: [45, 80] } },
    { id: "tiktok", name: "TikTok Shop", logo: "tiktok-shop", role: "Social shop and LIVE", account: "Shop + LIVE", rhythm: "live", perDay: [4, 8], showDays: [0, 3], perShow: [14, 30], listShare: 0.7, refStart: 5_904_000, every: "real time", realtime: true,
      never: ["Pre-owned"] },
    { id: "ebay", name: "eBay", logo: "ebay", role: "Marketplace", account: "eBay store (US)", rhythm: "steady", perDay: [4, 7], listShare: 0.42, refStart: 412_000, every: "real time", realtime: true,
      always: ["Pre-owned"] },
    { id: "grailed", name: "Grailed", logo: "grailed", role: "Resale marketplace", account: "Seller profile", rhythm: "steady", perDay: [2, 4], listShare: 0.24, refStart: 76_300, every: "every 10 min", pollMin: 10,
      always: ["Pre-owned"], label: { service: "Grailed prepaid label · USPS", carrier: 0 } },
    { id: "depop", name: "Depop", logo: "depop", role: "Resale marketplace", account: "Depop shop", rhythm: "steady", perDay: [2, 4], listShare: 0.3, refStart: 158_900, every: "every 10 min", pollMin: 10,
      always: ["Pre-owned"], label: { service: "Depop shipping label · USPS", carrier: 0 } },
  ],
  shipping: {
    tool: { name: "ShipStation", logo: "shipstation", role: "Labels and packing slips" },
    carriers: [
      { name: "USPS", service: "USPS Ground Advantage", logo: "usps", share: 0.6, days: [2, 5] },
      { name: "UPS", service: "UPS Ground", logo: "ups", share: 0.32, days: [1, 5] },
      { name: "FedEx", service: "FedEx 2Day", logo: "fedex", share: 0.08, days: [1, 2] },
    ],
    cutoffHour: 14,
  },
  tracking: { name: "AfterShip", logo: "aftership", role: "Tracking page and emails" },
  returns: { name: "Loop Returns", logo: "loop", role: "Returns and exchanges", rate: 0.06, reasons: ["Too small", "Too big", "Fit too boxy", "Changed my mind", "Colour not as expected"] },
  // the shop's own label is made by its print shop: a run is marked received in the production sheet
  restock: { name: "Production sheet", logo: "google-sheets", role: "Print-shop runs", weekday: 2, title: "Production run received", rule: "Production runs",
    when: "A run is marked received in the production sheet", brands: ["Cinderlot"] },
  sizes: { S: 0.13, M: 0.29, L: 0.31, XL: 0.19, XXL: 0.08 },
  more: [
    { slug: "stockx", name: "StockX", why: "for deadstock of the big labels" },
    { slug: "whatnot", name: "Whatnot", why: "live shows" },
    { slug: "poshmark", name: "Poshmark", why: "pre-owned pieces" },
    { slug: "mercari", name: "Mercari", why: "pre-owned pieces" },
    { slug: "etsy", name: "Etsy", why: "one-off customs" },
    { slug: "facebook-marketplace", name: "Facebook Marketplace", why: "local buyers" },
  ],
  // the team's tools: the assistant's routines post to the connected chat (lib/storedemo/assistant.ts)
  tools: [
    { slug: "google-sheets", name: "Google Sheets", role: "Production and consignor sheets", detail: "Runs from the print shop, sizes to reprint, consignor payouts", on: true },
    { slug: "discord", name: "Discord", role: "Team server", detail: "Drop sell-outs, LIVE results and returns", on: true },
  ],
  // no streetwear case page: "How it works" is the homepage's "What we build", the plan button its contact form
  caseHref: "/#build",
  contactHref: "/#contact",
  // the drop recap, the consignor payout sheet and the reprint list (lib/storedemo/assistant-streetwear.ts)
  assistant: streetwearRoutines,
};

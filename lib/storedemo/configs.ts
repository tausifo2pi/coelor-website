// The store demos, one config each (lib/storedemo/types.ts). The channels, warehouse, carriers and tools of a demo
// follow what sellers of those goods use (lead-outreach research_notes/platform_map_2026-10-04.md): US women's clothing
// shops sell on TikTok Shop and Amazon next to their web store, ship with USPS and UPS through ShipStation, track with
// AfterShip and take returns through Loop; they buy their stock wholesale on Faire. Competitor tools are never shown.
// Shopify, TikTok Shop, Amazon and Walmart send webhooks (orders in real time); Poshmark has no seller API (read every 10 min).
// No "@/" imports: node --test loads it.
import type { DemoConfig } from "./types.ts";

export const WOMENS_BOUTIQUE: DemoConfig = {
  slug: "womens-boutique",
  label: "Custom build",
  goods: "Women's clothing",
  who: "one women's boutique",
  setup: "their Shopify store, TikTok Shop, Amazon, Walmart and Poshmark, their stockroom, their carriers and their own rules",
  item: "piece",
  items: "pieces",
  catalog: { seed: "womens-boutique-1", newest: 148, best: 40, dropDays: [2, 4], perDrop: [6, 9] },
  tz: "America/Chicago",
  since: [2026, 3, 2],
  stock: { name: "Stockroom", logo: "stockroom", role: "Counts the stock", detail: "1 location · every size on one count" },
  channels: [
    { id: "shopify", name: "Shopify", logo: "shopify", role: "Web store", account: "Online store", rhythm: "store", perDay: [22, 34], listShare: 1, refStart: 18_240, every: "real time", realtime: true },
    { id: "tiktok", name: "TikTok Shop", logo: "tiktok-shop", role: "Social shop and LIVE", account: "Shop + LIVE", rhythm: "live", perDay: [5, 9], showDays: [2, 4, 0], perShow: [16, 38], listShare: 0.82, refStart: 5_770_000, every: "real time", realtime: true },
    { id: "amazon", name: "Amazon", logo: "amazon", role: "Marketplace", account: "Seller Central (US)", rhythm: "steady", perDay: [6, 11], listShare: 0.56, refStart: 114_000, every: "real time", realtime: true },
    { id: "walmart", name: "Walmart", logo: "walmart", role: "Marketplace", account: "Marketplace (US)", rhythm: "steady", perDay: [3, 6], listShare: 0.45, refStart: 208_400, every: "real time", realtime: true },
    { id: "poshmark", name: "Poshmark", logo: "poshmark", role: "Fashion marketplace", account: "Boutique closet", rhythm: "steady", perDay: [2, 4], listShare: 0.38, refStart: 64_800, every: "every 10 min", pollMin: 10,
      label: { service: "Poshmark prepaid label · USPS Priority Mail", carrier: 0 } },
  ],
  shipping: {
    tool: { name: "ShipStation", logo: "shipstation", role: "Labels and packing slips" },
    carriers: [
      { name: "USPS", service: "USPS Ground Advantage", logo: "usps", share: 0.62, days: [2, 5] },
      { name: "UPS", service: "UPS Ground", logo: "ups", share: 0.28, days: [1, 5] },
      { name: "FedEx", service: "FedEx Home Delivery", logo: "fedex", share: 0.1, days: [2, 4] },
    ],
    cutoffHour: 14,
  },
  tracking: { name: "AfterShip", logo: "aftership", role: "Tracking page and emails" },
  returns: { name: "Loop Returns", logo: "loop", role: "Returns and exchanges", rate: 0.11, reasons: ["Too small", "Too big", "Changed my mind", "Colour not as expected", "Arrived late"] },
  restock: { name: "Faire", logo: "faire", role: "Wholesale restocks", weekday: 1 },
  sizes: { XS: 0.05, S: 0.3, M: 0.36, L: 0.22, XL: 0.05, "1X": 0.01, "2X": 0.01 },
  more: [
    { slug: "ebay", name: "eBay", why: "for last season and samples" },
    { slug: "etsy", name: "Etsy", why: "for vintage and handmade lines" },
    { slug: "depop", name: "Depop", why: "younger buyers" },
    { slug: "whatnot", name: "Whatnot", why: "live shows" },
    { slug: "facebook-marketplace", name: "Facebook Marketplace", why: "local buyers" },
    { slug: "faire", name: "Faire", why: "selling your own label wholesale" },
  ],
  // the team's tools: the assistant's routines post to the connected chat (lib/storedemo/assistant.ts)
  tools: [
    { slug: "google-sheets", name: "Google Sheets", role: "Daily stock sheet", detail: "Every size, sold and left, for the buying meeting", on: true },
    { slug: "slack", name: "Slack", role: "Team alerts", detail: "Sold-out best sellers, LIVE results and returns", on: true },
  ],
  caseHref: "/case-studies/womens-boutique",
  contactHref: "/case-studies/womens-boutique#contact",
};

export const STORE_DEMOS: DemoConfig[] = [WOMENS_BOUTIQUE];
export const demoBySlug = (slug: string): DemoConfig | null => STORE_DEMOS.find((d) => d.slug === slug) ?? null;

// The store demos, one config each (lib/storedemo/types.ts). The channels, warehouse, carriers and tools of a demo
// follow what sellers of those goods use (lead-outreach research_notes/platform_map_2026-10-04.md): US women's clothing
// shops sell on TikTok Shop and Amazon next to their web store, ship with USPS and UPS through ShipStation, track with
// AfterShip and take returns through Loop; they buy their stock wholesale on Faire. Competitor tools are never shown.
// No "@/" imports: node --test loads it.
import type { DemoConfig } from "./types.ts";

export const WOMENS_BOUTIQUE: DemoConfig = {
  slug: "womens-boutique",
  label: "Multi-platform sync",
  goods: "Women's clothing",
  item: "piece",
  items: "pieces",
  store: { domain: "lane201.com", newest: 120, bestCollection: "bestsellers" },
  tz: "America/Chicago",
  since: [2026, 3, 2],
  stock: { name: "Stockroom", logo: "stockroom", role: "Counts the stock", detail: "1 location · every size on one count" },
  channels: [
    { id: "shopify", name: "Shopify", logo: "shopify", role: "Web store", account: "Online store", rhythm: "store", perDay: [22, 34], listShare: 1, refStart: 18_240, every: "every 2 min" },
    { id: "tiktok", name: "TikTok Shop", logo: "tiktok-shop", role: "Social shop and LIVE", account: "Shop + LIVE", rhythm: "live", perDay: [5, 9], showDays: [2, 4, 0], perShow: [16, 38], listShare: 0.82, refStart: 5_770_000, every: "every 3 min" },
    { id: "amazon", name: "Amazon", logo: "amazon", role: "Marketplace", account: "Seller Central (US)", rhythm: "steady", perDay: [6, 11], listShare: 0.56, refStart: 114_000, every: "every 5 min" },
    { id: "walmart", name: "Walmart", logo: "walmart", role: "Marketplace", account: "Marketplace (US)", rhythm: "steady", perDay: [3, 6], listShare: 0.45, refStart: 208_400, every: "every 5 min" },
    { id: "poshmark", name: "Poshmark", logo: "poshmark", role: "Fashion marketplace", account: "Boutique closet", rhythm: "steady", perDay: [2, 4], listShare: 0.38, refStart: 64_800, every: "every 10 min",
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
  moreTools: [
    { slug: "shipbob", name: "ShipBob", why: "a 3PL instead of the stockroom" },
    { slug: "shiphero", name: "ShipHero", why: "a 3PL instead of the stockroom" },
  ],
  tools: [
    { slug: "google-sheets", name: "Google Sheets", role: "Daily stock sheet", detail: "Every size, sold and left, for the buying meeting", on: true },
    { slug: "slack", name: "Slack", role: "Team alerts", detail: "Sold-out best sellers, LIVE results and returns", on: true },
    { slug: "claude", name: "Claude", role: "Use the assistant from Claude", detail: "Ask stock, orders and routines in the Claude app (beta, read-only)" },
    { slug: "chatgpt", name: "ChatGPT", role: "Use the assistant from ChatGPT", detail: "Ask stock, orders and routines in the ChatGPT app (beta, read-only)" },
    { slug: "openai", name: "OpenAI", role: "Product texts", detail: "Titles, size charts and channel descriptions" },
    { slug: "excel", name: "Excel", role: "Stock and sales export", detail: "The same sheet for Microsoft 365" },
    { slug: "discord", name: "Discord", role: "Team alerts" },
    { slug: "gemini", name: "Gemini", role: "AI assistant" },
    { slug: "gmail", name: "Gmail", role: "Order and return emails" },
    { slug: "whatsapp", name: "WhatsApp", role: "Order updates to buyers" },
    { slug: "mailchimp", name: "Mailchimp", role: "Back-in-stock emails" },
    { slug: "hubspot", name: "HubSpot", role: "Customer lists" },
    { slug: "zendesk", name: "Zendesk", role: "Order lookup for support" },
    { slug: "quickbooks", name: "QuickBooks", role: "Sales into the books" },
    { slug: "xero", name: "Xero", role: "Sales into the books" },
    { slug: "notion", name: "Notion", role: "Buying plan and notes" },
    { slug: "airtable", name: "Airtable", role: "Product planning base" },
    { slug: "google-drive", name: "Google Drive", role: "Product photos" },
  ],
  caseHref: "/case-studies/womens-boutique",
  contactHref: "/case-studies/womens-boutique#contact",
};

export const STORE_DEMOS: DemoConfig[] = [WOMENS_BOUTIQUE];
export const demoBySlug = (slug: string): DemoConfig | null => STORE_DEMOS.find((d) => d.slug === slug) ?? null;

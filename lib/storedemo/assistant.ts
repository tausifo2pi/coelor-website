// A store demo's assistant (the Assistant section of /demo/<slug>): the same chat and scheduler as the sneaker demo
// (lib/demo/schedule.ts, components/demo/SheetAssistant.tsx), with the routines a shop of these goods asks for, in the
// shop's time zone: a low-stock reorder list for the buyer, the LIVE lineup sheet, a sales summary to Slack, a new
// arrivals check, a price check, a returns report and a pick list. Beta: read-only, posting to the team's tools only.
// No network, no AI: a deterministic parser.
// No "@/" imports: node --test loads it.
import { SNEAKER, type Chip, type KindDef, type Profile, type Schedule } from "../demo/schedule.ts";
import type { DemoConfig } from "./types.ts";

const MINUTE = 60_000;
const join = (xs: string[]) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);

export function storeAssistant(cfg: DemoConfig): Profile {
  const web = cfg.channels[0];
  const live = cfg.channels.find((c) => c.rhythm === "live") ?? null;
  const market = cfg.channels.find((c) => c.id === "amazon") ?? cfg.channels.find((c) => c.rhythm === "steady") ?? web;
  const others = cfg.channels.slice(1);
  const chat = cfg.tools.find((t) => t.on && /slack|discord/.test(t.slug)) ?? { slug: "slack", name: "Slack" };
  const chatMod = chat.slug === "discord" ? "discord" : "slack";
  const mod = (id: string) => id.replace(/[^a-z]/g, "");

  const kinds: Record<string, KindDef> = {
    "reorder-list": {
      name: "Low-stock reorder list",
      what: "Best sellers down to 2 or less in a size, with the brand and last week's sales, in a sheet for the buyer.",
      logo: "google-sheets",
      uses: ["stock", "sheets"],
      body: [
        "const low = await stock.sizes({ left: \"<=2\", bestSellers: true });",
        "const rows = low.map((s) => [s.brand, s.title, s.color, s.size, s.left, s.soldLastWeek]);",
        "await sheets.write(SHEET, \"Reorder\", [[\"Brand\", \"Product\", \"Colour\", \"Size\", \"Left\", \"Sold last week\"], ...rows]);",
      ],
      dry: (n) => `${n} sizes down to 2 or less, ${Math.max(2, Math.round(n / 3))} of them best sellers`,
    },
    pickup: {
      name: "Pick list",
      what: `Today's orders to pack from every channel, with size and colour, in the order the ${cfg.stock.name.toLowerCase()} is laid out.`,
      uses: ["orders", "sheets"],
      body: [
        "const open = await orders.list({ status: \"paid\", channel: \"any\" });",
        "const rows = open.flatMap((o) => o.lines.map((l) => [o.channel, o.ref, l.title, l.color, l.size]));",
        "await sheets.write(SHEET, \"Pick list\", [[\"Channel\", \"Order\", \"Product\", \"Colour\", \"Size\"], ...rows]);",
      ],
      dry: (n) => `${n} orders to pack from ${cfg.channels.length} channels`,
    },
    "daily-summary": {
      name: "Daily sales summary",
      what: `Orders per channel, sold-out sizes and returns, posted to ${chat.name}.`,
      logo: chat.slug,
      uses: ["orders", "stock", chatMod, "summary"],
      body: [
        "const today = await orders.list({ created: \"today\" });",
        "const soldOut = await stock.sizes({ left: 0, changed: \"today\" });",
        `await ${chatMod}.post(CHANNEL, summary.byChannel(today, { soldOut }));`,
      ],
      dry: (n) => `${n + 40} orders today across ${cfg.channels.length} channels`,
    },
    "returns-report": {
      name: "Weekly returns report",
      what: `Last week's returns from ${cfg.returns.name} by product and reason, in a sheet for the buyer.`,
      logo: cfg.returns.logo,
      uses: [mod(cfg.returns.logo), "dates", "sheets"],
      body: [
        "const week = dates.lastWeek();",
        `const returns = await ${mod(cfg.returns.logo)}.returns({ from: week.start, to: week.end });`,
        "await sheets.write(SHEET, week.label, returns.byProduct([\"reason\", \"size\", \"refund\"]));",
      ],
      dry: (n) => `${Math.round(n / 2) + 4} returns last week, most often "${cfg.returns.reasons[0]}"`,
    },
    "arrivals-check": {
      name: "New arrivals check",
      what: `New products from the last day and the channels they are not on yet, in a sheet for the team.`,
      logo: web.logo,
      uses: [mod(web.id), ...others.map((c) => mod(c.id)), "sheets"],
      body: [
        `const fresh = await ${mod(web.id)}.products({ published: "last 24 hours" });`,
        `const on = { ${others.map((c) => `${mod(c.id)}: await ${mod(c.id)}.skus()`).join(", ")} };`,
        `await sheets.write(SHEET, "New arrivals", fresh.map((p) => [p.title, ...${JSON.stringify(others.map((c) => mod(c.id)))}.map((c) => (on[c].has(p.sku) ? "listed" : "not yet"))]));`,
      ],
      dry: (n) => `${Math.max(2, Math.round(n / 6))} new products, ${Math.max(1, Math.round(n / 12))} not on every channel yet`,
    },
    "price-check": {
      name: `${market.name} price check`,
      what: `Flags ${market.name} listings priced differently from the web store, in a sheet for the team.`,
      logo: market.logo,
      uses: [mod(market.id), mod(web.id), "sheets"],
      body: [
        `const listings = await ${mod(market.id)}.listings({ status: "active" });`,
        `const prices = await ${mod(web.id)}.prices(listings.map((l) => l.sku));`,
        "await sheets.write(SHEET, \"Price differences\", listings.filter((l) => l.price !== prices[l.sku]).map((l) => [l.sku, l.title, l.price, prices[l.sku]]));",
      ],
      dry: (n) => `${Math.max(1, Math.round(n / 8))} listings priced differently`,
    },
    custom: {
      name: "Custom sheet",
      what: "It takes the columns you pick from the stock count.",
      uses: ["stock", "sheets"],
      body: ["const rows = await stock.sizes();", "await sheets.write(SHEET, NAME, rows.map((s) => [s.sku, s.title, s.color, s.size, s.left]), { header: true });"],
      dry: (n) => `${n * 30} rows`,
    },
  };
  if (live) {
    kinds["live-lineup"] = {
      name: `${live.name} LIVE lineup sheet`,
      what: "The sizes in stock for tonight's show, in a sheet for the host, so nothing goes into the show that isn't there.",
      logo: live.logo,
      uses: ["stock", mod(live.id), "sheets"],
      body: [
        `const show = await ${mod(live.id)}.nextLive();`,
        "const sizes = await stock.sizes({ left: \">0\", tag: \"live\" });",
        "await sheets.write(SHEET, show.title, sizes.map((s) => [s.sku, s.title, s.color, s.size, s.left]));",
      ],
      dry: (n) => `${n * 3} sizes in stock for the next show`,
    };
  }

  const at = (h: number, m = 0) => ({ h, m });
  const seeded: Schedule[] = [
    { id: "reorder", kind: "reorder-list", name: kinds["reorder-list"].name, freq: { type: "daily", at: at(7) }, share: "the buyer", seeded: true, anchor: 0 },
    { id: "pick", kind: "pickup", name: "Pick list", freq: { type: "weekdays", at: at(8) }, share: `the ${cfg.stock.name.toLowerCase()}`, seeded: true, anchor: 0 },
    { id: "arrivals", kind: "arrivals-check", name: kinds["arrivals-check"].name, freq: { type: "daily", at: at(9) }, share: "the team", seeded: true, anchor: 0 },
    ...(live ? [{ id: "lineup", kind: "live-lineup", name: kinds["live-lineup"].name, freq: { type: "daily" as const, at: at(18, 30) }, share: "the show host", seeded: true, anchor: 0 }] : []),
    { id: "price", kind: "price-check", name: kinds["price-check"].name, freq: { type: "hours", n: 6 }, share: "the team", seeded: true, anchor: 11 * MINUTE },
    { id: "returns", kind: "returns-report", name: kinds["returns-report"].name, freq: { type: "weekly", day: 1, at: at(9) }, share: "the buyer", seeded: true, anchor: 0 },
    { id: "summary", kind: "daily-summary", name: kinds["daily-summary"].name, freq: { type: "daily", at: at(18) }, share: `#team in ${chat.name}`, seeded: true, anchor: 0 },
  ];

  const startChips: Chip[] = [
    { id: "reorder-morning", text: "Low-stock reorder list every morning at 7:00" },
    ...(live ? [{ id: "lineup-daily", text: `${live.name} LIVE lineup sheet every day at 18:30` }] : []),
    { id: "summary-daily", text: `Daily sales summary to ${chat.name} at 18:00` },
    { id: "arrivals-morning", text: "New arrivals check every morning at 9:00" },
    { id: "returns-monday", text: "Weekly returns report every Monday at 9:00" },
  ];

  function kindOf(t: string): { kind: string; name: string } | null {
    const k = (kind: string) => ({ kind, name: kinds[kind].name });
    if (live && /\b(live|show)\b/.test(t) && /\b(line ?-?up|list|sizes)\b/.test(t)) return k("live-lineup");
    if (/\b(summary|recap|digest)\b/.test(t) || (/\b(slack|discord|team chat)\b/.test(t) && /\b(sales|orders)\b/.test(t))) return k("daily-summary");
    if (/\b(low|reorder|re-order|restock|running out|running low)\b/.test(t)) return k("reorder-list");
    if (/\bnew (arrivals?|products?|styles?|drops?)\b/.test(t)) return k("arrivals-check");
    if (/\b(price|prices|pricing)\b/.test(t)) return k("price-check");
    if (/\breturns?\b|\brefunds?\b/.test(t)) return k("returns-report");
    if (/\bpick\s*-?\s*(up|list)s?\b|\bpicking\b|\bpacking\b|\bto pack\b|\bpick\b/.test(t)) return k("pickup");
    const m = /\b([a-z]+)\s+(sheet|report|list|export|overview)\b/.exec(t);
    if (m && !["a", "an", "the", "my", "our", "new", "google", "every", "each"].includes(m[1])) return { kind: "custom", name: `${m[1].charAt(0).toUpperCase()}${m[1].slice(1)} ${m[2]}` };
    return null;
  }

  const sources: Record<string, string> = {
    stock: cfg.stock.name, orders: join(cfg.channels.map((c) => c.name)), sheets: "Google Sheets", slack: "Slack", discord: "Discord",
    ...Object.fromEntries(cfg.channels.map((c) => [mod(c.id), c.name])),
    [mod(cfg.returns.logo)]: cfg.returns.name,
  };

  return {
    kinds,
    kindOf,
    greeting: `Hi! I'm in beta: I build routines that get data from your build and post it to your team, in Google Sheets, Excel, ${chat.name} or ${chat.name === "Slack" ? "Discord" : "Slack"}. Tell me what you need and when. I write the routine's script, test it without changing anything, and put it on a schedule. For example: a low-stock reorder list every morning${live ? `, tonight's ${live.name} LIVE lineup sheet` : ""}, or a daily sales summary to ${chat.name}.`,
    startChips,
    whatChips: [
      { id: "what-reorder", text: "Low-stock reorder list" },
      ...(live ? [{ id: "what-lineup", text: `${live.name} LIVE lineup sheet` }] : []),
      { id: "what-summary", text: "Daily sales summary" },
      { id: "what-pick", text: "Pick list" },
    ],
    whenChips: SNEAKER.whenChips,
    askWhat: `What should run? A sheet (low-stock reorder list, pick list, returns report), a check on a channel (${[live ? `${live.name} LIVE lineup sheet` : "", "new arrivals check", `${market.name} price check`].filter(Boolean).join(", ")}), or a sales summary for ${chat.name}.`,
    askWhatWhen: (when) => `Sure, ${when}. What should run: a sheet (reorder list, pick list, returns report) or a check on a channel, like the new arrivals check?`,
    seeded,
    tz: cfg.tz,
    tzName: cfg.tz.split("/").pop()!.replace(/_/g, " "),
    trigger: { event: "orders.created", text: `runs on each order from ${join(cfg.channels.map((c) => c.name))}` },
    sources,
    consts: (s) => [
      ...(s.kind === "custom" ? [`const NAME = ${JSON.stringify(s.name)};`] : []),
      ...(s.kind === "daily-summary" ? [`const CHANNEL = ${chatMod}.channel(${JSON.stringify(s.share ?? "#team")});`] : []),
    ],
    posts: [
      { slug: "google-sheets", name: "Google Sheets" }, { slug: "excel", name: "Excel" },
      ...(chatMod === "slack" ? [{ slug: "slack", name: "Slack" }, { slug: "discord", name: "Discord" }] : [{ slug: "discord", name: "Discord" }, { slug: "slack", name: "Slack" }]),
    ],
    targets: [...cfg.channels.map((c) => c.name.toLowerCase().split(" ")[0]), ...cfg.more.map((m) => m.name.toLowerCase().split(" ")[0]), "instagram", "facebook", "tiktok", "x", "twitter"].join("|"),
    insteadChips: [
      { id: "instead-arrivals", text: "New arrivals check every morning at 9:00" },
      { id: "instead-reorder", text: "Low-stock reorder list every morning at 7:00" },
      { id: "instead-summary", text: `Daily sales summary to ${chat.name} at 18:00` },
    ],
  };
}

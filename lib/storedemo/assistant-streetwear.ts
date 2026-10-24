// The streetwear demo's assistant (/demo/streetwear-shop): the store demos' assistant (lib/storedemo/assistant.ts) with
// the two routines a streetwear shop asks for on top: a drop recap to the team's Discord after every drop (how each
// piece and size sold, what sold out first and on which channel) and the consignor payout sheet for Monday. Beta and
// read-only like every assistant here: routines read the data and post to the team's tools only; a request to change a
// listing, a price or the stock is refused (lib/demo/schedule.ts writes()).
// No "@/" imports: node --test loads it.
import type { Chip, KindDef, Profile, Schedule } from "../demo/schedule.ts";
import { storeAssistant } from "./assistant.ts";
import type { DemoConfig } from "./types.ts";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** A store demo's assistant: the streetwear shop's own routines on top of the store demos' ones. */
export function assistantFor(cfg: DemoConfig): Profile {
  return cfg.catalog.kind === "streetwear" ? streetwearAssistant(cfg) : storeAssistant(cfg);
}

export function streetwearAssistant(cfg: DemoConfig): Profile {
  const base = storeAssistant(cfg);
  const chat = cfg.tools.find((t) => t.on && /slack|discord/.test(t.slug)) ?? { slug: "discord", name: "Discord" };
  const chatMod = chat.slug === "slack" ? "slack" : "discord";
  const dropDay = cfg.catalog.dropDays[0] ?? 4;
  const recapChannel = "#drops";

  // the shop reprints its own best sellers rather than reordering them: the reorder list is its reprint list (rule C-10)
  const reprint = (x: string) => x.replace(/Low-stock reorder list/g, "Reprint list");
  const kinds: Record<string, KindDef> = {
    ...base.kinds,
    "reorder-list": {
      ...base.kinds["reorder-list"],
      name: "Reprint list",
      what: "Best sellers down to 2 or less in a size, with last week's sales, in the production sheet for the next print-shop run.",
    },
    "drop-recap": {
      name: "Drop recap",
      what: `How the last drop sold: each piece and size, how fast it sold out and on which channel, posted to ${chat.name}.`,
      logo: chat.slug,
      uses: ["orders", "stock", chatMod, "summary"],
      body: [
        "const drop = await stock.products({ dropped: \"last drop\" });",
        "const sales = await orders.list({ products: drop.ids, since: drop.openedAt });",
        `await ${chatMod}.post(CHANNEL, summary.dropRecap(drop, sales, { soldOutFirst: true, byChannel: true }));`,
      ],
      dry: (n) => `${Math.max(9, Math.round(n / 4))} pieces in the last drop, ${Math.max(3, Math.round(n / 6))} sizes sold out in the first hour`,
    },
    "consignor-sheet": {
      name: "Consignor payout sheet",
      what: "Pre-owned pieces sold last week, by consignor, with the channel, the price and the payout due, in a sheet for Monday.",
      logo: "google-sheets",
      uses: ["orders", "dates", "sheets"],
      body: [
        "const week = dates.lastWeek();",
        "const sold = await orders.list({ category: \"Pre-owned\", from: week.start, to: week.end });",
        "await sheets.write(SHEET, week.label, sold.byConsignor([\"piece\", \"channel\", \"price\", \"payout\"]));",
      ],
      dry: (n) => `${Math.max(3, Math.round(n / 5))} pre-owned pieces sold last week, ${Math.max(2, Math.round(n / 8))} consignors to pay`,
    },
  };

  const recapAt = { h: 18, m: 0 };
  const seeded: Schedule[] = [
    { id: "recap", kind: "drop-recap", name: "Drop recap", freq: { type: "weekly", day: dropDay, at: recapAt }, share: `${recapChannel} in ${chat.name}`, seeded: true, anchor: 0 },
    // the shop has no buyer: the reprint list goes to the owner, the returns report to the stockroom
    ...base.seeded.map((s) => (s.kind === "reorder-list" ? { ...s, name: "Reprint list", share: "Marcus" } : s.kind === "returns-report" ? { ...s, share: "Omar" } : s)),
    { id: "consignors", kind: "consignor-sheet", name: "Consignor payout sheet", freq: { type: "weekly", day: 1, at: { h: 8, m: 0 } }, share: "Kenji", seeded: true, anchor: 0 },
  ];
  const recapChip: Chip = { id: "recap-drop", text: `Drop recap to ${chat.name} every ${DAYS[dropDay]} at 18:00` };

  return {
    ...base,
    kinds,
    kindOf: (t) => {
      if (/\bdrops?\b/.test(t) && /\b(recap|report|summary|sell[- ]?through|sold|results?)\b/.test(t)) return { kind: "drop-recap", name: kinds["drop-recap"].name };
      if (/\bconsign(or|ors|ment|ed)?\b|\bpayouts?\b/.test(t)) return { kind: "consignor-sheet", name: kinds["consignor-sheet"].name };
      if (/\breprints?\b/.test(t)) return { kind: "reorder-list", name: kinds["reorder-list"].name };
      return base.kindOf(t);
    },
    greeting: `Hi! I'm in beta: I build routines that get data from your build and post it to your team, in Google Sheets, Excel, ${chat.name} or ${chat.name === "Slack" ? "Discord" : "Slack"}. Tell me what you need and when. I write the routine's script, test it without changing anything, and put it on a schedule. For example: a drop recap to ${chat.name} every ${DAYS[dropDay]} evening, tonight's TikTok Shop LIVE lineup sheet, or the consignor payout sheet for Monday.`,
    startChips: [recapChip, ...base.startChips.slice(0, 4).map((c) => ({ ...c, text: reprint(c.text) }))],
    whatChips: [{ id: "what-recap", text: "Drop recap" }, ...base.whatChips.slice(0, 3).map((c) => ({ ...c, text: reprint(c.text) }))],
    askWhat: `What should run? A recap for ${chat.name} (drop recap, daily sales summary), a sheet (reprint list, pick list, consignor payouts, returns report) or a check on a channel (new arrivals check, the LIVE lineup sheet).`,
    seeded,
    consts: (s) => [
      ...(base.consts?.(s) ?? []),
      ...(s.kind === "drop-recap" ? [`const CHANNEL = ${chatMod}.channel(${JSON.stringify(recapChannel)});`] : []),
    ],
    insteadChips: [recapChip, ...base.insteadChips.slice(0, 2).map((c) => ({ ...c, text: reprint(c.text) }))],
  };
}

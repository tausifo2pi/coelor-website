// node --test lib/demo/schedule.test.mts
// The demo's assistant: a chat (labelled GPT) that turns a request into a routine. It "writes" the routine's script
// (scriptOf), checks it against the setup without changing anything (verifyOf) and runs it on a cron schedule (cronOf).
// No network and no AI: a small deterministic parser reads the request ("Pickup sheet every weekday at 8:00, share with
// the warehouse", "Hide sold-out sizes on Shopify every 15 minutes"), and next and last runs are worked out in the
// store's time zone (Europe/Amsterdam), so the server and the browser agree. The seeded routines match the sheets in
// lib/demo/sheets.ts and the connected channels.
import { FLEX_AFTER_MS, FLEX_EVERY_MIN, LIVE_AFTER_MS, LIVE_EVERY_MIN, MONTHS, PARTNERS } from "./sheets.ts";

export type Kind =
  | "pickup" | "location" | "supplier" | "consignment" | "custom"
  // routines on the connected channels
  | "shopify-stock" | "whatnot-lineup" | "stockx-ask" | "alias-report" | "sales-summary";
export type HM = { h: number; m: number };
export type Freq =
  | { type: "minutes"; n: number }
  | { type: "hours"; n: number }
  | { type: "daily"; at: HM }
  | { type: "weekdays"; at: HM }
  | { type: "weekly"; day: number; at: HM } // day: 0 = Sunday … 6 = Saturday
  | { type: "sale" }; // on each order
/** `anchor`: where a periodic schedule counts from (its start); unused for the others. */
export type Schedule = { id: string; kind: Kind; name: string; freq: Freq; share: string | null; seeded: boolean; anchor: number };

/** `logo`: a platform slug (website data/platforms.json) the routine works on, shown next to it; else an icon. */
export const KINDS: Record<Kind, { name: string; what: string; logo?: string }> = {
  pickup: { name: "Pickup sheet", what: "It lists today's orders to pick, with the bin location of each pair." },
  location: { name: "Location sheet", what: "It shows where each size sits in the warehouse, bin by bin." },
  supplier: { name: "Supplier stock sheet", what: "It shares the live stock and prices with a partner." },
  consignment: { name: "Consignment check", what: "It lists the stock that isn't on StockX Flex yet.", logo: "stockx" },
  custom: { name: "Custom sheet", what: "It takes the columns you pick from the Picqer stock." },
  "shopify-stock": { name: "Hide sold-out sizes on Shopify", what: "Every size at 0 in Picqer is hidden in the store, and shown again when stock comes back.", logo: "shopify" },
  "whatnot-lineup": { name: "Whatnot show lineup", what: "It puts the sizes in stock into tonight's show list, so nothing sells that isn't there.", logo: "whatnot" },
  "stockx-ask": { name: "StockX lowest-ask check", what: "It flags listings priced above the lowest ask, in a sheet for the team.", logo: "stockx" },
  "alias-report": { name: "Alias weekly sales report", what: "Last week's Alias sales, cancellations and payouts in one sheet.", logo: "alias-goat" },
  "sales-summary": { name: "Daily sales summary", what: "Orders per channel, sold-out sizes and anything flagged, posted to the team chat.", logo: "discord" },
};

export const TZ = "Europe/Amsterdam";
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const MIN_MINUTES = 5;
const SALE_POLL_MIN = 5; // orders come in every 5 minutes; a sale-triggered sheet runs on the poll that brings one

/* ---------- the parser ---------- */

export type Parsed = { kind: Kind | null; name: string | null; freq: Freq | null; share: string | null; note: string | null };

const NUMBERS: Record<string, number> = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, eight: 8, ten: 10, twelve: 12, fifteen: 15, twenty: 20, thirty: 30 };
const STOP = new Set(["a", "an", "the", "new", "my", "our", "one", "this", "that", "google", "every", "each", "same", "own", "simple", "small", "big"]);
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const HEAD: [RegExp, Kind][] = [
  [/^(pick\s*-?\s*up|picking|pick)$/, "pickup"],
  [/^(consignment|consign|flex)$/, "consignment"],
  [/^(locations?|bins?)$/, "location"],
  [/^(suppliers?|wholesale|stock|inventory|partners?)$/, "supplier"],
];

const routine = (kind: Kind) => ({ kind, name: KINDS[kind].name });

function kindOf(t: string): { kind: Kind; name: string } | null {
  // routines on a channel: the channel's name and what to do with it
  if (/\bshopify\b/.test(t) && /\b(hide|sold[- ]?out|out of stock|stock|unpublish)\b/.test(t)) return routine("shopify-stock");
  if (/\bwhatnot\b|\bshow line ?-?up\b|\blive show\b/.test(t)) return routine("whatnot-lineup");
  if (/\bstockx\b/.test(t) && /\b(lowest|ask|asks|price|prices|pricing)\b/.test(t)) return routine("stockx-ask");
  if (/\balias\b/.test(t) && /\b(report|sales|payouts?|cancell?ations?)\b/.test(t)) return routine("alias-report");
  if (/\b(summary|recap|digest)\b/.test(t) || (/\b(discord|slack|team chat)\b/.test(t) && /\b(sales|orders)\b/.test(t))) return routine("sales-summary");
  // the word right before "sheet" decides ("supplier sheet with bin locations" is a supplier sheet)
  const head = /\b(pick\s*-?\s*up|picking|pick|locations?|bins?|suppliers?|wholesale|stock|inventory|partners?|consignment|consign|flex)\s+(?:sheet|report|list|check|overview)\b/.exec(t);
  const byHead = head && HEAD.find(([re]) => re.test(head[1]))?.[1];
  if (byHead) return { kind: byHead, name: KINDS[byHead].name };
  if (/\bpick\s*-?\s*ups?\b|\bpicking\b|\bpick\s*-?\s*lists?\b|\bto pick\b/.test(t)) return { kind: "pickup", name: KINDS.pickup.name };
  if (/\bconsign|\bflex\b/.test(t)) return { kind: "consignment", name: KINDS.consignment.name };
  if (/\blocations?\b|\bbins?\b|\bwhere (each|every|the)\b/.test(t)) return { kind: "location", name: KINDS.location.name };
  if (/\bsuppliers?\b|\bwholesale|\bstock (sheet|list)\b|\binventory\b|\blive stock\b|\bprice ?list\b|\bpartners?\b/.test(t)) return { kind: "supplier", name: KINDS.supplier.name };
  const m = /\b([a-z]+)\s+(sheet|report|list|export|overview)\b/.exec(t);
  if (m && !STOP.has(m[1])) return { kind: "custom", name: `${cap(m[1])} ${m[2]}` };
  return null;
}

/** "8:00", "8.30", "8am", "9 pm", "at 8", "noon", "midnight". */
export function timeOf(t: string): HM | null {
  let h: number | null = null;
  let m = 0;
  let ampm: string | undefined;
  const hm = /\b(\d{1,2})[:.](\d{2})\s*(am|pm|a\.m\.|p\.m\.)?/.exec(t);
  const hOnly = /\b(\d{1,2})\s*(am|pm|a\.m\.|p\.m\.)/.exec(t);
  const at = /\bat\s+(\d{1,2})\b(?!\s*(?:min|hour|h\b|hr))/.exec(t);
  if (hm) [h, m, ampm] = [Number(hm[1]), Number(hm[2]), hm[3]];
  else if (hOnly) [h, ampm] = [Number(hOnly[1]), hOnly[2]];
  else if (at) h = Number(at[1]);
  else if (/\b(noon|midday)\b/.test(t)) h = 12;
  else if (/\bmidnight\b/.test(t)) h = 0;
  if (h === null) return null;
  if (ampm?.startsWith("p") && h < 12) h += 12;
  if (ampm?.startsWith("a") && h === 12) h = 0;
  return h <= 23 && m <= 59 ? { h, m } : null;
}

function freqOf(t: string): { freq: Freq; note: string | null } | null {
  if (/\b(after|on|with|for) (every|each|a|any) (sale|order)s?\b|\b(every|each|per) (sale|order)\b|\bwhen(ever)? (a |an )?(pair |order |size )?(sells|is sold|comes in)\b|\breal[- ]?time\b|\binstantly\b/.test(t)) {
    return { freq: { type: "sale" }, note: null };
  }
  const every = /\b(?:every|each)\s+(\d+|half(?: an?)?|an?|one|two|three|four|five|six|eight|ten|twelve|fifteen|twenty|thirty)?\s*(minutes?|mins?|m|hours?|hrs?|h)\b/.exec(t);
  if (every || /\bhourly\b/.test(t)) {
    const word = every?.[1];
    const unit = every?.[2] ?? "hour";
    const n = !word ? 1 : word.startsWith("half") ? 0.5 : /^\d+$/.test(word) ? Number(word) : NUMBERS[word];
    let minutes = Math.round(n * (unit.startsWith("m") ? 1 : 60));
    let note: string | null = null;
    if (minutes < MIN_MINUTES) {
      minutes = MIN_MINUTES;
      note = "Every 5 minutes is the shortest, so I used that.";
    }
    if (minutes > 24 * 60) {
      minutes = 24 * 60;
      note = "Every 24 hours is the longest, so I used that.";
    }
    return { freq: minutes % 60 === 0 ? { type: "hours", n: minutes / 60 } : { type: "minutes", n: minutes }, note };
  }
  const part = /\b(morning|evening|night|tonight)\b/.exec(t)?.[1];
  const at = timeOf(t) ?? (part === "evening" ? { h: 18, m: 0 } : part === "night" || part === "tonight" ? { h: 22, m: 0 } : { h: 8, m: 0 });
  if (/\bweek\s*-?\s*days?\b|\b(working|business|work) days?\b|\bmon(day)?\s*(-|–|to|through|till|until)\s*fri(day)?\b/.test(t)) return { freq: { type: "weekdays", at }, note: null };
  const day = /\b(sun|mon|tue|tues|wed|thu|thur|thurs|fri|sat)(day|nesday|sday|urday|rsday)?s?\b/.exec(t);
  if (day) {
    const i = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"].indexOf(day[1].slice(0, 3));
    return { freq: { type: "weekly", day: i, at }, note: null };
  }
  if (/\bdaily\b|\b(every|each) ?(day|morning|evening|night)\b|\bnightly\b|\bonce a day\b/.test(t)) return { freq: { type: "daily", at }, note: null };
  if (/\bweekly\b|\b(every|each|once a) week\b/.test(t)) return { freq: { type: "weekly", day: 1, at }, note: null };
  // a time alone ("at 7:30") means every day
  if (timeOf(t)) return { freq: { type: "daily", at }, note: null };
  return null;
}

/** "share with the warehouse", "share a pickup sheet with Anna", "send it to Tom": the name as typed, up to 40 characters. */
function shareOf(raw: string): string | null {
  const verb = /\b(?:share[sd]?|send|e-?mail|mail)\b/i.exec(raw);
  if (!verb) return null;
  const rest = raw.slice(verb.index);
  const end = String.raw`(.+?)(?=\s*(?:[,.;!?]|$|\s(?:every|each|at|on|after|daily|weekly|hourly|when|from|in)\b))`;
  // "with" first: "share the orders to pick with Anna" is shared with Anna
  const m = new RegExp(String.raw`\bwith\s+` + end, "i").exec(rest) ?? new RegExp(String.raw`\bto\s+` + end, "i").exec(rest);
  const name = m?.[1].trim().replace(/\s+/g, " ").slice(0, 40);
  return name || null;
}

export function parse(raw: string): Parsed {
  const t = raw.toLowerCase().replace(/\s+/g, " ").trim();
  const k = kindOf(t);
  const f = freqOf(t);
  return { kind: k?.kind ?? null, name: k?.name ?? null, freq: f?.freq ?? null, share: shareOf(raw), note: f?.note ?? null };
}

/* ---------- words ---------- */

const pad2 = (n: number) => String(n).padStart(2, "0");
export const hm = (a: HM) => `${pad2(a.h)}:${pad2(a.m)}`;

/** "every weekday at 08:00", "every 2 hours", "after every sale". */
export function describe(f: Freq): string {
  switch (f.type) {
    case "minutes": return `every ${f.n} minutes`;
    case "hours": return f.n === 1 ? "every hour" : `every ${f.n} hours`;
    case "daily": return `every day at ${hm(f.at)}`;
    case "weekdays": return `every weekday at ${hm(f.at)}`;
    case "weekly": return `every ${DAYS[f.day]} at ${hm(f.at)}`;
    case "sale": return "after every sale";
  }
}

/** Short and safe for tracking: "weekdays", "2h", "30min", "weekly-mon", "sale". */
export function freqKey(f: Freq): string {
  switch (f.type) {
    case "minutes": return `${f.n}min`;
    case "hours": return `${f.n}h`;
    case "weekly": return `weekly-${DAYS[f.day].slice(0, 3).toLowerCase()}`;
    default: return f.type;
  }
}

/* ---------- time, in the store's time zone ---------- */

type Wall = { y: number; mo: number; d: number; h: number; mi: number; s: number };
const PARTS = new Intl.DateTimeFormat("en-US", { timeZone: TZ, hourCycle: "h23", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", second: "numeric" });

function wall(ms: number): Wall {
  const p: Record<string, number> = {};
  for (const x of PARTS.formatToParts(new Date(ms))) if (x.type !== "literal") p[x.type] = Number(x.value);
  return { y: p.year, mo: p.month, d: p.day, h: p.hour % 24, mi: p.minute, s: p.second };
}
const offset = (ms: number) => {
  const w = wall(ms);
  return Date.UTC(w.y, w.mo - 1, w.d, w.h, w.mi, w.s) - Math.floor(ms / 1000) * 1000;
};
/** The instant a wall-clock time in Amsterdam happens. */
export function fromWall(y: number, mo: number, d: number, h: number, mi: number): number {
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  const t = guess - offset(guess);
  return guess - offset(t);
}
/** Amsterdam's calendar date `k` days after the one `ms` falls on, with its weekday. */
function day(ms: number, k: number) {
  const w = wall(ms);
  const u = new Date(Date.UTC(w.y, w.mo - 1, w.d + k));
  return { y: u.getUTCFullYear(), mo: u.getUTCMonth() + 1, d: u.getUTCDate(), wd: u.getUTCDay() };
}
const runsOn = (f: Freq, wd: number) => f.type === "daily" || (f.type === "weekdays" && wd >= 1 && wd <= 5) || (f.type === "weekly" && wd === f.day);
const period = (f: Freq) => (f.type === "minutes" ? f.n * MINUTE : f.type === "hours" ? f.n * HOUR : 0);

/** When it runs next; null for "after every sale", which waits for the next order. */
export function nextRun(s: Pick<Schedule, "freq" | "anchor">, now: number): number | null {
  const f = s.freq;
  if (f.type === "sale") return null;
  const p = period(f);
  if (p) {
    const t = Math.max(now, s.anchor);
    return s.anchor + (Math.floor((t - s.anchor) / p) + 1) * p;
  }
  const at = (f as { at: HM }).at;
  for (let k = 0; k <= 7; k++) {
    const d = day(now, k);
    if (!runsOn(f, d.wd)) continue;
    const t = fromWall(d.y, d.mo, d.d, at.h, at.m);
    if (t > now) return t;
  }
  return null;
}

/** When it last ran: the last slot for periodic ones, the last order poll for "after every sale". */
export function prevRun(s: Pick<Schedule, "freq" | "anchor">, now: number): number | null {
  const f = s.freq;
  const p = f.type === "sale" ? SALE_POLL_MIN * MINUTE : period(f);
  if (p) return now < s.anchor ? null : s.anchor + Math.floor((now - s.anchor) / p) * p;
  const at = (f as { at: HM }).at;
  for (let k = 0; k <= 7; k++) {
    const d = day(now, -k);
    if (!runsOn(f, d.wd)) continue;
    const t = fromWall(d.y, d.mo, d.d, at.h, at.m);
    if (t <= now) return t;
  }
  return null;
}

/** "Fri 2 Oct, 08:00", Amsterdam time. Names from here, not Intl, so every ICU prints the same ("Sep", not "Sept"). */
export function runLabel(ms: number): string {
  const w = wall(ms);
  const wd = new Date(Date.UTC(w.y, w.mo - 1, w.d)).getUTCDay();
  return `${DAYS[wd].slice(0, 3)} ${w.d} ${MONTHS[w.mo - 1].slice(0, 3)}, ${pad2(w.h)}:${pad2(w.mi)}`;
}

/** "in 12 min", "in 5 h", "in 3 days". */
export function inText(ms: number, now: number): string {
  const m = Math.max(0, Math.round((ms - now) / MINUTE));
  if (m < 1) return "in under a minute";
  if (m < 60) return `in ${m} min`;
  const h = Math.round(m / 60);
  if (h < 36) return `in ${h} h`;
  return `in ${Math.round(h / 24)} days`;
}

/* ---------- the conversation ---------- */

export type Chip = { id: string; text: string };

export const START_CHIPS: Chip[] = [
  { id: "shopify-15min", text: "Hide sold-out sizes on Shopify every 15 minutes" },
  { id: "whatnot-daily", text: "Whatnot show lineup every day at 17:30" },
  { id: "pickup-weekdays", text: "Pickup sheet every weekday at 8:00" },
  { id: "summary-daily", text: "Daily sales summary to Discord at 18:00" },
  { id: "consignment-6h", text: "Consignment check every 6 hours" },
];
const WHAT_CHIPS: Chip[] = [
  { id: "what-pickup", text: "Pickup sheet" },
  { id: "what-shopify", text: "Hide sold-out sizes on Shopify" },
  { id: "what-whatnot", text: "Whatnot show lineup" },
  { id: "what-summary", text: "Daily sales summary" },
];
const WHEN_CHIPS: Chip[] = [
  { id: "when-weekdays", text: "Every weekday at 8:00" },
  { id: "when-2h", text: "Every 2 hours" },
  { id: "when-sale", text: "After every sale" },
  { id: "when-monday", text: "Every Monday at 9:00" },
];

export const GREETING =
  "Hi! Tell me what should run on its own and when. I write the routine's script, test it on your live setup without changing anything, and put it on a schedule. For example: hide sold-out sizes on Shopify every 15 minutes, a pickup sheet every weekday at 8:00, or a daily sales summary to Discord.";

/** What the last question left open, carried into the next message. */
export type Pending = { kind: Kind | null; name: string | null; freq: Freq | null; share: string | null } | null;

export type Answer =
  | { ok: true; kind: Kind; text: string; schedule: Omit<Schedule, "id"> }
  | { ok: false; kind: Kind | null; text: string; pending: Pending; chips: Chip[] };

export function answer(raw: string, pending: Pending, now: number): Answer {
  const p = parse(raw);
  const kind = p.kind ?? pending?.kind ?? null;
  const name = p.kind ? p.name : pending?.name ?? null;
  const freq = p.freq ?? pending?.freq ?? null;
  const share = p.share ?? pending?.share ?? null;

  if (!kind || !name) {
    const text = freq
      ? `Sure, ${describe(freq)}. What should run: a sheet (pickup, location, supplier stock, consignment) or a routine on a channel, like hiding sold-out sizes on Shopify?`
      : "What should run? A sheet (pickup, location, supplier stock, consignment), a routine on a channel (Shopify, Whatnot, StockX, Alias), or a sales summary for the team chat.";
    return { ok: false, kind: null, text, pending: { kind: null, name: null, freq, share }, chips: WHAT_CHIPS };
  }
  if (!freq) {
    return {
      ok: false,
      kind,
      text: `When should "${name}" run? For example every 15 minutes, every weekday at 8:00 or after every sale.`,
      pending: { kind, name, freq: null, share },
      chips: WHEN_CHIPS,
    };
  }

  const schedule = { kind, name, freq, share, seeded: false, anchor: now };
  const next = nextRun(schedule, now);
  const cron = cronOf(freq);
  const text = [
    `Done. "${name}" is scheduled ${describe(freq)}${cron ? ` (cron ${cron})` : ""}${share ? `, shared with ${share}` : ""}. Next run: ${next === null ? "with the next sale" : runLabel(next)}.`,
    KINDS[kind].what,
    p.note,
  ].filter(Boolean).join(" ");
  return { ok: true, kind, text, schedule };
}

/* ---------- the schedules already running ---------- */

export const SEEDED: Schedule[] = [
  { id: "live", kind: "supplier", name: "Live stock sheet", freq: { type: "minutes", n: LIVE_EVERY_MIN }, share: PARTNERS.supplier, seeded: true, anchor: LIVE_AFTER_MS },
  { id: "flex", kind: "consignment", name: "Consignment report (StockX US Flex)", freq: { type: "hours", n: FLEX_EVERY_MIN / 60 }, share: PARTNERS.consign, seeded: true, anchor: FLEX_AFTER_MS },
  { id: "pickup", kind: "pickup", name: "Pickup sheet", freq: { type: "weekdays", at: { h: 8, m: 0 } }, share: "the warehouse team", seeded: true, anchor: 0 },
  { id: "location", kind: "location", name: "Location sheet", freq: { type: "sale" }, share: "the warehouse team", seeded: true, anchor: 41_000 },
  // routines on the connected channels
  { id: "shopify", kind: "shopify-stock", name: KINDS["shopify-stock"].name, freq: { type: "minutes", n: 15 }, share: null, seeded: true, anchor: 23_000 },
  { id: "whatnot", kind: "whatnot-lineup", name: KINDS["whatnot-lineup"].name, freq: { type: "daily", at: { h: 17, m: 30 } }, share: "the show host", seeded: true, anchor: 0 },
  { id: "stockx-ask", kind: "stockx-ask", name: KINDS["stockx-ask"].name, freq: { type: "hours", n: 6 }, share: "the team", seeded: true, anchor: 7 * MINUTE },
  { id: "alias-report", kind: "alias-report", name: KINDS["alias-report"].name, freq: { type: "weekly", day: 1, at: { h: 9, m: 0 } }, share: "the office", seeded: true, anchor: 0 },
  { id: "summary", kind: "sales-summary", name: KINDS["sales-summary"].name, freq: { type: "daily", at: { h: 18, m: 0 } }, share: "the team chat", seeded: true, anchor: 0 },
];

/* ---------- cron, the script and its check ---------- */

/** The cron line for a schedule (every 15 minutes, weekdays at 8:00 as "0 8 * * 1-5"); null for "after every sale",
 * which runs on the order event. */
export function cronOf(f: Freq): string | null {
  switch (f.type) {
    case "minutes": return `*/${f.n} * * * *`;
    case "hours": return f.n === 1 ? "0 * * * *" : `0 */${f.n} * * *`;
    case "daily": return `${f.at.m} ${f.at.h} * * *`;
    case "weekdays": return `${f.at.m} ${f.at.h} * * 1-5`;
    case "weekly": return `${f.at.m} ${f.at.h} * * ${f.day}`;
    case "sale": return null;
  }
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "routine";

// What each routine does, as the engine's calls: the lines between "run() {" and its return.
const BODY: Record<Kind, string[]> = {
  pickup: [
    "const orders = await picqer.orders({ status: \"processing\", created: \"today\" });",
    "const rows = orders.flatMap((o) => o.lines.map((l) => [o.channel, o.ref, l.sku, l.size, l.bin]));",
    "await sheets.write(SHEET, \"Pickup\", [[\"Channel\", \"Order\", \"SKU\", \"Size\", \"Bin\"], ...rows]);",
  ],
  location: [
    "const stock = await picqer.stock({ freeStock: \">0\", with: [\"locations\"] });",
    "const rows = stock.flatMap((p) => p.locations.map((b) => [b.name, p.sku, p.size, b.free]));",
    "await sheets.write(SHEET, \"Locations\", [[\"Bin\", \"SKU\", \"Size\", \"Free\"], ...rows.sort()]);",
  ],
  supplier: [
    "const stock = await picqer.stock({ freeStock: \">0\" });",
    "const rows = stock.map((p) => [p.sku, p.name, p.eu, p.us, p.free, p.price.eur, p.price.usd]);",
    "await sheets.write(SHEET, \"Live stock\", rows, { header: true, photos: true });",
  ],
  consignment: [
    "const stock = await picqer.stock({ freeStock: \">0\" });",
    "const onFlex = await stockx.flexListings({ store: \"us\" });",
    "const missing = stock.filter((p) => !onFlex.has(p.style, p.us));",
    "await sheets.write(SHEET, \"Not on Flex\", missing.map((p) => [p.sku, p.name, p.us, p.free]));",
  ],
  custom: [
    "const stock = await picqer.stock();",
    "await sheets.write(SHEET, NAME, stock.map((p) => [p.sku, p.name, p.size, p.free]), { header: true });",
  ],
  "shopify-stock": [
    "const soldOut = await picqer.stock({ freeStock: 0 });",
    "const variants = await shopify.variants({ sku: soldOut.map((p) => p.sku), published: true });",
    "for (const v of variants) await shopify.hide(v.id);",
    "const back = await shopify.variants({ hidden: true, sku: await picqer.skus({ freeStock: \">0\" }) });",
    "for (const v of back) await shopify.show(v.id);",
  ],
  "whatnot-lineup": [
    "const show = await whatnot.nextShow();",
    "const stock = await picqer.stock({ freeStock: \">0\", tag: \"whatnot\" });",
    "await whatnot.setLineup(show.id, stock.map((p) => ({ sku: p.sku, size: p.us, quantity: p.free })));",
  ],
  "stockx-ask": [
    "const listings = await stockx.listings({ status: \"active\" });",
    "const asks = await stockx.lowestAsks(listings.map((l) => l.variantId));",
    "const above = listings.filter((l) => l.price > asks[l.variantId]);",
    "await sheets.write(SHEET, \"Above lowest ask\", above.map((l) => [l.style, l.size, l.price, asks[l.variantId]]));",
  ],
  "alias-report": [
    "const week = dates.lastWeek(\"Europe/Amsterdam\");",
    "const orders = await alias.orders({ from: week.start, to: week.end });",
    "await sheets.write(SHEET, week.label, alias.summary(orders, [\"sold\", \"cancelled\", \"payout\"]));",
  ],
  "sales-summary": [
    "const today = await picqer.orders({ created: \"today\" });",
    "const soldOut = await picqer.stock({ freeStock: 0, changed: \"today\" });",
    "await discord.post(CHANNEL, summary.byChannel(today, { soldOut, flagged: today.filter((o) => o.flagged) }));",
  ],
};

/** The engine modules a routine imports (sheets are written with `sheets`). */
const USES: Record<Kind, string[]> = {
  pickup: ["picqer", "sheets"], location: ["picqer", "sheets"], supplier: ["picqer", "sheets"],
  consignment: ["picqer", "stockx", "sheets"], custom: ["picqer", "sheets"],
  "shopify-stock": ["picqer", "shopify"], "whatnot-lineup": ["picqer", "whatnot"], "stockx-ask": ["stockx", "sheets"],
  "alias-report": ["alias", "dates", "sheets"], "sales-summary": ["picqer", "discord", "summary"],
};

export type Script = { file: string; code: string };

/** The routine's script, as the assistant writes it: engine imports, its schedule and its run(). */
export function scriptOf(s: Pick<Schedule, "kind" | "name" | "freq" | "share">): Script {
  const cron = cronOf(s.freq);
  const lines = [
    `import { ${USES[s.kind].join(", ")} } from "@coelor/engine";`,
    "",
    cron ? `export const schedule = { cron: "${cron}", tz: "Europe/Amsterdam" }; // ${describe(s.freq)}` : `export const trigger = "picqer.order.created"; // ${describe(s.freq)}`,
  ];
  if (USES[s.kind].includes("sheets")) lines.push(`const SHEET = sheets.byName(${JSON.stringify(s.name)}${s.share ? `, { share: ${JSON.stringify(s.share)} }` : ""});`);
  if (s.kind === "custom") lines.push(`const NAME = ${JSON.stringify(s.name)};`);
  if (s.kind === "sales-summary") lines.push(`const CHANNEL = discord.channel(${JSON.stringify(s.share ?? "the team chat")});`);
  lines.push("", "export default async function run() {", ...BODY[s.kind].map((l) => `  ${l}`), "}");
  return { file: `routines/${slug(s.name)}.ts`, code: lines.join("\n") };
}

export type Check = { label: string; detail: string };

// a stable number for a routine's dry run (the same routine shows the same count)
function count(seed: string, lo: number, hi: number): number {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  return lo + (h % (hi - lo + 1));
}

const SOURCE: Partial<Record<string, string>> = { picqer: "Picqer", shopify: "Shopify", whatnot: "Whatnot", stockx: "StockX", alias: "Alias", discord: "Discord", sheets: "Google Sheets" };

/** What the assistant checks before it schedules a routine: nothing is written during the check. */
export function verifyOf(s: Pick<Schedule, "kind" | "name" | "freq">, now: number): Check[] {
  const n = count(`${s.kind}|${s.name}`, 6, 48);
  const reached = USES[s.kind].map((u) => SOURCE[u]).filter((x): x is string => !!x);
  const dry: Record<Kind, string> = {
    pickup: `${n} order lines with their bins`,
    location: `${n * 40} sizes in ${n + 20} bins`,
    supplier: `${n * 35} sizes in stock, prices in EUR and USD`,
    consignment: `${Math.max(3, Math.round(n / 4))} sizes not on Flex yet`,
    custom: `${n * 30} rows`,
    "shopify-stock": `${Math.max(2, Math.round(n / 3))} sizes to hide, ${Math.max(1, Math.round(n / 8))} to show again`,
    "whatnot-lineup": `${n} sizes for the next show`,
    "stockx-ask": `${Math.max(2, Math.round(n / 3))} listings above the lowest ask`,
    "alias-report": `${n + 9} sales and ${Math.max(1, Math.round(n / 12))} cancellations last week`,
    "sales-summary": `${n + 40} orders today across 4 channels`,
  };
  const cron = cronOf(s.freq);
  const next = nextRun({ freq: s.freq, anchor: now }, now);
  return [
    { label: "Script checked", detail: "types and imports OK" },
    { label: "Connections reached", detail: reached.join(", ") },
    { label: "Test run, nothing written", detail: dry[s.kind] },
    cron
      ? { label: "Scheduled", detail: `cron ${cron}, next ${next === null ? "with the next sale" : runLabel(next)}` }
      : { label: "Hooked to new orders", detail: "runs on each order Picqer receives" },
  ];
}

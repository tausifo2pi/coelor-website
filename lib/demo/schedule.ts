// node --test lib/demo/schedule.test.mts
// The demo's sheet assistant: a scripted stand-in for a GPT chat that schedules sheets. No network and no AI: a small
// deterministic parser turns a request ("Pickup sheet every weekday at 8:00, share with the warehouse") into a
// schedule, and next and last runs are worked out in the store's time zone (Europe/Amsterdam), so the server and the
// browser agree. The seeded schedules match the sample sheets in lib/demo/sheets.ts.
import { FLEX_AFTER_MS, FLEX_EVERY_MIN, LIVE_AFTER_MS, LIVE_EVERY_MIN, MONTHS, PARTNERS } from "./sheets.ts";

export type Kind = "pickup" | "location" | "supplier" | "consignment" | "custom";
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

export const KINDS: Record<Kind, { name: string; what: string }> = {
  pickup: { name: "Pickup sheet", what: "It lists today's orders to pick, with the bin location of each pair." },
  location: { name: "Location sheet", what: "It shows where each size sits in the warehouse, bin by bin." },
  supplier: { name: "Supplier stock sheet", what: "It shares the live stock and prices with a partner." },
  consignment: { name: "Consignment check", what: "It lists the stock that isn't on StockX Flex yet." },
  custom: { name: "Custom sheet", what: "It takes the columns you pick from the Picqer stock." },
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

function kindOf(t: string): { kind: Kind; name: string } | null {
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
  { id: "pickup-weekdays", text: "Pickup sheet every weekday at 8:00" },
  { id: "location-sale", text: "Location sheet after every sale" },
  { id: "supplier-monday", text: "Supplier stock sheet every Monday at 9:00" },
  { id: "consignment-6h", text: "Consignment check every 6 hours" },
];
const WHAT_CHIPS: Chip[] = [
  { id: "what-pickup", text: "Pickup sheet" },
  { id: "what-location", text: "Location sheet" },
  { id: "what-supplier", text: "Supplier stock sheet" },
  { id: "what-consignment", text: "Consignment check" },
];
const WHEN_CHIPS: Chip[] = [
  { id: "when-weekdays", text: "Every weekday at 8:00" },
  { id: "when-2h", text: "Every 2 hours" },
  { id: "when-sale", text: "After every sale" },
  { id: "when-monday", text: "Every Monday at 9:00" },
];

export const GREETING =
  "Hi! I make Google Sheets from your Picqer stock and run them on a schedule: a pickup sheet for the warehouse, a location sheet, a supplier stock sheet, a consignment check, or one of your own. Tell me which sheet, when it should run, and who to share it with.";

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
      ? `Sure, ${describe(freq)}. Which sheet should it be: a pickup sheet, a location sheet, a supplier stock sheet or a consignment check?`
      : "Which sheet would you like? I can make a pickup sheet, a location sheet, a supplier stock sheet or a consignment check, or name your own.";
    return { ok: false, kind: null, text, pending: { kind: null, name: null, freq, share }, chips: WHAT_CHIPS };
  }
  if (!freq) {
    return {
      ok: false,
      kind,
      text: `When should the ${name.toLowerCase()} run? For example every weekday at 8:00, every 2 hours or after every sale.`,
      pending: { kind, name, freq: null, share },
      chips: WHEN_CHIPS,
    };
  }

  const schedule = { kind, name, freq, share, seeded: false, anchor: now };
  const next = nextRun(schedule, now);
  const text = [
    `Done. ${name} — ${describe(freq)}${share ? `, shared with ${share}` : ""}. Next run: ${next === null ? "with the next sale" : runLabel(next)}.`,
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
];

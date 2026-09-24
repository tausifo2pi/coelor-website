// First-party outreach tracking. Every event is one JSON line appended to
// $TRACK_DIR/events.jsonl; the local outreach DB pulls them via /api/t/export.
// Only a truncated IP (/24 or /48) is stored, never the full address.
import { randomBytes, randomUUID } from "node:crypto";
import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import type { NextRequest } from "next/server";

export const TRACK_DIR = process.env.TRACK_DIR ?? path.join(process.cwd(), ".track");
export const EVENTS_FILE = path.join(TRACK_DIR, "events.jsonl");

export const VISITOR_COOKIE = "cv"; // random visitor id, set only after an email click
export const TOKEN_COOKIE = "ct"; // message token from the email link

const TOKEN_RE = /^[A-Za-z0-9_-]{6,32}$/;
const VISITOR_RE = /^[A-Za-z0-9]{16}$/;

export const EVENT_TYPES = [
  "open",
  "click",
  "pageview",
  "section_view",
  "scroll",
  "time_on_page",
  "cta_click",
  "form_submit",
  "unsubscribe",
] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export function validToken(t: string | null | undefined): t is string {
  return !!t && TOKEN_RE.test(t);
}

export function validVisitor(v: string | null | undefined): v is string {
  return !!v && VISITOR_RE.test(v);
}

export function newVisitorId(): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from(randomBytes(16), (b) => alphabet[b % alphabet.length]).join("");
}

function ipPrefix(req: NextRequest): string | null {
  const raw = req.headers.get("x-real-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
  if (!raw) return null;
  if (raw.includes(".") && !raw.includes(":")) {
    const p = raw.split(".");
    return p.length === 4 ? `${p[0]}.${p[1]}.${p[2]}.0/24` : null;
  }
  const v4mapped = raw.match(/::ffff:(\d+\.\d+\.\d+)\.\d+$/i);
  if (v4mapped) return `${v4mapped[1]}.0/24`;
  // Expand "::" so compressed addresses (e.g. 2a02:a46::1) keep the right first three groups
  const [head, tail = ""] = raw.split("::");
  const left = head ? head.split(":") : [];
  const right = raw.includes("::") && tail ? tail.split(":") : [];
  const groups = raw.includes("::") ? [...left, ...Array(8 - left.length - right.length).fill("0"), ...right] : left;
  if (groups.length !== 8) return null;
  return `${groups.slice(0, 3).map((g) => g || "0").join(":")}::/48`;
}

// Request headers that help tell real people from mail scanners and prefetchers.
function requestSignals(req: NextRequest) {
  const h = req.headers;
  const pick = (k: string) => h.get(k)?.slice(0, 300) ?? null;
  return {
    ua: pick("user-agent"),
    lang: pick("accept-language"),
    accept: pick("accept"),
    fetch_site: pick("sec-fetch-site"),
    fetch_mode: pick("sec-fetch-mode"),
    fetch_dest: pick("sec-fetch-dest"),
    fetch_user: pick("sec-fetch-user"),
    purpose: pick("sec-purpose") ?? pick("purpose"),
    via: pick("via"),
  };
}

export type TrackInput = {
  type: EventType;
  token?: string | null;
  visitor?: string | null;
  page?: string | null; // per-pageload id from the browser beacon
  path?: string | null;
  ref?: string | null;
  value?: string | number | null;
  extra?: Record<string, unknown>;
};

let dirReady: Promise<unknown> | null = null;

export async function track(req: NextRequest, input: TrackInput): Promise<void> {
  const event = {
    id: randomUUID(),
    ts: new Date().toISOString(),
    type: input.type,
    token: validToken(input.token) ? input.token : null,
    visitor: validVisitor(input.visitor) ? input.visitor : null,
    page: input.page ?? null,
    path: input.path?.slice(0, 500) ?? null,
    ref: input.ref?.slice(0, 500) ?? null,
    value: input.value ?? null,
    ip_prefix: ipPrefix(req),
    ...requestSignals(req),
    ...(input.extra ? { extra: input.extra } : {}),
  };
  try {
    dirReady ??= mkdir(TRACK_DIR, { recursive: true });
    await dirReady;
    await appendFile(EVENTS_FILE, JSON.stringify(event) + "\n", "utf8");
  } catch (err) {
    // Tracking must never break the page or the redirect.
    console.error("track: failed to write event", err);
  }
}

export const cookieOptions = (maxAgeDays: number) => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: maxAgeDays * 24 * 60 * 60,
});

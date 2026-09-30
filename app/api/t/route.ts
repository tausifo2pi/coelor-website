// Browser beacon from components/Tracker.tsx (navigator.sendBeacon, text/plain JSON).
// Accepts a small batch of on-page events; the email token comes from the cookie, not the body.
import { NextResponse, type NextRequest } from "next/server";
import { TOKEN_COOKIE, VISITOR_COOKIE, track, type EventType } from "@/lib/track";

export const dynamic = "force-dynamic";

const BEACON_TYPES = new Set<EventType>([
  "pageview", "section_view", "scroll", "time_on_page", "cta_click",
  "demo_view", "demo_dwell", "demo_action", "demo_connect", "demo_cta", "demo_error",
]);
const MAX_BODY = 4096;
const MAX_EVENTS = 20;

type BeaconEvent = { type?: string; path?: string; ref?: string; value?: string | number; label?: string; meta?: unknown };

// The demo's small facts about an event (section, seconds, click count, where the visitor came from): a few short
// flat values, kept apart from the fields the bot rules read (extra.webdriver).
function metaOf(m: unknown): Record<string, string | number | boolean> | null {
  if (!m || typeof m !== "object" || Array.isArray(m)) return null;
  const out: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(m).slice(0, 8)) {
    if (!/^[a-z_]{1,16}$/.test(k)) continue;
    if (typeof v === "string") out[k] = v.slice(0, 60);
    else if (typeof v === "boolean" || (typeof v === "number" && Number.isFinite(v))) out[k] = v;
  }
  return Object.keys(out).length ? out : null;
}

export async function POST(req: NextRequest) {
  const raw = await req.text();
  if (raw.length > MAX_BODY) return new NextResponse(null, { status: 413 });

  let body: { page?: string; bot?: boolean; events?: BeaconEvent[] };
  try {
    body = JSON.parse(raw);
  } catch {
    return new NextResponse(null, { status: 400 });
  }

  const token = req.cookies.get(TOKEN_COOKIE)?.value ?? null;
  const visitor = req.cookies.get(VISITOR_COOKIE)?.value ?? null;
  const page = typeof body.page === "string" ? body.page.slice(0, 32) : null;

  for (const e of (body.events ?? []).slice(0, MAX_EVENTS)) {
    if (!e || !BEACON_TYPES.has(e.type as EventType)) continue;
    const value = typeof e.value === "number" || typeof e.value === "string" ? String(e.value).slice(0, 200) : null;
    const meta = String(e.type).startsWith("demo_") ? metaOf(e.meta) : null;
    await track(req, {
      type: e.type as EventType,
      token,
      visitor,
      page,
      path: typeof e.path === "string" ? e.path : null,
      ref: typeof e.ref === "string" ? e.ref : null,
      value,
      extra: {
        ...(typeof e.label === "string" ? { label: e.label.slice(0, 120) } : {}),
        ...(body.bot ? { webdriver: true } : {}),
        ...(meta ? { meta } : {}),
      },
    });
  }
  return new NextResponse(null, { status: 204 });
}

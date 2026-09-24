// Browser beacon from components/Tracker.tsx (navigator.sendBeacon, text/plain JSON).
// Accepts a small batch of on-page events; the email token comes from the cookie, not the body.
import { NextResponse, type NextRequest } from "next/server";
import { TOKEN_COOKIE, VISITOR_COOKIE, track, type EventType } from "@/lib/track";

export const dynamic = "force-dynamic";

const BEACON_TYPES = new Set<EventType>(["pageview", "section_view", "scroll", "time_on_page", "cta_click"]);
const MAX_BODY = 4096;
const MAX_EVENTS = 20;

type BeaconEvent = { type?: string; path?: string; ref?: string; value?: string | number; label?: string };

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
      },
    });
  }
  return new NextResponse(null, { status: 204 });
}

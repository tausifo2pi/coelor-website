// The live demo's data (/demo/multi-platform-sync) for pages an older script still has open: the same generated
// answers the page now builds itself (lib/demo/gen.ts), so nothing here reads another system. GET only; a small
// per-network limit keeps one visitor from keeping the server busy.
import { NextResponse, type NextRequest } from "next/server";
import { demoAnswer } from "@/lib/demo/gen";

export const dynamic = "force-dynamic";

const WINDOW_MS = 60_000;
const LIMIT = 90; // requests per minute per /24 (a busy visitor clicks through ~20)
const hits = new Map<string, { n: number; since: number }>();

function limited(req: NextRequest): boolean {
  const ip = req.headers.get("x-real-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const key = ip.includes(":") ? ip.split(":").slice(0, 3).join(":") : ip.split(".").slice(0, 3).join(".");
  const now = Date.now();
  const h = hits.get(key);
  if (!h || now - h.since > WINDOW_MS) {
    hits.set(key, { n: 1, since: now });
    if (hits.size > 5000) hits.delete(hits.keys().next().value as string);
    return false;
  }
  h.n += 1;
  return h.n > LIMIT;
}

const json = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: { "cache-control": "no-store", "x-robots-tag": "noindex" } });

export async function GET(req: NextRequest, ctx: { params: Promise<{ view: string }> }) {
  if (limited(req)) return json({ error: "slow_down" }, 429);
  const { view } = await ctx.params;
  try {
    const a = demoAnswer(view, req.nextUrl.searchParams);
    return a ? json(a) : json({ error: "not_found" }, 404);
  } catch (err) {
    console.error("demo: answer failed", view, err instanceof Error ? err.message : err);
    return json({ error: "unavailable" }, 503);
  }
}

// The live demo's data (/demo/multi-platform-sync): read-only views of the client's running sync, shaped for a public
// page by lib/demo/ak.ts. GET only; a small per-network limit keeps one visitor from hammering the client's API.
import { NextResponse, type NextRequest } from "next/server";
import { linked, listQuery, listings, overview, product, sales } from "@/lib/demo/ak";

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
  const sp = req.nextUrl.searchParams;
  try {
    switch (view) {
      case "overview":
        return json(await overview());
      case "sales":
        return json(await sales(listQuery(sp)));
      case "listings":
        return json(await listings(listQuery(sp)));
      case "linked":
        return json(await linked(listQuery(sp)));
      case "product": {
        const id = sp.get("id") ?? "";
        const p = /^[a-z0-9]{1,10}$/.test(id) ? await product(id) : null;
        return p ? json(p) : json({ error: "not_found" }, 404);
      }
      default:
        return json({ error: "not_found" }, 404);
    }
  } catch (err) {
    console.error("demo: live data unavailable", view, err instanceof Error ? err.message : err);
    return json({ error: "unavailable" }, 503);
  }
}

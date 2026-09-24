// Pulled by the local outreach DB (leads/outreach/sync_events.py).
// GET /api/t/export?from=<byte offset>  with  Authorization: Bearer $TRACK_EXPORT_SECRET
// Returns whole JSON lines starting at `from` plus the offset to ask for next time.
import { timingSafeEqual } from "node:crypto";
import { open, stat } from "node:fs/promises";
import { NextResponse, type NextRequest } from "next/server";
import { EVENTS_FILE } from "@/lib/track";

export const dynamic = "force-dynamic";

const CHUNK = 4 * 1024 * 1024;

function authorized(req: NextRequest): boolean {
  const secret = process.env.TRACK_EXPORT_SECRET;
  if (!secret || secret.length < 24) return false;
  const given = Buffer.from(req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "");
  const want = Buffer.from(secret);
  return given.length === want.length && timingSafeEqual(given, want);
}

export async function GET(req: NextRequest) {
  // 404 rather than 401 so the endpoint is not advertised.
  if (!authorized(req)) return new NextResponse(null, { status: 404 });

  const from = Math.max(0, Number(req.nextUrl.searchParams.get("from") ?? 0) || 0);
  let size = 0;
  try {
    size = (await stat(EVENTS_FILE)).size;
  } catch {
    return NextResponse.json({ from, next: 0, size: 0, lines: [] }, { headers: { "Cache-Control": "no-store" } });
  }
  if (from >= size) {
    return NextResponse.json({ from, next: from, size, lines: [] }, { headers: { "Cache-Control": "no-store" } });
  }

  const fh = await open(EVENTS_FILE, "r");
  try {
    const buf = Buffer.alloc(Math.min(CHUNK, size - from));
    const { bytesRead } = await fh.read(buf, 0, buf.length, from);
    const lastNl = buf.subarray(0, bytesRead).lastIndexOf(0x0a);
    if (lastNl < 0) {
      return NextResponse.json({ from, next: from, size, lines: [] }, { headers: { "Cache-Control": "no-store" } });
    }
    const text = buf.subarray(0, lastNl).toString("utf8");
    const lines = text.split("\n").filter(Boolean);
    return NextResponse.json(
      { from, next: from + lastNl + 1, size, lines },
      { headers: { "Cache-Control": "no-store" } },
    );
  } finally {
    await fh.close();
  }
}

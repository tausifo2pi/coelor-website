// Open pixel: <img src="https://coelor.com/o/<token>.gif">. Always returns a 1x1 transparent GIF.
import type { NextRequest } from "next/server";
import { track } from "@/lib/track";

export const dynamic = "force-dynamic";

const GIF = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");

export async function GET(req: NextRequest, ctx: RouteContext<"/o/[file]">) {
  const { file } = await ctx.params;
  const token = file.replace(/\.gif$/i, "");
  await track(req, { type: "open", token });
  return new Response(GIF, {
    headers: {
      "Content-Type": "image/gif",
      "Content-Length": String(GIF.length),
      "Cache-Control": "no-store, no-cache, must-revalidate, private, max-age=0",
      Expires: "0",
      "X-Robots-Tag": "noindex",
    },
  });
}

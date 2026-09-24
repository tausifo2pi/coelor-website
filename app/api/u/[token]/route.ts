// Unsubscribe endpoint. Used two ways:
//  1. RFC 8058 one-click: mail clients POST "List-Unsubscribe=One-Click" here from the
//     List-Unsubscribe header. Must answer 200 directly (no redirect).
//  2. The confirm button on /u/<token> posts a form here, then lands back on the page.
import { NextResponse, type NextRequest } from "next/server";
import { VISITOR_COOKIE, track, validToken } from "@/lib/track";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, ctx: RouteContext<"/api/u/[token]">) {
  const { token } = await ctx.params;
  const body = (await req.text()).slice(0, 500);
  const oneClick = body.includes("List-Unsubscribe=One-Click");

  if (validToken(token)) {
    await track(req, {
      type: "unsubscribe",
      token,
      visitor: req.cookies.get(VISITOR_COOKIE)?.value,
      value: oneClick ? "one_click" : "page",
    });
  }

  if (oneClick) {
    return new NextResponse("Unsubscribed", { status: 200, headers: { "Content-Type": "text/plain" } });
  }
  return new NextResponse(null, { status: 303, headers: { Location: `/u/${encodeURIComponent(token)}?done=1` } });
}

// Link scanners open GET URLs, so GET never unsubscribes; it only shows the confirm page.
export async function GET(_req: NextRequest, ctx: RouteContext<"/api/u/[token]">) {
  const { token } = await ctx.params;
  return new NextResponse(null, { status: 302, headers: { Location: `/u/${encodeURIComponent(token)}` } });
}

// Email link: https://coelor.com/r/<token>[?to=/some/path]. Logs the click, remembers the
// token in a first-party cookie so later pageviews are attributed, then redirects on-site.
import { NextResponse, type NextRequest } from "next/server";
import {
  TOKEN_COOKIE,
  VISITOR_COOKIE,
  cookieOptions,
  newVisitorId,
  track,
  validToken,
  validVisitor,
} from "@/lib/track";

export const dynamic = "force-dynamic";

// Only same-site paths, so the link can never be used as an open redirect.
function safeTarget(to: string | null): string {
  if (!to || !to.startsWith("/") || to.startsWith("//") || to.includes("\\")) return "/";
  return to.slice(0, 300);
}

export async function GET(req: NextRequest, ctx: RouteContext<"/r/[token]">) {
  const { token } = await ctx.params;
  const target = safeTarget(req.nextUrl.searchParams.get("to"));
  // Relative Location: behind nginx, nextUrl.origin is the internal container address.
  const res = new NextResponse(null, {
    status: 302,
    headers: { Location: target, "Cache-Control": "no-store", "X-Robots-Tag": "noindex" },
  });

  if (!validToken(token)) return res;

  const existing = req.cookies.get(VISITOR_COOKIE)?.value;
  const visitor = validVisitor(existing) ? existing : newVisitorId();
  await track(req, { type: "click", token, visitor, path: target });

  res.cookies.set(VISITOR_COOKIE, visitor, cookieOptions(365));
  res.cookies.set(TOKEN_COOKIE, token, cookieOptions(180));
  return res;
}

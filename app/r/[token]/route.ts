// Email link: https://coelor.com/r/<token>[?to=/some/path]. Without ?to a sneaker reader (their mix speaks of pairs, the
// same test as the case page's demo button) opens the live demo; a reader whose mix names other goods gets the case study
// (a neutral address; the page adapts to the platform mix of this email, see lib/case-page.ts). When the lookup is slow
// or fails the reader gets the demo: almost every email goes to sneaker sellers (user 2026-10-01, "direct demo link"). Short links read better in plain-text mail. Logs
// the click, remembers the token in a first-party cookie so later pageviews are attributed, then redirects on-site.
import { NextResponse, type NextRequest } from "next/server";
import { NEUTRAL_MIX, fetchCaseMix } from "@/lib/case-mix";
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

const DEFAULT_TARGET = "/case-studies/stock-sync";
const DEMO_TARGET = "/demo/multi-platform-sync?src=email";
// a slow lookup must not hold the click long: after 1.5 s the reader gets the demo (the mix is cached and kept warm)
const LOOKUP_MS = 1500;

// Only same-site paths, so the link can never be used as an open redirect.
function safeTarget(to: string | null): string {
  if (!to) return DEFAULT_TARGET;
  if (!to.startsWith("/") || to.startsWith("//") || to.includes("\\")) return "/";
  return to.slice(0, 300);
}

async function targetFor(token: string, to: string | null): Promise<string> {
  if (to || !validToken(token)) return safeTarget(to);
  const mix = await fetchCaseMix(token, LOOKUP_MS);
  if (!mix || mix === NEUTRAL_MIX) return DEMO_TARGET; // slow, failed or unknown: fetchCaseMix answers the neutral mix
  return mix.words.item === "pair" ? DEMO_TARGET : DEFAULT_TARGET;
}

export async function GET(req: NextRequest, ctx: RouteContext<"/r/[token]">) {
  const { token } = await ctx.params;
  const target = await targetFor(token, req.nextUrl.searchParams.get("to"));
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

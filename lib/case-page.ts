import type { Metadata } from "next";
import { cache } from "react";
import { cookies } from "next/headers";
import { adaptCase } from "@/lib/case-adapt";
import { fetchCaseMix } from "@/lib/case-mix";
import { TOKEN_COOKIE } from "@/lib/track";

// The outreach case study for this request: a reader who came through their email link (the ct cookie set by
// /r/<token>) gets the page told for a platform mix they recognise; everyone else gets the generic page. One lookup
// per request (metadata and page share it).
export const caseContent = cache(async () => adaptCase(await fetchCaseMix((await cookies()).get(TOKEN_COOKIE)?.value)));

export async function caseMetadata(path: string): Promise<Metadata> {
  const c = await caseContent();
  return { title: c.seo.title, description: c.seo.description, robots: { index: false, follow: false }, alternates: { canonical: path } };
}

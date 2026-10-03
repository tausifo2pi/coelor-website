import type { Metadata } from "next";
import { adaptCase } from "@/lib/case-adapt";

// The outreach case study: the real client's story, the same for every reader (user 2026-10-03: the page no longer
// names the reader's own platforms). Static: built once, no lookup per visit; the email cookie still ties the visit to
// the lead through the site tracker.
export const caseContent = () => adaptCase(null);

export function caseMetadata(path: string): Metadata {
  const c = caseContent();
  return { title: c.seo.title, description: c.seo.description, robots: { index: false, follow: false }, alternates: { canonical: path } };
}

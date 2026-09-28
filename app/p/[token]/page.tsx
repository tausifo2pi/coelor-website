import type { Metadata } from "next";
import CaseStudy from "@/components/CaseStudy";
import { adaptCase } from "@/lib/case-adapt";
import { fetchCaseMix } from "@/lib/case-mix";

// Preview for the outreach panel: the case study exactly as the reader of this email sees it. Sets no cookie and
// records nothing (the tracker only attributes visits to a ct cookie from an email link).
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Case study preview · Coelor", robots: { index: false, follow: false } };

export default async function CasePreview({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <CaseStudy c={adaptCase(await fetchCaseMix(token))} />;
}

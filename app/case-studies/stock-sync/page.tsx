import CaseStudy from "@/components/CaseStudy";
import { caseContent, caseMetadata } from "@/lib/case-page";

// Unlisted landing page for outreach (not linked from the homepage, not indexed). Rendered per request and never cached
// for anyone else: see lib/case-page.ts. /case-studies/stock-sync is where email links go (a neutral address);
// /case-studies/sneakers stays for older links.
export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return caseMetadata("/case-studies/stock-sync");
}

export default async function CaseStudyPage() {
  return <CaseStudy c={await caseContent()} />;
}

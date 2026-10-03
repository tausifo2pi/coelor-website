import CaseStudy from "@/components/CaseStudy";
import { caseContent, caseMetadata } from "@/lib/case-page";

// Unlisted landing page for outreach (not linked from the homepage, not indexed). Static: the real client's story for
// every reader (lib/case-page.ts). /case-studies/stock-sync is where email links go (a neutral address);
// /case-studies/sneakers stays for older links.
export const dynamic = "force-static";

export const metadata = caseMetadata("/case-studies/sneakers");

export default function CaseStudyPage() {
  return <CaseStudy c={caseContent()} />;
}

import { redirect } from "next/navigation";

// Preview for the outreach panel. The case study is the same for every reader now (lib/case-page.ts), so the preview of
// any email is the case study itself. Sets no cookie and records nothing.
export default function CasePreview(): never {
  redirect("/case-studies/stock-sync");
}

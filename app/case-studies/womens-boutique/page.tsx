import CaseStudy from "@/components/CaseStudy";
import { categoryCase, type CategoryPage } from "@/lib/case-adapt";
import page from "@/data/case-womens-boutique.json";

// How the sync works for a women's clothing shop (web store, TikTok Shop, Amazon), with its live demo
// (/demo/womens-boutique). Unlisted landing page for outreach emails: not linked from the site, not indexed. Static.
export const dynamic = "force-static";

const c = categoryCase(page as unknown as CategoryPage);

export const metadata = {
  title: c.seo.title,
  description: c.seo.description,
  robots: { index: false, follow: false },
  alternates: { canonical: "/case-studies/womens-boutique" },
};

export default function WomensBoutiquePage() {
  return <CaseStudy c={c} />;
}

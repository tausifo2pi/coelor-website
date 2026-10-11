import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

// Public pages only; the email-only pages (/demo, /case-studies) are noindex and never linked from public pages.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/r/", "/o/", "/u/", "/p/", "/demo"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

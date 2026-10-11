import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

// The public pages, nothing else: never /demo or /case-studies (email-only, noindex). lastModified is the day a page's
// content last changed; set it by hand when you change one.
const PAGES: { path: string; lastModified: string; priority: number }[] = [
  { path: "/", lastModified: "2026-10-11", priority: 1 },
  { path: "/pricing", lastModified: "2026-10-11", priority: 0.9 },
  { path: "/privacy", lastModified: "2026-10-11", priority: 0.3 },
  { path: "/terms", lastModified: "2026-10-11", priority: 0.3 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.map((p) => ({ url: `${SITE_URL}${p.path === "/" ? "" : p.path}`, lastModified: p.lastModified, priority: p.priority }));
}

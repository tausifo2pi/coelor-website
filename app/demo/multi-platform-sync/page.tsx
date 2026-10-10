import type { Metadata, Viewport } from "next";
import DemoApp from "@/components/demo/DemoApp";

// The live demo of the sync we run for a sneaker reseller (StockX, Alias, Picqer), linked from the case study
// (/case-studies/stock-sync) and from emails. A static page: built once, sent at once, with no data in it; the browser
// reads the live data from /api/demo/* (answered from copies kept fresh on the server) and picks the section from
// ?section=. Not indexed.
export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Live demo: a custom build · Coelor",
  description: "One sneaker reseller's custom build at work: marketplaces, web store and warehouse on one stock count. Read-only. Yours is built for your own setup.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/demo/multi-platform-sync" },
};

export const viewport: Viewport = { themeColor: "#0f172a", colorScheme: "light" };

export default function DemoPage() {
  return <DemoApp />;
}

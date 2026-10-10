import type { Metadata, Viewport } from "next";
import DemoApp from "@/components/demo/DemoApp";
import { NORTHVALE } from "@/lib/demo/clients";

// The live demo: Northvale Kicks, a demo sneaker reseller's custom build (lib/demo/clients.ts; StockX, Alias, Picqer),
// linked from the case study (/case-studies/stock-sync) and from emails. A static page: built once, sent at once, with
// no data in it; the browser reads the data and picks the section from ?section=. Not indexed.
export const dynamic = "force-static";

export const metadata: Metadata = {
  title: `Demo: ${NORTHVALE.name}, a custom build · Coelor`,
  description: `${NORTHVALE.name}, a demo sneaker reseller: the kind of custom build we make, with marketplaces, web store and warehouse on one stock count. Generated numbers, read-only. Yours is built for your own setup.`,
  robots: { index: false, follow: false },
  alternates: { canonical: "/demo/multi-platform-sync" },
};

export const viewport: Viewport = { themeColor: "#0f172a", colorScheme: "light" };

export default function DemoPage() {
  return <DemoApp />;
}

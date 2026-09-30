import type { Metadata, Viewport } from "next";
import DemoApp from "@/components/demo/DemoApp";
import type { SectionId } from "@/components/demo/views";
import { overview } from "@/lib/demo/ak";

// The live demo of the sync we run for a sneaker reseller (StockX, Alias, Picqer), linked from the case study
// (/case-studies/stock-sync). Rendered per request with the live overview when it comes quickly (it is cached for
// 30 s, so most visitors get it at once); otherwise the page loads it itself. Not indexed.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Live demo: multi-platform sync · Coelor",
  description: "A multi-platform sync at work: marketplaces, web store and warehouse on one stock count. Orders, stock, listings and automations, read-only.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/demo/multi-platform-sync" },
};

export const viewport: Viewport = { themeColor: "#0f172a", colorScheme: "light" };

const SECTIONS: SectionId[] = ["dashboard", "connections", "orders", "products", "listings", "automations", "extra"];

export default async function DemoPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const want = typeof sp.section === "string" ? sp.section : "";
  const first = (SECTIONS as string[]).includes(want) ? (want as SectionId) : "dashboard";
  const initial = await Promise.race([
    overview().catch(() => null),
    new Promise<null>((r) => setTimeout(() => r(null), 1500)),
  ]);
  return <DemoApp initial={initial} first={first} />;
}

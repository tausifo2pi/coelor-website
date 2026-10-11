import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import StoreDemoApp from "@/components/storedemo/StoreDemoApp";
import { STORE_DEMOS, demoBySlug } from "@/lib/storedemo/configs";
import { storeClient } from "@/components/demo/workspace/format";

// The store demos (lib/storedemo/configs.ts), one static page each, built once: the browser builds the shop's
// generated catalogue itself (components/storedemo/StoreDemoApp.tsx). Email-only, not indexed (robots.ts disallows
// /demo). /demo/multi-platform-sync is its own page (the sneaker demo) and wins over this route. Each is shown as a demo
// shop's custom build (components/demo/workspace/format.ts storeClient: the boutique demo is Fernhollow).
export const dynamicParams = false;

export function generateStaticParams() {
  return STORE_DEMOS.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const d = demoBySlug((await params).slug);
  const c = storeClient(d?.slug ?? "");
  return {
    title: `Demo: ${c.name}, a custom build · Coelor`,
    description: `${c.name}, a demo ${c.noticeWho.replace(/^an? /, "")}: the kind of custom build we make, with web store, social shop, marketplaces, stockroom and carriers on one stock count. Generated numbers, read-only. Yours is built for your own setup.`,
    robots: { index: false, follow: false },
    alternates: { canonical: `/demo/${d?.slug ?? ""}` },
  };
}

export const viewport: Viewport = { themeColor: "#0f172a", colorScheme: "light" };

export default async function StoreDemoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!demoBySlug(slug)) notFound();
  return <StoreDemoApp slug={slug} />;
}

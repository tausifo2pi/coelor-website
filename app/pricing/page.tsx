import type { Metadata, ResolvingMetadata } from "next";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import PricingHeader from "@/components/pricing/Header";
import PricingHero from "@/components/pricing/Hero";
import Connection from "@/components/pricing/Connection";
import Setups from "@/components/pricing/Setups";
import Trial from "@/components/pricing/Trial";
import Compare from "@/components/pricing/Compare";
import Process from "@/components/pricing/Process";
import Included from "@/components/pricing/Included";
import After from "@/components/pricing/After";
import Proof from "@/components/pricing/Proof";
import PricingFaq from "@/components/pricing/Faq";
import { pricing } from "@/components/pricing/content";
import { jsonLd, serviceJsonLd } from "@/lib/seo";

// Pricing (rebuilt 2026-10-11, lead-outreach docs/website/REBUILD_BRIEF_2026-10-11.md): $500 per connection, one-time,
// 3 for 2, live in about a day once we have access, free trial "your first link" (lib/offer.ts; copy in
// data/pricing.json). The live quote, what a connection is, example setups, the trial, the first 12 months compared,
// how it goes, what is in the price, after handover, the proof line, questions, the form. Indexed. Every section is a
// server-rendered <section id> inside <main> (the Tracker); ids in components/pricing/ids.ts.

/** The page's own title and description; the share image is the site's (layout), whatever it is. */
export async function generateMetadata(_props: unknown, parent: ResolvingMetadata): Promise<Metadata> {
  const images = (await parent).openGraph?.images ?? [];
  return {
    title: pricing.seo.title,
    description: pricing.seo.description,
    alternates: { canonical: "/pricing" },
    openGraph: {
      title: pricing.seo.title,
      description: pricing.seo.description,
      url: "/pricing",
      siteName: "Coelor",
      images,
      type: "website",
    },
  };
}

export default function PricingPage() {
  const { contact } = pricing;
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(serviceJsonLd()) }} />
      <a href="#main" className="skip-link" data-track="off">Skip to content</a>
      <PricingHeader />
      <main id="main">
        <PricingHero />
        <Connection />
        <Setups />
        <Trial />
        <Compare />
        <Process />
        <Included />
        <After />
        <Proof />
        <PricingFaq />
        <Contact num={contact.num} headline={contact.headline} body={contact.body} />
      </main>
      <Footer base="/" />
    </>
  );
}

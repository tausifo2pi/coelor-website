import type { Metadata } from "next";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import PricingHeader from "@/components/pricing/Header";
import PricingHero from "@/components/pricing/Hero";
import HowPriced from "@/components/pricing/HowPriced";
import Tiers from "@/components/pricing/Tiers";
import Included from "@/components/pricing/Included";
import Engine from "@/components/pricing/Engine";
import PricingFaq from "@/components/pricing/Faq";
import { pricing } from "@/components/pricing/content";

// Pricing: one-time payment, full codebase, priced by connections (copy and tiers in data/pricing.json). Not in the
// homepage nav or the sitemap, and not indexed yet; the owner decides later whether it goes in the main nav.

export const metadata: Metadata = {
  title: pricing.seo.title,
  description: pricing.seo.description,
  robots: { index: false, follow: true },
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: pricing.seo.title,
    description: pricing.seo.description,
    url: "/pricing",
    siteName: "Coelor",
    images: [{ url: "/logo-white-on-dark.png", width: 1200, height: 400 }],
    type: "website",
  },
};

export default function PricingPage() {
  const { contact } = pricing;
  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <PricingHeader />
      <main id="main">
        <PricingHero />
        <HowPriced />
        <Tiers />
        <Included />
        <Engine />
        <PricingFaq />
        <Contact num={contact.num} headline={contact.headline} body={contact.body} />
      </main>
      <Footer base="/" />
    </>
  );
}

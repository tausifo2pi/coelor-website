// Search and sharing basics in one place: the social card, each public page's Open Graph block, the homepage metadata
// and the JSON-LD (Organization + WebSite in app/layout.tsx; Service with the per-connection price for /pricing).
// Copy comes from data/site-content.json (seo.*, brand.*); the price from lib/offer.ts.
import type { Metadata } from "next";
import content from "@/data/site-content.json";
import { OFFER, usd } from "@/lib/offer";

export const SITE_URL = "https://coelor.com";

/** public/og.png: 1200×630, dark, wordmark + "Built for how you sell." (rendered once with next/og; see CLAUDE.md). */
export const OG_IMAGE = { url: "/og.png", width: 1200, height: 630, alt: "Coelor. Built for how you sell." } as const;

/** A public page's Open Graph block. A page that sets `openGraph` replaces the layout's whole block, so it always
 * carries the image too. */
export function openGraph(title: string, description: string, path: string): NonNullable<Metadata["openGraph"]> {
  return { title, description, url: path, siteName: content.brand.name, locale: "en_US", type: "website", images: [OG_IMAGE] };
}

/** The homepage's metadata (re-exported at the top of app/page.tsx). */
export const homeMetadata: Metadata = {
  title: { absolute: content.seo.title },
  description: content.seo.description,
  alternates: { canonical: "/" },
  openGraph: openGraph(content.seo.openGraphTitle, content.seo.openGraphDescription, "/"),
};

const { brand } = content;

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: brand.name,
    url: SITE_URL,
    logo: `${SITE_URL}/icon-512.png`,
    email: brand.email,
    slogan: brand.tagline,
    address: {
      "@type": "PostalAddress",
      streetAddress: brand.postal.street,
      addressLocality: brand.postal.city,
      addressCountry: brand.postal.country,
    },
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: brand.name,
    url: SITE_URL,
    inLanguage: "en-US",
    publisher: { "@id": `${SITE_URL}/#organization` },
  };
}

/** For /pricing: the custom build as a Service with its one-time price per connection. */
export function serviceJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Custom ecommerce integration",
    serviceType: "Custom ecommerce integration",
    description: content.seo.description,
    url: `${SITE_URL}/pricing`,
    provider: { "@id": `${SITE_URL}/#organization` },
    areaServed: "Worldwide",
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/pricing`,
      price: OFFER.perConnection,
      priceCurrency: OFFER.currency,
      description: `${usd(OFFER.perConnection)} per connection, one-time. ${OFFER.freeAt} connections for the price of ${OFFER.freeAt - 1}.`,
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: OFFER.perConnection,
        priceCurrency: OFFER.currency,
        unitText: "connection",
      },
    },
  };
}

/** JSON-LD for <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(x) }} />: no "<" left, so
 * the text can never close the script tag. */
export const jsonLd = (data: object | object[]) => JSON.stringify(data).replace(/</g, "\\u003c");

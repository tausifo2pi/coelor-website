import type { ComponentType } from "react";
import {
  SiShopify,
  SiWoocommerce,
  SiPrestashop,
  SiOdoo,
  SiXero,
  SiQuickbooks,
  SiGooglesheets,
  SiHubspot,
  SiNotion,
  SiWhatsapp,
  SiZendesk,
  SiSap,
  SiEbay,
  SiStockx,
  SiEtsy,
  SiTiktok,
  SiBigcommerce,
  SiWix,
  SiSquarespace,
  SiShopware,
  SiVinted,
  SiZalando,
  SiDiscogs,
  SiAllegro,
  SiKaufland,
  SiAftership,
  SiWebflow,
  SiSquare,
  SiCardmarket,
} from "@icons-pack/react-simple-icons";

// Third-party brand marks (Simple Icons), kept apart from the UI icons so client components that only need an arrow
// do not ship every brand logo.

type BrandIcon = ComponentType<{ size?: number; color?: string; title?: string; className?: string }>;

const BRANDS: Record<string, BrandIcon> = {
  shopify: SiShopify,
  woocommerce: SiWoocommerce,
  prestashop: SiPrestashop,
  odoo: SiOdoo,
  xero: SiXero,
  quickbooks: SiQuickbooks,
  "google-sheets": SiGooglesheets,
  hubspot: SiHubspot,
  notion: SiNotion,
  whatsapp: SiWhatsapp,
  zendesk: SiZendesk,
  sap: SiSap,
  ebay: SiEbay,
  stockx: SiStockx,
  // platforms of the dynamic case study's mixes (slugs as lead-outreach sends them)
  etsy: SiEtsy,
  "tiktok-shop": SiTiktok,
  bigcommerce: SiBigcommerce,
  wix: SiWix,
  squarespace: SiSquarespace,
  shopware: SiShopware,
  vinted: SiVinted,
  zalando: SiZalando,
  discogs: SiDiscogs,
  allegro: SiAllegro,
  kaufland: SiKaufland,
  aftership: SiAftership,
  webflow: SiWebflow,
  square: SiSquare,
  cardmarket: SiCardmarket,
};

/** Third-party platform logo (Simple Icons). Falls back to a monogram tile. */
export function BrandLogo({ slug, name, size = 22 }: { slug: string; name: string; size?: number }) {
  const C = BRANDS[slug];
  if (C) return <C size={size} color="currentColor" title={name} />;
  return (
    <span
      aria-hidden
      className="inline-flex items-center justify-center rounded-[6px] border border-current font-semibold leading-none"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.5) }}
    >
      {name.slice(0, 1)}
    </span>
  );
}

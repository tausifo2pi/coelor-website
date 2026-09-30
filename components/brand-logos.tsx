import type { ComponentType } from "react";
import { Warehouse } from "lucide-react";
import {
  SiShopify,
  SiWoocommerce,
  SiEbay,
  SiEtsy,
  SiZalando,
  SiKaufland,
  SiOtto,
  SiTiktok,
  SiBigcommerce,
  SiShopware,
  SiPrestashop,
  SiOdoo,
  SiGooglesheets,
  SiXero,
  SiQuickbooks,
} from "@icons-pack/react-simple-icons";

// Third-party platform marks for the homepage's "what we connect" strip (Simple Icons, single colour), kept apart from
// the UI icons so a client component that only needs an arrow does not ship every brand mark. Only platforms a seller
// runs on: no connector or sync tools.

type BrandIcon = ComponentType<{ size?: number; color?: string; title?: string; className?: string }>;

const BRANDS: Record<string, BrandIcon> = {
  shopify: SiShopify,
  woocommerce: SiWoocommerce,
  ebay: SiEbay,
  etsy: SiEtsy,
  zalando: SiZalando,
  kaufland: SiKaufland,
  otto: SiOtto,
  "tiktok-shop": SiTiktok,
  bigcommerce: SiBigcommerce,
  shopware: SiShopware,
  prestashop: SiPrestashop,
  odoo: SiOdoo,
  "google-sheets": SiGooglesheets,
  xero: SiXero,
  quickbooks: SiQuickbooks,
};

// Marks that are the brand's wordmark (the name is in the mark): shown alone, cropped to the drawing (its box in the
// 24x24 icon grid) and drawn at height `h`.
const WORDMARKS: Record<string, { box: [number, number, number, number]; h: number }> = {
  ebay: { box: [0, 7.21, 24, 9.58], h: 26 },
  odoo: { box: [0, 8.2, 24, 7.59], h: 21 },
  otto: { box: [0, 7.95, 24, 8.1], h: 16 },
  woocommerce: { box: [0, 9.58, 24, 4.84], h: 22 },
};

/** True when the mark already spells the platform's name, so the name need not be written next to it. */
export const isWordmark = (slug: string) => slug in WORDMARKS;

// Marks Simple Icons does not have: the platform's own icon file, turned white by CSS (.connect-img).
const IMAGES: Record<string, string> = {
  amazon: "/platforms/amazon.svg",
};

/**
 * One hidden SVG sprite with every mark once. BrandMark points at it with <use>, so a mark shown twice (the marquee
 * repeats its track) costs its path data only once in the HTML.
 */
export function BrandSprite({ slugs }: { slugs: string[] }) {
  return (
    <svg width="0" height="0" className="pointer-events-none absolute h-0 w-0 overflow-hidden" aria-hidden focusable="false">
      <defs>
        {slugs.map((slug) => {
          const C = BRANDS[slug];
          return C ? (
            <symbol key={slug} id={`brand-${slug}`} viewBox={(WORDMARKS[slug]?.box ?? [0, 0, 24, 24]).join(" ")}>
              <C size={24} color="currentColor" title="" />
            </symbol>
          ) : null;
        })}
      </defs>
    </svg>
  );
}

/** A platform mark in the current text colour. Decorative: the name is written next to it, or (for a wordmark) kept for screen readers. */
export function BrandMark({ slug, size = 22 }: { slug: string; size?: number }) {
  const wm = WORDMARKS[slug];
  if (wm && BRANDS[slug]) {
    const [, , w, h] = wm.box;
    return (
      // the symbol already crops to the box; this viewport only needs its proportions
      <svg width={Math.round((wm.h * w) / h)} height={wm.h} viewBox={`0 0 ${w} ${h}`} fill="currentColor" aria-hidden focusable="false">
        <use href={`#brand-${slug}`} />
      </svg>
    );
  }
  if (BRANDS[slug]) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden focusable="false">
        <use href={`#brand-${slug}`} />
      </svg>
    );
  }
  if (IMAGES[slug]) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={IMAGES[slug]} alt="" width={size} height={size} className="connect-img" style={{ height: size, width: size }} loading="lazy" decoding="async" />;
  }
  if (slug === "warehouse") return <Warehouse size={size} strokeWidth={1.8} aria-hidden />;
  return (
    <span aria-hidden className="inline-flex items-center justify-center rounded-[6px] border border-current font-semibold leading-none" style={{ width: size, height: size, fontSize: Math.round(size * 0.5) }}>
      {slug.slice(0, 1).toUpperCase()}
    </span>
  );
}

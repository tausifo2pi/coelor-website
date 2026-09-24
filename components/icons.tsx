import type { ComponentType } from "react";
import {
  Copy,
  PackageX,
  FileSpreadsheet,
  GitCompareArrows,
  BellOff,
  RefreshCw,
  ArrowRightLeft,
  Link2,
  CalendarClock,
  Receipt,
  ShieldCheck,
  PhoneCall,
  Wrench,
  Power,
  Activity,
  Check,
  Plus,
  ArrowRight,
  type LucideProps,
} from "lucide-react";
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
} from "@icons-pack/react-simple-icons";

const LUCIDE: Record<string, ComponentType<LucideProps>> = {
  copy: Copy,
  "package-x": PackageX,
  "file-spreadsheet": FileSpreadsheet,
  "git-compare": GitCompareArrows,
  "bell-off": BellOff,
  refresh: RefreshCw,
  route: ArrowRightLeft,
  link: Link2,
  "calendar-clock": CalendarClock,
  receipt: Receipt,
  shield: ShieldCheck,
  phone: PhoneCall,
  wrench: Wrench,
  power: Power,
  activity: Activity,
  check: Check,
  plus: Plus,
  "arrow-right": ArrowRight,
};

/** UI icon by name (Lucide). Unknown names render nothing. */
export function Icon({ name, size = 20, className = "", strokeWidth = 1.8 }: { name: string; size?: number; className?: string; strokeWidth?: number }) {
  const C = LUCIDE[name];
  if (!C) return null;
  return <C size={size} strokeWidth={strokeWidth} className={className} aria-hidden />;
}

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

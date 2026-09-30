import { platformInfo } from "@/lib/platforms";
import { Icon } from "@/components/icons";

// A platform's icon on a white rounded tile (icons in /public/platforms, see data/platforms.json): an app icon with its
// own background fills the tile, a mark gets some air around it, and a platform without an icon gets its initial.
// A "facet:…" slug is a part of the reader's setup that is no platform (their warehouse, stock sheet, web store): a dark
// tile with an icon, so it never looks like a brand.

type Size = number | string; // px, or a CSS length such as "0.8em" to sit inside text

/** `eager`: load the icon right away (the hero's setup card; lazy icons were missing when a page opened in a background tab) */
export function PlatformTile({ slug, name, size = 28, label = false, eager = false, className = "" }: { slug: string; name: string; size?: Size; label?: boolean; eager?: boolean; className?: string }) {
  const px = typeof size === "number";
  if (slug.startsWith("facet:") || slug === "warehouse") return <FacetTile facet={slug.replace("facet:", "")} name={name} size={size} label={label} className={className} />;
  const p = platformInfo(slug);
  const style = { width: size, height: size, borderRadius: px ? Math.max(5, Math.round(size * 0.24)) : "24%" };
  const a11y = label ? { role: "img", "aria-label": name } : { "aria-hidden": true as const };
  return (
    <span className={`platform-tile ${className}`} style={style} {...a11y}>
      {p?.logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.logo} alt="" className={p.bleed ? "is-bleed" : ""} loading={eager ? "eager" : "lazy"} decoding="async" />
      ) : (
        <span className="font-semibold leading-none text-[#12151c]" style={{ fontSize: px ? Math.round(size * 0.46) : "0.46em" }}>
          {name.slice(0, 1)}
        </span>
      )}
    </span>
  );
}

const FACET_ICON: Record<string, string> = { warehouse: "warehouse", sheet: "file-spreadsheet", web: "globe" };

function FacetTile({ facet, name, size, label, className = "" }: { facet: string; name: string; size: Size; label: boolean; className?: string }) {
  const px = typeof size === "number";
  const style = { width: size, height: size, borderRadius: px ? Math.max(5, Math.round(size * 0.24)) : "24%" };
  const a11y = label ? { role: "img", "aria-label": name } : { "aria-hidden": true as const };
  return (
    <span className={`facet-tile ${className}`} style={style} {...a11y}>
      <Icon name={FACET_ICON[facet] ?? "globe"} size={px ? Math.round(size * 0.52) : 16} className="h-[52%] w-[52%]" />
    </span>
  );
}

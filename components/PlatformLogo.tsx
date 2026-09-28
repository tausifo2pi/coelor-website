import { platformInfo } from "@/lib/platforms";
import { Icon } from "@/components/icons";

// A platform's icon on a white rounded tile (icons in /public/platforms, see data/platforms.json): an app icon with its
// own background fills the tile, a mark gets some air around it, and a platform without an icon gets its initial.
// "warehouse" is the stand-in for a stock system we don't know.

type Size = number | string; // px, or a CSS length such as "0.8em" to sit inside text

export function PlatformTile({ slug, name, size = 28, label = false, className = "" }: { slug: string; name: string; size?: Size; label?: boolean; className?: string }) {
  const p = platformInfo(slug);
  const px = typeof size === "number";
  const style = { width: size, height: size, borderRadius: px ? Math.max(5, Math.round(size * 0.24)) : "24%" };
  const a11y = label ? { role: "img", "aria-label": name } : { "aria-hidden": true as const };
  return (
    <span className={`platform-tile ${className}`} style={style} {...a11y}>
      {p?.logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.logo} alt="" className={p.bleed ? "is-bleed" : ""} loading="lazy" decoding="async" />
      ) : slug === "warehouse" ? (
        <Icon name="warehouse" size={px ? Math.round(size * 0.55) : 16} className="h-[55%] w-[55%] text-[#12151c]" />
      ) : (
        <span className="font-semibold leading-none text-[#12151c]" style={{ fontSize: px ? Math.round(size * 0.46) : "0.46em" }}>
          {name.slice(0, 1)}
        </span>
      )}
    </span>
  );
}

/** Logo + name, for lists and chips. */
export function PlatformChip({ slug, name, size = 18 }: { slug: string; name: string; size?: number }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-[9px] border border-rule bg-white/[0.04] py-1 pl-1 pr-2.5 text-[13px] font-medium text-ink">
      <PlatformTile slug={slug} name={name} size={size} />
      {name}
    </span>
  );
}

/** Names inside running text, each with its logo: "Shopify, eBay and Picqer". */
export function PlatformList({ items, size = "0.8em" }: { items: { slug: string; name: string }[]; size?: string }) {
  return (
    <>
      {items.map((p, i) => (
        <span key={`${p.slug}-${i}`}>
          <span className="whitespace-nowrap">
            <PlatformTile slug={p.slug} name={p.name} size={size} className="mr-[0.2em] -translate-y-[0.06em] align-middle" />
            {p.name}
          </span>
          {i < items.length - 2 ? ", " : i === items.length - 2 ? " and " : ""}
        </span>
      ))}
    </>
  );
}

import content from "@/data/site-content.json";
import { PlatformTile } from "@/components/PlatformLogo";
import { BrandTile, hasBrandMark } from "@/components/brand-logos";
import { Icon } from "@/components/icons";
import { platformInfo } from "@/lib/platforms";

/**
 * "Platforms we build for" (#connect): what we can build for, not partners. The places buyers sell first, then the
 * systems behind them, each mark once with its name, and the list ends with "Not listed?". A mark is the platform's
 * icon file (data/platforms.json); else its Simple Icons mark in brand colour (QuickBooks); else its initial. "warehouse"
 * is the reader's own system: a dark tile, never a brand. 16 platforms + the last tile (2 wide) fill every row at 2, 3
 * and 6 columns.
 */

function Mark({ slug, name }: { slug: string; name: string }) {
  if (!platformInfo(slug)?.logo && hasBrandMark(slug)) return <BrandTile slug={slug} size={36} />;
  return <PlatformTile slug={slug} name={name} size={36} />;
}

export default function Integrations() {
  const { connect } = content;
  return (
    <section id="connect" aria-labelledby="connect-title" className="scroll-mt-16">
      <div className="mx-auto flex max-w-site flex-col gap-6 px-5 pb-16 md:px-10 lg:px-20 lg:pb-[104px]">
        <div className="flex flex-col gap-2 border-t border-rule pt-10 md:flex-row md:items-end md:justify-between md:gap-10">
          <h2 id="connect-title" className="h2 text-[24px] text-ink md:text-[28px]">
            {connect.headline}
          </h2>
          <p className="max-w-[440px] text-[14px] leading-[1.6] text-ink-muted md:text-right md:text-[15px]">{connect.body}</p>
        </div>

        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6 lg:gap-2.5">
          {connect.items.map((it) => (
            <li key={it.slug} className="flex min-h-[56px] min-w-0 items-center gap-3 rounded-[12px] border border-rule bg-white/[0.03] p-2.5 pr-3">
              <Mark slug={it.slug} name={it.name} />
              <span className="min-w-0 text-[14px] font-medium leading-[1.3] text-ink">{it.name}</span>
            </li>
          ))}
          <li className="col-span-2 flex min-h-[56px] items-center gap-3 rounded-[12px] border border-dashed border-accent/40 bg-accent/[0.05] p-2.5 pr-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] bg-accent/15 text-accent" aria-hidden>
              <Icon name="plus" size={16} strokeWidth={2.2} />
            </span>
            <span className="text-[14px] leading-[1.4] text-ink">{connect.more}</span>
          </li>
        </ul>
      </div>
    </section>
  );
}

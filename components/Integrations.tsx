import content from "@/data/site-content.json";
import { BrandMark, BrandSprite, isWordmark } from "@/components/brand-logos";

/**
 * "What we connect": a strip of platform marks with their names. The track is rendered twice so the CSS translate of
 * -50% loops seamlessly; the second copy is hidden from assistive tech (and, without motion, from view).
 */
export default function Integrations() {
  const { connect } = content;
  const Track = ({ hidden = false }: { hidden?: boolean }) => (
    <ul className="flex shrink-0 items-center gap-10 pr-10 md:gap-14 md:pr-14" aria-hidden={hidden || undefined}>
      {connect.items.map((it) => (
        <li key={it.slug} className="connect-item">
          <BrandMark slug={it.slug} size={22} />
          <span className={isWordmark(it.slug) ? "sr-only" : undefined}>{it.name}</span>
        </li>
      ))}
    </ul>
  );

  return (
    <section id="connect" aria-labelledby="connect-title" className="relative scroll-mt-16 border-y border-rule bg-canvas2">
      <BrandSprite slugs={connect.items.map((it) => it.slug)} />
      <div className="mx-auto flex max-w-site flex-col gap-6 px-5 py-8 md:px-10 lg:px-20">
        <h2 id="connect-title" className="text-center text-[13px] font-medium leading-[1.5] text-ink-soft">
          {connect.label}
        </h2>
        <div className="marquee connect-marquee">
          <div className="marquee-track" style={{ animationDuration: "90s" }}>
            <Track />
            <Track hidden />
          </div>
        </div>
      </div>
    </section>
  );
}

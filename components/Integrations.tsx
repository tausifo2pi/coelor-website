import content from "@/data/site-content.json";

/**
 * Logo-only brand strip. The track is rendered twice so the CSS translate
 * of -50% loops seamlessly; the second copy is hidden from assistive tech.
 */
export default function Integrations() {
  const { integrations } = content;
  const Track = ({ hidden = false }: { hidden?: boolean }) => (
    <ul className="flex shrink-0 items-center gap-14 pr-14 md:gap-20 md:pr-20" aria-hidden={hidden}>
      {integrations.items.map((it) => (
        <li key={it.name} className="flex shrink-0 items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={it.file} alt={hidden ? "" : it.name} className="brand-logo" style={{ height: it.h }} loading="lazy" decoding="async" />
        </li>
      ))}
    </ul>
  );

  return (
    <section aria-label={integrations.label} className="border-y border-rule bg-canvas2">
      <div className="mx-auto flex max-w-site flex-col gap-5 px-5 py-7 md:px-10 lg:px-20 lg:py-7">
        <p className="text-center text-[13px] text-ink-soft">{integrations.label}</p>
        <div className="marquee">
          <div className="marquee-track">
            <Track />
            <Track hidden />
          </div>
        </div>
      </div>
    </section>
  );
}

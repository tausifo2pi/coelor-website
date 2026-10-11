import SectionHead from "@/components/SectionHead";
import { Icon } from "@/components/icons";
import { IDS, INNER, SECTION, pricing } from "./content";

// After handover (user decision 1, 2026-10-11): 90 days of fixes included, also when a platform changes its API; then
// a fixed price per fix, agreed first; or any developer, because the client has the source code.

export default function After() {
  const { after } = pricing;
  return (
    <section id={IDS.after} aria-labelledby="after-title" className={`${SECTION} bg-canvas2`}>
      <div className={`${INNER} grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-20`}>
        <SectionHead id="after-title" num={after.num} eyebrow={after.eyebrow} headline={after.headline} size="md" className="[&_h2]:text-balance" />
        <ul className="grid grid-cols-1 border-t border-rule sm:grid-cols-3 sm:gap-6 sm:border-t-0">
          {after.items.map((it) => (
            <li key={it.title} className="flex flex-col gap-1.5 border-b border-rule py-4 sm:border-b-0 sm:border-t sm:pt-5">
              <span className="flex items-center gap-2.5 text-[15px] font-semibold text-ink">
                <span className="text-accent">
                  <Icon name={it.icon} size={17} />
                </span>
                {it.title}
              </span>
              <p className="text-[14px] leading-[1.6] text-ink-muted">{it.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

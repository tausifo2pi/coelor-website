import SectionHead from "@/components/SectionHead";
import { Icon } from "@/components/icons";
import { PREFILL } from "@/lib/offer";
import { IDS, INNER, SECTION, pricing } from "./content";

// The free trial, explained once: "your first link" (two of the reader's platforms), what it runs, and what happens
// after the 7 days, both ways. The button fills in the contact form with the trial (ContactForm listens for
// [data-prefill]).

export default function Trial() {
  const { trial } = pricing;
  return (
    <section id={IDS.trial} aria-labelledby="trial-title" className={`${SECTION} bg-canvas2`}>
      <div className={`${INNER} grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-20`}>
        <div className="flex flex-col gap-6">
          <SectionHead id="trial-title" num={trial.num} eyebrow={trial.eyebrow} headline={trial.headline} body={trial.body} size="md" className="[&_h2]:text-balance" />
          <a href={`#${IDS.contact}`} data-prefill={PREFILL.trial} className="btn-primary w-full sm:w-fit">
            {trial.cta}
            <Icon name="arrow-right" size={15} strokeWidth={2.4} />
          </a>
        </div>
        <dl className="flex flex-col self-start rounded-[16px] border border-dashed border-ok/40 bg-ok/[0.04] px-5 md:px-6 lg:mt-2">
          {trial.points.map((p, i) => (
            <div key={p.title} className={`flex flex-col gap-1 py-4 ${i ? "border-t border-dashed border-ok/20" : ""}`}>
              <dt className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#8fe7c2]">{p.title}</dt>
              <dd className="m-0 text-[15px] leading-[1.55] text-ink">{p.body}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

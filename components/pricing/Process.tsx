import SectionHead from "@/components/SectionHead";
import { Icon } from "@/components/icons";
import { IDS, INNER, SECTION, pricing } from "./content";

// How a build goes: the call, the build (live in about a day once we have access), the free trial, one payment,
// handover. A row of steps on a line on wide screens (xl), a vertical line on phones. The line is drawn next to the
// list, not inside it: an <ol> may only hold <li>.

export default function Process() {
  const { process } = pricing;
  return (
    <section id={IDS.process} aria-labelledby="process-title" className={`${SECTION} bg-canvas2`}>
      <div className={`${INNER} flex flex-col gap-8 lg:gap-10`}>
        <SectionHead id="process-title" num={process.num} eyebrow={process.eyebrow} headline={process.headline} size="md" className="max-w-[640px] [&_h2]:text-balance" />
        <div className="relative">
          {/* the line through the steps */}
          <span className="absolute bottom-6 left-[19px] top-6 w-px bg-gradient-to-b from-accent/50 via-rule-strong to-rule xl:bottom-auto xl:left-6 xl:right-6 xl:top-[19px] xl:h-px xl:w-auto xl:bg-gradient-to-r" aria-hidden />
          <ol className="relative grid grid-cols-1 gap-0 xl:grid-cols-5 xl:gap-5">
            {process.steps.map((s) => (
              <li key={s.title} className="relative grid grid-cols-[40px_1fr] gap-x-4 pb-6 last:pb-0 xl:flex xl:flex-col xl:gap-4 xl:pb-0">
                <span className="relative z-[1] grid h-10 w-10 place-items-center rounded-full border border-accent/40 bg-canvas text-accent" aria-hidden>
                  <Icon name={s.icon} size={17} />
                </span>
                <div className="flex flex-col gap-1 pt-1 xl:pt-0">
                  <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-soft">{s.when}</span>
                  <h3 className="text-[17px] font-semibold leading-[1.3] text-ink">{s.title}</h3>
                  <p className="max-w-[420px] text-[14px] leading-[1.6] text-ink-muted">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

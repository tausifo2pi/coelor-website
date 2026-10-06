import SectionHead from "@/components/SectionHead";
import { Icon } from "@/components/icons";
import { pricing } from "./content";

// How a build goes, day by day: call, set-up, the optional free trial, one payment, handover. A row of steps on a line
// on wide screens (xl), a vertical line on phones. The optional step (the trial) is drawn dashed.

export default function Process() {
  const { process } = pricing;
  return (
    <section id="process" aria-labelledby="process-title" className="scroll-mt-20 border-t border-rule">
      <div className="mx-auto flex max-w-site flex-col gap-12 px-5 py-16 md:px-10 lg:px-20 lg:py-[104px]">
        <SectionHead id="process-title" num={process.num} eyebrow={process.eyebrow} headline={process.headline} className="max-w-[680px] [&_h2]:text-balance" />
        <ol className="relative grid grid-cols-1 gap-0 xl:grid-cols-5 xl:gap-5">
          {/* the line through the steps */}
          <span className="absolute bottom-6 left-[19px] top-6 w-px bg-gradient-to-b from-accent/50 via-rule-strong to-rule xl:bottom-auto xl:left-6 xl:right-6 xl:top-[19px] xl:h-px xl:w-auto xl:bg-gradient-to-r" aria-hidden />
          {process.steps.map((s) => {
            const optional = "tag" in s && s.tag;
            return (
              <li key={s.title} className="relative grid grid-cols-[40px_1fr] gap-x-4 pb-9 last:pb-0 xl:flex xl:flex-col xl:gap-4 xl:pb-0">
                <span
                  className={`relative z-[1] grid h-10 w-10 place-items-center rounded-full border bg-canvas ${optional ? "border-dashed border-ok/60 text-ok" : "border-accent/40 text-accent"}`}
                  aria-hidden
                >
                  <Icon name={s.icon} size={17} />
                </span>
                <div className="flex flex-col gap-1.5 pt-1 xl:pt-0">
                  <span className="flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-soft">
                    {s.when}
                    {optional && <span className="rounded-full border border-ok/30 bg-ok/10 px-2 py-0.5 text-[10px] text-[#8fe7c2]">{optional}</span>}
                  </span>
                  <h3 className="text-[17px] font-semibold leading-[1.3] text-ink">{s.title}</h3>
                  <p className="max-w-[420px] text-[14px] leading-[1.6] text-ink-muted">{s.body}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

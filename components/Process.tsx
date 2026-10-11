import content from "@/data/site-content.json";
import SectionHead from "@/components/SectionHead";
import { Icon } from "@/components/icons";

/**
 * How it works: call, build, trial, pay once, handover. Five cards on a sweeping rail on wide screens (xl), a vertical
 * line beside them below that. The rail and the line sit next to the <ol>, not in it (only <li> may be its children).
 */
export default function Process() {
  const { process } = content;
  const last = process.steps.length - 1;
  return (
    <section id="process" aria-labelledby="process-title" className="scroll-mt-16 border-t border-rule bg-canvas2">
      <div className="mx-auto flex max-w-site flex-col gap-10 px-5 py-16 md:px-10 lg:gap-14 lg:px-20 lg:py-[104px]">
        <SectionHead id="process-title" num={process.num} eyebrow={process.eyebrow} headline={process.headline} className="max-w-[640px] [&_h2]:text-balance" />

        <div className="relative">
          {/* horizontal rail (xl) */}
          <div className="rail pointer-events-none absolute left-6 right-6 top-6 hidden h-[2px] rounded-full xl:block" aria-hidden />
          {/* vertical line (below xl) */}
          <div className="pointer-events-none absolute bottom-6 left-[23px] top-6 w-[2px] rounded-full bg-gradient-to-b from-accent to-ok opacity-60 xl:hidden" aria-hidden />

          <ol className="relative grid grid-cols-1 gap-6 xl:grid-cols-5 xl:gap-5">
            {process.steps.map((s, i) => (
              <li key={s.title} className="relative flex gap-5 xl:flex-col xl:gap-0">
                {/* node */}
                <span className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-rule-strong bg-canvas text-ink shadow-[0_0_0_6px_#0d0f14]">
                  <Icon name={s.icon} size={18} />
                  {i === last && <span className="pulse absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-canvas bg-ok" aria-hidden />}
                </span>

                {/* card */}
                <div className="panel relative flex min-w-0 flex-1 flex-col gap-3 overflow-hidden p-5 md:p-6 xl:mt-7 xl:p-5">
                  <span className="pointer-events-none absolute -right-2 -top-4 select-none font-mono text-[72px] font-medium leading-none text-white/[0.04]" aria-hidden>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="inline-flex w-fit items-center rounded-md bg-accent/10 px-2 py-1 font-mono text-[11px] uppercase tracking-[0.08em] text-accent">{s.when}</span>
                  <h3 className="text-[19px] font-semibold text-ink">{s.title}</h3>
                  <p className="text-[14px] leading-[1.6] text-ink-muted md:text-[15px] xl:text-[14px]">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

import content from "@/data/site-content.json";
import SectionHead from "@/components/SectionHead";
import { Icon } from "@/components/icons";

export default function Process() {
  const { process } = content;
  const last = process.steps.length - 1;
  return (
    <section id="process" aria-labelledby="process-title" className="scroll-mt-16">
      <div className="mx-auto flex max-w-site flex-col gap-10 px-5 py-16 md:px-10 lg:gap-14 lg:px-20 lg:py-[104px]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
          <SectionHead id="process-title" num={process.num} eyebrow={process.eyebrow} headline={process.headline} className="max-w-[640px]" />
          <p className="inline-flex items-center gap-2 rounded-full border border-rule bg-panel px-3.5 py-2 text-[13px] text-ink-muted lg:mb-1">
            <Icon name="calendar-clock" size={15} className="text-accent" />
            {process.timeline}
          </p>
        </div>

        <ol className="timeline relative grid grid-cols-1 gap-8 lg:grid-cols-4 lg:gap-6">
          {/* horizontal rail (desktop) */}
          <div className="rail pointer-events-none absolute left-6 right-6 top-6 hidden h-[2px] rounded-full lg:block" aria-hidden />
          {process.steps.map((s, i) => (
            <li key={s.title} className="relative flex gap-5 lg:flex-col lg:gap-0">
              {/* node */}
              <span className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-rule-strong bg-canvas text-ink shadow-[0_0_0_6px_#0a0c10]">
                <Icon name={s.icon} size={18} />
                {i === last && <span className="pulse absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-canvas bg-ok" aria-hidden />}
              </span>

              {/* card */}
              <div className="panel relative flex flex-1 flex-col gap-3 overflow-hidden p-6 lg:mt-7">
                <span className="pointer-events-none absolute -right-2 -top-4 select-none font-mono text-[72px] font-medium leading-none text-white/[0.04]" aria-hidden>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="inline-flex w-fit items-center rounded-md bg-accent/10 px-2 py-1 font-mono text-[11px] uppercase tracking-[0.08em] text-accent">{s.when}</span>
                <span className="text-[20px] font-semibold text-ink">{s.title}</span>
                <span className="text-[14px] leading-[1.6] text-ink-muted">{s.body}</span>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

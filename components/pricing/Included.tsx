import SectionHead from "@/components/SectionHead";
import { Icon } from "@/components/icons";
import { pricing } from "./content";

// What the price covers, line by line: what is in it, what is never charged ($0 lines, like the quote above), and what
// stays as today (the platforms' own plans). Nothing about hosting or support after handover (user, 2026-10-07).

export default function Included() {
  const { included } = pricing;
  return (
    <section id="included" aria-labelledby="included-title" className="scroll-mt-20 border-t border-rule bg-canvas2">
      <div className="mx-auto flex max-w-site flex-col gap-10 px-5 py-16 md:px-10 lg:gap-12 lg:px-20 lg:py-[104px]">
        <SectionHead id="included-title" num={included.num} eyebrow={included.eyebrow} headline={included.headline} className="max-w-[680px] [&_h2]:text-balance" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.15fr_1fr]">
          <div className="flex flex-col gap-5 rounded-[16px] border border-ok/25 bg-ok/[0.05] p-6 md:p-8">
            <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-[#8fe7c2]">{included.inLabel}</span>
            <ul className="flex flex-col">
              {included.in.map((x, i) => (
                <li key={x} className={`flex gap-3 py-3.5 text-[15px] leading-[1.5] text-ink md:text-[16px] ${i ? "border-t border-ok/15" : ""}`}>
                  <span className="mt-[1px] grid h-6 w-6 shrink-0 place-items-center rounded-full bg-ok/15 text-ok" aria-hidden>
                    <Icon name="check" size={13} strokeWidth={2.8} />
                  </span>
                  {x}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-4">
            <div className="panel flex flex-col gap-4 p-6 md:p-8">
              <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-soft">{included.neverLabel}</span>
              <dl className="flex flex-col">
                {included.never.map((x, i) => (
                  <div key={x.label} className={`flex items-baseline justify-between gap-4 py-3 text-[15px] ${i ? "border-t border-dashed border-rule-strong" : ""}`}>
                    <dt className="text-ink-muted">{x.label}</dt>
                    <dd className="font-mono tabular-nums text-ink">{x.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="flex gap-4 rounded-[14px] border border-rule bg-white/[0.02] p-6">
              <span className="facet-tile h-9 w-9 rounded-[8px]" aria-hidden>
                <Icon name="globe" size={16} />
              </span>
              <div className="flex flex-col gap-1">
                <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-soft">{included.ownLabel}</span>
                <p className="text-[14px] leading-[1.6] text-ink-muted">{included.own}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

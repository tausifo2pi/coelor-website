import SectionHead from "@/components/SectionHead";
import { Icon } from "@/components/icons";
import { IDS, INNER, SECTION, pricing } from "./content";

// What the price covers, line by line: what is in it, what is never charged ($0 lines, like the quote above), and the
// honest running cost: it runs in the client's own cloud account and the host bills them directly (usually $5–20 a
// month, user decision 2, 2026-10-11); the platforms' own plans stay as they are. We charge nothing monthly.

export default function Included() {
  const { included } = pricing;
  return (
    <section id={IDS.included} aria-labelledby="included-title" className={SECTION}>
      <div className={`${INNER} flex flex-col gap-8 lg:gap-10`}>
        <SectionHead id="included-title" num={included.num} eyebrow={included.eyebrow} headline={included.headline} size="md" className="max-w-[640px] [&_h2]:text-balance" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.15fr_1fr]">
          <div className="flex flex-col gap-3 rounded-[16px] border border-ok/25 bg-ok/[0.05] p-5 md:p-7">
            <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-[#8fe7c2]">{included.inLabel}</span>
            <ul className="flex flex-col">
              {included.in.map((x, i) => (
                <li key={x} className={`flex gap-3 py-2.5 text-[15px] leading-[1.5] text-ink ${i ? "border-t border-ok/15" : ""}`}>
                  <span className="mt-[1px] grid h-6 w-6 shrink-0 place-items-center rounded-full bg-ok/15 text-ok" aria-hidden>
                    <Icon name="check" size={13} strokeWidth={2.8} />
                  </span>
                  {x}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-4">
            <div className="panel flex flex-col gap-2 p-5 md:p-7">
              <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-soft">{included.neverLabel}</span>
              <dl className="flex flex-col">
                {included.never.map((x, i) => (
                  <div key={x.label} className={`flex items-baseline justify-between gap-4 py-2.5 text-[15px] ${i ? "border-t border-dashed border-rule-strong" : ""}`}>
                    <dt className="text-ink-muted">{x.label}</dt>
                    <dd className="m-0 font-mono tabular-nums text-ink">{x.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="flex gap-4 rounded-[14px] border border-rule bg-white/[0.02] p-5 md:p-6">
              <span className="hidden shrink-0 sm:block" aria-hidden>
                <span className="facet-tile h-9 w-9 rounded-[8px]">
                  <Icon name="globe" size={16} />
                </span>
              </span>
              <div className="flex flex-col gap-1.5">
                <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-soft">{included.runLabel}</span>
                {included.run.map((x) => (
                  <p key={x} className="text-[14px] leading-[1.6] text-ink-muted">{x}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

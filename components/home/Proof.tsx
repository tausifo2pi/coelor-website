import content from "@/data/site-content.json";
import SectionHead from "@/components/SectionHead";
import { Icon } from "@/components/icons";

// The one real client, anonymous: a reseller in the Netherlands (never next to the names of its marketplaces or its
// warehouse system). Only what its build really does today, in the same words and numbers as /pricing: a card like the
// hero's, with what it does, and the numbers it runs at under it.

export default function Proof() {
  const { proof } = content;
  return (
    <section id="proof" aria-labelledby="proof-title" className="scroll-mt-16">
      <div className="mx-auto flex max-w-site flex-col gap-10 px-5 py-16 md:px-10 lg:gap-14 lg:px-20 lg:py-[104px]">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,480px)_1fr] lg:items-center lg:gap-20">
          <SectionHead id="proof-title" num={proof.num} eyebrow={proof.eyebrow} headline={proof.headline} body={proof.body} className="[&_h2]:text-balance" />

          <div className="panel overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-rule px-5 py-3.5">
              <span className="inline-flex items-center gap-2.5 text-[13px] font-semibold text-ink">
                <Icon name="activity" size={14} className="text-ink/70" />
                {proof.doesTitle}
              </span>
              <span className="inline-flex h-6 items-center gap-2 rounded-full border border-ok/25 bg-ok/10 px-2.5 text-[11px] font-medium text-[#8fe7c2]">
                <span className="pulse h-1.5 w-1.5 rounded-full bg-ok" aria-hidden />
                {proof.badge}
              </span>
            </div>
            <ul className="flex flex-col px-5 py-2">
              {proof.does.map((d, i) => (
                <li key={d} className={`flex items-start gap-3 py-3.5 text-[15px] leading-[1.5] text-ink md:text-[16px] ${i ? "border-t border-rule" : ""}`}>
                  <span className="mt-[1px] grid h-6 w-6 shrink-0 place-items-center rounded-full bg-ok/15 text-ok" aria-hidden>
                    <Icon name="check" size={13} strokeWidth={2.8} />
                  </span>
                  {d}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <dl className="grid grid-cols-1 gap-6 border-t border-rule pt-8 sm:grid-cols-3">
          {proof.stats.map((s) => (
            <div key={s.label} className="flex flex-col-reverse justify-end gap-1">
              <dt className="max-w-[260px] text-[13px] leading-[1.45] text-ink-soft md:text-[14px]">{s.label}</dt>
              <dd className="display m-0 text-[30px] text-ink lg:text-[36px]">{s.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

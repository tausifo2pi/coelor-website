import content from "@/data/site-content.json";
import SectionHead from "@/components/SectionHead";
import { Icon } from "@/components/icons";
import { fill } from "@/components/home/figures";
import { OFFER, PREFILL, quote, usd } from "@/lib/offer";

// The prices in one panel: the offer, three example setups with their totals (computed from lib/offer.ts: $500 each,
// from 3 on one is free), the typical range, the price per month over two years and the honest running cost. The full
// details live on /pricing. Example rows are generic parts of a setup (dark tiles), never brands.

type Example = { title: string; rows: { icon: string; label: string }[] };

function ExampleCard({ ex }: { ex: Example }) {
  const { pricing } = content;
  const n = ex.rows.length;
  return (
    <li className="flex flex-col gap-4 rounded-[14px] border border-rule bg-white/[0.02] p-5">
      <div className="flex flex-col gap-1">
        <h3 className="text-[16px] font-semibold leading-[1.3] text-ink">{ex.title}</h3>
        <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-soft">{fill(pricing.connections, { n })}</span>
      </div>
      <ul className="flex flex-col gap-2">
        {ex.rows.map((r) => (
          <li key={r.label} className="flex items-center gap-3 rounded-[10px] border border-rule bg-white/[0.03] p-2 pr-3">
            <span className="facet-tile h-8 w-8 rounded-[8px]" aria-hidden>
              <Icon name={r.icon} size={15} />
            </span>
            <span className="min-w-0 flex-1 text-[14px] leading-[1.35] text-ink">{r.label}</span>
            <span className="shrink-0 font-mono text-[11px] text-ink-soft">{usd(OFFER.perConnection)}</span>
          </li>
        ))}
      </ul>
      {n >= OFFER.freeAt && (
        <div className="flex items-center justify-between gap-3 px-1">
          <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#8fe7c2]">{pricing.free}</span>
          <span className="font-mono text-[13px] text-ink-muted">−{usd(OFFER.perConnection)}</span>
        </div>
      )}
      <div className="mt-auto flex items-center justify-between gap-3 rounded-[12px] border border-accent/30 bg-accent/[0.07] px-4 py-3">
        <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-accent">{pricing.total}</span>
        <span className="text-[18px] font-semibold text-ink">{usd(quote(n))}</span>
      </div>
    </li>
  );
}

export default function PricingTeaser() {
  const { pricing } = content;
  return (
    <section id="pricing" aria-labelledby="pricing-title" className="scroll-mt-16">
      <div className="mx-auto max-w-site px-5 py-16 md:px-10 lg:px-20 lg:py-[104px]">
        <div className="panel relative flex flex-col gap-10 overflow-hidden p-6 md:p-10 lg:p-12">
          <div className="pointer-events-none absolute -right-28 -top-28 h-72 w-72 rounded-full bg-accent/10 blur-3xl" aria-hidden />

          <div className="relative grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px] lg:gap-16">
            <SectionHead id="pricing-title" num={pricing.num} eyebrow={pricing.eyebrow} headline={pricing.headline} body={pricing.body} />
            <ul className="flex flex-col gap-3.5 lg:pt-10">
              {pricing.points.map((p) => (
                <li key={p} className="flex gap-3 text-[15px] leading-[1.5] text-ink md:text-[16px]">
                  <Icon name="check" size={16} strokeWidth={2.4} className="mt-[3px] shrink-0 text-ok" />
                  {p}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative flex flex-col gap-4">
            <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-soft">{pricing.examplesTitle}</span>
            <ul className="grid grid-cols-1 gap-3 md:gap-4 lg:grid-cols-3">
              {pricing.examples.map((ex) => (
                <ExampleCard key={ex.title} ex={ex} />
              ))}
            </ul>
          </div>

          <div className="relative flex flex-col gap-6 border-t border-rule pt-8 xl:flex-row xl:items-end xl:justify-between xl:gap-12">
            <div className="flex max-w-[620px] flex-col gap-2">
              <span className="text-[20px] font-semibold leading-[1.3] text-ink md:text-[22px]">{pricing.typical}</span>
              <span className="text-[15px] leading-[1.55] text-ink-muted">{fill(pricing.perMonth)}</span>
              <span className="text-[13px] leading-[1.55] text-ink-soft">{fill(pricing.note)}</span>
            </div>
            <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center">
              <a href={pricing.trialCta.href} data-prefill={PREFILL.trial} className="btn-primary">
                {pricing.trialCta.label}
                <Icon name="arrow-right" size={15} strokeWidth={2.4} />
              </a>
              <a href={pricing.cta.href} className="btn-ghost">
                {pricing.cta.label}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

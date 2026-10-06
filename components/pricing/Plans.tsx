import SectionHead from "@/components/SectionHead";
import { Icon } from "@/components/icons";
import { PREFILL } from "@/lib/offer";
import { pricing, priceLine } from "./content";

// The free trial and three sizes by number of connections. A paid card's price is computed from its `count`
// (lib/offer.ts: $500 per connection, one-time, 3 for the price of 2); a card gets a label only when its `badge` is set.
// From tablet width the cards share their five rows (CSS subgrid), so titles, prices and buttons line up. Every button
// fills in the contact form below with that plan (ContactForm listens for [data-prefill]).

type Plan = (typeof pricing.plans.items)[number];

const CARD = "relative flex flex-col gap-5 rounded-[16px] p-6 md:p-7 md:row-span-5 md:grid md:grid-rows-subgrid md:gap-5";

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex w-fit items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.08em] text-accent">
      <Icon name="link" size={12} />
      {children}
    </span>
  );
}

function TrialCard() {
  const { trial } = pricing.plans;
  return (
    <li className={`${CARD} border border-dashed border-ok/40 bg-ok/[0.04]`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-ok/30 bg-ok/10 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.08em] text-[#8fe7c2]">
          <span className="pulse h-1.5 w-1.5 rounded-full bg-ok" aria-hidden />
          {trial.label}
        </span>
      </div>
      <h3 className="text-[20px] font-semibold leading-[1.25] text-ink">{trial.title}</h3>
      <div className="flex flex-col gap-1">
        <span className="display text-[40px] leading-none text-ink">{trial.price}</span>
        <span className="text-[13px] text-ink-soft">{trial.unit}</span>
      </div>
      <div className="flex flex-col gap-4">
        <ul className="flex flex-col gap-2.5">
          {trial.points.map((p) => (
            <li key={p} className="flex gap-2.5 text-[14px] leading-[1.5] text-ink-muted">
              <Icon name="check" size={15} strokeWidth={2.4} className="mt-[3px] shrink-0 text-ok" />
              {p}
            </li>
          ))}
        </ul>
        <p className="border-t border-dashed border-rule-strong pt-4 text-[13px] leading-[1.55] text-ink-soft">{trial.after}</p>
      </div>
      <a href="#contact" data-prefill={PREFILL.trial} className="btn-ghost w-full self-end">
        {trial.cta}
        <Icon name="arrow-right" size={15} strokeWidth={2.4} />
      </a>
    </li>
  );
}

function PlanCard({ p }: { p: Plan }) {
  const { plans } = pricing;
  const price = priceLine(p.count, "plus" in p && p.plus === true);
  const badge = (p.badge as string | null) ?? null;
  return (
    <li className={`${CARD} border ${badge ? "border-accent/45 bg-panel2 shadow-[0_30px_80px_-30px_rgba(159,176,255,0.35)]" : "border-rule bg-panel"}`}>
      <div className="flex items-center">
        <Chip>{p.connections}</Chip>
        {badge && (
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-accent px-3 py-1 font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-canvas">
            {badge}
          </span>
        )}
      </div>
      <h3 className="text-[20px] font-semibold leading-[1.25] text-ink">{p.title}</h3>
      <div className="flex flex-col gap-1">
        <span className="display text-[40px] leading-none tabular-nums text-ink">{price.title}</span>
        <span className="text-[13px] text-ink-soft">{price.unit}</span>
      </div>
      <div className="flex flex-col gap-4">
        <ul className="flex flex-col gap-2.5">
          {p.points.map((x) => (
            <li key={x} className="flex gap-2.5 text-[14px] leading-[1.5] text-ink-muted">
              <Icon name="check" size={15} strokeWidth={2.4} className="mt-[3px] shrink-0 text-ok" />
              {x}
            </li>
          ))}
        </ul>
        <p className="border-t border-dashed border-rule-strong pt-4 text-[13px] leading-[1.55] text-ink-soft">
          <span className="font-mono text-[10px] uppercase tracking-[0.1em]">{plans.exampleLabel}:</span> {p.example}
        </p>
      </div>
      <a href="#contact" data-prefill={PREFILL.quote(p.count)} className={`${badge ? "btn-primary" : "btn-ghost"} w-full self-end`}>
        {plans.cta}
        <Icon name="arrow-right" size={15} strokeWidth={2.4} />
      </a>
    </li>
  );
}

export default function Plans() {
  const { plans } = pricing;
  return (
    <section id="plans" aria-labelledby="plans-title" className="scroll-mt-20 border-t border-rule bg-canvas2">
      <div className="mx-auto flex max-w-site flex-col gap-10 px-5 py-16 md:px-10 lg:gap-12 lg:px-20 lg:py-[104px]">
        <SectionHead id="plans-title" num={plans.num} eyebrow={plans.eyebrow} headline={plans.headline} body={plans.body} className="max-w-[680px] [&_h2]:text-balance" />
        <ul className="grid grid-cols-1 gap-4 pt-3 md:grid-cols-2 xl:grid-cols-4">
          <TrialCard />
          {plans.items.map((p) => (
            <PlanCard key={p.key} p={p} />
          ))}
        </ul>
        <div className="flex flex-col gap-4 rounded-[14px] border border-rule bg-white/[0.02] px-6 py-5">
          <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-soft">{plans.commonLabel}</span>
          <ul className="grid grid-cols-1 gap-x-6 gap-y-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {plans.common.map((c) => (
              <li key={c} className="flex items-start gap-2 text-[14px] leading-[1.45] text-ink-muted">
                <Icon name="check" size={14} strokeWidth={2.4} className="mt-[3px] shrink-0 text-ok" />
                {c}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

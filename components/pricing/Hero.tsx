import { Icon } from "@/components/icons";
import { pricing } from "./content";

// Headline, the two CTAs, and a spec card of what every build is (one-time, priced by connections, unlimited, yours).
// No link to the live demo or the case studies: those are for email readers only.

function BuildCard() {
  const { card } = pricing.hero;
  return (
    <div className="glass-card flex flex-col gap-5 p-5 sm:p-6" aria-label={card.title}>
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-soft">{card.title}</span>
        <span className="inline-flex items-center gap-2 rounded-full border border-ok/30 bg-ok/10 px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.08em] text-[#8fe7c2]">
          <Icon name="check" size={12} strokeWidth={2.6} />
          {card.badge}
        </span>
      </div>
      <dl className="flex flex-col rounded-[12px] border border-rule bg-white/[0.03]">
        {card.rows.map((r, i) => (
          <div key={r.label} className={`flex items-center justify-between gap-4 px-4 py-3.5 ${i ? "border-t border-rule" : ""}`}>
            <dt className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-soft">{r.label}</dt>
            <dd className="text-right text-[14px] font-semibold text-ink sm:text-[15px]">{r.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default function PricingHero() {
  const { hero } = pricing;
  return (
    <section id="top" aria-labelledby="pricing-title" className="relative overflow-hidden">
      <div className="pointer-events-none absolute -right-40 -top-40 h-[560px] w-[560px] rounded-full bg-accent/10 blur-3xl" aria-hidden />
      <div className="relative mx-auto grid max-w-site grid-cols-1 gap-12 px-5 pb-14 pt-12 md:px-10 md:pt-20 lg:grid-cols-[minmax(0,600px)_1fr] lg:items-center lg:gap-14 lg:px-20 lg:pb-20 lg:pt-24">
        <div className="flex flex-col">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.08em] text-accent">
            {hero.eyebrow}
          </span>
          <h1 id="pricing-title" className="display mt-5 text-[40px] leading-[1.05] text-ink sm:text-[52px] lg:text-[62px]">
            {/* one sentence per line: "Pay once." / "Own the code." */}
            {hero.headline.split(/(?<=\.)\s+/).map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h1>
          <p className="mt-5 max-w-[540px] text-pretty text-[16px] leading-[1.6] text-ink-muted md:text-[18px]">{hero.sub}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <a href={hero.primaryCta.href} className="btn-primary">
              {hero.primaryCta.label}
              <Icon name="arrow-right" size={15} strokeWidth={2.4} />
            </a>
            <a href={hero.secondaryCta.href} className="btn-ghost">
              {hero.secondaryCta.label}
            </a>
          </div>
          <ul className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2" aria-label="Every build">
            {hero.points.map((p) => (
              <li key={p} className="inline-flex items-center gap-2 text-[14px] text-ink-muted">
                <Icon name="check" size={14} strokeWidth={2.4} className="text-ok" />
                {p}
              </li>
            ))}
          </ul>
        </div>
        <BuildCard />
      </div>
    </section>
  );
}

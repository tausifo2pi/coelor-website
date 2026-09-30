import SectionHead from "@/components/SectionHead";
import { Icon } from "@/components/icons";
import { pricing, priceLine } from "./content";

// Three builds by number of connections. The price line comes from data/pricing.json (`from`, null until filled in);
// a card gets a label only when its `badge` is set. On wide screens the cards share their six rows (CSS subgrid), so the
// price lines and buttons sit at the same height whatever the length of the text above them.

type Tier = (typeof pricing.tiers.items)[number];

function TierCard({ t }: { t: Tier }) {
  const { tiers } = pricing;
  const price = priceLine(t.from);
  const badge = (t.badge as string | null) ?? null;
  const includes = [t.connectionsLine, ...tiers.common];
  return (
    <li className={`panel relative flex flex-col gap-6 p-6 md:p-7 lg:row-span-6 lg:grid lg:grid-rows-subgrid ${badge ? "border-accent/40 bg-panel2" : ""}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.08em] text-accent">
          <Icon name="link" size={12} />
          {t.connections}
        </span>
        {badge && <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#8fe7c2]">{badge}</span>}
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-[20px] font-semibold leading-[1.25] text-ink md:text-[22px]">{t.title}</h3>
        <p className="text-[14px] leading-[1.6] text-ink-muted md:text-[15px]">{t.body}</p>
      </div>

      <p className="rounded-[12px] border border-rule bg-white/[0.02] p-4 text-[13px] leading-[1.55] text-ink-muted">
        <span className="mb-1 block font-mono text-[10px] uppercase tracking-[0.1em] text-ink-soft">{tiers.exampleLabel}</span>
        {t.example}
      </p>

      <div className="flex flex-col gap-1 border-t border-rule pt-6">
        <span className="display text-[30px] text-ink md:text-[34px]">{price.title}</span>
        <span className="text-[14px] text-ink-soft">{price.unit}</span>
      </div>

      <a href="#contact" className={`${badge ? "btn-primary" : "btn-ghost"} w-full`}>
        {tiers.cta}
        <Icon name="arrow-right" size={15} strokeWidth={2.4} />
      </a>

      <ul className="flex flex-col gap-3 border-t border-rule pt-6">
        {includes.map((it, i) => (
          <li key={it} className={`flex gap-2.5 text-[14px] leading-[1.5] ${i ? "text-ink-muted" : "font-semibold text-ink"}`}>
            <Icon name="check" size={15} strokeWidth={2.4} className="mt-[3px] shrink-0 text-ok" />
            {it}
          </li>
        ))}
      </ul>
    </li>
  );
}

export default function Tiers() {
  const { tiers } = pricing;
  return (
    <section id="tiers" aria-labelledby="tiers-title" className="scroll-mt-20">
      <div className="mx-auto flex max-w-site flex-col gap-10 px-5 py-16 md:px-10 lg:gap-12 lg:px-20 lg:py-[104px]">
        <SectionHead id="tiers-title" num={tiers.num} eyebrow={tiers.eyebrow} headline={tiers.headline} body={tiers.body} className="max-w-[680px] [&_h2]:text-balance" />
        <ul className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-x-5">
          {tiers.items.map((t) => (
            <TierCard key={t.key} t={t} />
          ))}
        </ul>
        <ul className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-x-8">
          {tiers.notes.map((n) => (
            <li key={n.text} className="inline-flex items-center gap-2.5 text-[14px] text-ink-muted">
              <Icon name={n.icon} size={15} className="shrink-0 text-accent" />
              {n.text}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

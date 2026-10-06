import SectionHead from "@/components/SectionHead";
import { Icon } from "@/components/icons";
import { OFFER, quote, usd } from "@/lib/offer";
import { pricing } from "./content";

// What counts as a connection (three rules) and a worked example of counting
// connections: three rows at $500, one of them free, total from lib/offer.ts. The example rows are generic parts of a
// setup (dark icon tiles), never brands.

function CountExample() {
  const { example } = pricing.how;
  const n = example.rows.length;
  const free = n >= OFFER.freeAt;
  return (
    <div className="panel flex flex-col gap-5 self-start p-5 sm:p-6" aria-label={example.title}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-[15px] font-semibold text-ink">{example.title}</span>
        <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-soft">{example.caption}</span>
      </div>
      <ul className="flex flex-col gap-2">
        {example.rows.map((r) => (
          <li key={r.label} className="flex items-center gap-3 rounded-[12px] border border-rule bg-white/[0.03] p-2 pr-3">
            <span className="facet-tile h-[34px] w-[34px] rounded-[8px]" aria-hidden>
              <Icon name={r.icon} size={17} />
            </span>
            <span className="min-w-0 flex-1 text-[14px] font-medium text-ink">{r.label}</span>
            <span className="shrink-0 font-mono text-[11px] text-ink-soft">{usd(OFFER.perConnection)}</span>
          </li>
        ))}
      </ul>
      {free && (
        <div className="flex items-center justify-between gap-3 px-1 text-[13px]">
          <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#8fe7c2]">{example.freeLabel}</span>
          <span className="font-mono text-ink-muted">−{usd(OFFER.perConnection)}</span>
        </div>
      )}
      <div className="flex items-center justify-between gap-3 rounded-[12px] border border-accent/30 bg-accent/[0.07] px-4 py-3">
        <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-accent">{example.totalLabel}</span>
        <span className="text-[16px] font-semibold text-ink">{usd(quote(n))}</span>
      </div>
      <p className="text-[13px] leading-[1.55] text-ink-muted">{example.note}</p>
    </div>
  );
}

export default function HowPriced() {
  const { how } = pricing;
  return (
    <section id="how" aria-labelledby="how-title" className="scroll-mt-20 border-t border-rule">
      <div className="mx-auto grid max-w-site grid-cols-1 gap-10 px-5 py-16 md:px-10 lg:grid-cols-[1fr_420px] lg:gap-20 lg:px-20 lg:py-[104px]">
        <div className="flex flex-col gap-10">
          <SectionHead id="how-title" num={how.num} eyebrow={how.eyebrow} headline={how.headline} size="md" className="max-w-[560px] [&_h2]:text-balance" />
          <ol className="flex flex-col border-t border-rule">
            {how.items.map((it, i) => (
              <li key={it.title} className="grid grid-cols-[40px_1fr] gap-x-4 border-b border-rule py-6 sm:grid-cols-[48px_1fr] sm:gap-x-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-accent/10 text-accent sm:h-12 sm:w-12" aria-hidden>
                  <Icon name={it.icon} size={18} />
                </span>
                <div className="flex flex-col gap-1.5">
                  <h3 className="flex items-baseline gap-3 text-[17px] font-semibold leading-[1.3] text-ink md:text-[18px]">
                    <span className="font-mono text-[12px] font-normal tabular-nums text-ink-soft">{String(i + 1).padStart(2, "0")}</span>
                    {it.title}
                  </h3>
                  <p className="max-w-[560px] text-[14px] leading-[1.6] text-ink-muted md:text-[15px]">{it.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div className="lg:pt-[52px]">
          <CountExample />
        </div>
      </div>
    </section>
  );
}

import { Video } from "lucide-react";
import SectionHead from "@/components/SectionHead";
import { Icon } from "@/components/icons";
import { OFFER, quote, usd } from "@/lib/offer";
import { IDS, INNER, SECTION, pricing } from "./content";

// Three example setups with their one-time totals: each part is one connection, and the total is quote() of their
// number (lib/offer.ts), so a price change can never leave a wrong total here. Generic parts, never brands (the real
// client stays anonymous). Under them, the typical range (checked against these totals in lib/offer.test.mts).

function PartIcon({ name }: { name: string }) {
  if (name === "live") return <Video size={14} strokeWidth={1.8} aria-hidden />;
  return <Icon name={name} size={14} />;
}

export default function Setups() {
  const { setups } = pricing;
  const per = usd(OFFER.perConnection);
  return (
    <section id={IDS.setups} aria-labelledby="setups-title" className={SECTION}>
      <div className={`${INNER} flex flex-col gap-6 lg:gap-10`}>
        <SectionHead id="setups-title" num={setups.num} eyebrow={setups.eyebrow} headline={setups.headline} size="md" className="max-w-[640px] [&_h2]:text-balance" />
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {setups.items.map((s) => {
            const n = s.parts.length;
            const free = n >= OFFER.freeAt;
            return (
              <li key={s.key} className="panel flex flex-col gap-3 p-5 md:p-6">
                <h3 className="text-[17px] font-semibold leading-[1.3] text-ink">{s.title}</h3>
                <ul className="flex flex-col gap-1.5" aria-label={`${n} connections`}>
                  {s.parts.map((p) => (
                    <li key={p.label} className="flex items-center gap-2.5 text-[14px] leading-[1.4] text-ink-muted">
                      <span className="shrink-0 text-accent">
                        <PartIcon name={p.icon} />
                      </span>
                      {p.label}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto flex items-end justify-between gap-3 border-t border-dashed border-rule-strong pt-3">
                  <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-soft">
                    {n} × {per}
                    {free && <span className="text-[#8fe7c2]">, {setups.freeLabel}</span>}
                  </span>
                  <span className="display text-[28px] leading-none tabular-nums text-ink">{usd(quote(n))}</span>
                </div>
              </li>
            );
          })}
        </ul>
        <p className="text-[15px] leading-[1.55] text-ink-muted">
          <strong className="font-semibold text-ink">{setups.typical}</strong> {setups.note}
        </p>
      </div>
    </section>
  );
}

import SectionHead from "@/components/SectionHead";
import { Icon } from "@/components/icons";
import { IDS, pricing } from "./content";

// Questions about the price and what comes after it, in the site's FAQ layout (native <details>, no script). Not a
// repeat of the sections above: the answers the buyer asks about next (after handover, API changes, hosting, access,
// paying, the trial, size, who builds it).
export default function PricingFaq() {
  const { faq } = pricing;
  return (
    <section id={IDS.faq} aria-labelledby="faq-title" className="scroll-mt-20 border-t border-rule">
      <div className="mx-auto grid max-w-site grid-cols-1 gap-8 px-5 py-9 md:px-10 md:py-16 lg:grid-cols-[360px_1fr] lg:gap-24 lg:px-20 lg:py-[88px]">
        <SectionHead id="faq-title" num={faq.num} eyebrow={faq.eyebrow} headline={faq.headline} size="md" className="[&_h2]:text-balance lg:sticky lg:top-28 lg:self-start" />
        <ul className="flex flex-col border-b border-rule">
          {faq.items.map((f) => (
            <li key={f.q}>
              <details className="group border-t border-rule">
                <summary className="flex items-start justify-between gap-6 py-3.5 text-[16px] font-semibold text-ink transition-colors hover:text-white md:py-5">
                  <span>{f.q}</span>
                  <Icon name="plus" size={18} strokeWidth={2} className="faq-chevron mt-0.5 shrink-0 text-ink-soft transition-transform duration-300" />
                </summary>
                <p className="max-w-[640px] pb-5 text-[14px] leading-[1.65] text-ink-muted md:text-[15px]">{f.a}</p>
              </details>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

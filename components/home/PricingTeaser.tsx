import content from "@/data/site-content.json";
import SectionHead from "@/components/SectionHead";
import { Icon } from "@/components/icons";

/** The offer in one panel; the tiers and details live on /pricing. */
export default function PricingTeaser() {
  const { pricing } = content;
  return (
    <section id="pricing" aria-labelledby="pricing-title" className="scroll-mt-16">
      <div className="mx-auto max-w-site px-5 py-16 md:px-10 lg:px-20 lg:py-[104px]">
        <div className="panel relative grid grid-cols-1 gap-10 overflow-hidden p-6 md:p-10 lg:grid-cols-[1fr_400px] lg:gap-16 lg:p-12">
          <div className="pointer-events-none absolute -right-28 -top-28 h-72 w-72 rounded-full bg-accent/10 blur-3xl" aria-hidden />

          <div className="relative flex flex-col gap-8">
            <SectionHead id="pricing-title" num={pricing.num} eyebrow={pricing.eyebrow} headline={pricing.headline} body={pricing.body} />
            <a href={pricing.cta.href} className="btn-primary w-fit">
              {pricing.cta.label}
              <Icon name="arrow-right" size={15} strokeWidth={2.4} />
            </a>
          </div>

          <div className="relative flex flex-col gap-5 lg:pt-10">
            <ul className="flex flex-col gap-3.5">
              {pricing.points.map((p) => (
                <li key={p} className="flex gap-3 text-[15px] leading-[1.5] text-ink md:text-[16px]">
                  <Icon name="check" size={16} strokeWidth={2.4} className="mt-[3px] shrink-0 text-ok" />
                  {p}
                </li>
              ))}
            </ul>
            <p className="border-t border-rule pt-4 text-[13px] leading-[1.55] text-ink-soft">{pricing.note}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

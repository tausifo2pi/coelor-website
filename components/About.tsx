"use client";

import { useReveal } from "@/hooks/useReveal";
import content from "@/data/site-content.json";

function Plan({ plan, i }: { plan: (typeof content.pricing.plans)[number]; i: number }) {
  const ref = useReveal<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className="reveal flex min-h-[330px] flex-col justify-between border-t border-rule py-7"
      style={{ transitionDelay: `${i * 60}ms` }}
    >
      <div>
        <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-mint-2">
          {plan.price}
        </div>
        <h3 className="display mt-3 text-[32px] md:text-[42px]">{plan.name}</h3>
        <p className="mt-4 text-[15px] leading-relaxed text-ink-muted">
          {plan.body}
        </p>
      </div>
      <ul className="mt-8 space-y-3 text-[14px] text-ink-muted">
        {plan.features.map((feature) => (
          <li key={feature} className="border-t border-rule pt-3">
            {feature}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Studio() {
  const demoRef = useReveal<HTMLDivElement>();
  const pricingRef = useReveal<HTMLDivElement>();
  const faqRef = useReveal<HTMLDivElement>();
  const { demo, pricing, faq } = content;

  return (
    <>
      <section id="demo" className="relative overflow-hidden py-20 md:py-28">
        <div className="mx-auto max-w-[1100px] px-6 md:px-10">
          <div ref={demoRef} className="reveal mb-12 grid grid-cols-1 gap-8 md:mb-16 md:grid-cols-12">
            <div className="md:col-span-7">
              <span className="eyebrow">{demo.eyebrow}</span>
              <h2 className="display mt-4 text-[32px] md:text-[48px]">
                {demo.headline}
              </h2>
            </div>
            <p className="max-w-md text-[15px] leading-relaxed text-ink-muted md:col-span-5 md:self-end md:text-base">
              {demo.body}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
            <div className="md:col-span-7">
              <div className="overflow-hidden rounded-lg border border-rule bg-canvasElev">
                {demo.timeline.map((item, index) => (
                  <div key={`${item.speaker}-${index}`} className="grid grid-cols-12 gap-4 border-b border-rule p-5 last:border-b-0 md:p-6">
                    <div className="col-span-12 font-mono text-[11px] uppercase tracking-[0.18em] text-mint-2 md:col-span-3">
                      {item.speaker}
                    </div>
                    <div className="col-span-12 text-[17px] leading-relaxed text-ink md:col-span-9">
                      {item.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="md:col-span-5">
              <div className="border-t border-rule pt-6">
                <span className="eyebrow">Outcome</span>
                <div className="mt-5 space-y-3">
                  {demo.outcome.map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 rounded-md border border-rule bg-canvasElev px-4 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-muted"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-mint-2" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="py-20 md:py-28">
        <div className="mx-auto max-w-[1100px] px-6 md:px-10">
          <div ref={pricingRef} className="reveal mb-12 max-w-4xl md:mb-16">
            <span className="eyebrow">{pricing.eyebrow}</span>
            <h2 className="display mt-4 text-[32px] md:text-[48px]">
              {pricing.headline}
            </h2>
            <p className="mt-6 max-w-2xl text-[15px] leading-relaxed text-ink-muted md:text-base">
              {pricing.body}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-x-10 gap-y-4 md:grid-cols-3">
            {pricing.plans.map((plan, i) => (
              <Plan key={plan.name} plan={plan} i={i} />
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="border-y border-rule bg-canvasElev py-20 md:py-28">
        <div className="mx-auto max-w-[1100px] px-6 md:px-10">
          <div ref={faqRef} className="reveal mb-12 max-w-3xl md:mb-16">
            <span className="eyebrow">{faq.eyebrow}</span>
            <h2 className="display mt-4 text-[32px] md:text-[48px]">
              {faq.headline}
            </h2>
          </div>
          <div className="border-b border-rule">
            {faq.items.map((item) => (
              <details key={item.q} className="group border-t border-rule py-6">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6">
                  <span className="display text-[24px] md:text-[32px]">{item.q}</span>
                  <span className="font-mono text-[20px] text-mint-2 transition-transform duration-200 group-open:rotate-45">+</span>
                </summary>
                <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-ink-muted md:text-base">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

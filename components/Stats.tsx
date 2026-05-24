"use client";

import { useReveal } from "@/hooks/useReveal";
import content from "@/data/site-content.json";

function PainItem({ item, i }: { item: (typeof content.pain.items)[number]; i: number }) {
  const ref = useReveal<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className="reveal border-t border-rule py-8 md:py-10"
      style={{ transitionDelay: `${i * 50}ms` }}
    >
      <h3 className="display text-[28px] md:text-[36px]">{item.title}</h3>
      <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-ink-muted md:text-base">
        {item.body}
      </p>
    </div>
  );
}

export default function Work() {
  const headRef = useReveal<HTMLDivElement>();
  const { pain } = content;

  return (
    <section id="pain" className="py-20 md:py-28">
      <div className="mx-auto max-w-[1100px] px-6 md:px-10">
        <div ref={headRef} className="reveal mb-12 grid grid-cols-1 gap-8 md:mb-16 md:grid-cols-12">
          <div className="md:col-span-7">
            <span className="eyebrow">{pain.eyebrow}</span>
            <h2 className="display mt-4 text-[32px] md:text-[48px]">
              {pain.headline}
            </h2>
          </div>
          <p className="max-w-md text-[15px] leading-relaxed text-ink-muted md:col-span-5 md:self-end md:text-base">
            {pain.body}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-x-10 border-b border-rule md:grid-cols-2">
          {pain.items.map((item, i) => (
            <PainItem key={item.title} item={item} i={i} />
          ))}
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 md:mt-14 md:grid-cols-3">
          {pain.metrics.map((metric) => (
            <div key={metric.label} className="border-t border-rule pt-5">
              <div className="display text-[42px] text-mint-2 md:text-[56px]">{metric.value}</div>
              <div className="mt-2 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-muted">
                {metric.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

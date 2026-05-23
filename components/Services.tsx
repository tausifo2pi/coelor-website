"use client";

import { useReveal } from "@/hooks/useReveal";
import content from "@/data/site-content.json";

function Step({ step, i }: { step: (typeof content.setup.steps)[number]; i: number }) {
  const ref = useReveal<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className="reveal grid grid-cols-12 gap-5 border-t border-rule py-8 transition-colors duration-300 hover:border-rule-strong md:py-10"
      style={{ transitionDelay: `${i * 50}ms` }}
    >
      <div className="col-span-2 font-mono text-[12px] tracking-[0.18em] text-mint-2 md:col-span-1">
        {step.num}
      </div>
      <div className="col-span-10 md:col-span-11">
        <h3 className="display text-[28px] md:text-[40px]">{step.title}</h3>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-ink-muted md:text-base">
          {step.body}
        </p>
      </div>
    </div>
  );
}

function Feature({ item, i }: { item: (typeof content.features.items)[number]; i: number }) {
  const ref = useReveal<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className="reveal flex min-h-[260px] flex-col justify-between border-t border-rule py-7"
      style={{ transitionDelay: `${i * 45}ms` }}
    >
      <div>
        <h3 className="display text-[28px] md:text-[34px]">{item.title}</h3>
        <p className="mt-4 text-[15px] leading-relaxed text-ink-muted">
          {item.body}
        </p>
      </div>
      <div className="mt-8 flex flex-wrap gap-2">
        {item.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-rule px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-muted"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function Capabilities() {
  const setupRef = useReveal<HTMLDivElement>();
  const featureRef = useReveal<HTMLDivElement>();
  const { setup, features, integrations, dashboard } = content;

  return (
    <>
      <section id="setup" className="py-20 md:py-28">
        <div className="mx-auto max-w-[1280px] px-6 md:px-10">
          <div ref={setupRef} className="reveal mb-12 grid grid-cols-1 gap-8 md:mb-16 md:grid-cols-12">
            <div className="md:col-span-7">
              <span className="eyebrow">{setup.eyebrow}</span>
              <h2 className="display mt-4 text-[38px] md:text-[60px]">
                {setup.headline}
              </h2>
            </div>
            <p className="max-w-md text-[15px] leading-relaxed text-ink-muted md:col-span-5 md:self-end md:text-base">
              {setup.body}
            </p>
          </div>
          <div className="border-b border-rule">
            {setup.steps.map((step, i) => (
              <Step key={step.num} step={step} i={i} />
            ))}
          </div>

          <div className="mt-14 overflow-hidden rounded-lg border border-rule bg-canvasElev md:mt-20">
            <div className="grid grid-cols-1 md:grid-cols-[0.95fr_1.05fr]">
              <div className="border-b border-rule p-6 md:border-b-0 md:border-r md:p-8">
                <span className="eyebrow">{dashboard.title}</span>
                <h3 className="display mt-4 text-[34px] md:text-[50px]">
                  {dashboard.subtitle}
                </h3>
                <div className="mt-8 grid grid-cols-1 gap-3">
                  {dashboard.panels.map((panel) => (
                    <div key={panel.title} className="rounded-md border border-rule bg-canvas px-4 py-3">
                      <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-mint-2">
                        {panel.title}
                      </div>
                      <div className="mt-2 text-[14px] leading-relaxed text-ink-muted">
                        {panel.body}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative min-h-[420px] overflow-hidden p-6 md:p-8">
                <div
                  aria-hidden
                  className="absolute inset-0 opacity-60"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(0,255,180,0.12), transparent 36%), linear-gradient(45deg, rgba(0,132,255,0.16), transparent 45%)",
                  }}
                />
                <div className="relative grid h-full grid-cols-12 gap-3">
                  <div className="col-span-7 rounded-lg border border-rule bg-canvas/90 p-4">
                    <div className="mb-5 flex items-center justify-between">
                      <span className="h-2 w-24 rounded-full bg-mint-2/70" />
                      <span className="h-2 w-10 rounded-full bg-white/15" />
                    </div>
                    <div className="space-y-3">
                      {[72, 54, 88, 61, 76].map((w, i) => (
                        <div key={i} className="rounded-md border border-rule bg-canvasElev p-3">
                          <div className="h-2 rounded-full bg-white/12" style={{ width: `${w}%` }} />
                          <div className="mt-3 h-2 rounded-full bg-mint-2/30" style={{ width: `${Math.max(28, w - 24)}%` }} />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="col-span-5 space-y-3">
                    {dashboard.metrics.map((metric, i) => (
                      <div
                        key={metric.label}
                        className={`rounded-lg border border-rule p-4 ${i === 0 ? "bg-[#10251d]" : "bg-canvas/90"}`}
                      >
                        <div
                          className="display text-[46px]"
                          style={{ color: i === 0 ? "#00ffb4" : i === 1 ? "#79b8ff" : "#ffcc66" }}
                        >
                          {metric.value}
                        </div>
                        <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-muted">
                          {metric.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-20 md:py-28">
        <div className="mx-auto max-w-[1280px] px-6 md:px-10">
          <div ref={featureRef} className="reveal mb-12 flex flex-col gap-6 md:mb-16 md:max-w-4xl">
            <span className="eyebrow">{features.eyebrow}</span>
            <h2 className="display text-[38px] md:text-[60px]">
              {features.headline}
            </h2>
            <p className="max-w-2xl text-[15px] leading-relaxed text-ink-muted md:text-base">
              {features.body}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-x-10 gap-y-4 md:grid-cols-3">
            {features.items.map((item, i) => (
              <Feature key={item.title} item={item} i={i} />
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-rule bg-canvasElev py-12 md:py-16">
        <div className="mx-auto max-w-[1280px] px-6 md:px-10">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
            <div className="md:col-span-4">
              <span className="eyebrow">{integrations.eyebrow}</span>
              <h2 className="display mt-4 text-[34px] md:text-[46px]">
                {integrations.headline}
              </h2>
            </div>
            <div className="flex flex-wrap content-start gap-3 md:col-span-8 md:pt-8">
              {integrations.items.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-rule bg-canvas px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-muted"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

"use client";

import { useReveal } from "@/hooks/useReveal";
import { useInView } from "@/hooks/useInView";
import { useCountUp } from "@/hooks/useCountUp";
import MaskReveal from "@/components/MaskReveal";
import content from "@/data/site-content.json";

function Step({ step, i }: { step: (typeof content.setup.steps)[number]; i: number }) {
  const ref = useReveal<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className="reveal grid grid-cols-12 gap-5 border-t border-rule py-8 transition-colors duration-300 hover:border-rule-strong md:py-10"
      style={{ "--d": `${i * 70}ms` } as React.CSSProperties}
    >
      <div className="col-span-2 font-mono text-[12px] tracking-[0.18em] text-mint-2 md:col-span-1">
        {step.num}
      </div>
      <div className="col-span-10 md:col-span-11">
        <h3 className="display text-[22px] md:text-[28px]">{step.title}</h3>
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
      className="reveal tile glass flex flex-col justify-between p-6"
      style={{ "--d": `${(i % 3) * 90}ms` } as React.CSSProperties}
    >
      <div>
        <h3 className="display text-[21px] md:text-[23px]">{item.title}</h3>
        <p className="mt-3 text-[14px] leading-relaxed text-ink-muted">
          {item.body}
        </p>
      </div>
      <div className="mt-7 flex flex-wrap gap-2">
        {item.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-rule px-3 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-ink-soft"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

function DashboardMetric({ metric, i, started }: { metric: { value: string; label: string }; i: number; started: boolean }) {
  const value = useCountUp(parseInt(metric.value, 10), 1600, started);

  return (
    <div className={`glass p-4 ${i === 0 ? "!border-mint-2/25" : ""}`}>
      <div
        className="display text-[40px]"
        style={{ color: i === 0 ? "#6EE7B7" : i === 1 ? "#79B8FF" : "#FFCC66" }}
      >
        {started ? value : 0}
      </div>
      <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-muted">
        {metric.label}
      </div>
    </div>
  );
}

function DashboardMock() {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.3 });
  const { dashboard } = content;

  return (
    <div ref={ref} className={`relative min-h-[420px] overflow-hidden p-6 md:p-8 ${inView ? "is-in" : ""}`}>
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, rgba(16,185,129,0.08), transparent 40%), linear-gradient(45deg, rgba(99,102,241,0.06), transparent 45%)",
        }}
      />
      <div className="relative grid h-full grid-cols-12 gap-3">
        <div className="glass col-span-7 p-4">
          <div className="mb-5 flex items-center justify-between">
            <span className="bar-grow h-2 w-24 rounded-full bg-mint-2/70" />
            <span className="h-2 w-10 rounded-full bg-white/10" />
          </div>
          <div className="space-y-3">
            {[72, 54, 88, 61, 76].map((w, i) => (
              <div key={i} className="rounded-md border border-rule bg-white/[0.02] p-3">
                <div
                  className="bar-grow h-2 rounded-full bg-white/10"
                  style={{ width: `${w}%`, "--d": `${i * 110}ms` } as React.CSSProperties}
                />
                <div
                  className="bar-grow mt-3 h-2 rounded-full bg-mint-2/40"
                  style={{ width: `${Math.max(28, w - 24)}%`, "--d": `${120 + i * 110}ms` } as React.CSSProperties}
                />
              </div>
            ))}
          </div>
        </div>
        <div className="col-span-5 space-y-3">
          {dashboard.metrics.map((metric, i) => (
            <DashboardMetric key={metric.label} metric={metric} i={i} started={inView} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Capabilities() {
  const setupRef = useReveal<HTMLParagraphElement>();
  const featureRef = useReveal<HTMLParagraphElement>();
  const integrationsRef = useReveal<HTMLDivElement>();
  const { setup, features, integrations, dashboard } = content;

  return (
    <>
      <section id="setup" className="py-20 md:py-28">
        <div className="mx-auto max-w-[1100px] px-6 md:px-10">
          <div className="mb-12 grid grid-cols-1 gap-8 md:mb-16 md:grid-cols-12">
            <div className="md:col-span-7">
              <span className="eyebrow">{setup.eyebrow}</span>
              <MaskReveal text={setup.headline} accent={setup.accent} className="display mt-4 text-[32px] md:text-[46px]" />
            </div>
            <p ref={setupRef} className="reveal max-w-md text-[15px] leading-relaxed text-ink-muted md:col-span-5 md:self-end md:text-base" style={{ "--d": "200ms" } as React.CSSProperties}>
              {setup.body}
            </p>
          </div>
          <div className="border-b border-rule">
            {setup.steps.map((step, i) => (
              <Step key={step.num} step={step} i={i} />
            ))}
          </div>

          <div className="glass mt-14 overflow-hidden md:mt-20">
            <div className="grid grid-cols-1 md:grid-cols-[0.95fr_1.05fr]">
              <div className="border-b border-rule p-6 md:border-b-0 md:border-r md:p-8">
                <span className="eyebrow">{dashboard.title}</span>
                <MaskReveal as="h3" text={dashboard.subtitle} className="display mt-4 text-[30px] md:text-[40px]" />
                <div className="mt-8 grid grid-cols-1 gap-3">
                  {dashboard.panels.map((panel) => (
                    <div key={panel.title} className="rounded-md border border-rule bg-white/[0.02] px-4 py-3">
                      <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-mint-1">
                        {panel.title}
                      </div>
                      <div className="mt-2 text-[14px] leading-relaxed text-ink-muted">
                        {panel.body}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <DashboardMock />
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-20 md:py-28">
        <div className="mx-auto max-w-[1100px] px-6 md:px-10">
          <div className="mb-12 flex flex-col gap-6 md:mb-16 md:max-w-4xl">
            <span className="eyebrow">{features.eyebrow}</span>
            <MaskReveal text={features.headline} accent={features.accent} className="display text-[32px] md:text-[46px]" />
            <p ref={featureRef} className="reveal max-w-2xl text-[15px] leading-relaxed text-ink-muted md:text-base" style={{ "--d": "250ms" } as React.CSSProperties}>
              {features.body}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {features.items.map((item, i) => (
              <Feature key={item.title} item={item} i={i} />
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-rule bg-canvasElev py-12 md:py-16">
        <div className="mx-auto max-w-[1100px] px-6 md:px-10">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
            <div className="md:col-span-4">
              <span className="eyebrow">{integrations.eyebrow}</span>
              <MaskReveal text={integrations.headline} accent={integrations.accent} className="display mt-4 text-[30px] md:text-[40px]" />
            </div>
            <div ref={integrationsRef} className="reveal md:col-span-8 md:self-center" style={{ "--d": "200ms" } as React.CSSProperties}>
              <div className="marquee">
                <div className="marquee-track">
                  {[0, 1].map((half) => (
                    <div key={half} aria-hidden={half === 1} className="flex shrink-0 gap-3 pr-3">
                      {integrations.items.map((item) => (
                        <span
                          key={item}
                          className="whitespace-nowrap rounded-full border border-rule bg-card px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-muted"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

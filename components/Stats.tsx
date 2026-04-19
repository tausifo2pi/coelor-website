"use client";

import { useReveal } from "@/hooks/useReveal";

const WORK = [
  {
    year: "2026",
    client: "Fintech · Series B",
    title: "A ledger engine that survives auditors.",
    role: "Core engineering · Infra",
  },
  {
    year: "2026",
    client: "Healthcare AI",
    title: "Clinical agent network cleared for pilots.",
    role: "AI systems · Eval pipeline",
  },
  {
    year: "2025",
    client: "Logistics",
    title: "Realtime orchestration across three continents.",
    role: "Platform · Integrations",
  },
  {
    year: "2025",
    client: "Media",
    title: "A publishing stack built to outlast the CMS trend cycle.",
    role: "Product engineering",
  },
  {
    year: "2024",
    client: "Energy",
    title: "Optimizer that pays for itself every 36 hours.",
    role: "Data · ML systems",
  },
];

function Row({ w, i }: { w: (typeof WORK)[number]; i: number }) {
  const ref = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className="reveal group relative grid cursor-default grid-cols-12 items-baseline gap-4 border-t border-rule py-6 transition-colors duration-300 hover:border-rule-strong md:py-8"
      style={{ transitionDelay: `${i * 40}ms` }}
    >
      <div className="col-span-2 font-mono text-[12px] tracking-[0.18em] text-ink-muted md:col-span-1">
        {w.year}
      </div>
      <div className="col-span-10 font-mono text-[11px] uppercase tracking-[0.22em] text-ink-muted md:col-span-3">
        {w.client}
      </div>
      <div className="col-span-12 md:col-span-6">
        <h3 className="display text-[22px] leading-tight text-ink transition-colors duration-300 group-hover:text-mint-1 md:text-[30px]">
          {w.title}
        </h3>
      </div>
      <div className="col-span-11 flex items-center justify-start gap-2 md:col-span-2 md:justify-end">
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-muted">
          {w.role}
        </span>
      </div>
    </div>
  );
}

export default function Work() {
  const headRef = useReveal<HTMLDivElement>();
  return (
    <section id="work" className="py-16 md:py-24">
      <div className="mx-auto max-w-[1280px] px-6 md:px-10">
        <div ref={headRef} className="reveal mb-12 flex items-end justify-between gap-8 md:mb-16">
          <div>
            <span className="eyebrow">§ 01 — Selected Work</span>
            <h2 className="display mt-4 text-[36px] md:text-[56px]">
              A short list
              <br />
              we&rsquo;re proud of.
            </h2>
          </div>
          <p className="hidden max-w-xs text-[14px] leading-relaxed text-ink-muted md:block">
            Under NDA for most, so the titles sketch the shape rather than name the company.
            Happy to walk through specifics on a call.
          </p>
        </div>

        <div className="border-b border-rule">
          {WORK.map((w, i) => (
            <Row key={w.title} w={w} i={i} />
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-baseline gap-x-8 gap-y-3 font-mono text-[11px] uppercase tracking-[0.22em] text-ink-muted md:mt-14">
          <span className="text-ink-soft">Proof —</span>
          <span>
            <span className="text-ink">100+</span> projects shipped
          </span>
          <span className="opacity-40">·</span>
          <span>
            <span className="text-ink">20</span> countries
          </span>
          <span className="opacity-40">·</span>
          <span>
            <span className="text-ink">95%</span> retained past first engagement
          </span>
        </div>
      </div>
    </section>
  );
}

"use client";

import { useReveal } from "@/hooks/useReveal";

const CAPABILITIES = [
  {
    num: "01",
    kicker: "Intelligence",
    title: "AI systems that ship.",
    body:
      "Production agents, RAG pipelines, and evaluation harnesses built for companies who need answers in latency budgets and cost ceilings — not demos.",
    tags: ["Agents", "RAG", "Evals"],
  },
  {
    num: "02",
    kicker: "Product",
    title: "Software built to your grain.",
    body:
      "End-to-end product engineering with senior operators. TypeScript, Go, Python. We write the code, own the roadmap, and ship every week.",
    tags: ["Web", "Mobile", "APIs"],
  },
  {
    num: "03",
    kicker: "Integration",
    title: "Your stack, finally in conversation.",
    body:
      "Glue that holds. Event-driven connectors, typed contracts, observable by default. The plumbing stops being the bottleneck.",
    tags: ["Webhooks", "Event Mesh", "iPaaS"],
  },
  {
    num: "04",
    kicker: "Infrastructure",
    title: "Cloud that scales without drama.",
    body:
      "Platforms on AWS, GCP, and bare metal. Infra-as-code, zero-downtime deploys, cost discipline. Built to survive the next order of magnitude.",
    tags: ["K8s", "Terraform", "Observability"],
  },
];

function Item({ item, i }: { item: (typeof CAPABILITIES)[number]; i: number }) {
  const ref = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className="reveal group relative grid grid-cols-12 gap-6 border-t border-rule py-10 transition-colors duration-300 hover:border-rule-strong md:py-14"
      style={{ transitionDelay: `${i * 40}ms` }}
    >
      <div className="col-span-2 md:col-span-1">
        <span className="font-mono text-[12px] tracking-[0.18em] text-ink-muted">{item.num}</span>
      </div>
      <div className="col-span-10 md:col-span-3">
        <span className="eyebrow">{item.kicker}</span>
      </div>
      <div className="col-span-12 md:col-span-5">
        <h3 className="display text-[28px] transition-colors duration-300 group-hover:text-mint-1 md:text-[40px]">
          {item.title}
        </h3>
        <p className="mt-4 max-w-md text-[15px] leading-relaxed text-ink-muted md:text-base">
          {item.body}
        </p>
      </div>
      <div className="col-span-12 flex flex-wrap items-end gap-2 md:col-span-3 md:justify-end">
        {item.tags.map((t) => (
          <span
            key={t}
            className="rounded-full border border-rule px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted"
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function Capabilities() {
  return (
    <section id="capabilities" className="py-20 md:py-28">
      <div className="mx-auto max-w-[1280px] px-6 md:px-10">
        <div className="mb-12 flex items-end justify-between gap-8 md:mb-16">
          <div>
            <span className="eyebrow">§ 02 — Capabilities</span>
            <h2 className="display mt-4 text-[36px] md:text-[56px]">
              Four disciplines.
              <br />
              One team.
            </h2>
          </div>
          <p className="hidden max-w-sm text-[15px] leading-relaxed text-ink-muted md:block">
            We staff small and stay technical. Every engagement is run by a partner — no layers
            between you and the people writing the code.
          </p>
        </div>
        <div className="border-b border-rule">
          {CAPABILITIES.map((c, i) => (
            <Item key={c.num} item={c} i={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

"use client";

import { useReveal } from "@/hooks/useReveal";

const PRINCIPLES = [
  {
    k: "P · 01",
    t: "Shape over scope.",
    b: "Scope lists pretend software is a lego kit. It isn't. We work on the shape of the problem first — the decisions a team will regret five years from now — and let scope fall out of it.",
  },
  {
    k: "P · 02",
    t: "Small teams, senior hands.",
    b: "Every engagement is two to four operators with a decade or more on the craft. No project managers translating between you and juniors. You talk to the people writing the code.",
  },
  {
    k: "P · 03",
    t: "Operate, don't deliver.",
    b: "A shipped build is not the end of our job. We run what we build — on-call, metrics, migrations — until the team taking it over can out-operate us.",
  },
];

function Principle({ p, i }: { p: (typeof PRINCIPLES)[number]; i: number }) {
  const ref = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className="reveal flex flex-col gap-3 border-t border-rule pt-6 md:pt-8"
      style={{ transitionDelay: `${i * 80}ms` }}
    >
      <span className="eyebrow">{p.k}</span>
      <h3 className="display text-[22px] md:text-[28px]">{p.t}</h3>
      <p className="text-[15px] leading-relaxed text-ink-muted">{p.b}</p>
    </div>
  );
}

export default function Studio() {
  const quoteRef = useReveal<HTMLDivElement>();
  return (
    <section id="studio" className="relative py-24 md:py-36">
      {/* Subtle textured backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-full"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at 50% 0%, rgba(0,184,122,0.06), transparent 55%)",
        }}
      />

      <div className="relative mx-auto max-w-[1280px] px-6 md:px-10">
        <div className="mb-14 flex items-baseline gap-4 md:mb-20">
          <span className="eyebrow">§ 03 — Studio</span>
          <span className="h-px flex-1 bg-rule" />
        </div>

        <div
          ref={quoteRef}
          className="reveal relative mx-auto max-w-4xl text-center"
        >
          <span
            aria-hidden
            className="absolute -left-4 -top-6 font-display text-[160px] leading-none text-ink/10 md:-left-10 md:-top-12 md:text-[240px]"
          >
            &ldquo;
          </span>
          <blockquote className="display relative text-[32px] leading-[1.1] md:text-[56px]">
            We don&rsquo;t build software.
            <br />
            We engineer{" "}
            <span
              className="italic"
              style={{
                backgroundImage: "var(--gradient-logo)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              unfair advantages
            </span>
            .
          </blockquote>
          <p className="mx-auto mt-8 max-w-xl text-[15px] leading-relaxed text-ink-muted md:text-base">
            Coelor was founded on a simple read of the market: most software teams are fast at
            shipping the wrong thing. We&rsquo;re small on purpose — built to be fast at shipping
            the right one.
          </p>
        </div>

        <div className="mt-20 grid grid-cols-1 gap-8 md:mt-28 md:grid-cols-3 md:gap-10">
          {PRINCIPLES.map((p, i) => (
            <Principle key={p.k} p={p} i={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

"use client";

import content from "@/data/site-content.json";
import HeroScene from "@/components/HeroScene";

export default function Hero() {
  const { hero } = content;

  return (
    <section id="top" className="relative h-screen min-h-[660px] overflow-hidden" style={{ paddingTop: "68px" }}>
      {/* Full-bleed gradient silk */}
      <HeroScene />

      <div className="relative z-10 mx-auto flex h-full max-w-[860px] flex-col items-center justify-center px-6 pb-20 text-center">
        <span
          className="rise-in mb-6 inline-flex items-center gap-2 rounded-full border border-rule bg-canvas/50 px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted backdrop-blur-sm"
          style={{ "--d": "100ms" } as React.CSSProperties}
        >
          <span className="active-dot h-1.5 w-1.5 rounded-full bg-mint-2" />
          {hero.eyebrow}
        </span>

        <h1 className="rise-in display max-w-[15ch] text-[44px] md:text-[64px] lg:text-[72px]" style={{ "--d": "220ms" } as React.CSSProperties}>
          {hero.headline} <span className="accent-serif">{hero.accent}</span>
        </h1>

        <p className="rise-in mt-6 max-w-[54ch] text-[15px] leading-[1.75] text-ink-muted md:text-[17px]" style={{ "--d": "360ms" } as React.CSSProperties}>
          {hero.body}
        </p>

        <div className="rise-in mt-9 flex flex-wrap items-center justify-center gap-4" style={{ "--d": "500ms" } as React.CSSProperties}>
          <a
            href={hero.primaryCta.href}
            className="group inline-flex items-center gap-2 rounded-full bg-mint-2 px-6 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-mint-ink transition-colors duration-300 hover:bg-mint-1"
          >
            {hero.primaryCta.label}
            <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1">→</span>
          </a>
          <a
            href={hero.secondaryCta.href}
            className="rounded-full border border-rule-strong bg-canvas/40 px-6 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-muted backdrop-blur-sm transition-colors duration-300 hover:border-mint-2/50 hover:text-ink"
          >
            {hero.secondaryCta.label}
          </a>
        </div>

        <div className="rise-in mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-2" style={{ "--d": "650ms" } as React.CSSProperties}>
          {hero.proof.map((p) => (
            <span key={p} className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
              {p}
            </span>
          ))}
        </div>
      </div>

      <div className="horizon absolute inset-x-0 bottom-0" aria-hidden />
    </section>
  );
}

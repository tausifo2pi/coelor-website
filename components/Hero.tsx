"use client";

import { useEffect, useState } from "react";

export default function Hero() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <section id="top" className="relative overflow-hidden pt-[84px] md:pt-[92px]">
      {/* Liquid mesh backdrop — slow, breathing, eye-soothing */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
        <div className="mesh-wrap absolute inset-0">
          <div className="mesh-orb mesh-orb-a" />
          <div className="mesh-orb mesh-orb-b" />
          <div className="mesh-orb mesh-orb-c" />
        </div>
        <div className="mesh-vignette" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1280px] px-6 md:px-10">
        {/* Meta row */}
        <div
          className="flex items-center justify-between pb-5"
          style={{
            opacity: ready ? 1 : 0,
            transform: ready ? "translateY(0)" : "translateY(8px)",
            transition: "opacity 0.6s ease, transform 0.6s ease",
          }}
        >
          <div className="flex items-center gap-3">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint-2 opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-mint-2 shadow-[0_0_12px_rgba(0,255,180,0.8)]" />
            </span>
            <span className="eyebrow">Accepting new work · Q2</span>
          </div>
          <span className="hidden eyebrow md:inline">Est. 2026 · Remote-first</span>
        </div>

        <hr />

        {/* Headline */}
        <div className="grid grid-cols-1 gap-8 py-10 md:grid-cols-12 md:gap-6 md:py-14">
          <h1 className="display col-span-12 text-[52px] sm:text-[68px] md:col-span-8 md:text-[88px] lg:text-[108px]">
            <span className="word-rise" style={{ animationDelay: "0.1s" }}>
              Software
            </span>
            <br />
            <span className="word-rise" style={{ animationDelay: "0.25s" }}>
              with the{" "}
            </span>
            <span className="word-rise" style={{ animationDelay: "0.4s" }}>
              <span
                className="shape-neon"
                style={{
                  fontStyle: "italic",
                  fontFamily: "var(--font-display)",
                }}
              >
                shape
              </span>
            </span>
            <br />
            <span className="word-rise" style={{ animationDelay: "0.55s" }}>
              of your ambition.
            </span>
          </h1>

          <div
            className="col-span-12 flex flex-col justify-end gap-5 border-t border-rule pt-5 md:col-span-4 md:border-none md:pt-0 self-end"
            style={{
              opacity: ready ? 1 : 0,
              transform: ready ? "translateY(0)" : "translateY(20px)",
              transition:
                "opacity 0.9s cubic-bezier(0.22,1,0.36,1) 0.7s, transform 0.9s cubic-bezier(0.22,1,0.36,1) 0.7s",
            }}
          >
            <p className="text-[14px] leading-[1.7] text-ink-muted">
              We build AI systems, custom products, and infrastructure for companies that refuse
              off-the-shelf answers.
            </p>

            <div className="flex flex-col items-start gap-3">
              <a
                href="#contact"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="group inline-flex items-center gap-2 rounded-full bg-mint-2 px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.22em] text-mint-ink shadow-[0_0_20px_2px_rgba(0,255,180,0.18)] transition-all duration-300 hover:shadow-[0_0_36px_6px_rgba(0,255,180,0.4)]"
              >
                <span>Start a project</span>
                <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1">→</span>
              </a>
              <a
                href="#work"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById("work")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft transition-colors duration-200 hover:text-ink-muted"
              >
                See selected work →
              </a>
            </div>
          </div>
        </div>

        <hr />
      </div>

      {/* Marquee band */}
      <div className="relative z-10 overflow-hidden py-5">
        <div
          className="flex whitespace-nowrap"
          style={{ animation: "marquee 55s linear infinite" }}
        >
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex shrink-0 items-center gap-12 pr-12 font-mono text-[12px] uppercase tracking-[0.24em] text-ink-muted">
              {[
                "AI Agents",
                "·",
                "LLM Pipelines",
                "·",
                "Product Engineering",
                "·",
                "Platform & Infra",
                "·",
                "Data Systems",
                "·",
                "Integrations",
                "·",
                "Realtime",
                "·",
                "TypeScript · Go · Python",
                "·",
                "Postgres · Kafka · Redis",
                "·",
              ].map((w, j) => (
                <span key={j}>{w}</span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <hr />
    </section>
  );
}

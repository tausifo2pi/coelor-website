"use client";

import { useEffect, useState } from "react";

type LogLine = {
  t: string;
  tag: string;
  msg: string;
};

const CMD = "coelor ship --production";

const LOG: LogLine[] = [
  { t: "14:02:18.10", tag: "build",   msg: "compiled · 482ms · 0 warnings" },
  { t: "14:02:19.30", tag: "tests",   msg: "284 passed · 0 failed · 2.61s" },
  { t: "14:02:20.04", tag: "rollout", msg: "14 / 14 replicas · healthy" },
  { t: "14:02:20.16", tag: "observe", msg: "p99 14ms · 0 alerts" },
  { t: "14:02:20.28", tag: "deploy",  msg: "succeeded in 2.87s" },
];

const TAG_WIDTH_CH = 8;
const STAGGER = 160;
const START_DELAY = 240;

export default function Hero() {
  const [visible, setVisible] = useState(0);
  const [finalCursor, setFinalCursor] = useState(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const at = (ms: number, fn: () => void) =>
      timers.push(setTimeout(fn, ms));

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(LOG.length);
      setFinalCursor(true);
      return;
    }

    LOG.forEach((_, idx) => {
      at(START_DELAY + idx * STAGGER, () =>
        setVisible((v) => Math.max(v, idx + 1)),
      );
    });
    at(START_DELAY + LOG.length * STAGGER + 200, () => setFinalCursor(true));

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <section
      id="top"
      className="relative overflow-hidden pb-28 pt-[120px] md:pb-40 md:pt-[160px]"
    >
      <div className="mx-auto max-w-[1280px] px-6 md:px-10">
        <div className="mb-10 flex items-center justify-between md:mb-14">
          <span className="eyebrow">§ 00 — Signal</span>
          <span className="eyebrow hidden md:inline">Coelor · Software Studio</span>
        </div>

        <div className="grid grid-cols-1 gap-y-10 md:grid-cols-12 md:grid-rows-[auto_auto] md:gap-x-10 md:gap-y-8">
          {/* Left — typography, static */}
          <div className="md:col-span-7 md:row-start-1 md:self-end">
            <h1 className="display text-[48px] leading-[0.98] md:text-[72px] lg:text-[84px]">
              Software
              <br />
              built to ship.
            </h1>

            <p className="mt-6 max-w-[44ch] text-[17px] leading-relaxed text-ink-muted md:mt-8 md:text-[18px]">
              An independent studio building production systems — AI, platform, and
              infrastructure — with senior engineers from day one.
            </p>
          </div>

          {/* Right — terminal, the only animated element — spans both rows on desktop */}
          <div className="md:col-span-5 md:col-start-8 md:row-span-2 md:row-start-1 md:self-center">
            <div className="relative overflow-hidden rounded-lg border border-rule bg-canvasElev shadow-[0_40px_120px_-50px_rgba(0,255,180,0.25)]">
              <div className="flex items-center justify-between border-b border-rule px-4 py-2.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-muted">
                  coelor.deploy.live
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-1 w-1 rounded-full bg-mint-2 shadow-[0_0_8px_rgba(0,255,180,0.55)]" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-muted">
                    live
                  </span>
                </span>
              </div>

              <div className="px-4 py-4 font-mono text-[11px] leading-[1.8] md:px-5 md:py-5 md:text-[12px]">
                <div className="flex items-baseline gap-2">
                  <span className="select-none text-ink-soft">$</span>
                  <span className="truncate text-ink">{CMD}</span>
                </div>

                <div
                  className="mt-1"
                  style={{ minHeight: `calc(${LOG.length} * 1.8em)` }}
                >
                  {LOG.slice(0, visible).map((line, idx) => (
                    <div key={idx} className="log-line flex items-baseline gap-2 whitespace-pre">
                      <span className="text-ink-soft">{line.t}</span>
                      <span className="text-mint-2">✓</span>
                      <span
                        className="text-ink-muted"
                        style={{ width: `${TAG_WIDTH_CH}ch`, display: "inline-block" }}
                      >
                        {line.tag}
                      </span>
                      <span className="truncate text-ink">{line.msg}</span>
                    </div>
                  ))}
                </div>

                <div
                  className="mt-1 flex items-baseline gap-2"
                  style={{ opacity: finalCursor ? 1 : 0, transition: "opacity 0.35s ease" }}
                >
                  <span className="select-none text-ink-soft">$</span>
                  <span className="term-cursor" />
                </div>
              </div>
            </div>
          </div>

          {/* CTAs — under the terminal on mobile, under the text on desktop */}
          <div className="flex flex-wrap items-center gap-5 md:col-span-7 md:row-start-2 md:self-start">
            <a
              href="#contact"
              className="group inline-flex items-center gap-3 rounded-full border border-ink bg-ink px-6 py-3 font-mono text-[11px] uppercase tracking-[0.22em] text-canvas transition-colors duration-200 hover:bg-transparent hover:text-ink"
            >
              <span>Start a project</span>
              <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1">→</span>
            </a>
            <a
              href="#work"
              className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-muted transition-colors duration-200 hover:text-ink"
            >
              See selected work →
            </a>
          </div>
        </div>

        <div className="mt-20 flex flex-wrap items-baseline gap-x-10 gap-y-3 border-t border-rule pt-6 font-mono text-[11px] uppercase tracking-[0.22em] text-ink-muted md:mt-28">
          <span className="text-ink-soft">Trusted by —</span>
          <span>Fintech</span>
          <span className="opacity-40">·</span>
          <span>Healthcare AI</span>
          <span className="opacity-40">·</span>
          <span>Logistics</span>
          <span className="opacity-40">·</span>
          <span>Media</span>
          <span className="opacity-40">·</span>
          <span>Energy</span>
        </div>
      </div>
    </section>
  );
}

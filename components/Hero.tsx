"use client";

import { useEffect, useState } from "react";

const CMD = "coelor ship --production --quiet";

type StatusStep =
  | { kind: "ok"; label: string; value: string }
  | { kind: "bar"; label: string };

const STEPS: StatusStep[] = [
  { kind: "ok", label: "migrations", value: "48 applied" },
  { kind: "ok", label: "contract tests", value: "284 / 284 pass" },
  { kind: "ok", label: "infra", value: "reconciled" },
  { kind: "bar", label: "rollout · v4.812" },
  { kind: "ok", label: "health", value: "0 alerts · 14 ms p99" },
];

type LineState = "hidden" | "pending" | "resolved";

export default function Hero() {
  const [cmdChars, setCmdChars] = useState(0);
  const [cmdDone, setCmdDone] = useState(false);
  const [lineStates, setLineStates] = useState<LineState[]>(() =>
    STEPS.map(() => "hidden"),
  );
  const [pct, setPct] = useState(0);
  const [finalCursor, setFinalCursor] = useState(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const at = (ms: number, fn: () => void) =>
      timers.push(setTimeout(fn, ms));

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setCmdChars(CMD.length);
      setCmdDone(true);
      setLineStates(STEPS.map(() => "resolved"));
      setPct(100);
      setFinalCursor(true);
      return;
    }

    let t = 520;

    // 1. Type the command character-by-character with mild jitter
    for (let i = 1; i <= CMD.length; i++) {
      const j = 18 + Math.random() * 22;
      at(t, () => setCmdChars(i));
      t += 26 + j;
    }
    at(t + 180, () => setCmdDone(true));
    t += 340;

    // 2. Stream the status lines
    STEPS.forEach((step, idx) => {
      at(t, () =>
        setLineStates((prev) => {
          const next = [...prev];
          next[idx] = "pending";
          return next;
        }),
      );

      if (step.kind === "bar") {
        const total = 1150;
        const start = t + 160;
        for (let p = 0; p <= 100; p += 2) {
          at(
            start + (p / 100) * total,
            () => setPct(p),
          );
        }
        t = start + total + 160;
        at(t, () =>
          setLineStates((prev) => {
            const next = [...prev];
            next[idx] = "resolved";
            return next;
          }),
        );
        t += 220;
      } else {
        const resolve = 320 + Math.random() * 220;
        t += resolve;
        at(t, () =>
          setLineStates((prev) => {
            const next = [...prev];
            next[idx] = "resolved";
            return next;
          }),
        );
        t += 160 + Math.random() * 80;
      }
    });

    at(t + 260, () => setFinalCursor(true));

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <section
      id="top"
      className="relative overflow-hidden px-6 pb-28 pt-[120px] md:px-10 md:pb-40 md:pt-[160px]"
    >
      <div className="mx-auto max-w-[1040px]">
        <div className="mb-8 flex items-center justify-between md:mb-12">
          <span className="eyebrow">§ 00 — Signal</span>
          <span className="eyebrow hidden md:inline">Coelor · Software Studio</span>
        </div>

        <div className="relative overflow-hidden rounded-lg border border-rule bg-canvasElev shadow-[0_40px_140px_-50px_rgba(0,255,180,0.22)]">
          <div className="flex items-center justify-between border-b border-rule px-5 py-3 md:px-7 md:py-4">
            <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-muted">
              coelor.deploy.live
            </span>
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-mint-2 shadow-[0_0_10px_rgba(0,255,180,0.5)]" />
              <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-muted">
                live
              </span>
            </span>
          </div>

          <div className="px-5 py-7 font-mono text-[13px] leading-[1.9] md:px-8 md:py-10 md:text-[14px]">
            {/* Command line — typewritten */}
            <div className="flex items-baseline gap-4">
              <span className="select-none text-ink-soft">$</span>
              <span className="text-ink">
                {CMD.slice(0, cmdChars)}
                {!cmdDone && <span className="term-cursor" />}
              </span>
            </div>

            {/* Status lines */}
            {STEPS.map((s, idx) => {
              const state = lineStates[idx];
              const visible = state !== "hidden";
              return (
                <div
                  key={idx}
                  className="flex items-baseline gap-4"
                  style={{
                    opacity: visible ? 1 : 0,
                    transform: visible ? "translateY(0)" : "translateY(4px)",
                    transition: "opacity 0.35s ease, transform 0.35s ease",
                  }}
                >
                  <span className="select-none text-ink-soft">·</span>
                  <span className="whitespace-nowrap text-ink-muted">{s.label}</span>
                  <span
                    aria-hidden
                    className="flex-1 -translate-y-[3px] border-b border-dotted"
                    style={{ borderColor: "rgba(255,255,255,0.14)" }}
                  />
                  {s.kind === "ok" ? (
                    <span className="whitespace-nowrap">
                      {state === "resolved" ? (
                        <span className="text-mint-2">{s.value}</span>
                      ) : (
                        <span className="term-spinner text-ink-soft">…</span>
                      )}
                    </span>
                  ) : (
                    <span className="flex items-center gap-3 whitespace-nowrap">
                      <span className="block h-[6px] w-[80px] overflow-hidden rounded-full bg-rule md:w-[160px]">
                        <span
                          className="block h-full bg-mint-2"
                          style={{
                            width: `${pct}%`,
                            transition: "width 120ms linear",
                          }}
                        />
                      </span>
                      <span
                        className={
                          pct === 100
                            ? "text-mint-2 tabular-nums"
                            : "text-ink tabular-nums"
                        }
                      >
                        {pct.toString().padStart(3, " ")}%
                      </span>
                    </span>
                  )}
                </div>
              );
            })}

            {/* Final cursor */}
            <div
              className="mt-4 flex items-baseline gap-4"
              style={{
                opacity: finalCursor ? 1 : 0,
                transition: "opacity 0.5s ease",
              }}
            >
              <span className="select-none text-ink-soft">$</span>
              <span className="term-cursor" />
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-8 md:mt-24 md:flex-row md:items-end md:justify-between md:gap-16">
          <h1 className="display text-[40px] leading-[1.05] md:text-[64px] lg:text-[76px]">
            Coelor builds software
            <br />
            like it has to work.
          </h1>
          <a
            href="mailto:hello@coelor.com"
            className="group inline-flex items-center gap-3 self-start font-mono text-[13px] uppercase tracking-[0.22em] text-ink transition-colors duration-200 hover:text-mint-2 md:self-end"
          >
            <span>hello@coelor.com</span>
            <span className="transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}

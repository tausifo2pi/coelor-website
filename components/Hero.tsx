"use client";

import { useEffect, useState } from "react";

type LogKind = "run" | "ok" | "info" | "warn" | "bar";

type LogLine = {
  t: string;
  tag: string;
  kind: LogKind;
  msg: string;
  /** For kind: "bar" — label shown before the progress bar. */
  barLabel?: string;
  /** Optional sequential replacements for the tail of the message (in-place update). */
  updates?: { at: number; msg: string }[];
  /** ms from scheduler start when this line first appears. */
  delay: number;
};

const CMD = "coelor ship --production";

const LOG: LogLine[] = [
  { delay: 0,    t: "14:02:17.421", tag: "ci",    kind: "run",  msg: "pipeline started · commit 4f2a91c · main" },
  { delay: 120,  t: "14:02:17.612", tag: "build", kind: "run",  msg: "bundling · turbopack · 18 entries" },
  { delay: 520,  t: "14:02:18.103", tag: "build", kind: "ok",   msg: "compiled in 482ms · 0 warnings" },
  { delay: 640,  t: "14:02:18.221", tag: "db",    kind: "run",  msg: "applying migrations · shard 0" },
  { delay: 960,  t: "14:02:18.544", tag: "db",    kind: "ok",   msg: "48 applied · 0 skipped · 312ms" },
  { delay: 1060, t: "14:02:18.669", tag: "test",  kind: "run",  msg: "contract suite · 284 specs" },
  { delay: 1680, t: "14:02:19.301", tag: "test",  kind: "ok",   msg: "284 passed · 0 failed · 2.61s" },
  { delay: 1780, t: "14:02:19.418", tag: "infra", kind: "ok",   msg: "pulumi reconciled · 0 diffs" },
  { delay: 1880, t: "14:02:19.527", tag: "k8s",   kind: "bar",  msg: "", barLabel: "rollout · v4.812" },
  { delay: 2640, t: "14:02:20.289", tag: "k8s",   kind: "ok",   msg: "rollout complete · 14/14 replicas · healthy" },
  { delay: 2760, t: "14:02:20.412", tag: "obs",   kind: "ok",   msg: "p99 14ms · error rate 0.00% · 0 alerts" },
  { delay: 2880, t: "14:02:20.531", tag: "ci",    kind: "ok",   msg: "deploy succeeded · 3.11s" },
];

const BAR_DURATION = 720;
const TAG_WIDTH_CH = 5;

function marker(kind: LogKind) {
  switch (kind) {
    case "ok":
      return { glyph: "✓", cls: "text-mint-2" };
    case "run":
      return { glyph: "▸", cls: "text-ink" };
    case "bar":
      return { glyph: "▸", cls: "text-ink" };
    case "warn":
      return { glyph: "!", cls: "text-[#ffb347]" };
    default:
      return { glyph: "·", cls: "text-ink-soft" };
  }
}

export default function Hero() {
  const [visible, setVisible] = useState<number>(0);
  const [msgs, setMsgs] = useState<string[]>(() => LOG.map((l) => l.msg));
  const [pct, setPct] = useState(0);
  const [finalCursor, setFinalCursor] = useState(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const at = (ms: number, fn: () => void) =>
      timers.push(setTimeout(fn, ms));

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(LOG.length);
      setMsgs(LOG.map((l) => (l.updates ? l.updates[l.updates.length - 1].msg : l.msg)));
      setPct(100);
      setFinalCursor(true);
      return;
    }

    LOG.forEach((line, idx) => {
      at(line.delay, () => setVisible((v) => Math.max(v, idx + 1)));

      if (line.kind === "bar") {
        const steps = 50;
        for (let s = 0; s <= steps; s++) {
          at(line.delay + (s / steps) * BAR_DURATION, () =>
            setPct(Math.round((s / steps) * 100)),
          );
        }
      }

      line.updates?.forEach((u) => {
        at(line.delay + u.at, () =>
          setMsgs((prev) => {
            if (prev[idx] === u.msg) return prev;
            const next = prev.slice();
            next[idx] = u.msg;
            return next;
          }),
        );
      });
    });

    const last = LOG[LOG.length - 1];
    at(last.delay + 320, () => setFinalCursor(true));

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <section
      id="top"
      className="relative overflow-hidden pb-28 pt-[120px] md:pb-40 md:pt-[160px]"
    >
      <div className="mx-auto max-w-[1280px] px-6 md:px-10">
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

          <div className="px-5 py-6 font-mono text-[12px] leading-[1.85] md:px-8 md:py-8 md:text-[13px]">
            {/* Command line — shown immediately, no character typing */}
            <div className="flex items-baseline gap-3">
              <span className="select-none text-ink-soft">$</span>
              <span className="text-ink">{CMD}</span>
            </div>

            {/* Reserved-height log area so the container doesn't jump as lines stream in */}
            <div
              className="relative mt-2"
              style={{
                minHeight: `calc(${LOG.length} * 1.85em + 0.5em)`,
              }}
            >
              {LOG.map((line, idx) => {
                if (idx >= visible) return null;
                const m = marker(line.kind);
                if (line.kind === "bar") {
                  const cells = 20;
                  const filled = Math.round((pct / 100) * cells);
                  const bar = "█".repeat(filled) + "░".repeat(cells - filled);
                  return (
                    <div
                      key={idx}
                      className="log-line flex items-baseline gap-3 whitespace-pre"
                    >
                      <span className="text-ink-soft">{line.t}</span>
                      <span
                        className="text-ink-muted"
                        style={{ width: `${TAG_WIDTH_CH}ch`, display: "inline-block" }}
                      >
                        {line.tag}
                      </span>
                      <span className={m.cls}>{m.glyph}</span>
                      <span className="text-ink-muted">{line.barLabel}</span>
                      <span className="whitespace-pre">
                        <span className="text-ink-soft">[</span>
                        <span className={pct === 100 ? "text-mint-2" : "text-ink"}>{bar}</span>
                        <span className="text-ink-soft">] </span>
                        <span
                          className={
                            pct === 100
                              ? "tabular-nums text-mint-2"
                              : "tabular-nums text-ink"
                          }
                        >
                          {pct.toString().padStart(3, " ")}%
                        </span>
                      </span>
                    </div>
                  );
                }
                return (
                  <div
                    key={idx}
                    className="log-line flex items-baseline gap-3 whitespace-pre"
                  >
                    <span className="text-ink-soft">{line.t}</span>
                    <span
                      className="text-ink-muted"
                      style={{ width: `${TAG_WIDTH_CH}ch`, display: "inline-block" }}
                    >
                      {line.tag}
                    </span>
                    <span className={m.cls}>{m.glyph}</span>
                    <span
                      className={line.kind === "ok" ? "text-ink" : "text-ink-muted"}
                    >
                      {msgs[idx]}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Final prompt cursor */}
            <div
              className="mt-3 flex items-baseline gap-3"
              style={{
                opacity: finalCursor ? 1 : 0,
                transition: "opacity 0.4s ease",
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

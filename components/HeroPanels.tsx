"use client";

import { useEffect, useState } from "react";
import content from "@/data/site-content.json";
import { Icon } from "@/components/icons";

const VISIBLE = 4;
const ROW_H = 56; // px, including gap
const INTERVAL_MS = 3200;

/**
 * One translucent card over the hero gradient: a live feed of automation
 * events. Rows keep stable keys and slide to their new slot with a CSS
 * transition, so a new event pushes the list down instead of re-rendering it.
 * Stops rotating under prefers-reduced-motion.
 */
export default function HeroPanels() {
  const { feed } = content.hero;
  const n = feed.events.length;
  const [head, setHead] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setHead((h) => (h + 1) % n), INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [n]);

  // rank 0 = newest (top). Ranks >= VISIBLE sit below the fold, faded out.
  const rank = (i: number) => (head - i + n) % n;

  return (
    <div className="mx-auto w-full max-w-[440px] lg:ml-auto lg:mr-0">
      <div className="glass-card">
        <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-3.5">
          <span className="inline-flex items-center gap-2.5 text-[13px] font-semibold text-ink">
            <Icon name="activity" size={14} className="text-ink/70" />
            {feed.title}
          </span>
          <span className="inline-flex h-6 items-center gap-2 rounded-full border border-ok/25 bg-ok/10 px-2.5 text-[11px] font-medium text-[#8fe7c2]">
            <span className="pulse h-1.5 w-1.5 rounded-full bg-ok" />
            Live
          </span>
        </div>

        <ul className="relative mx-2 my-2" style={{ height: ROW_H * VISIBLE }} aria-live="off">
          {feed.events.map((e, i) => {
            const r = rank(i);
            const shown = r < VISIBLE;
            const review = e.state === "review";
            return (
              <li
                key={e.id}
                aria-hidden={!shown}
                className={`absolute inset-x-0 top-0 flex items-center gap-3 rounded-[12px] px-3 transition-[transform,opacity,background-color] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${r === 0 ? "bg-white/[0.07] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]" : ""}`}
                style={{
                  height: ROW_H - 6,
                  transform: `translateY(${Math.min(r, VISIBLE) * ROW_H}px)`,
                  opacity: shown ? 1 - r * 0.18 : 0,
                  pointerEvents: "none",
                }}
              >
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${review ? "border-warn/30 bg-warn/15 text-warn" : "border-white/[0.1] bg-white/[0.06] text-ink"}`}>
                  <Icon name={e.icon} size={15} />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-[13px] font-semibold text-ink">{e.title}</span>
                  <span className="truncate text-[12px] text-ink/60">{e.detail}</span>
                </span>
                <span className="font-mono text-[11px] tabular-nums text-ink/45">{e.time}</span>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center justify-between border-t border-white/[0.08] px-5 py-3 text-[12px] text-ink/60">
          <span className="inline-flex items-center gap-2">
            <Icon name="check" size={13} strokeWidth={2.4} className="text-ok" />
            {feed.footer}
          </span>
          <span className="font-mono text-[11px] text-ink/40">UTC+1</span>
        </div>
      </div>
    </div>
  );
}

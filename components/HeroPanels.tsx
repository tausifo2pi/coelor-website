"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/icons";

const VISIBLE = 4;
const ROW_H = 56; // px, including gap
const INTERVAL_MS = 3200;

export type HeroFeed = {
  title: string;
  badge: string;
  footer: string;
  /** "HH:MM" of the newest row on first paint; each later row is STEP_MIN minutes newer */
  clock: string;
  events: Array<{ id: string; icon: string; title: string; detail: string; state?: string }>;
};

const STEP_MIN = 2;

/**
 * One translucent card over the hero gradient: a feed of automation events (an illustration, not live data). Rows keep
 * stable keys and slide to their new slot with a CSS transition, so a new event pushes the list down instead of
 * re-rendering it. Stops rotating under prefers-reduced-motion.
 */
export default function HeroPanels({ feed }: { feed: HeroFeed }) {
  const n = feed.events.length;
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setTick((t) => t + 1), INTERVAL_MS);
    return () => window.clearInterval(id);
  }, []);

  // rank 0 = newest (top). Ranks >= VISIBLE sit below the fold, faded out.
  const head = tick % n;
  const rank = (i: number) => (head - i + n) % n;
  // A row's time is the step it last came in at, so the times always run newest-first down the card.
  const [hh, mm] = feed.clock.split(":").map(Number);
  const timeOf = (i: number) => {
    const m = (((hh * 60 + mm + (tick - rank(i)) * STEP_MIN) % 1440) + 1440) % 1440;
    return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
  };

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
            {feed.badge}
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
                <span className="font-mono text-[11px] tabular-nums text-ink/45">{timeOf(i)}</span>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center border-t border-white/[0.08] px-5 py-3 text-[12px] text-ink/60">
          <span className="inline-flex min-w-0 items-center gap-2">
            <Icon name="check" size={13} strokeWidth={2.4} className="shrink-0 text-ok" />
            <span className="truncate">{feed.footer}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

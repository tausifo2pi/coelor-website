"use client";

// The hero's live quote: pick a number of connections and see every line of the price, like an invoice (n × $500, the
// free one from 3 on, what is $0, the one-time total). Numbers from lib/offer.ts, words from data/pricing.json (passed
// in by the server, so the browser does not download the page's whole copy). "Get this quote" and the trial link fill
// in the contact form below (ContactForm listens for [data-prefill]). The stepper sits in data-track="off": every
// tracked click is a phone notification.
import { useState } from "react";
import { ArrowRight, Minus, Plus } from "lucide-react";
import { OFFER, PREFILL, breakdown, usd } from "@/lib/offer";
import type { pricing } from "./content";

type Copy = (typeof pricing)["quote"];

const MIN = 1;
const MAX = 20;
const fill = (s: string, k: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, x: string) => String(k[x] ?? ""));

export default function QuoteBuilder({ copy, start = OFFER.freeAt }: { copy: Copy; start?: number }) {
  const [n, setN] = useState(start);
  const b = breakdown(n);
  const set = (v: number) => setN(Math.min(MAX, Math.max(MIN, v)));

  return (
    <div className="flex flex-col gap-4">
      <div className="glass-card flex flex-col p-5 sm:p-7" aria-labelledby="quote-title">
        <div className="flex items-center justify-between gap-3">
          <span id="quote-title" className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-soft">{copy.title}</span>
          <span className="rounded-full border border-ok/30 bg-ok/10 px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.08em] text-[#8fe7c2]">{copy.badge}</span>
        </div>

        {/* the number of connections */}
        <div data-track="off" className="mt-6 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[16px] font-semibold text-ink">{copy.countLabel}</p>
            <p className="text-[13px] leading-[1.4] text-ink-soft">{copy.countHint}</p>
          </div>
          <div className="flex shrink-0 items-center rounded-full border border-rule-strong bg-black/20 p-1">
            <button type="button" onClick={() => set(n - 1)} disabled={n <= MIN} aria-label="One connection less" className="grid h-9 w-9 place-items-center rounded-full text-ink transition-colors hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent">
              <Minus size={16} strokeWidth={2.4} />
            </button>
            <output aria-live="polite" aria-label={`${n} connections`} className="w-10 text-center font-mono text-[20px] font-semibold tabular-nums text-ink">{n}</output>
            <button type="button" onClick={() => set(n + 1)} disabled={n >= MAX} aria-label="One connection more" className="grid h-9 w-9 place-items-center rounded-full text-ink transition-colors hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent">
              <Plus size={16} strokeWidth={2.4} />
            </button>
          </div>
        </div>

        {/* the lines of the price */}
        <dl className="mt-6 flex flex-col border-t border-dashed border-rule-strong pt-4 text-[14px]">
          <div className="flex items-baseline justify-between gap-4 py-2">
            <dt className="text-ink">
              {copy.lineEachLabel} <span className="font-mono text-[12px] text-ink-soft">{fill(copy.lineEach, { n, price: usd(OFFER.perConnection) })}</span>
            </dt>
            <dd className="font-mono tabular-nums text-ink">{usd(b.gross)}</dd>
          </div>
          {b.discount > 0 ? (
            <div className="flex items-baseline justify-between gap-4 py-2">
              <dt className="flex items-center gap-2 text-[#8fe7c2]">
                {copy.lineFree}
                <span className="rounded-full bg-ok/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.06em]">1 free</span>
              </dt>
              <dd className="font-mono tabular-nums text-[#8fe7c2]">−{usd(b.discount)}</dd>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4 py-2">
              <dt className="text-accent">{fill(copy.lineToFree, { k: b.toFree })}</dt>
              <dd data-track="off">
                <button type="button" onClick={() => set(OFFER.freeAt)} className="rounded-full border border-accent/40 px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-[0.06em] text-accent transition-colors hover:bg-accent/10">
                  Add
                </button>
              </dd>
            </div>
          )}
          {copy.rows.map((r) => (
            <div key={r.label} className="flex items-baseline justify-between gap-4 py-2">
              <dt className="text-ink-muted">{r.label}</dt>
              <dd className="font-mono tabular-nums text-ink-muted">{r.value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-3 flex items-end justify-between gap-4 border-t border-dashed border-rule-strong pt-5">
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-soft">{copy.totalLabel}</span>
            <span className={`text-[13px] text-[#8fe7c2] ${b.discount ? "" : "invisible"}`}>{fill(copy.save, { amount: usd(b.discount || OFFER.perConnection) })}</span>
          </div>
          <span key={b.total} className="display rise-in text-[44px] leading-none tabular-nums text-ink [--d:0ms] sm:text-[52px]" style={{ animationDuration: "0.35s" }}>
            {usd(b.total)}
          </span>
        </div>

        <a href="#contact" data-prefill={PREFILL.quote(n)} className="btn-primary mt-6 w-full">
          {copy.cta}
          <ArrowRight size={15} strokeWidth={2.4} aria-hidden />
        </a>
        <p className="mt-4 text-center text-[12.5px] leading-[1.5] text-ink-soft">{copy.payNote}</p>
      </div>

      <a href="#contact" data-prefill={PREFILL.trial} className="group mx-auto inline-flex items-center gap-2 text-[14px] font-medium text-ink-muted transition-colors hover:text-ink">
        <span className="h-1.5 w-1.5 rounded-full bg-ok" aria-hidden />
        {copy.trialLink}
        <ArrowRight size={14} strokeWidth={2.4} className="transition-transform group-hover:translate-x-0.5" aria-hidden />
      </a>
    </div>
  );
}

"use client";

// "Pricing & trial" inside the live demos (sneaker and store demos), in the demo's light look, so a reader sees the
// price and the free trial without leaving the demo: the trial first, a live quote with every line of the price, the
// plans, how it goes, and what is and is not in the price. A slim trial strip sits at the top of every other section
// and opens this one. Numbers and words from lib/offer.ts (the same offer as the public /pricing). Buttons open the
// demo's contact form already filled in (?plan=, see ContactForm). The quote's stepper is not tracked (only "Get this
// quote"): every demo_cta is a phone notification.
import { useState } from "react";
import { ArrowRight, Check, Minus, Plus } from "lucide-react";
import { OFFER, OFFER_LINES, TRIAL, breakdown, usd, withPlan } from "@/lib/offer";
import type { DemoTracker } from "@/lib/demo/track";
import { PlanTiles } from "@/components/demo/Offer";

const per = usd(OFFER.perConnection);
const PRICING = "/pricing";

/** The top of every section: the free trial in one line, and the way to the pricing section. */
export function TrialStrip({ open, contact, t }: { open: () => void; contact: string; t: DemoTracker | null }) {
  return (
    <div className="mb-5 flex flex-col gap-3 rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="flex items-start gap-2.5 text-[13.5px] leading-[1.5] text-[#14532d]">
        <span className="mt-[6px] h-2 w-2 shrink-0 animate-pulse rounded-full bg-[#22c55e]" aria-hidden />
        <span>
          <b className="font-semibold">Free {TRIAL.days}-day trial:</b> we connect {TRIAL.connections} platform of yours, no card.
          <span className="hidden md:inline"> After that {per} per connection, one-time, {OFFER_LINES.free.toLowerCase()}.</span>
        </span>
      </p>
      <div className="flex shrink-0 items-center gap-2">
        <button type="button" onClick={open} className="inline-flex h-8 items-center rounded-lg px-2.5 text-[13px] font-semibold text-[#166534] hover:bg-[#dcfce7]">
          Pricing
        </button>
        <a href={withPlan(contact, "trial")} onClick={() => t?.cta("trial", "Start free trial (strip)")} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#16a34a] px-3 text-[13px] font-semibold text-white hover:bg-[#15803d]">
          Start free trial<ArrowRight size={14} />
        </a>
      </div>
    </div>
  );
}

const STEPS = [
  { when: "Day 0", title: "30-minute call", body: "We list your platforms and accounts together. You get the exact price in writing before anything starts." },
  { when: "Day 1", title: "Set-up", body: "We connect your platforms and accounts and set the automations to your rules." },
  { when: `Days 2–${TRIAL.days + 1}`, title: "Free trial", body: `${TRIAL.connections} connection free for ${TRIAL.days} days on your real data. No card.`, optional: true },
  { when: "Once it runs", title: "Pay once", body: "One payment, the price agreed on the call. Never before it works." },
  { when: "Then", title: "Handover", body: "The full source code and a walkthrough. It's yours." },
];

const IN_PRICE = [
  "The full source code, yours to keep",
  "Unlimited orders and products",
  "Every platform and account connected and matched to your data",
  "Automations set to your rules",
  "Set-up in 1 day, then handover",
];

const NEVER = ["Monthly software fee", "Fee per order", "Fee per product", "Separate set-up fee", `The ${TRIAL.days}-day trial`];

function Box({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-xl border border-[#e3e6eb] bg-white p-5 md:p-6 ${className}`}>{children}</section>;
}

function Label({ children, tone = "slate" }: { children: React.ReactNode; tone?: "slate" | "green" | "blue" }) {
  const c = tone === "green" ? "text-[#15803d]" : tone === "blue" ? "text-[#2563eb]" : "text-[#64748b]";
  return <p className={`text-[12px] font-semibold uppercase tracking-[0.06em] ${c}`}>{children}</p>;
}

/** The quote: pick connections, see every line of the price. */
function Quote({ contact, t }: { contact: string; t: DemoTracker | null }) {
  const [n, setN] = useState<number>(OFFER.freeAt);
  const b = breakdown(n);
  const set = (v: number) => setN(Math.min(20, Math.max(1, v)));
  const row = "flex items-baseline justify-between gap-4 py-2 text-[14px]";
  return (
    <Box className="flex flex-col">
      <div className="flex items-center justify-between gap-3">
        <Label tone="blue">Your quote</Label>
        <span className="rounded-full bg-[#eff6ff] px-2 py-0.5 text-[11px] font-semibold text-[#1d4ed8]">One-time</span>
      </div>
      <div className="mt-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-[15px] font-semibold">Connections</p>
          <p className="text-[12.5px] text-[#64748b]">Platforms or accounts we connect</p>
        </div>
        <div className="flex items-center rounded-full border border-[#d9dde3] bg-[#f8fafc] p-1">
          <button type="button" onClick={() => set(n - 1)} disabled={n <= 1} aria-label="One connection less" className="grid h-8 w-8 place-items-center rounded-full hover:bg-white disabled:opacity-30">
            <Minus size={15} strokeWidth={2.4} />
          </button>
          <output aria-live="polite" className="w-9 text-center text-[18px] font-bold tabular-nums">{n}</output>
          <button type="button" onClick={() => set(n + 1)} disabled={n >= 20} aria-label="One connection more" className="grid h-8 w-8 place-items-center rounded-full hover:bg-white disabled:opacity-30">
            <Plus size={15} strokeWidth={2.4} />
          </button>
        </div>
      </div>
      <dl className="mt-4 border-t border-dashed border-[#d9dde3] pt-2">
        <div className={row}>
          <dt>Connections <span className="text-[12.5px] text-[#94a3b8]">{n} × {per}</span></dt>
          <dd className="font-semibold tabular-nums">{usd(b.gross)}</dd>
        </div>
        {b.discount > 0 ? (
          <div className={row}>
            <dt className="flex items-center gap-2 text-[#15803d]">{OFFER.freeAt} for the price of {OFFER.freeAt - 1} <span className="whitespace-nowrap rounded-full bg-[#dcfce7] px-2 py-0.5 text-[11px] font-semibold">1 free</span></dt>
            <dd className="whitespace-nowrap font-semibold tabular-nums text-[#15803d]">−{usd(b.discount)}</dd>
          </div>
        ) : (
          <div className={row}>
            <dt className="text-[#2563eb]">Add {b.toFree} more and one is free</dt>
            <dd>
              <button type="button" onClick={() => set(OFFER.freeAt)} className="rounded-full border border-[#bfdbfe] px-2.5 py-0.5 text-[12px] font-semibold text-[#2563eb] hover:bg-[#eff6ff]">Add</button>
            </dd>
          </div>
        )}
        {[["Set-up, 1 day", "Included"], ["Orders and products, unlimited", "$0"], ["Monthly fee", "$0"], ["Source code", "Yours"]].map(([k, v]) => (
          <div key={k} className={row}>
            <dt className="text-[#475569]">{k}</dt>
            <dd className="tabular-nums text-[#475569]">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-2 flex items-end justify-between gap-4 border-t border-dashed border-[#d9dde3] pt-4">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#64748b]">Total, one-time</p>
          {b.discount > 0 && <p className="text-[13px] font-semibold text-[#15803d]">You save {usd(b.discount)}</p>}
        </div>
        <p className="text-[40px] font-bold leading-none tracking-[-0.03em] tabular-nums">{usd(b.total)}</p>
      </div>
      <a href={withPlan(contact, n)} onClick={() => t?.cta("get_this", `Quote ${n} connections (pricing)`)} className="mt-5 inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-[#2563eb] text-[14px] font-semibold text-white hover:bg-[#1d4ed8]">
        Get this quote<ArrowRight size={15} />
      </a>
      <p className="mt-3 text-center text-[12.5px] leading-[1.5] text-[#64748b]">Pay once, after it runs and before handover.</p>
    </Box>
  );
}

/** The pricing section of the demo. */
export function PricingView({ contact, t }: { contact: string; t: DemoTracker | null }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
        {/* the free trial */}
        <Box className="flex flex-col gap-5 border-[#86efac] bg-[#f0fdf4]">
          <div>
            <Label tone="green">Free trial</Label>
            <h2 className="mt-1 text-[24px] font-bold tracking-[-0.02em] md:text-[28px]">Try it free for {TRIAL.days} days</h2>
            <p className="mt-2 max-w-[560px] text-[15px] leading-[1.6] text-[#334155]">
              We connect {TRIAL.connections} platform or account of your store and set it up in 1 day. It then runs for {TRIAL.days} days on your real data, like the
              sync in this demo. No card, no commitment.
            </p>
          </div>
          <ul className="grid gap-2.5 sm:grid-cols-2">
            {[`${TRIAL.connections} platform or account connected`, "Set up in 1 day", `Runs ${TRIAL.days} days on your real data`, "No card, no commitment"].map((x) => (
              <li key={x} className="flex items-start gap-2 text-[14px] text-[#14532d]">
                <Check size={16} strokeWidth={2.6} className="mt-[2px] shrink-0 text-[#16a34a]" />
                {x}
              </li>
            ))}
          </ul>
          <div className="rounded-lg bg-white/70 p-4 text-[13.5px] leading-[1.55] text-[#334155] ring-1 ring-[#bbf7d0]">
            <b className="font-semibold">After {TRIAL.days} days:</b> keep it for {per} one-time (it counts toward {OFFER_LINES.free.toLowerCase()}), or we switch it
            off and you pay nothing.
          </div>
          <div className="mt-auto flex flex-col gap-2 sm:flex-row">
            <a href={withPlan(contact, "trial")} onClick={() => t?.cta("trial", "Start free trial (pricing)")} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-[#16a34a] px-4 text-[14px] font-semibold text-white hover:bg-[#15803d]">
              Start free trial<ArrowRight size={15} />
            </a>
            <a href={PRICING} onClick={() => t?.cta("pricing", "Full pricing (pricing)")} className="inline-flex h-10 items-center justify-center rounded-lg border border-[#bbf7d0] bg-white px-4 text-[14px] font-semibold text-[#166534] hover:bg-[#f7fef9]">
              Full pricing page
            </a>
          </div>
        </Box>
        <Quote contact={contact} t={t} />
      </div>

      <Box>
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Label>Plans</Label>
            <h3 className="mt-1 text-[19px] font-bold tracking-[-0.01em]">{per} per connection, {OFFER_LINES.free.toLowerCase()}</h3>
          </div>
          <p className="text-[13px] text-[#64748b]">A connection is one platform or account: a marketplace account, a web store, a warehouse system.</p>
        </div>
        <PlanTiles contact={contact} t={t} where="pricing" className="pt-2" />
      </Box>

      <Box>
        <Label>How it goes</Label>
        <ol className="mt-4 grid gap-4 md:grid-cols-5">
          {STEPS.map((s, i) => (
            <li key={s.title} className={`flex flex-col gap-1.5 rounded-lg p-3.5 ${s.optional ? "border border-dashed border-[#86efac] bg-[#f0fdf4]" : "bg-[#f8fafc] ring-1 ring-[#eef0f3]"}`}>
              <span className="flex items-center gap-2 text-[11.5px] font-semibold uppercase tracking-[0.05em] text-[#64748b]">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-white text-[11px] text-[#0f172a] ring-1 ring-[#e3e6eb]">{i + 1}</span>
                {s.when}
              </span>
              <p className="text-[15px] font-semibold">
                {s.title}
                {s.optional && <span className="ml-2 rounded-full bg-[#dcfce7] px-1.5 py-0.5 align-middle text-[10.5px] font-semibold uppercase text-[#15803d]">Optional</span>}
              </p>
              <p className="text-[13px] leading-[1.5] text-[#64748b]">{s.body}</p>
            </li>
          ))}
        </ol>
      </Box>

      <div className="grid gap-5 lg:grid-cols-2">
        <Box>
          <Label tone="green">In the price</Label>
          <ul className="mt-3 flex flex-col">
            {IN_PRICE.map((x, i) => (
              <li key={x} className={`flex items-start gap-2.5 py-2.5 text-[14px] ${i ? "border-t border-[#eef0f3]" : ""}`}>
                <Check size={16} strokeWidth={2.6} className="mt-[2px] shrink-0 text-[#16a34a]" />
                {x}
              </li>
            ))}
          </ul>
        </Box>
        <Box>
          <Label>Never charged</Label>
          <dl className="mt-3 flex flex-col">
            {NEVER.map((x, i) => (
              <div key={x} className={`flex items-baseline justify-between gap-4 py-2.5 text-[14px] ${i ? "border-t border-dashed border-[#e3e6eb]" : ""}`}>
                <dt className="text-[#475569]">{x}</dt>
                <dd className="font-semibold tabular-nums">$0</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-[12.5px] leading-[1.5] text-[#94a3b8]">Your platforms&apos; own plans and fees stay with those platforms. We add nothing to them.</p>
        </Box>
      </div>
    </div>
  );
}

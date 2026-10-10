"use client";

// The offer on the live demos (sneaker and store demos), in the demo's light look: a "your own build" card under every
// section, a line in the sidebar card and a line in the "view only" dialog. The demo is one business's custom build
// (components/demo/CustomNotice.tsx), so the card sells a build made for the reader's own setup, scoped on a call, not
// "the same sync" or a plan to pick (lead-outreach PLAN_followups_custom_demo.md step 5a, user 2026-10-11). Numbers and
// wording from lib/offer.ts ($500 per connection, one-time, 3 for the price of 2, set up in 1 day, 7-day free trial with
// 1 connection, pay once after it runs). The button opens the demo's contact form; "How pricing works" opens the
// demo's pricing section.
import { ArrowRight, Check } from "lucide-react";
import { OFFER, OFFER_LINES, TRIAL, usd } from "@/lib/offer";
import type { DemoTracker } from "@/lib/demo/track";

const PRICING = "/pricing";
const per = usd(OFFER.perConnection);

const TERMS = ["Scoped with you on a 30-minute call", "Built for your platforms and rules", "The code is yours", "No monthly fee"];

/** Under every section: a build made for the visitor's own setup, and what it costs. */
export function OfferCard({ contact, t, open }: { contact: string; t: DemoTracker | null; open?: () => void }) {
  return (
    <section aria-labelledby="offer-title" className="mt-8 overflow-hidden rounded-xl border border-[#e3e6eb] bg-white">
      <div className="flex flex-col gap-4 p-5 md:flex-row md:items-end md:justify-between md:p-6">
        <div className="max-w-[720px]">
          <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#2563eb]">Your own build</p>
          <h2 id="offer-title" className="mt-1 text-[19px] font-bold tracking-[-0.01em] md:text-[22px]">Made for your setup, not copied from this one</h2>
          <p className="mt-1.5 text-[14px] leading-[1.6] text-[#64748b]">
            Tell us which platforms, accounts and tools you use and how you work. We build it around that: {per} per connection, one-time,{" "}
            {OFFER_LINES.free.toLowerCase()}. Pay once, after it runs. {OFFER_LINES.trial}.
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
          {open ? (
            <button type="button" onClick={open} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg px-3 text-[14px] font-semibold text-[#2563eb] hover:bg-[#eff6ff]">
              How pricing works
            </button>
          ) : (
            <a href={PRICING} onClick={() => t?.cta("pricing", "Pricing (offer)")} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg px-3 text-[14px] font-semibold text-[#2563eb] hover:bg-[#eff6ff]">
              How pricing works
            </a>
          )}
          <a href={contact} onClick={() => t?.cta("get_this", "Plan my own build (offer)")} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-[#2563eb] px-4 text-[14px] font-semibold text-white hover:bg-[#1d4ed8]">
            Plan my own build<ArrowRight size={15} />
          </a>
        </div>
      </div>

      <ul className="flex flex-wrap gap-x-6 gap-y-2 border-t border-[#e3e6eb] bg-[#f8fafc] px-5 py-4 md:px-6">
        {TERMS.map((l) => (
          <li key={l} className="inline-flex items-center gap-1.5 text-[13px] text-[#475569]">
            <Check size={14} strokeWidth={2.6} className="shrink-0 text-[#16a34a]" />
            {l}
          </li>
        ))}
        <li className="text-[13px] text-[#94a3b8]">A connection is one platform or account.</li>
      </ul>
    </section>
  );
}

/** The sidebar card's price lines. */
export function OfferLines() {
  return (
    <p className="mt-2 text-[12.5px] leading-[1.5] text-[#64748b]">
      <b className="font-semibold text-[#0f172a]">{OFFER_LINES.price}.</b> {OFFER_LINES.free}. Free {TRIAL.days}-day trial.
    </p>
  );
}

/** The "view only" dialog: what this platform (or a whole build) costs in the reader's own build. */
export function OfferNote({ name }: { name?: string }) {
  return (
    <p className="mt-4 rounded-lg bg-[#f0fdf4] px-3 py-2.5 text-[13px] leading-[1.5] text-[#166534] ring-1 ring-[#bbf7d0]">
      {name ? `${name} in your own build: one connection, ${per} one-time, or free for ${TRIAL.days} days as your trial.` : `${OFFER_LINES.price}, or free for ${TRIAL.days} days with 1 connection.`}{" "}
      {OFFER_LINES.free}, {OFFER_LINES.setup.toLowerCase()}.
    </p>
  );
}

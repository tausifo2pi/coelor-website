"use client";

// The offer on the live demos (sneaker and store demos), in the demo's light look: a price card under every section
// (free trial + three sizes, every line of the price shown), a line in the sidebar card and a line in the "view only"
// dialog. Numbers and wording from lib/offer.ts ($500 per connection, one-time, 3 for the price of 2, set up in 1 day,
// 7-day free trial with 1 connection, pay once after it runs). Buttons open the demo's contact form already filled in
// (?plan=, see ContactForm); "Full pricing" goes to the public /pricing.
import { ArrowRight, Check } from "lucide-react";
import { OFFER, OFFER_LINES, TRIAL, breakdown, usd, withPlan } from "@/lib/offer";
import type { DemoTracker } from "@/lib/demo/track";

const PRICING = "/pricing";

type Tile = { key: string; head: string; price: string; unit: string; plan: "trial" | number; cta: string; short: string; best?: boolean; trial?: boolean };

const per = usd(OFFER.perConnection);
const TILES: Tile[] = [
  { key: "trial", head: "Free trial", price: usd(0), unit: `${TRIAL.connections} connection, ${TRIAL.days} days, no card`, plan: "trial", cta: "Start free trial", short: "Start trial", trial: true },
  ...[2, 3, 4].map((n): Tile => {
    const b = breakdown(n);
    const plus = n === 4;
    return {
      key: String(n),
      head: plus ? `${n}+ connections` : `${n} connections`,
      price: usd(b.total),
      unit: plus ? `for ${n}, +${per} each after` : `${n} × ${per}${b.discount ? ", 1 free" : ""}`,
      plan: n,
      cta: "Get this quote",
      short: "Get quote",
      best: n === OFFER.freeAt,
    };
  }),
];

const TERMS = ["Unlimited orders and products", "The code is yours", OFFER_LINES.setup, "No monthly fee"];

/** The free trial and three sizes as tiles, each with its button to the contact form (filled in with that plan). */
export function PlanTiles({ contact, t, where, className = "" }: { contact: string; t: DemoTracker | null; where: string; className?: string }) {
  return (
    <ul className={`grid grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-4 ${className}`}>
      {TILES.map((x) => (
        <li
          key={x.key}
          className={`relative flex flex-col gap-3 rounded-xl p-3.5 sm:p-4 ${x.trial ? "border border-dashed border-[#86efac] bg-[#f0fdf4]" : x.best ? "border border-[#2563eb] bg-[#f8fbff] ring-1 ring-[#2563eb]" : "border border-[#e3e6eb] bg-[#f8fafc]"}`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className={`text-[11.5px] font-semibold uppercase tracking-[0.05em] sm:text-[12px] ${x.trial ? "text-[#15803d]" : "text-[#475569]"}`}>{x.head}</span>
            {x.best && <span className="absolute -top-2.5 right-3 whitespace-nowrap rounded-full bg-[#2563eb] px-2 py-0.5 text-[11px] font-semibold text-white">Best value</span>}
          </div>
          <div>
            <p className="text-[24px] font-bold leading-none tracking-[-0.02em] tabular-nums sm:text-[28px]">{x.price}</p>
            <p className="mt-1.5 text-[12.5px] leading-[1.4] text-[#64748b]">{x.unit}</p>
          </div>
          <a
            href={withPlan(contact, x.plan)}
            onClick={() => t?.cta(x.trial ? "trial" : "get_this", x.trial ? `Start free trial (${where})` : `Quote ${x.plan} connections (${where})`)}
            className={`mt-auto inline-flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-2 text-[13.5px] font-semibold sm:px-3 ${x.best ? "bg-[#2563eb] text-white hover:bg-[#1d4ed8]" : x.trial ? "bg-[#16a34a] text-white hover:bg-[#15803d]" : "border border-[#d9dde3] bg-white text-[#334155] hover:bg-[#f1f5f9]"}`}
          >
            <span className="sm:hidden">{x.short}</span>
            <span className="hidden sm:inline">{x.cta}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

/** Under every section: what the same sync costs for the visitor's store. */
export function OfferCard({ contact, t, open }: { contact: string; t: DemoTracker | null; open?: () => void }) {
  return (
    <section aria-labelledby="offer-title" className="mt-8 overflow-hidden rounded-xl border border-[#e3e6eb] bg-white">
      <div className="flex flex-col gap-4 p-5 md:flex-row md:items-end md:justify-between md:p-6">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#2563eb]">For your store</p>
          <h2 id="offer-title" className="mt-1 text-[19px] font-bold tracking-[-0.01em] md:text-[22px]">Get the same sync, {OFFER_LINES.setup.toLowerCase()}</h2>
          <p className="mt-1 text-[14px] leading-[1.5] text-[#64748b]">{per} per connection, one-time. Pay once, after it runs.</p>
        </div>
        {open ? (
          <button type="button" onClick={open} className="inline-flex shrink-0 items-center gap-1.5 text-[14px] font-semibold text-[#2563eb] hover:text-[#1d4ed8]">
            Pricing and free trial<ArrowRight size={15} />
          </button>
        ) : (
          <a href={PRICING} onClick={() => t?.cta("pricing", "Pricing (offer)")} className="inline-flex shrink-0 items-center gap-1.5 text-[14px] font-semibold text-[#2563eb] hover:text-[#1d4ed8]">
            Full pricing<ArrowRight size={15} />
          </a>
        )}
      </div>

      <PlanTiles contact={contact} t={t} where="offer" className="px-4 pt-1 md:px-6" />

      <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2 border-t border-[#e3e6eb] bg-[#f8fafc] px-5 py-4 md:px-6">
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

/** The "view only" dialog: what connecting this platform (or the whole sync) costs. */
export function OfferNote({ name }: { name?: string }) {
  return (
    <p className="mt-4 rounded-lg bg-[#f0fdf4] px-3 py-2.5 text-[13px] leading-[1.5] text-[#166534] ring-1 ring-[#bbf7d0]">
      {name ? `Connecting ${name} for your store: ${per}, one-time, or free for ${TRIAL.days} days as your trial.` : `${OFFER_LINES.price}, or free for ${TRIAL.days} days with 1 connection.`}{" "}
      {OFFER_LINES.free}, {OFFER_LINES.setup.toLowerCase()}.
    </p>
  );
}

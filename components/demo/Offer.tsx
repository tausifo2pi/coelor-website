"use client";

// The offer on the live demos (sneaker and store demos), in the demo's light look: a card under every section, a line in
// the sidebar card and a line in the "view only" dialog. Numbers and wording from lib/offer.ts ($500 per connection,
// one-time, 3 for the price of 2, set up in 1 day). Links go to /pricing (public) and the demo's own contact form.
import { ArrowRight, Check } from "lucide-react";
import { OFFER, OFFER_EXAMPLES, OFFER_LINES, usd } from "@/lib/offer";
import type { DemoTracker } from "@/lib/demo/track";

const PRICING = "/pricing";

/** Under every section: what the same sync costs for the visitor's store, with a few setups priced out. */
export function OfferCard({ contact, t }: { contact: string; t: DemoTracker | null }) {
  return (
    <section aria-labelledby="offer-title" className="mt-8 grid gap-6 rounded-xl border border-[#e3e6eb] bg-white p-5 md:grid-cols-[minmax(0,1fr)_300px] md:gap-8 md:p-6">
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#2563eb]">For your store</p>
          <h2 id="offer-title" className="mt-1 text-[19px] font-bold tracking-[-0.01em] md:text-[21px]">Get the same sync, {OFFER_LINES.setup.toLowerCase()}</h2>
        </div>
        <ul className="flex flex-col gap-2">
          {[OFFER_LINES.price, OFFER_LINES.free, OFFER_LINES.setup, "Unlimited orders and products, and the code is yours"].map((l) => (
            <li key={l} className="flex items-start gap-2 text-[14px] leading-[1.5] text-[#334155]">
              <Check size={16} strokeWidth={2.6} className="mt-[2px] shrink-0 text-[#16a34a]" />
              {l}
            </li>
          ))}
        </ul>
        <div className="flex flex-col gap-2 sm:flex-row">
          <a href={contact} onClick={() => t?.cta("get_this", "Get this for your store (offer)")} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-[#2563eb] px-4 text-[14px] font-semibold text-white hover:bg-[#1d4ed8]">
            Get this for your store<ArrowRight size={15} />
          </a>
          <a href={PRICING} onClick={() => t?.cta("pricing", "Pricing (offer)")} className="inline-flex h-10 items-center justify-center rounded-lg border border-[#d9dde3] bg-white px-4 text-[14px] font-semibold text-[#334155] hover:bg-[#f8fafc]">
            See pricing
          </a>
        </div>
      </div>
      <div className="flex flex-col gap-2 self-start rounded-xl bg-[#f8fafc] p-4 ring-1 ring-[#e3e6eb]">
        <p className="flex items-baseline gap-1.5">
          <span className="text-[30px] font-bold leading-none tracking-[-0.02em]">{usd(OFFER.perConnection)}</span>
          <span className="text-[13px] text-[#64748b]">per connection, one-time</span>
        </p>
        <dl className="mt-1 flex flex-col divide-y divide-[#e3e6eb] text-[13.5px]">
          {OFFER_EXAMPLES.map((x) => (
            <div key={x.n} className="flex items-center justify-between gap-3 py-2">
              <dt className="text-[#475569]">{x.n} connections</dt>
              <dd className="flex items-center gap-2 font-semibold">
                {x.free && <span className="rounded-full bg-[#dcfce7] px-2 py-0.5 text-[11px] font-semibold text-[#15803d]">1 free</span>}
                {x.price}
              </dd>
            </div>
          ))}
        </dl>
        <p className="text-[12px] leading-[1.5] text-[#64748b]">A connection is one platform or account: a marketplace account, a web store, a warehouse system.</p>
      </div>
    </section>
  );
}

/** The sidebar card's price lines. */
export function OfferLines() {
  return (
    <p className="mt-2 text-[12.5px] leading-[1.5] text-[#64748b]">
      <b className="font-semibold text-[#0f172a]">{OFFER_LINES.price}.</b> {OFFER_LINES.free}, {OFFER_LINES.setup.toLowerCase()}.
    </p>
  );
}

/** The "view only" dialog: what connecting this platform (or the whole sync) costs. */
export function OfferNote({ name }: { name?: string }) {
  return (
    <p className="mt-4 rounded-lg bg-[#f0fdf4] px-3 py-2.5 text-[13px] leading-[1.5] text-[#166534] ring-1 ring-[#bbf7d0]">
      {name ? `Connecting ${name} for your store: ${usd(OFFER.perConnection)}, one-time.` : `${OFFER_LINES.price}.`} {OFFER_LINES.free}, {OFFER_LINES.setup.toLowerCase()}.
    </p>
  );
}

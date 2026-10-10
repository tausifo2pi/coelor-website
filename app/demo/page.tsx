import type { Metadata } from "next";
import Logo from "@/components/Logo";
import { Icon } from "@/components/icons";
import { OFFER, OFFER_LINES, usd, withPlan } from "@/lib/offer";

// The short page an email can link to (coelor.com/r/<token>?to=/demo): what the live demo shows and the link to it.
// Static and small (no data, no client code of its own); the site Tracker logs the visit, the sections seen and the
// click on the live link, tied to the lead by the email cookie. Email readers only: never linked from the site, not
// indexed (robots.ts disallows /demo). The offer (lib/offer.ts) sits under the list, with a link to the public /pricing.

export const metadata: Metadata = {
  title: "Live demo · Coelor",
  description: "One reseller's custom build at work: orders, stock, listings and automations, live and read-only. Yours is built for your own setup.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/demo" },
};

const LIVE = "/demo/multi-platform-sync?src=live";

const SEES = [
  { icon: "activity", text: "Orders coming in from every channel, and what the build did with the stock" },
  { icon: "warehouse", text: "One stock count behind every marketplace, web store and account" },
  { icon: "refresh", text: "The rules made for this reseller, running on their own, with their last run" },
];

export default function DemoIntro() {
  return (
    <main id="main" className="relative flex min-h-screen flex-col overflow-hidden">
      <div className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-accent/10 blur-3xl" aria-hidden />
      <header className="relative mx-auto flex w-full max-w-[720px] items-center px-5 pt-8 md:pt-12">
        <a href="/" aria-label="Coelor home" className="py-2">
          <Logo height={26} priority />
        </a>
      </header>

      <section id="intro" className="relative mx-auto flex w-full max-w-[720px] flex-1 flex-col justify-center gap-8 px-5 py-14">
        <div className="flex flex-col gap-5">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.08em] text-accent">
            <span className="pulse h-2 w-2 rounded-full bg-accent" aria-hidden />
            Live demo
          </span>
          <h1 className="display text-balance text-[34px] leading-[1.1] text-ink sm:text-[44px]">One reseller&apos;s custom build, running right now.</h1>
          <p className="max-w-[560px] text-[16px] leading-[1.6] text-ink-muted md:text-[18px]">
            Look inside a build we made and run for one sneaker reseller, around their own marketplaces, warehouse and rules. It is
            heavily customised for them, so it won&apos;t match your setup. Yours is built for exactly what you need. Read-only:
            nothing you click changes anything.
          </p>
        </div>

        <ul className="flex flex-col gap-2.5">
          {SEES.map((s) => (
            <li key={s.text} className="flex items-start gap-3 text-[15px] leading-[1.5] text-ink">
              <span className="facet-tile mt-0.5 h-8 w-8 shrink-0 rounded-[8px]" aria-hidden>
                <Icon name={s.icon} size={15} />
              </span>
              <span className="pt-1">{s.text}</span>
            </li>
          ))}
        </ul>

        <div id="offer" className="panel overflow-hidden">
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-end sm:justify-between sm:p-6">
            <div className="flex flex-col gap-1.5">
              <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-soft">Your own build</span>
              <p className="flex flex-wrap items-baseline gap-x-2">
                <span className="display text-[34px] leading-none text-ink">{usd(OFFER.perConnection)}</span>
                <span className="text-[15px] text-ink-muted">per connection, one-time</span>
              </p>
              <p className="text-[14px] leading-[1.5] text-ink-muted">
                {OFFER_LINES.free} · {OFFER_LINES.setup} · Pay once, after it runs
              </p>
            </div>
            <a href="/pricing" className="inline-flex w-fit shrink-0 items-center gap-1.5 text-[14px] font-semibold text-accent hover:underline">
              Full pricing
              <Icon name="arrow-right" size={14} strokeWidth={2.4} />
            </a>
          </div>
          <div className="flex flex-col gap-3 border-t border-dashed border-ok/30 bg-ok/[0.05] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="inline-flex items-center gap-2 text-[14px] text-ink">
              <span className="pulse h-2 w-2 shrink-0 rounded-full bg-ok" aria-hidden />
              {OFFER_LINES.trial}, no card.
            </p>
            <a href={withPlan("/pricing", "trial") + "#contact"} className="inline-flex w-fit shrink-0 items-center gap-1.5 text-[14px] font-semibold text-[#8fe7c2] hover:underline">
              Start free trial
              <Icon name="arrow-right" size={14} strokeWidth={2.4} />
            </a>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <a href={LIVE} className="btn-primary w-fit">
            Open the live demo
            <Icon name="arrow-right" size={15} strokeWidth={2.4} />
          </a>
          <a href="mailto:contact@coelor.com?subject=Live%20demo" className="btn-ghost w-fit">
            Ask a question
          </a>
        </div>
        <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-soft">Customer names and order numbers are hidden</p>
      </section>
    </main>
  );
}

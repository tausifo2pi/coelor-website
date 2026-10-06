import { Icon } from "@/components/icons";
import { PREFILL } from "@/lib/offer";
import { pricing } from "./content";
import QuoteBuilder from "./QuoteBuilder";

// The offer in one sentence, the two ways in (free trial, call) and, at the right, the live quote with every line of
// the price. No link to the live demo or the case studies: those are for email readers only.

export default function PricingHero() {
  const { hero, quote } = pricing;
  return (
    <section id="top" aria-labelledby="pricing-title" className="relative overflow-clip">
      {/* overflow-clip, not -hidden: a hidden overflow is still a scroll box, and focusing the quote's buttons scrolled the
          glow into view sideways */}
      <div className="grid-fade pointer-events-none absolute inset-0" aria-hidden />
      <div className="pointer-events-none absolute -right-40 -top-40 h-[560px] w-[560px] rounded-full bg-accent/10 blur-3xl" aria-hidden />
      <div className="relative mx-auto grid max-w-site grid-cols-1 gap-12 px-5 pb-16 pt-12 md:px-10 md:pt-20 lg:px-20 xl:grid-cols-[minmax(0,1fr)_460px] xl:items-center xl:gap-16 lg:pb-24 lg:pt-24">
        <div className="flex flex-col">
          <span className="rise-in inline-flex w-fit items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.08em] text-accent">
            {hero.eyebrow}
          </span>
          <h1 id="pricing-title" className="display rise-in mt-6 text-balance text-[40px] leading-[1.04] text-ink [--d:80ms] sm:text-[52px] lg:text-[54px]">
            {/* one sentence per line: "$500 per connection." / "Nothing hidden." */}
            {hero.headline.split(/(?<=\.)\s+/).map((line, i) => (
              <span key={line} className={`block ${i ? "text-accent" : ""}`}>
                {line}
              </span>
            ))}
          </h1>
          <p className="rise-in mt-6 max-w-[540px] text-pretty text-[16px] leading-[1.65] text-ink-muted [--d:160ms] md:text-[18px]">{hero.sub}</p>
          <div className="rise-in mt-9 flex flex-col gap-3 [--d:240ms] sm:flex-row sm:items-center sm:gap-4">
            <a href="#contact" data-prefill={PREFILL.trial} className="btn-primary">
              {hero.trialCta}
              <Icon name="arrow-right" size={15} strokeWidth={2.4} />
            </a>
            <a href="#contact" className="btn-ghost">
              {hero.callCta}
            </a>
          </div>
          <ul className="rise-in mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 [--d:320ms]" aria-label="The terms">
            {hero.fine.map((p) => (
              <li key={p} className="inline-flex items-center gap-2 text-[14px] text-ink-muted">
                <Icon name="check" size={14} strokeWidth={2.4} className="text-ok" />
                {p}
              </li>
            ))}
          </ul>
        </div>
        <div className="rise-in mx-auto w-full max-w-[520px] [--d:200ms] xl:max-w-none">
          <QuoteBuilder copy={quote} />
        </div>
      </div>
    </section>
  );
}

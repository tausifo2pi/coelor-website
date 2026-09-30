import SectionHead from "@/components/SectionHead";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import Logo from "@/components/Logo";
import { Icon } from "@/components/icons";
import { PlatformTile } from "@/components/PlatformLogo";
import type { CaseContent } from "@/lib/case-adapt";

// The outreach case study, rendered from its content: told for one reader's own setup, or the real client's story
// (lib/case-adapt.ts). Used by /case-studies/stock-sync, /case-studies/sneakers and the panel preview /p/<token>.
// Each platform's logo appears once, in the hero's setup card; the rest of the page is words. No motion but the
// "Sync running" dot on the real client's setup. Sneaker readers (and the real story) also get a link to the live demo of
// that sync (/demo/multi-platform-sync): in the setup card and after "What we built". It is a plain link (a full page
// load), so the site Tracker logs it as a click.

const DEMO = "/demo/multi-platform-sync?src=case";
const showsDemo = (c: CaseContent) => !c.adapted || c.words.item === "pair";

function DemoLink() {
  return (
    <a
      href={DEMO}
      className="group flex items-center justify-between gap-3 rounded-[12px] border border-accent/30 bg-accent/[0.07] p-4 transition-colors hover:bg-accent/[0.12]"
    >
      <span className="flex flex-col gap-1">
        <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.08em] text-accent">
          <span className="pulse h-2 w-2 rounded-full bg-accent" aria-hidden />
          Live demo
        </span>
        <span className="text-[14px] font-semibold leading-[1.4] text-ink">See the sync running, with real orders</span>
      </span>
      <Icon name="arrow-right" size={16} strokeWidth={2.4} className="shrink-0 text-accent transition-transform group-hover:translate-x-0.5" />
    </a>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-[60] border-b border-rule bg-[rgba(10,12,16,0.82)] backdrop-blur-[14px]">
      <div className="mx-auto flex h-[68px] max-w-site items-center justify-between px-5 md:h-[76px] md:px-10 lg:px-20">
        <a href="/" aria-label="Coelor home" className="flex items-center py-2">
          <Logo height={26} priority className="md:hidden" />
          <Logo height={32} priority className="hidden md:block" />
        </a>
        <a
          href="#contact"
          className="inline-flex h-10 items-center gap-2 rounded-full border border-rule-strong bg-white/10 px-[18px] text-[15px] font-medium text-ink transition-colors hover:bg-white/15"
        >
          Book a call
          <Icon name="arrow-right" size={14} strokeWidth={2.4} />
        </a>
      </div>
    </header>
  );
}

/* ---------- hero: the reader's setup, where it slips, what the sync does ---------- */

function SetupCard({ c }: { c: CaseContent }) {
  const { hero } = c;
  return (
    <div className="glass-card flex flex-col gap-5 p-5 sm:p-6" aria-label={hero.setupTitle}>
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-soft">{hero.setupTitle}</span>
        {hero.status && (
          <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.08em] text-ok">
            <span className="pulse h-2 w-2 rounded-full bg-ok" aria-hidden />
            {hero.status}
          </span>
        )}
      </div>
      <ul className="flex flex-col gap-2">
        {hero.setup.map((p, i) => (
          <li key={`${p.slug}-${i}`} className="flex items-center gap-3 rounded-[12px] border border-rule bg-white/[0.03] p-2 pr-3">
            <PlatformTile slug={p.slug} name={p.name} size={34} />
            <span className="min-w-0 flex-1 text-[14px] font-medium text-ink">{p.name}</span>
            {p.role && <span className="text-right text-[12px] text-ink-soft">{p.role}</span>}
          </li>
        ))}
      </ul>
      <div className="flex flex-col gap-1.5 rounded-[12px] border border-warn/25 bg-warn/[0.06] p-4">
        <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.08em] text-warn">
          <Icon name="alert" size={13} />
          {hero.gapTitle}
        </span>
        <p className="text-[14px] leading-[1.55] text-ink">{hero.gap}</p>
      </div>
      <div className="flex flex-col gap-1.5 rounded-[12px] border border-ok/25 bg-ok/[0.06] p-4">
        <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.08em] text-[#8fe7c2]">
          <Icon name="check" size={13} strokeWidth={2.4} />
          {hero.fixTitle}
        </span>
        <p className="text-[14px] leading-[1.55] text-ink">{hero.fix}</p>
      </div>
      {showsDemo(c) && <DemoLink />}
    </div>
  );
}

function Hero({ c }: { c: CaseContent }) {
  const { hero } = c;
  return (
    <section id="top" aria-labelledby="case-title" className="relative overflow-hidden">
      <div className="pointer-events-none absolute -right-40 -top-40 h-[560px] w-[560px] rounded-full bg-accent/10 blur-3xl" aria-hidden />
      <div className="relative mx-auto grid max-w-site grid-cols-1 gap-12 px-5 pb-14 pt-12 md:px-10 md:pt-20 lg:grid-cols-[minmax(0,600px)_1fr] lg:items-center lg:gap-14 lg:px-20 lg:pb-20 lg:pt-24">
        <div className="flex flex-col">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.08em] text-accent">
            {hero.eyebrow}
          </span>
          <h1 id="case-title" className="display mt-5 text-[36px] leading-[1.08] text-ink sm:text-[46px] lg:text-[54px]">
            {hero.headline}
          </h1>
          <p className="mt-5 max-w-[520px] text-[16px] leading-[1.6] text-ink-muted md:text-[18px]">{hero.sub}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <a href={hero.primaryCta.href} className="btn-primary">
              {hero.primaryCta.label}
              <Icon name="arrow-right" size={15} strokeWidth={2.4} />
            </a>
            <a href={hero.secondaryCta.href} className="btn-ghost">
              {hero.secondaryCta.label}
            </a>
          </div>
        </div>
        <SetupCard c={c} />
      </div>
    </section>
  );
}

/* ---------- "Is this you?": the hand work, as a checklist the reader recognises ---------- */

function Hook({ c }: { c: CaseContent }) {
  const { hook } = c;
  return (
    <section id="hook" aria-labelledby="hook-title" className="scroll-mt-20 border-t border-rule bg-canvas2">
      <div className="mx-auto grid max-w-site grid-cols-1 gap-10 px-5 py-16 md:px-10 lg:grid-cols-[minmax(0,420px)_1fr] lg:gap-20 lg:px-20 lg:py-[104px]">
        <div className="flex flex-col gap-8 lg:sticky lg:top-28 lg:self-start">
          <SectionHead id="hook-title" num={hook.num} eyebrow={hook.eyebrow} headline={hook.headline} body={hook.body} size="md" />
          <div className="flex flex-col gap-4 border-t border-rule pt-6">
            <p className="text-[16px] font-semibold leading-[1.45] text-ink">{hook.footer}</p>
            <a href="#contact" className="btn-primary w-fit">
              Book a call
              <Icon name="arrow-right" size={15} strokeWidth={2.4} />
            </a>
          </div>
        </div>
        <ol className="self-start overflow-hidden rounded-[16px] border border-rule bg-panel">
          {hook.items.map((it, i) => (
            <li
              key={it.key}
              className={`relative grid grid-cols-[28px_1fr] gap-x-4 gap-y-3 border-rule px-5 py-6 sm:grid-cols-[32px_1fr_auto] sm:px-7 ${i ? "border-t" : "bg-warn/[0.045]"}`}
            >
              {i === 0 && <span className="absolute inset-y-0 left-0 w-[3px] bg-warn/80" aria-hidden />}
              <span className={`pt-[3px] font-mono text-[12px] tabular-nums ${i ? "text-ink-soft" : "text-warn"}`}>{String(i + 1).padStart(2, "0")}</span>
              <div className="flex flex-col gap-1.5">
                {i === 0 && <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-warn">{hook.lead}</span>}
                <h3 className="text-[17px] font-semibold leading-[1.3] text-ink">{it.title}</h3>
                <p className="max-w-[560px] text-[14px] leading-[1.6] text-ink-muted md:text-[15px]">{it.body}</p>
              </div>
              <span className="col-start-2 w-fit self-start whitespace-nowrap rounded-full border border-rule-strong px-2.5 py-1 font-mono text-[11px] text-ink-muted sm:col-start-3 sm:mt-0.5">
                {it.every}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ---------- the real client's results ---------- */

function Results({ c }: { c: CaseContent }) {
  return (
    <section id="results" aria-label="Results" className="border-y border-rule">
      <div className="mx-auto flex max-w-site flex-col gap-1.5 px-5 pt-10 md:px-10 lg:px-20">
        <p className="text-[15px] leading-[1.6] text-ink md:text-[16px]">{c.proof.text}</p>
        {c.proof.origin && <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-soft">{c.proof.origin}</p>}
      </div>
      <ul className="mx-auto grid max-w-site grid-cols-2 gap-px px-5 md:px-10 lg:grid-cols-4 lg:px-20">
        {c.stats.map((s) => (
          <li key={s.label} className="flex flex-col gap-1.5 py-8 md:py-10 lg:pr-6">
            <span className="display text-[32px] text-ink md:text-[40px]">{s.value}</span>
            <span className="max-w-[200px] text-[13px] leading-[1.45] text-ink-muted md:text-[14px]">{s.label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Setup({ c }: { c: CaseContent }) {
  const { setup } = c;
  return (
    <section id="setup" aria-labelledby="setup-title" className="scroll-mt-20">
      <div className="mx-auto flex max-w-site flex-col gap-10 px-5 py-16 md:px-10 lg:gap-14 lg:px-20 lg:py-[96px]">
        <SectionHead id="setup-title" num={setup.num} eyebrow={setup.eyebrow} headline={setup.headline} body={setup.body} className="max-w-[680px]" />

        <ol className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-4">
          {setup.steps.map((s, i) => (
            <li key={s.title} className="panel relative flex flex-col gap-3 overflow-hidden p-6">
              <span className="pointer-events-none absolute -right-2 -top-4 select-none font-mono text-[72px] font-medium leading-none text-white/[0.04]" aria-hidden>
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-accent/10 text-accent">
                <Icon name={s.icon} size={16} />
              </span>
              <span className="text-[17px] font-semibold text-ink">{s.title}</span>
              <span className="text-[14px] leading-[1.6] text-ink-muted">{s.body}</span>
            </li>
          ))}
        </ol>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
          <div className="flex flex-col gap-3 rounded-[14px] border border-rule bg-white/[0.02] p-6">
            <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-soft">{setup.beforeLabel}</span>
            <ul className="flex flex-col gap-2.5">
              {setup.before.map((b) => (
                <li key={b} className="flex gap-2.5 text-[14px] leading-[1.5] text-ink-muted">
                  <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-ink-soft" />
                  {b}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-3 rounded-[14px] border border-ok/25 bg-ok/[0.06] p-6">
            <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#8fe7c2]">{setup.afterLabel}</span>
            <ul className="flex flex-col gap-2.5">
              {setup.after.map((a) => (
                <li key={a} className="flex gap-2.5 text-[14px] leading-[1.5] text-ink">
                  <Icon name="check" size={15} strokeWidth={2.4} className="mt-[3px] shrink-0 text-ok" />
                  {a}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {showsDemo(c) && (
          <div className="flex flex-col gap-4 rounded-[14px] border border-rule bg-white/[0.02] p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-[17px] font-semibold text-ink">Look inside the running sync</span>
              <span className="text-[14px] leading-[1.6] text-ink-muted">The live orders, stock and automations, read-only. Names and order numbers are hidden.</span>
            </div>
            <a href={DEMO} className="btn-ghost w-fit shrink-0">
              Open the live demo
              <Icon name="arrow-right" size={15} strokeWidth={2.4} />
            </a>
          </div>
        )}
      </div>
    </section>
  );
}

function Offer({ c }: { c: CaseContent }) {
  const { offer } = c;
  return (
    <section id="start" aria-labelledby="start-title" className="scroll-mt-20 bg-canvas2">
      <div className="mx-auto flex max-w-site flex-col gap-10 px-5 py-16 md:px-10 lg:px-20 lg:py-[88px]">
        <SectionHead id="start-title" num={offer.num} eyebrow={offer.eyebrow} headline={offer.headline} size="md" className="max-w-[640px]" />
        <ol className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
          {offer.items.map((it, i) => (
            <li key={it.title} className="panel flex flex-col gap-2 p-6">
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-rule-strong font-mono text-[12px] text-ink">{i + 1}</span>
              <span className="mt-2 text-[17px] font-semibold text-ink">{it.title}</span>
              <span className="text-[14px] leading-[1.6] text-ink-muted">{it.body}</span>
            </li>
          ))}
        </ol>
        <a href="#contact" className="btn-primary w-fit">
          Book a call
          <Icon name="arrow-right" size={15} strokeWidth={2.4} />
        </a>
      </div>
    </section>
  );
}

function Faq({ c }: { c: CaseContent }) {
  const { faq } = c;
  return (
    <section id="faq" aria-labelledby="faq-title" className="scroll-mt-20">
      <div className="mx-auto grid max-w-site grid-cols-1 gap-10 px-5 py-16 md:px-10 lg:grid-cols-[360px_1fr] lg:gap-24 lg:px-20 lg:py-[96px]">
        <SectionHead id="faq-title" num={faq.num} eyebrow={faq.eyebrow} headline={faq.headline} size="md" className="lg:sticky lg:top-28 lg:self-start" />
        <ul className="flex flex-col border-b border-rule">
          {faq.items.map((f) => (
            <li key={f.q}>
              <details className="group border-t border-rule">
                <summary className="flex items-start justify-between gap-6 py-5 text-[16px] font-semibold text-ink transition-colors hover:text-white">
                  <span>{f.q}</span>
                  <Icon name="plus" size={18} strokeWidth={2} className="faq-chevron mt-0.5 shrink-0 text-ink-soft transition-transform duration-300" />
                </summary>
                <p className="max-w-[640px] pb-5 text-[14px] leading-[1.65] text-ink-muted md:text-[15px]">{f.a}</p>
              </details>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default function CaseStudy({ c }: { c: CaseContent }) {
  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <Header />
      <main id="main">
        <Hero c={c} />
        <Hook c={c} />
        <Results c={c} />
        <Setup c={c} />
        <Offer c={c} />
        <Faq c={c} />
        <Contact num={c.contact.num} headline={c.contact.headline} body={c.contact.body} />
      </main>
      <Footer base="/" />
    </>
  );
}

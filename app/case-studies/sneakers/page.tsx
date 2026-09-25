import type { Metadata } from "next";
import cs from "@/data/case-sneakers.json";
import SectionHead from "@/components/SectionHead";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import Logo from "@/components/Logo";
import { BrandLogo, Icon } from "@/components/icons";

// Unlisted landing page for sneaker-seller outreach: not linked from the homepage, not indexed.
export const metadata: Metadata = {
  title: cs.seo.title,
  description: cs.seo.description,
  robots: { index: false, follow: false },
  alternates: { canonical: "/case-studies/sneakers" },
};

function Chip({ slug, name }: { slug: string; name: string }) {
  return (
    <li className="flex items-center gap-2 rounded-[8px] border border-rule bg-white/[0.03] px-2.5 py-1.5 text-[12px] font-medium text-ink/80">
      <BrandLogo slug={slug} name={name} size={14} />
      {name}
    </li>
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

function Hero() {
  const { hero } = cs;
  return (
    <section id="top" aria-labelledby="case-title" className="relative overflow-hidden">
      <div className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-accent/10 blur-3xl" aria-hidden />
      <div className="relative mx-auto grid max-w-site grid-cols-1 gap-12 px-5 pb-14 pt-14 md:px-10 md:pt-20 lg:grid-cols-[minmax(0,620px)_1fr] lg:items-center lg:gap-16 lg:px-20 lg:pb-20 lg:pt-24">
        <div className="flex flex-col">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.08em] text-accent">
            {hero.eyebrow}
          </span>
          <h1 id="case-title" className="display mt-5 text-[38px] text-ink sm:text-[48px] lg:text-[56px]">
            {hero.headline}
          </h1>
          <p className="mt-5 max-w-[500px] text-[16px] leading-[1.55] text-ink-muted md:text-[18px]">{hero.sub}</p>
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

        <div className="panel flex flex-col gap-4 p-5 md:p-6" aria-label="Sync status">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-soft">{hero.panel.title}</span>
            <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.08em] text-ok">
              <span className="pulse h-2 w-2 rounded-full bg-ok" aria-hidden />
              Running
            </span>
          </div>
          <ul className="flex flex-col divide-y divide-rule rounded-[12px] border border-rule bg-canvas">
            {hero.panel.rows.map((r) => (
              <li key={r.label} className="flex items-center gap-3 px-4 py-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-accent/10 text-accent">
                  <Icon name={r.icon} size={15} />
                </span>
                <span className="flex-1 text-[14px] font-medium text-ink">{r.label}</span>
                <span className="font-mono text-[12px] text-ink-muted">{r.meta}</span>
                <span className="rounded-md bg-ok/10 px-2 py-0.5 font-mono text-[11px] text-ok">{r.state}</span>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center gap-2 border-t border-rule pt-4">
            <ul className="flex flex-wrap gap-2">
              {cs.setup.flowFrom.map((f) => (
                <Chip key={f.name} {...f} />
              ))}
            </ul>
            <Icon name="arrow-right" size={14} className="text-ink-soft" />
            <ul className="flex flex-wrap gap-2">
              {cs.setup.flowTo.slice(0, 1).map((f) => (
                <Chip key={f.name} {...f} />
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stats() {
  return (
    <section id="results" aria-label="Results" className="border-y border-rule bg-canvas2">
      <ul className="mx-auto grid max-w-site grid-cols-2 gap-px px-5 md:px-10 lg:grid-cols-4 lg:px-20">
        {cs.stats.map((s) => (
          <li key={s.label} className="flex flex-col gap-1.5 py-8 md:py-10 lg:pr-6">
            <span className="display text-[32px] text-ink md:text-[40px]">{s.value}</span>
            <span className="max-w-[200px] text-[13px] leading-[1.45] text-ink-muted md:text-[14px]">{s.label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Problem() {
  const { problem } = cs;
  return (
    <section id="problem" aria-labelledby="problem-title" className="scroll-mt-20">
      <div className="mx-auto grid max-w-site grid-cols-1 gap-10 px-5 py-16 md:px-10 lg:grid-cols-[420px_1fr] lg:gap-24 lg:px-20 lg:py-[96px]">
        <SectionHead id="problem-title" num={problem.num} eyebrow={problem.eyebrow} headline={problem.headline} body={problem.body} className="lg:sticky lg:top-28 lg:self-start" />
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
          {problem.items.map((it) => (
            <li key={it.title} className="panel flex flex-col gap-4 p-6">
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-rule bg-white/[0.04] text-ink-muted">
                  <Icon name={it.icon} size={18} />
                </span>
                <span className="rounded-md bg-white/[0.05] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.06em] text-ink-soft">{it.tag}</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-[17px] font-semibold text-ink">{it.title}</span>
                <span className="text-[14px] leading-[1.55] text-ink-muted">{it.body}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Setup() {
  const { setup } = cs;
  return (
    <section id="setup" aria-labelledby="setup-title" className="scroll-mt-20 bg-canvas2">
      <div className="mx-auto flex max-w-site flex-col gap-10 px-5 py-16 md:px-10 lg:gap-14 lg:px-20 lg:py-[96px]">
        <SectionHead id="setup-title" num={setup.num} eyebrow={setup.eyebrow} headline={setup.headline} body={setup.body} className="max-w-[680px]" />

        {/* flow */}
        <div className="panel flex flex-col gap-4 p-5 md:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-2">
            <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-soft">Sales channels</span>
            <ul className="flex flex-wrap gap-2">
              {setup.flowFrom.map((f) => (
                <Chip key={f.name} {...f} />
              ))}
            </ul>
          </div>
          <Icon name="arrow-right" size={16} className="hidden text-ink-soft lg:block" />
          <span className="inline-flex w-fit items-center gap-2 rounded-[10px] border border-accent/30 bg-accent/10 px-3 py-2">
            <Logo height={14} />
          </span>
          <Icon name="arrow-right" size={16} className="hidden text-ink-soft lg:block" />
          <div className="flex flex-col gap-2">
            <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-soft">Warehouse and reporting</span>
            <ul className="flex flex-wrap gap-2">
              {setup.flowTo.map((f) => (
                <Chip key={f.name} {...f} />
              ))}
            </ul>
          </div>
        </div>

        {/* steps */}
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

        {/* before / after */}
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
      </div>
    </section>
  );
}

function Fit() {
  const { fit } = cs;
  return (
    <section id="fit" aria-labelledby="fit-title" className="scroll-mt-20">
      <div className="mx-auto grid max-w-site grid-cols-1 gap-10 px-5 py-16 md:px-10 lg:grid-cols-[1fr_380px] lg:gap-24 lg:px-20 lg:py-[96px]">
        <div className="flex flex-col gap-8">
          <SectionHead id="fit-title" num={fit.num} eyebrow={fit.eyebrow} headline={fit.headline} className="max-w-[640px]" />
          <ul className="flex flex-col gap-3">
            {fit.items.map((it) => (
              <li key={it} className="flex items-start gap-3 text-[15px] leading-[1.55] text-ink md:text-[16px]">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-accent/30 bg-accent/10 text-accent">
                  <Icon name="check" size={13} strokeWidth={2.6} />
                </span>
                {it}
              </li>
            ))}
          </ul>
        </div>
        <aside className="panel flex flex-col gap-5 self-start p-6 md:p-7">
          <span className="text-[17px] font-semibold text-ink">{fit.offer.title}</span>
          <ol className="flex flex-col gap-3">
            {fit.offer.items.map((it, i) => (
              <li key={it} className="flex items-start gap-3 text-[14px] text-ink-muted">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-rule-strong font-mono text-[11px] text-ink">{i + 1}</span>
                <span className="pt-0.5">{it}</span>
              </li>
            ))}
          </ol>
          <a href="#contact" className="btn-primary mt-1">
            Book a call
            <Icon name="arrow-right" size={15} strokeWidth={2.4} />
          </a>
        </aside>
      </div>
    </section>
  );
}

function Faq() {
  const { faq } = cs;
  return (
    <section id="faq" aria-labelledby="faq-title" className="scroll-mt-20 bg-canvas2">
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

export default function SneakersCaseStudy() {
  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <Header />
      <main id="main">
        <Hero />
        <Stats />
        <Problem />
        <Setup />
        <Fit />
        <Faq />
        <Contact num={cs.contact.num} headline={cs.contact.headline} body={cs.contact.body} />
      </main>
      <Footer base="/" />
    </>
  );
}

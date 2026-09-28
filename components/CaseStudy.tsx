import type { ReactNode } from "react";
import SectionHead from "@/components/SectionHead";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import Logo from "@/components/Logo";
import { Icon } from "@/components/icons";
import { PlatformTile } from "@/components/PlatformLogo";
import type { CaseContent, HookItem, Role } from "@/lib/case-adapt";

// The outreach case study, rendered from its content: told for one reader's own setup, or the real client's story
// (lib/case-adapt.ts). Used by /case-studies/stock-sync, /case-studies/sneakers and the panel preview /p/<token>.
// Each platform's logo appears once, in the hero's setup card; everything else uses names and neutral icons. No motion
// but the "Sync running" dot.

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

const joinNames = (xs: string[]) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);

function SetupCard({ c }: { c: CaseContent }) {
  const { hero } = c;
  return (
    <div className="glass-card flex flex-col gap-5 p-5 sm:p-6" aria-label={hero.setupTitle}>
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-soft">{hero.setupTitle}</span>
        <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.08em] text-ok">
          <span className="pulse h-2 w-2 rounded-full bg-ok" aria-hidden />
          Sync running
        </span>
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
            {hero.lead} {joinNames(hero.places.map((p) => p.name))}
            {hero.tail}.
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

/* ---------- "Is this you?": each card draws the hand work with neutral icons ---------- */

const T = 36; // node size in the card drawings
const ROLE_ICON: Record<Role, string> = { web: "globe", market: "bag", counter: "store", system: "warehouse", sheet: "file-spreadsheet", warehouse: "warehouse" };

function Node({ role, badge, dim = false }: { role: Role | null; badge?: ReactNode; dim?: boolean }) {
  return (
    <span className={`relative inline-flex ${dim ? "opacity-45" : ""}`}>
      <span
        className={`inline-flex items-center justify-center rounded-[10px] border ${role ? "border-rule-strong bg-white/[0.05] text-ink" : "border-dashed border-rule-strong text-ink-soft"}`}
        style={{ width: T, height: T }}
      >
        <Icon name={role ? ROLE_ICON[role] : "plus"} size={16} />
      </span>
      {badge && <span className="viz-badge">{badge}</span>}
    </span>
  );
}

function Glyph({ name, tone = "muted" }: { name: string; tone?: "muted" | "warn" | "accent" }) {
  const c = tone === "warn" ? "border-warn/40 bg-warn/10 text-warn" : tone === "accent" ? "border-accent/35 bg-accent/10 text-accent" : "border-rule-strong bg-white/[0.05] text-ink-muted";
  return (
    <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${c}`} aria-hidden>
      <Icon name={name} size={15} />
    </span>
  );
}

const Arrow = () => <Icon name="arrow-right" size={14} className="shrink-0 text-ink-soft" />;
const Pill = ({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "warn" }) => (
  <span className={`rounded-md px-1.5 py-0.5 font-mono text-[10px] ${tone === "warn" ? "bg-warn/10 text-warn" : "bg-white/[0.06] text-ink-muted"}`}>{children}</span>
);
const Col = ({ children }: { children: ReactNode }) => <span className="flex flex-col items-center gap-1.5">{children}</span>;

// how the same variant gets spelled differently, in the reader's vocabulary
function spellings(c: CaseContent) {
  const { item, variant } = c.words;
  if (variant === "size") return item === "pair" ? ["9W", "9M", "38,5", "(GS)"] : ["M", "Medium", "M/38", "m"];
  if (variant === "condition") return ["NM", "Near Mint", "NM-M", "nm"];
  return ["Black/L", "L-BLK", "black_l", "L · Black"];
}

function Viz({ it, c }: { it: HookItem; c: CaseContent }) {
  const { a, b } = c.cast;
  const stock = c.cast.stock ?? "warehouse";
  const pen = <Icon name="pencil" size={9} />;
  switch (it.viz) {
    case "store":
      return (<><Col><Node role="counter" /><Pill>sold</Pill></Col><Glyph name="alert" tone="warn" /><Col><Node role={a} /><Pill tone="warn">still for sale</Pill></Col></>);
    case "unique":
      return (<><Col><Node role={b} /><Pill>sold</Pill></Col><Glyph name="alert" tone="warn" /><Col><Node role={a} /><Pill tone="warn">still for sale</Pill></Col></>);
    case "buyin":
      return (<><Glyph name="package-plus" tone="accent" /><Arrow /><Glyph name="keyboard" /><Arrow /><Node role={a} badge="+1" />{b && b !== "counter" && <Node role={b} badge="+1" />}</>);
    case "multistore":
      return (<><Node role="counter" badge="12" /><Node role="counter" badge="9" /><Glyph name="alert" tone="warn" /><Node role={a} badge="?" /></>);
    case "copy":
      return (<><Node role={a} /><Arrow /><Glyph name="copy" /><Arrow /><Node role={b} badge="2×" /></>);
    case "twice":
      return (<><Col><Node role={a} /><Pill>1 left</Pill></Col><Glyph name="alert" tone="warn" /><Col><Node role={b} /><Pill tone="warn">sold again</Pill></Col></>);
    case "sale":
      return (<><Col><Node role={b} /><Pill>sold</Pill></Col><Arrow /><Glyph name="keyboard" /><Arrow /><Node role={a} badge="−1" />{c.cast.stock && <Node role={stock} badge="−1" />}</>);
    case "edit":
      return (<><Node role={a} badge={pen} />{b && <Node role={b} badge={pen} />}{c.cast.stock && <Node role={stock} badge={pen} />}</>);
    case "type":
      return (<><Col><Node role={a} /><Pill>order</Pill></Col><Arrow /><Glyph name="keyboard" /><Arrow /><Node role="system" /></>);
    case "sheet":
      return (<><Glyph name="file-spreadsheet" tone="accent" /><Arrow /><Node role={a} dim />{b && <Node role={b} dim />}</>);
    case "pause":
      return (<><Col><Node role={a} /><Pill>sold</Pill></Col><Arrow /><Node role={b} badge={<Icon name="pause" size={9} />} /><Node role={null} badge={<Icon name="pause" size={9} />} /></>);
    case "variants":
      return (
        <span className="flex flex-wrap items-center justify-center gap-1.5">
          {spellings(c).map((s) => (
            <span key={s} className="rounded-md border border-rule-strong bg-white/[0.04] px-2 py-1 font-mono text-[11px] text-ink">{s}</span>
          ))}
        </span>
      );
    case "restock":
      return (<><Glyph name="package-plus" tone="accent" /><Arrow /><Node role={a} badge="+" />{b && <Node role={b} badge="+" />}{c.cast.stock && <Node role={stock} badge="+" />}</>);
    case "returns":
      return (<><Glyph name="undo" /><Arrow /><Node role={a} badge="+1" />{b && <Node role={b} badge="+1" />}</>);
    default:
      return null;
  }
}

function Hook({ c }: { c: CaseContent }) {
  const { hook } = c;
  return (
    <section id="hook" aria-labelledby="hook-title" className="scroll-mt-20 border-t border-rule bg-canvas2">
      <div className="mx-auto flex max-w-site flex-col gap-10 px-5 py-16 md:px-10 lg:gap-12 lg:px-20 lg:py-[96px]">
        <SectionHead id="hook-title" num={hook.num} eyebrow={hook.eyebrow} headline={hook.headline} body={hook.body} className="max-w-[720px]" />
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-4">
          {hook.items.map((it) => (
            <li key={it.viz} className="panel flex flex-col overflow-hidden">
              <div className="viz-stage flex h-[96px] items-center justify-center gap-2.5 border-b border-rule px-4" aria-hidden>
                <Viz it={it} c={c} />
              </div>
              <div className="flex flex-col gap-1.5 p-5">
                <span className="text-[16px] font-semibold leading-[1.3] text-ink">{it.title}</span>
                <span className="text-[14px] leading-[1.55] text-ink-muted">{it.body}</span>
              </div>
            </li>
          ))}
        </ul>
        <div className="flex flex-col items-start justify-between gap-5 rounded-[16px] border border-accent/25 bg-accent/[0.07] p-6 md:flex-row md:items-center md:p-7">
          <p className="max-w-[560px] text-[17px] font-semibold leading-[1.4] text-ink md:text-[19px]">{hook.footer}</p>
          <a href="#contact" className="btn-primary shrink-0">
            Book a call
            <Icon name="arrow-right" size={15} strokeWidth={2.4} />
          </a>
        </div>
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

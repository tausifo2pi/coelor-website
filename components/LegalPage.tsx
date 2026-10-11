import Logo from "@/components/Logo";
import Footer from "@/components/Footer";

// The frame of the plain-language legal pages (/privacy, /terms): a small header, one readable column, the site footer.
// Server-rendered, no client script. Sections have no id on purpose: the Tracker only reports `main section[id]`.

export const LEGAL_UPDATED = { iso: "2026-10-11", label: "October 11, 2026" } as const;

export function LegalPage({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) {
  return (
    <>
      <a href="#main" className="skip-link" data-track="off">
        Skip to content
      </a>
      <header className="sticky top-0 z-[60] border-b border-rule bg-[rgba(10,12,16,0.82)] backdrop-blur-[14px]">
        <div className="mx-auto flex h-[68px] max-w-site items-center justify-between px-5 md:h-[76px] md:px-10 lg:px-20">
          <a href="/" aria-label="Coelor home" data-track="off" className="flex items-center py-2">
            <Logo height={26} priority className="md:hidden" />
            <Logo height={32} priority className="hidden md:block" />
          </a>
          <nav aria-label="Primary" className="flex items-center gap-5">
            <a href="/pricing" aria-label="Pricing (legal page)" className="py-1.5 text-[15px] font-medium text-ink-muted transition-colors hover:text-ink">
              Pricing
            </a>
            <a
              href="/#contact"
              aria-label="Contact (legal page)"
              className="inline-flex h-10 items-center rounded-full border border-rule-strong bg-white/10 px-[18px] text-[15px] font-medium text-ink transition-colors hover:bg-white/15"
            >
              Contact
            </a>
          </nav>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-site px-5 py-14 md:px-10 md:py-20 lg:px-20">
        <article className="mx-auto flex max-w-[760px] flex-col gap-12">
          <div className="flex flex-col gap-5">
            <span className="font-mono text-[12px] uppercase tracking-[0.08em] text-accent">Legal</span>
            <h1 className="display text-[40px] text-ink md:text-[56px]">{title}</h1>
            <p className="text-[16px] leading-[1.65] text-ink-muted md:text-[18px]">{intro}</p>
            <p className="font-mono text-[12px] text-ink-soft">
              Last updated: <time dateTime={LEGAL_UPDATED.iso}>{LEGAL_UPDATED.label}</time>
            </p>
          </div>
          {children}
        </article>
      </main>
      <Footer base="/" />
    </>
  );
}

/** One numbered part of a legal page: a heading and plain paragraphs or lists. */
export function Part({ id, n, title, children }: { id: string; n: number; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-4 border-t border-rule pt-8">
      <h2 id={id} className="h2 flex items-baseline gap-3 text-[24px] text-ink md:text-[28px]">
        <span className="font-mono text-[13px] font-normal text-ink-soft">{String(n).padStart(2, "0")}</span>
        {title}
      </h2>
      <div className="flex flex-col gap-4 text-[15px] leading-[1.7] text-ink-muted md:text-[16px] [&_a]:text-ink [&_a]:underline [&_a]:underline-offset-[3px] [&_li]:pl-1 [&_strong]:font-semibold [&_strong]:text-ink [&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-2 [&_ul]:pl-5">
        {children}
      </div>
    </section>
  );
}

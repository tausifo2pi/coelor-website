import content from "@/data/site-content.json";
import Logo from "@/components/Logo";

// The footer of every page with one (homepage, /pricing, /privacy, /terms, the email-only case studies): who we are and
// where (company details), the page links, Privacy · Terms, and the note on platform names. Each link's aria-label ends in
// "(footer)", so the Tracker's click (a phone push for the owner) tells it apart from the same link in the nav.

/** `base` prefixes the section links ("#…", e.g. with "/") when the footer sits on a page other than home; page links ("/pricing") stay as they are. */
export default function Footer({ base = "" }: { base?: string }) {
  const { footer, brand } = content;
  return (
    <footer className="border-t border-rule">
      <div className="mx-auto flex max-w-site flex-col gap-8 px-5 py-8 md:px-10 md:py-12 lg:px-20">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-3">
            <Logo height={26} />
            <span className="text-[13px] text-ink-soft">{footer.tagline}</span>
            <address className="text-[13px] not-italic leading-[1.6] text-ink-soft">
              {brand.name} · {brand.address}
              <br />
              <a href={`mailto:${brand.email}`} aria-label={`${brand.email} (footer)`} className="inline-block py-1 text-ink-muted transition-colors hover:text-ink">
                {brand.email}
              </a>
            </address>
          </div>
          <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-7 gap-y-3">
            {footer.links.map((l) => (
              <a key={l.href} href={l.href.startsWith("#") ? base + l.href : l.href} aria-label={`${l.label} (footer)`} className="py-1.5 text-[14px] text-ink-muted transition-colors hover:text-ink">
                {l.label}
              </a>
            ))}
          </nav>
        </div>
        <div className="flex flex-col gap-3 border-t border-rule pt-6 text-[13px] text-ink-soft md:flex-row md:items-center md:justify-between md:gap-8">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <span>{footer.copyright}</span>
            {footer.legal.map((l) => (
              <a key={l.href} href={l.href} aria-label={`${l.label} (footer)`} className="py-1 text-ink-muted transition-colors hover:text-ink">
                {l.label}
              </a>
            ))}
          </div>
          <p className="max-w-[520px] md:text-right">{footer.note}</p>
        </div>
      </div>
    </footer>
  );
}

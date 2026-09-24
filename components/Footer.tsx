import content from "@/data/site-content.json";
import Logo from "@/components/Logo";

export default function Footer() {
  const { footer, brand } = content;
  return (
    <footer className="border-t border-rule">
      <div className="mx-auto flex max-w-site flex-col gap-5 px-5 py-8 md:flex-row md:items-center md:justify-between md:px-10 md:py-12 lg:px-20">
        <div className="flex flex-col gap-3">
          <Logo height={26} />
          <span className="text-[13px] text-ink-soft">{footer.tagline}</span>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-7 gap-y-3">
          {footer.links.map((l) => (
            <a key={l.href} href={l.href} className="py-1.5 text-[14px] text-ink-muted transition-colors hover:text-ink">
              {l.label}
            </a>
          ))}
          <a href={`mailto:${brand.email}`} className="py-1.5 text-[14px] text-ink-muted transition-colors hover:text-ink">
            {brand.email}
          </a>
          <span className="text-[13px] text-ink-soft">{footer.copyright}</span>
        </nav>
      </div>
    </footer>
  );
}

const SOCIAL = [
  {
    name: "GitHub",
    href: "https://github.com/coelor",
    d: "M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.8c-2.8.6-3.4-1.3-3.4-1.3-.4-1.1-1.1-1.4-1.1-1.4-.9-.6.1-.6.1-.6 1 .1 1.6 1 1.6 1 .9 1.6 2.5 1.1 3.1.9.1-.7.4-1.1.6-1.4-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.5-1.3.1-2.7 0 0 .8-.3 2.7 1a9.5 9.5 0 0 1 5 0c1.9-1.3 2.7-1 2.7-1 .6 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.4 4.7-4.6 5 .4.3.7.9.7 1.8v2.7c0 .3.2.6.7.5A10 10 0 0 0 12 2z",
  },
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/company/coelor",
    d: "M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3V9zm7 0h3.8v1.7h.1c.5-.95 1.8-1.95 3.7-1.95 4 0 4.75 2.6 4.75 6V21H18.5v-5.4c0-1.3 0-3-1.85-3s-2.15 1.45-2.15 2.9V21H10V9z",
  },
  {
    name: "X",
    href: "https://x.com/coelor",
    d: "M18.244 3H21l-6.52 7.44L22 21h-6.41l-4.69-6.17L5.4 21H2.64l7-7.98L2 3h6.56l4.24 5.61L18.244 3zm-2.247 16.2h1.537L7.08 4.67H5.43l10.567 14.53z",
  },
];

export default function Footer() {
  return (
    <footer className="relative border-t border-rule bg-canvasElev">
      <div className="mx-auto max-w-[1280px] px-6 py-14 md:px-10 md:py-20">
        {/* Giant wordmark */}
        <div
          aria-hidden
          className="wordmark select-none whitespace-nowrap leading-none"
          style={{
            fontSize: "clamp(84px, 18vw, 260px)",
            letterSpacing: "-0.02em",
          }}
        >
          coelor
        </div>

        <div className="mt-10 grid grid-cols-1 gap-8 border-t border-rule pt-8 text-[14px] md:grid-cols-4 md:gap-6">
          <div className="flex flex-col gap-2">
            <span className="eyebrow">Studio</span>
            <p className="text-ink-muted">Independent software studio.</p>
            <p className="text-ink-muted">Remote-first, operating worldwide.</p>
          </div>
          <div className="flex flex-col gap-2">
            <span className="eyebrow">Contact</span>
            <a href="mailto:hello@coelor.com" className="text-ink underline-offset-4 hover:underline">
              hello@coelor.com
            </a>
            <a href="#contact" className="text-ink-muted hover:text-ink">
              Start a project →
            </a>
          </div>
          <div className="flex flex-col gap-2">
            <span className="eyebrow">Follow</span>
            <div className="flex items-center gap-4">
              {SOCIAL.map((s) => (
                <a
                  key={s.name}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={s.name}
                  className="text-ink-muted transition-colors duration-200 hover:text-ink"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d={s.d} />
                  </svg>
                </a>
              ))}
            </div>
          </div>
          <div className="flex flex-col items-start gap-2 md:items-end">
            <span className="eyebrow">© {new Date().getFullYear()}</span>
            <p className="text-ink-muted">Coelor. All rights reserved.</p>
            <p className="text-ink-soft">Agile by nature.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

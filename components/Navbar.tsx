"use client";

import { useEffect, useState } from "react";

const NAV = [
  { id: "work", label: "Work" },
  { id: "capabilities", label: "Capabilities" },
  { id: "studio", label: "Studio" },
  { id: "contact", label: "Contact" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const smoothTo = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-[60] transition-colors duration-300 ${
        scrolled ? "backdrop-blur-md" : ""
      }`}
      style={{
        backgroundColor: scrolled ? "rgba(7,7,13,0.72)" : "transparent",
        borderBottom: scrolled ? "1px solid var(--rule)" : "1px solid transparent",
      }}
    >
      <div className="mx-auto flex h-[68px] max-w-[1280px] items-center justify-between px-6 md:px-10">
        {/* Logo */}
        <a href="#top" onClick={smoothTo("top")}>
          <span className="wordmark text-[26px] leading-none">coelor</span>
        </a>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-10 md:flex">
          {NAV.map((n) => (
            <a
              key={n.id}
              href={`#${n.id}`}
              onClick={smoothTo(n.id)}
              className="group relative font-mono text-[11px] uppercase tracking-[0.22em] text-ink-muted transition-colors duration-200 hover:text-ink"
            >
              {n.label}
              <span className="absolute -bottom-1 left-0 h-px w-0 bg-ink transition-all duration-300 group-hover:w-full" />
            </a>
          ))}
        </nav>

        {/* Desktop CTA */}
        <a
          href="#contact"
          onClick={smoothTo("contact")}
          className="group hidden items-center gap-2 rounded-full border border-mint-2 bg-mint-2 px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.18em] text-mint-ink shadow-[0_0_24px_-4px_rgba(0,255,180,0.45)] transition-all duration-200 hover:bg-transparent hover:text-mint-2 md:inline-flex"
        >
          <span>Start a project</span>
          <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-0.5">→</span>
        </a>

        {/* Hamburger / X — z-[70] keeps it above the overlay in every scenario */}
        <button
          type="button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
          className="relative z-[70] -mr-2 flex h-10 w-10 items-center justify-center text-ink md:hidden"
        >
          {menuOpen ? (
            <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden>
              <line x1="4" y1="4" x2="18" y2="18" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              <line x1="18" y1="4" x2="4" y2="18" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden>
              <line x1="3" y1="8" x2="19" y2="8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              <line x1="3" y1="14" x2="19" y2="14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 z-50 flex flex-col bg-canvas transition-opacity duration-300 md:hidden ${
          menuOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        {/* Top bar spacer so links don't hide under the header */}
        <div className="h-[68px] shrink-0" />

        <nav className="flex flex-1 flex-col items-center justify-center gap-8 px-6">
          {NAV.map((n) => (
            <a
              key={n.id}
              href={`#${n.id}`}
              onClick={smoothTo(n.id)}
              className="font-display text-[44px] tracking-tight text-ink transition-opacity duration-200 hover:opacity-60"
            >
              {n.label}
            </a>
          ))}
        </nav>

        <div className="shrink-0 border-t border-rule px-6 py-8">
          <a
            href="#contact"
            onClick={smoothTo("contact")}
            className="flex w-full items-center justify-center rounded-full bg-ink py-3.5 font-mono text-[11px] uppercase tracking-[0.2em] text-canvas"
          >
            Start a project →
          </a>
        </div>
      </div>
    </header>
  );
}

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
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const smoothTo = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setMenuOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-colors duration-300 ${
        scrolled ? "backdrop-blur-md" : ""
      }`}
      style={{
        backgroundColor: scrolled ? "rgba(7,7,13,0.72)" : "transparent",
        borderBottom: scrolled ? "1px solid var(--rule)" : "1px solid transparent",
      }}
    >
      <div className="mx-auto flex h-[68px] max-w-[1280px] items-center justify-between px-6 md:px-10">
        <a href="#top" onClick={smoothTo("top")} className="flex items-baseline gap-2">
          <span className="wordmark text-[26px] leading-none">coelor</span>
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.2em] text-ink-muted sm:inline">
            · Studio
          </span>
        </a>

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

        <a
          href="#contact"
          onClick={smoothTo("contact")}
          className="group hidden items-center gap-2 rounded-full border border-ink/80 bg-ink px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.18em] text-canvas transition-colors duration-200 hover:bg-canvas hover:text-ink md:inline-flex"
        >
          <span>Start a project</span>
          <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-0.5">→</span>
        </a>

        <button
          type="button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
          className="relative h-10 w-10 md:hidden"
        >
          <span
            className={`absolute left-2 right-2 top-[17px] h-px bg-ink transition-transform duration-200 ${
              menuOpen ? "translate-y-[3px] rotate-45" : ""
            }`}
          />
          <span
            className={`absolute left-2 right-2 top-[23px] h-px bg-ink transition-transform duration-200 ${
              menuOpen ? "-translate-y-[3px] -rotate-45" : ""
            }`}
          />
        </button>
      </div>

      <div
        className={`fixed inset-0 z-30 bg-canvas transition-opacity duration-300 md:hidden ${
          menuOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <ul className="flex h-full flex-col items-center justify-center gap-10">
          {NAV.map((n) => (
            <li key={n.id}>
              <a
                href={`#${n.id}`}
                onClick={smoothTo(n.id)}
                className="font-display text-5xl tracking-tight text-ink"
              >
                {n.label}
              </a>
            </li>
          ))}
          <li className="mt-4">
            <a
              href="#contact"
              onClick={smoothTo("contact")}
              className="rounded-full bg-ink px-6 py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-canvas"
            >
              Start a project →
            </a>
          </li>
        </ul>
      </div>
    </header>
  );
}

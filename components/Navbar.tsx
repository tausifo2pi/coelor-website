"use client";

import { useEffect, useState } from "react";

import { Icon } from "@/components/icons";
import Logo from "@/components/Logo";

type NavLink = { label: string; href: string };

const Arrow = () => <Icon name="arrow-right" size={14} strokeWidth={2.4} />;

/** Copy comes in as props from the page (a server component), so the content file never ships to the browser. */
export default function Navbar({ brand, links, cta }: { brand: string; links: NavLink[]; cta: NavLink }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // "#id" scrolls smoothly on this page; any other href ("/pricing") is a normal link.
  const go = (href: string) => (e: React.MouseEvent) => {
    setOpen(false);
    if (!href.startsWith("#")) return;
    e.preventDefault();
    document.getElementById(href.slice(1))?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <header className="fixed inset-x-0 top-0 z-[60]">
      <div
        className="transition-[background-color,border-color] duration-300"
        style={{
          backgroundColor: scrolled || open ? "rgba(10,12,16,0.82)" : "transparent",
          backdropFilter: scrolled && !open ? "blur(14px)" : "none",
          WebkitBackdropFilter: scrolled && !open ? "blur(14px)" : "none",
          borderBottom: `1px solid ${scrolled ? "var(--rule)" : "transparent"}`,
        }}
      >
      <div className="mx-auto flex h-[68px] max-w-site items-center justify-between px-5 md:h-[76px] md:px-10 lg:px-20">
        <a href="#hero" onClick={go("#hero")} aria-label={`${brand} home`} className="flex items-center py-2">
          <Logo height={26} priority className="md:hidden" />
          <Logo height={32} priority className="hidden md:block" />
        </a>

        <nav aria-label="Primary" className="hidden items-center gap-8 lg:flex">
          {links.map((n) => (
            <a key={n.href} href={n.href} onClick={go(n.href)} className="py-1.5 text-[15px] font-medium text-ink/85 transition-colors hover:text-ink">
              {n.label}
            </a>
          ))}
        </nav>

        <a
          href={cta.href}
          onClick={go(cta.href)}
          className="hidden h-10 items-center gap-2 rounded-full border border-rule-strong bg-white/10 px-[18px] text-[15px] font-medium text-ink transition-colors hover:bg-white/15 lg:inline-flex"
        >
          {cta.label}
          <Arrow />
        </a>

        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((v) => !v)}
          className="relative z-[70] -mr-2 flex h-11 w-11 items-center justify-center text-ink lg:hidden"
        >
          {open ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <path d="M6 6l12 12" />
              <path d="M18 6L6 18" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <path d="M4 7h16" />
              <path d="M4 12h16" />
              <path d="M4 17h16" />
            </svg>
          )}
        </button>
      </div>
      </div>

      {/* Mobile overlay */}
      <div
        id="mobile-menu"
        inert={!open}
        aria-hidden={!open}
        className={`fixed inset-x-0 top-0 z-50 flex h-[100dvh] flex-col bg-canvas transition-opacity duration-300 lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <div className="h-[68px] shrink-0" />
        <nav aria-label="Mobile" className="flex flex-1 flex-col justify-center gap-7 px-8">
          {links.map((n) => (
            <a key={n.href} href={n.href} onClick={go(n.href)} className="text-[32px] font-semibold tracking-tight text-ink">
              {n.label}
            </a>
          ))}
        </nav>
        <div className="shrink-0 border-t border-rule px-8 py-8">
          <a href={cta.href} onClick={go(cta.href)} className="btn-primary w-full">
            {cta.label}
            <Arrow />
          </a>
        </div>
      </div>
    </header>
  );
}

"use client";

import { useState } from "react";
import { useReveal } from "@/hooks/useReveal";

type Field = "name" | "email" | "company" | "brief";

export default function Contact() {
  const headRef = useReveal<HTMLDivElement>();
  const formRef = useReveal<HTMLDivElement>(0.1);
  const [focus, setFocus] = useState<Field | null>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("sending");
    setTimeout(() => setStatus("sent"), 650);
  };

  const fieldBase = (name: Field) =>
    `flex flex-col gap-2 border-t py-5 transition-colors duration-300 ${
      focus === name ? "border-ink" : "border-rule"
    }`;

  return (
    <section id="contact" className="relative py-16 md:py-24">
      <div className="mx-auto max-w-[1280px] px-6 md:px-10">
        <div
          ref={headRef}
          className="reveal mb-12 grid grid-cols-1 items-end gap-8 md:mb-16 md:grid-cols-12"
        >
          <div className="md:col-span-8">
            <span className="eyebrow">§ 04 — Contact</span>
            <h2 className="display mt-4 text-[44px] md:text-[88px]">
              Tell us what
              <br />
              you&rsquo;re building.
            </h2>
          </div>
          <p className="max-w-sm text-[15px] leading-relaxed text-ink-muted md:col-span-4">
            A partner replies within two business days. No sales funnel, no SDR, no &ldquo;let&rsquo;s
            circle back.&rdquo; Just a real engineer reading what you wrote.
          </p>
        </div>

        <div ref={formRef} className="reveal grid grid-cols-1 gap-10 md:grid-cols-12">
          <form onSubmit={onSubmit} className="md:col-span-8">
            <div className="grid grid-cols-1 gap-0 md:grid-cols-2 md:gap-x-10">
              <div className={fieldBase("name")}>
                <label htmlFor="name" className="eyebrow">Name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  placeholder="Your full name"
                  onFocus={() => setFocus("name")}
                  onBlur={() => setFocus(null)}
                  className="bg-transparent py-2 text-[17px] text-ink placeholder:text-ink-soft focus:outline-none"
                />
              </div>
              <div className={fieldBase("company")}>
                <label htmlFor="company" className="eyebrow">Company</label>
                <input
                  id="company"
                  name="company"
                  type="text"
                  autoComplete="organization"
                  placeholder="Where you work"
                  onFocus={() => setFocus("company")}
                  onBlur={() => setFocus(null)}
                  className="bg-transparent py-2 text-[17px] text-ink placeholder:text-ink-soft focus:outline-none"
                />
              </div>
              <div className={`${fieldBase("email")} md:col-span-2`}>
                <label htmlFor="email" className="eyebrow">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="you@company.com"
                  onFocus={() => setFocus("email")}
                  onBlur={() => setFocus(null)}
                  className="bg-transparent py-2 text-[17px] text-ink placeholder:text-ink-soft focus:outline-none"
                />
              </div>
              <div className={`${fieldBase("brief")} md:col-span-2`}>
                <label htmlFor="brief" className="eyebrow">Brief</label>
                <textarea
                  id="brief"
                  name="brief"
                  rows={5}
                  required
                  placeholder="A paragraph about what you're building and where you're stuck."
                  onFocus={() => setFocus("brief")}
                  onBlur={() => setFocus(null)}
                  className="resize-none bg-transparent py-2 text-[17px] leading-relaxed text-ink placeholder:text-ink-soft focus:outline-none"
                />
              </div>
              <div className="mt-8 flex flex-col gap-4 border-t border-rule pt-6 md:col-span-2 md:flex-row md:items-center md:justify-between">
                <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-muted">
                  Or email —{" "}
                  <a href="mailto:hello@coelor.com" className="text-ink underline-offset-4 hover:underline">
                    hello@coelor.com
                  </a>
                </span>
                <button
                  type="submit"
                  disabled={status !== "idle"}
                  className="group inline-flex items-center gap-2 rounded-full border border-ink bg-ink px-7 py-3.5 font-mono text-[11px] uppercase tracking-[0.22em] text-canvas transition-all duration-200 hover:bg-transparent hover:text-ink disabled:opacity-70"
                >
                  <span>
                    {status === "sent" ? "Received — we'll be in touch" : status === "sending" ? "Sending…" : "Send brief"}
                  </span>
                  {status === "idle" && (
                    <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                  )}
                </button>
              </div>
            </div>
          </form>

          <aside className="flex flex-col gap-6 border-t border-rule pt-6 md:col-span-4 md:border-none md:pt-0">
            <div>
              <span className="eyebrow">Good fits</span>
              <ul className="mt-3 space-y-2 text-[15px] text-ink-muted">
                <li>— Seed to Series C, with a sharp technical problem.</li>
                <li>— Teams that want a partner, not a vendor.</li>
                <li>— Work that isn&rsquo;t a rebuild of the same CRUD app.</li>
              </ul>
            </div>
            <div>
              <span className="eyebrow">Not a fit</span>
              <ul className="mt-3 space-y-2 text-[15px] text-ink-muted">
                <li>— Body-shop augmentation by the seat.</li>
                <li>— Marketing sites (we have opinions — we&rsquo;ll refer you).</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

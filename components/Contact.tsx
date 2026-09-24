"use client";

import { useState } from "react";
import content from "@/data/site-content.json";
import { Icon } from "@/components/icons";
import SectionHead from "@/components/SectionHead";

type Field = "name" | "email" | "message";
type Errors = Partial<Record<Field, string>>;

function validate(d: Record<Field, string>): Errors {
  const e: Errors = {};
  if (!d.name.trim()) e.name = "Required";
  if (!d.email.trim()) e.email = "Required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) e.email = "Enter a valid email";
  if (!d.message.trim()) e.message = "Required";
  else if (d.message.trim().length < 12) e.message = "A sentence is enough";
  return e;
}

/** Optional overrides let a landing page reuse the form with its own heading. */
export default function Contact({ num, headline, body }: { num?: string; headline?: string; body?: string } = {}) {
  const { brand } = content;
  const contact = { ...content.contact, ...(num && { num }), ...(headline && { headline }), ...(body && { body }) };
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errors, setErrors] = useState<Errors>({});
  const [sent, setSent] = useState<{ name: string; email: string; ref: string } | null>(null);

  const onSubmit = async (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    const form = ev.currentTarget;
    const get = (k: Field) => (form.elements.namedItem(k) as HTMLInputElement | HTMLTextAreaElement).value;
    const data = { name: get("name"), email: get("email"), message: get("message") };
    const errs = validate(data);
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error();
      const json = (await res.json()) as { ref?: string };
      setSent({ name: data.name.trim(), email: data.email.trim(), ref: json.ref ?? "" });
      setStatus("sent");
      form.reset();
    } catch {
      setStatus("error");
    }
  };

  const field = (k: Field, extra?: React.ReactNode) => (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={`c-${k}`} className="text-[13px] text-ink-soft">
        {contact.fields[k]}
      </label>
      {extra}
      {errors[k] && (
        <span id={`c-${k}-error`} className="text-[12px] text-[#ff9a9a]">
          {errors[k]}
        </span>
      )}
    </div>
  );
  const a11y = (k: Field) => ({ "aria-invalid": !!errors[k], "aria-describedby": errors[k] ? `c-${k}-error` : undefined });

  return (
    <section id="contact" aria-labelledby="contact-title" className="scroll-mt-16 bg-canvas2">
      <div className="mx-auto grid max-w-site grid-cols-1 gap-10 px-5 py-16 md:px-10 lg:grid-cols-[1fr_380px] lg:gap-24 lg:px-20 lg:py-[104px]">
        <div className="flex flex-col gap-8">
          <SectionHead id="contact-title" num={contact.num} eyebrow={contact.eyebrow} headline={contact.headline} body={contact.body} className="max-w-[640px]" />

          {status === "sent" && sent ? (
            <div role="status" aria-live="polite" className="panel relative flex max-w-[560px] flex-col gap-6 overflow-hidden p-7 md:p-8">
              <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-ok/15 blur-3xl" aria-hidden />
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-ok/30 bg-ok/10 text-ok">
                  <Icon name="check" size={22} strokeWidth={2.4} />
                </span>
                <div className="flex flex-col gap-1">
                  <span className="text-[22px] font-semibold text-ink">{contact.success.title}</span>
                  <span className="font-mono text-[12px] text-ink-soft">
                    {contact.success.refLabel} <span className="text-ink">{sent.ref}</span>
                  </span>
                </div>
              </div>
              <p className="text-[15px] leading-[1.6] text-ink-muted">
                {contact.success.body.replace("{name}", sent.name).replace("{email}", sent.email)}
              </p>
              <ol className="flex flex-col gap-3 border-t border-rule pt-5">
                {contact.success.next.map((it, i) => (
                  <li key={it} className="flex items-start gap-3 text-[14px] text-ink-muted">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-rule-strong font-mono text-[11px] text-ink">{i + 1}</span>
                    <span className="pt-0.5">{it}</span>
                  </li>
                ))}
              </ol>
              <button type="button" onClick={() => { setSent(null); setStatus("idle"); }} className="link-arrow self-start text-[14px] text-ink-muted hover:text-ink">
                {contact.success.again}
                <Icon name="arrow-right" size={14} strokeWidth={2.4} />
              </button>
            </div>
          ) : (
          <form onSubmit={onSubmit} noValidate className="panel flex max-w-[560px] flex-col gap-5 p-6 md:p-7">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {field("name", <input id="c-name" name="name" type="text" required autoComplete="name" placeholder={contact.placeholders.name} className={`field ${errors.name ? "field-error" : ""}`} {...a11y("name")} />)}
              {field("email", <input id="c-email" name="email" type="email" required autoComplete="email" placeholder={contact.placeholders.email} className={`field ${errors.email ? "field-error" : ""}`} {...a11y("email")} />)}
            </div>
            {field("message", <textarea id="c-message" name="message" rows={3} required placeholder={contact.placeholders.message} className={`field ${errors.message ? "field-error" : ""}`} {...a11y("message")} />)}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button type="submit" disabled={status === "sending"} className="btn-primary disabled:opacity-70">
                {status === "sending" ? contact.buttonSending : status === "error" ? contact.buttonError : contact.buttonIdle}
                {status !== "sending" && <Icon name="arrow-right" size={15} strokeWidth={2.4} />}
              </button>
              <span className="text-[13px] text-ink-soft">
                or email{" "}
                <a href={`mailto:${brand.email}`} className="inline-block py-1 text-ink underline underline-offset-[3px]">
                  {brand.email}
                </a>
              </span>
            </div>
            {status === "error" && (
              <span role="status" aria-live="polite" className="text-[13px] text-[#ff9a9a]">
                Something went wrong on our side. Please email us directly and we will pick it up.
              </span>
            )}
          </form>
          )}
        </div>

        <div className="panel flex flex-col gap-5 self-start p-7 lg:mt-[104px]">
          <span className="text-[14px] font-semibold text-ink">{contact.aside.title}</span>
          <ol className="flex flex-col gap-4">
            {contact.aside.items.map((it, i) => (
              <li key={it} className="flex items-start gap-3 text-[14px] leading-[1.5] text-ink-muted">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-rule-strong font-mono text-[11px] text-ink">{i + 1}</span>
                <span className="pt-0.5">{it}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

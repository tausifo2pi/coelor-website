"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { PREFILL } from "@/lib/offer";

// The contact form, the only interactive part of the page: it gets its copy from the server component (Contact.tsx), so
// the browser does not download the site's whole content file to show three fields.

export type ContactCopy = {
  fields: Record<"name" | "email" | "message", string>;
  placeholders: Record<"name" | "email" | "message", string>;
  buttonIdle: string;
  buttonSending: string;
  buttonError: string;
  success: { title: string; body: string; refLabel: string; next: string[]; again: string };
  email: string;
};

const Icon = ({ name, size, strokeWidth = 1.8 }: { name: "check" | "arrow-right"; size: number; strokeWidth?: number }) => {
  const C = name === "check" ? Check : ArrowRight;
  return <C size={size} strokeWidth={strokeWidth} aria-hidden />;
};

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

export default function ContactForm({ copy }: { copy: ContactCopy }) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errors, setErrors] = useState<Errors>({});
  const [sent, setSent] = useState<{ name: string; email: string; ref: string } | null>(null);
  const filled = useRef("");

  // A link with data-prefill (the pricing page's trial and quote buttons) fills in the message, unless the visitor has
  // written their own; so does ?plan=trial or ?plan=<connections> in the address (links from the demo pages).
  useEffect(() => {
    const plan = new URLSearchParams(window.location.search).get("plan") ?? "";
    const start = plan === "trial" ? PREFILL.trial : /^[1-9]\d?$/.test(plan) ? PREFILL.quote(Number(plan)) : "";
    const first = document.getElementById("c-message") as HTMLTextAreaElement | null;
    if (start && first && !first.value) first.value = filled.current = start;
    const onClick = (ev: MouseEvent) => {
      const text = (ev.target as HTMLElement | null)?.closest<HTMLElement>("[data-prefill]")?.dataset.prefill;
      const box = document.getElementById("c-message") as HTMLTextAreaElement | null;
      if (!text || !box || (box.value.trim() && box.value !== filled.current)) return;
      box.value = filled.current = text;
      if (window.matchMedia("(pointer: fine)").matches) setTimeout(() => box.focus({ preventScroll: true }), 400); // no keyboard pop-up on phones
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

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
        {copy.fields[k]}
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

  return status === "sent" && sent ? (
    <div role="status" aria-live="polite" className="panel relative flex max-w-[560px] flex-col gap-6 overflow-hidden p-7 md:p-8">
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-ok/15 blur-3xl" aria-hidden />
      <div className="flex items-center gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-ok/30 bg-ok/10 text-ok">
          <Icon name="check" size={22} strokeWidth={2.4} />
        </span>
        <div className="flex flex-col gap-1">
          <span className="text-[22px] font-semibold text-ink">{copy.success.title}</span>
          <span className="font-mono text-[12px] text-ink-soft">
            {copy.success.refLabel} <span className="text-ink">{sent.ref}</span>
          </span>
        </div>
      </div>
      <p className="text-[15px] leading-[1.6] text-ink-muted">
        {copy.success.body.replace("{name}", sent.name).replace("{email}", sent.email)}
      </p>
      <ol className="flex flex-col gap-3 border-t border-rule pt-5">
        {copy.success.next.map((it, i) => (
          <li key={it} className="flex items-start gap-3 text-[14px] text-ink-muted">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-rule-strong font-mono text-[11px] text-ink">{i + 1}</span>
            <span className="pt-0.5">{it}</span>
          </li>
        ))}
      </ol>
      <button type="button" onClick={() => { setSent(null); setStatus("idle"); }} className="link-arrow self-start text-[14px] text-ink-muted hover:text-ink">
        {copy.success.again}
        <Icon name="arrow-right" size={14} strokeWidth={2.4} />
      </button>
    </div>
  ) : (
  <form onSubmit={onSubmit} noValidate className="panel flex max-w-[560px] flex-col gap-5 p-6 md:p-7">
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      {field("name", <input id="c-name" name="name" type="text" required autoComplete="name" placeholder={copy.placeholders.name} className={`field ${errors.name ? "field-error" : ""}`} {...a11y("name")} />)}
      {field("email", <input id="c-email" name="email" type="email" required autoComplete="email" placeholder={copy.placeholders.email} className={`field ${errors.email ? "field-error" : ""}`} {...a11y("email")} />)}
    </div>
    {field("message", <textarea id="c-message" name="message" rows={3} required placeholder={copy.placeholders.message} className={`field ${errors.message ? "field-error" : ""}`} {...a11y("message")} />)}
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <button type="submit" disabled={status === "sending"} className="btn-primary disabled:opacity-70">
        {status === "sending" ? copy.buttonSending : status === "error" ? copy.buttonError : copy.buttonIdle}
        {status !== "sending" && <Icon name="arrow-right" size={15} strokeWidth={2.4} />}
      </button>
      <span className="text-[13px] text-ink-soft">
        or email{" "}
        <a href={`mailto:${copy.email}`} className="inline-block py-1 text-ink underline underline-offset-[3px]">
          {copy.email}
        </a>
      </span>
    </div>
    {status === "error" && (
      <span role="status" aria-live="polite" className="text-[13px] text-[#ff9a9a]">
        Something went wrong on our side. Please email us directly and we will pick it up.
      </span>
    )}
  </form>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { PREFILL } from "@/lib/offer";

// The contact form, the only interactive part of the page: it gets its copy from the server component (Contact.tsx), so
// the browser does not download the site's whole content file to show three fields. Shared by the homepage, /pricing and
// the email-only case studies (components/CaseStudy.tsx), which all get the same copy (data/site-content.json contact.*).

export type Kind = "trial" | "price";
type Field = "name" | "email" | "message";

export type ContactCopy = {
  choice: { legend: string; trial: string; price: string; pricePrefill: string };
  fields: Record<Field, string>;
  placeholders: Record<Field, string>;
  buttonIdle: string;
  buttonSending: string;
  buttonError: string;
  orEmail: string;
  errors: { required: string; email: string; short: string; summary: string; server: string; rateLimited: string };
  next: Record<Kind, string[]>;
  success: { title: string; body: string; bodyNoReceipt: string; refLabel: string; again: string };
  email: string;
};

const Icon = ({ name, size, strokeWidth = 1.8 }: { name: "check" | "arrow-right"; size: number; strokeWidth?: number }) => {
  const C = name === "check" ? Check : ArrowRight;
  return <C size={size} strokeWidth={strokeWidth} aria-hidden />;
};

const FIELDS: Field[] = ["name", "email", "message"];
type Errors = Partial<Record<Field, string>>;

function validate(d: Record<Field, string>, e: ContactCopy["errors"]): Errors {
  const out: Errors = {};
  if (!d.name.trim()) out.name = e.required;
  if (!d.email.trim()) out.email = e.required;
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim())) out.email = e.email;
  if (!d.message.trim()) out.message = e.required;
  else if (d.message.trim().length < 12) out.message = e.short;
  return out;
}

/** A trial button's prefill says "trial"; a quote's does not. */
const kindOf = (text: string): Kind => (text === PREFILL.trial || /\btrial\b/i.test(text) ? "trial" : "price");

const messageBox = () => document.getElementById("c-message") as HTMLTextAreaElement | null;

export default function ContactForm({ copy }: { copy: ContactCopy }) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [failure, setFailure] = useState<"server" | "rateLimited">("server");
  const [errors, setErrors] = useState<Errors>({});
  const [kind, setKind] = useState<Kind>("trial");
  const [sent, setSent] = useState<{ name: string; email: string; ref: string; kind: Kind; receipt: boolean } | null>(null);
  const filled = useRef(""); // the text we put in the message box, so we never overwrite what the visitor wrote

  // A link with data-prefill (trial and quote buttons) fills in the message, unless the visitor has written their own,
  // and picks the matching choice; so does ?plan=trial or ?plan=<connections> in the address (links from the demo pages
  // and from /pricing).
  useEffect(() => {
    const plan = new URLSearchParams(window.location.search).get("plan") ?? "";
    const start = plan === "trial" ? PREFILL.trial : /^[1-9]\d?$/.test(plan) ? PREFILL.quote(Number(plan)) : "";
    const first = messageBox();
    if (start) setKind(plan === "trial" ? "trial" : "price");
    if (start && first && !first.value) first.value = filled.current = start;
    const onClick = (ev: MouseEvent) => {
      const text = (ev.target as HTMLElement | null)?.closest<HTMLElement>("[data-prefill]")?.dataset.prefill;
      const box = messageBox();
      if (!text || !box) return;
      setKind(kindOf(text));
      if (box.value.trim() && box.value !== filled.current) return;
      box.value = filled.current = text;
      if (window.matchMedia("(pointer: fine)").matches) setTimeout(() => box.focus({ preventScroll: true }), 400); // no keyboard pop-up on phones
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  // Switching the choice swaps a message we filled in for the other one; the visitor's own words stay.
  const choose = (k: Kind) => {
    setKind(k);
    const box = messageBox();
    if (box && filled.current && box.value === filled.current) box.value = filled.current = k === "trial" ? PREFILL.trial : copy.choice.pricePrefill;
  };

  const onSubmit = async (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    const form = ev.currentTarget;
    const get = (k: string) => (form.elements.namedItem(k) as HTMLInputElement | HTMLTextAreaElement | null)?.value ?? "";
    const data = { name: get("name"), email: get("email"), message: get("message") };
    const errs = validate(data, copy.errors);
    setErrors(errs);
    const firstBad = FIELDS.find((k) => errs[k]);
    if (firstBad) {
      (form.elements.namedItem(firstBad) as HTMLElement | null)?.focus();
      return;
    }
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, kind, hp: get("hp") }),
      });
      if (!res.ok) {
        setFailure(res.status === 429 ? "rateLimited" : "server");
        throw new Error(String(res.status));
      }
      const json = (await res.json()) as { ref?: string; receipt?: boolean };
      setSent({ name: data.name.trim(), email: data.email.trim(), ref: json.ref ?? "", kind, receipt: json.receipt !== false });
      setStatus("sent");
      filled.current = "";
      form.reset();
    } catch {
      setStatus("error");
    }
  };

  const field = (k: Field, control: React.ReactNode) => (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={`c-${k}`} className="text-[13px] text-ink-soft">
        {copy.fields[k]}
      </label>
      {control}
      {errors[k] && (
        <span id={`c-${k}-error`} className="text-[12px] text-[#ff9a9a]">
          {errors[k]}
        </span>
      )}
    </div>
  );
  const a11y = (k: Field) => ({ "aria-invalid": !!errors[k], "aria-describedby": errors[k] ? `c-${k}-error` : undefined });

  if (status === "sent" && sent) {
    const body = sent.receipt ? copy.success.body : copy.success.bodyNoReceipt;
    return (
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
        <p className="text-[15px] leading-[1.6] text-ink-muted">{body.replace("{name}", sent.name).replace("{email}", sent.email)}</p>
        <ol className="flex flex-col gap-3 border-t border-rule pt-5">
          {copy.next[sent.kind].map((it, i) => (
            <li key={it} className="flex items-start gap-3 text-[14px] text-ink-muted">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-rule-strong font-mono text-[11px] text-ink">{i + 1}</span>
              <span className="pt-0.5">{it}</span>
            </li>
          ))}
        </ol>
        <button
          type="button"
          data-track="off"
          onClick={() => {
            setSent(null);
            setStatus("idle");
          }}
          className="link-arrow self-start text-[14px] text-ink-muted hover:text-ink"
        >
          {copy.success.again}
          <Icon name="arrow-right" size={14} strokeWidth={2.4} />
        </button>
      </div>
    );
  }

  // The two choices as one segmented control (radio buttons: arrow keys move between them).
  const option = (k: Kind) => (
    <label key={k} className="relative flex-1 cursor-pointer">
      <input type="radio" name="kind" value={k} checked={kind === k} onChange={() => choose(k)} className="peer sr-only" />
      <span className="flex min-h-11 items-center justify-center rounded-full px-4 py-2 text-center text-[14px] font-medium leading-tight text-ink-muted transition-colors hover:text-ink peer-checked:bg-ink peer-checked:text-canvas peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent">
        {copy.choice[k]}
      </span>
    </label>
  );

  return (
    <form onSubmit={onSubmit} noValidate className="panel relative flex max-w-[560px] flex-col gap-5 p-6 md:p-7">
      <fieldset className="m-0 min-w-0 border-0 p-0">
        <legend className="mb-2 p-0 text-[13px] text-ink-soft">{copy.choice.legend}</legend>
        <div className="flex gap-1 rounded-full border border-[#626a78] p-1">{(["trial", "price"] as const).map(option)}</div>
      </fieldset>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {field("name", <input id="c-name" name="name" type="text" required autoComplete="name" placeholder={copy.placeholders.name} className={`field ${errors.name ? "field-error" : ""}`} {...a11y("name")} />)}
        {field("email", <input id="c-email" name="email" type="email" required autoComplete="email" placeholder={copy.placeholders.email} className={`field ${errors.email ? "field-error" : ""}`} {...a11y("email")} />)}
      </div>
      {field("message", <textarea id="c-message" name="message" rows={3} required placeholder={copy.placeholders.message} className={`field ${errors.message ? "field-error" : ""}`} {...a11y("message")} />)}
      {/* Spam trap: invisible to people and screen readers, skipped by Tab and autofill, not tracked. A bot that fills
          every field gets a normal "sent" from /api/contact, and nothing is mailed. */}
      <div aria-hidden="true" data-track="off" className="pointer-events-none absolute -left-[10000px] top-0 h-px w-px overflow-hidden opacity-0">
        <label htmlFor="c-hp">Leave this field empty</label>
        <input id="c-hp" name="hp" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>
      <div aria-live="assertive" className="sr-only">
        {Object.keys(errors).length ? copy.errors.summary : ""}
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button type="submit" disabled={status === "sending"} className="btn-primary disabled:opacity-70">
          {status === "sending" ? copy.buttonSending : status === "error" ? copy.buttonError : copy.buttonIdle}
          {status !== "sending" && <Icon name="arrow-right" size={15} strokeWidth={2.4} />}
        </button>
        <span className="text-[13px] text-ink-soft">
          {copy.orEmail}{" "}
          <a href={`mailto:${copy.email}`} className="inline-block py-1 text-ink underline underline-offset-[3px]">
            {copy.email}
          </a>
        </span>
      </div>
      {status === "error" && (
        <span role="alert" className="text-[13px] text-[#ff9a9a]">
          {copy.errors[failure]}
        </span>
      )}
    </form>
  );
}

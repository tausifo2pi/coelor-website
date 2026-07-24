"use client";

import { useState } from "react";
import { useReveal } from "@/hooks/useReveal";
import MaskReveal from "@/components/MaskReveal";
import content from "@/data/site-content.json";

type Field = "name" | "email" | "company" | "brief";
type Errors = Partial<Record<Field, string>>;

function validate(data: Record<string, string>): Errors {
  const errs: Errors = {};
  if (!data.name.trim()) errs.name = "Name is required";
  if (!data.email.trim()) errs.email = "Email is required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errs.email = "Invalid email";
  if (!data.brief.trim()) errs.brief = "Message is required";
  else if (data.brief.trim().length < 20) errs.brief = "Too short — add more detail";
  return errs;
}

export default function Contact() {
  const headRef = useReveal<HTMLParagraphElement>();
  const formRef = useReveal<HTMLDivElement>(0.1);
  const [focus, setFocus] = useState<Field | null>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errors, setErrors] = useState<Errors>({});
  const { contact, brand } = content;

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = {
      name: (form.elements.namedItem("name") as HTMLInputElement).value,
      email: (form.elements.namedItem("email") as HTMLInputElement).value,
      company: (form.elements.namedItem("company") as HTMLInputElement).value,
      brief: (form.elements.namedItem("brief") as HTMLTextAreaElement).value,
    };
    const errs = validate(data);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  };

  const fieldBase = (name: Field) =>
    `flex flex-col gap-1 border-t py-5 transition-colors duration-300 ${
      errors[name] ? "border-red-400" : focus === name ? "border-ink" : "border-rule"
    }`;

  return (
    <section id="contact" className="relative py-20 md:py-28">
      <div className="mx-auto max-w-[1100px] px-6 md:px-10">
        <div className="mb-12 grid grid-cols-1 items-end gap-8 md:mb-16 md:grid-cols-12">
          <div className="md:col-span-8">
            <span className="eyebrow">{contact.eyebrow}</span>
            <MaskReveal text={contact.headline} accent={contact.accent} className="display mt-4 text-[36px] md:text-[56px]" />
          </div>
          <p ref={headRef} className="reveal max-w-sm text-[15px] leading-relaxed text-ink-muted md:col-span-4" style={{ transitionDelay: "200ms" }}>
            {contact.body}
          </p>
        </div>

        <div ref={formRef} className="reveal grid grid-cols-1 gap-10 md:grid-cols-12">
          <form onSubmit={onSubmit} className="md:col-span-8">
            <div className="grid grid-cols-1 gap-0 md:grid-cols-2 md:gap-x-10">
              <div className={fieldBase("name")}>
                <label htmlFor="name" className="eyebrow">Name</label>
                <input
                  id="name" name="name" type="text" autoComplete="name"
                  placeholder={contact.fields.name}
                  onFocus={() => setFocus("name")}
                  onBlur={() => setFocus(null)}
                  onChange={() => errors.name && setErrors(p => ({ ...p, name: undefined }))}
                  className="bg-transparent py-2 text-[17px] text-ink placeholder:text-ink-soft focus:outline-none"
                />
                {errors.name && <span className="font-mono text-[10px] text-red-500">{errors.name}</span>}
              </div>
              <div className={fieldBase("company")}>
                <label htmlFor="company" className="eyebrow">Company</label>
                <input
                  id="company" name="company" type="text" autoComplete="organization"
                  placeholder={contact.fields.company}
                  onFocus={() => setFocus("company")}
                  onBlur={() => setFocus(null)}
                  className="bg-transparent py-2 text-[17px] text-ink placeholder:text-ink-soft focus:outline-none"
                />
              </div>
              <div className={`${fieldBase("email")} md:col-span-2`}>
                <label htmlFor="email" className="eyebrow">Email</label>
                <input
                  id="email" name="email" type="email" autoComplete="email"
                  placeholder={contact.fields.email}
                  onFocus={() => setFocus("email")}
                  onBlur={() => setFocus(null)}
                  onChange={() => errors.email && setErrors(p => ({ ...p, email: undefined }))}
                  className="bg-transparent py-2 text-[17px] text-ink placeholder:text-ink-soft focus:outline-none"
                />
                {errors.email && <span className="font-mono text-[10px] text-red-500">{errors.email}</span>}
              </div>
              <div className={`${fieldBase("brief")} md:col-span-2`}>
                <label htmlFor="brief" className="eyebrow">Brief</label>
                <textarea
                  id="brief"
                  name="brief"
                  rows={5}
                  placeholder={contact.fields.brief}
                  onFocus={() => setFocus("brief")}
                  onBlur={() => setFocus(null)}
                  onChange={() => errors.brief && setErrors(p => ({ ...p, brief: undefined }))}
                  className="resize-none bg-transparent py-2 text-[17px] leading-relaxed text-ink placeholder:text-ink-soft focus:outline-none"
                />
                {errors.brief && <span className="font-mono text-[10px] text-red-500">{errors.brief}</span>}
              </div>
              <div className="mt-8 flex flex-col gap-4 border-t border-rule pt-6 md:col-span-2 md:flex-row md:items-center md:justify-between">
                <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-muted">
                  {status === "error" ? (
                    <span className="text-red-500">Failed to send — email us directly at{" "}
                      <a href={`mailto:${brand.email}`} className="underline underline-offset-4">{brand.email}</a>
                    </span>
                  ) : (
                    <>Or email —{" "}
                      <a href={`mailto:${brand.email}`} className="text-ink underline-offset-4 hover:underline">{brand.email}</a>
                    </>
                  )}
                </span>
                <button
                  type="submit"
                  disabled={status === "sending" || status === "sent"}
                  className="group inline-flex items-center gap-2 rounded-full border border-ink bg-ink px-7 py-3.5 font-mono text-[11px] uppercase tracking-[0.22em] text-canvas transition-all duration-200 hover:bg-transparent hover:text-ink disabled:opacity-70"
                >
                  <span>
                    {status === "sent" ? contact.buttonSent : status === "sending" ? contact.buttonSending : contact.buttonIdle}
                  </span>
                  {(status === "idle" || status === "error") && (
                    <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                  )}
                </button>
              </div>
            </div>
          </form>

          <aside className="flex flex-col gap-6 border-t border-rule pt-6 md:col-span-4 md:border-none md:pt-0">
            {contact.aside.map((group) => (
              <div key={group.title}>
                <span className="eyebrow">{group.title}</span>
                <ul className="mt-3 space-y-2 text-[15px] text-ink-muted">
                  {group.items.map((item) => (
                    <li key={item}>— {item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </aside>
        </div>
      </div>
    </section>
  );
}

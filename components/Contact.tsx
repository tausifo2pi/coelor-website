import content from "@/data/site-content.json";
import SectionHead from "@/components/SectionHead";
import ContactForm, { type ContactCopy } from "@/components/ContactForm";

/** Optional overrides let a landing page reuse the form with its own heading. */
export default function Contact({ num, headline, body }: { num?: string; headline?: string; body?: string } = {}) {
  const contact = { ...content.contact, ...(num && { num }), ...(headline && { headline }), ...(body && { body }) };
  const { fields, placeholders, buttonIdle, buttonSending, buttonError, success } = contact;
  const copy: ContactCopy = { fields, placeholders, buttonIdle, buttonSending, buttonError, success, email: content.brand.email };
  return (
    <section id="contact" aria-labelledby="contact-title" className="scroll-mt-16 bg-canvas2">
      <div className="mx-auto grid max-w-site grid-cols-1 gap-10 px-5 py-16 md:px-10 lg:grid-cols-[1fr_380px] lg:gap-24 lg:px-20 lg:py-[104px]">
        <div className="flex flex-col gap-8">
          <SectionHead id="contact-title" num={contact.num} eyebrow={contact.eyebrow} headline={contact.headline} body={contact.body} className="max-w-[640px]" />

          <ContactForm copy={copy} />
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

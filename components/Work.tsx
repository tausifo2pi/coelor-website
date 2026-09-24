import content from "@/data/site-content.json";
import SectionHead from "@/components/SectionHead";
import Logo from "@/components/Logo";
import { BrandLogo, Icon } from "@/components/icons";

function Chip({ slug, name }: { slug: string; name: string }) {
  return (
    <li className="flex items-center gap-2 rounded-[8px] border border-rule bg-white/[0.03] px-2.5 py-1.5 text-[12px] font-medium text-ink/80">
      <BrandLogo slug={slug} name={name} size={14} />
      {name}
    </li>
  );
}

function OpsCase() {
  const { ops } = content.work;
  return (
    <article className="panel flex flex-col gap-6 p-6 md:p-7">
      <header className="flex flex-col gap-2">
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-rule bg-white/[0.04] px-3 py-1 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-muted">
          <Icon name="refresh" size={12} />
          {ops.label}
        </span>
        <h3 className="text-[20px] font-semibold leading-[1.25] text-ink md:text-[22px]">{ops.title}</h3>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-3 rounded-[12px] border border-rule bg-white/[0.02] p-4">
          <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-soft">{ops.beforeLabel}</span>
          <ul className="flex flex-col gap-2">
            {ops.before.map((b) => (
              <li key={b} className="flex gap-2.5 text-[13px] leading-[1.5] text-ink-muted">
                <span className="mt-[8px] h-1 w-1 shrink-0 rounded-full bg-ink-soft" />
                {b}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-3 rounded-[12px] border border-ok/25 bg-ok/[0.06] p-4">
          <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#8fe7c2]">{ops.afterLabel}</span>
          <ul className="flex flex-col gap-2">
            {ops.after.map((a) => (
              <li key={a} className="flex gap-2.5 text-[13px] leading-[1.5] text-ink">
                <Icon name="check" size={14} strokeWidth={2.4} className="mt-[3px] shrink-0 text-ok" />
                {a}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* one-line flow */}
      <div className="mt-auto flex flex-col gap-3 border-t border-rule pt-5 lg:flex-row lg:items-center lg:gap-4">
        <ul className="flex flex-wrap gap-2">
          {ops.flowFrom.map((f) => (
            <Chip key={f.slug} {...f} />
          ))}
        </ul>
        <span className="hidden text-ink-soft lg:block" aria-hidden>
          <Icon name="arrow-right" size={14} />
        </span>
        <span className="inline-flex w-fit items-center gap-2 rounded-[8px] border border-accent/30 bg-accent/10 px-2.5 py-1.5">
          <Logo height={12} />
        </span>
        <span className="hidden text-ink-soft lg:block" aria-hidden>
          <Icon name="arrow-right" size={14} />
        </span>
        <ul className="flex flex-wrap gap-2">
          {ops.flowTo.map((f) => (
            <Chip key={f.slug} {...f} />
          ))}
        </ul>
      </div>
    </article>
  );
}

function AiCase() {
  const { ai } = content.work;
  return (
    <article className="panel relative flex flex-col gap-6 overflow-hidden p-6 md:p-7">
      <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-accent/10 blur-3xl" aria-hidden />
      <header className="relative flex flex-col gap-2">
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.08em] text-accent">
          <Icon name="activity" size={12} />
          {ai.label}
        </span>
        <h3 className="text-[20px] font-semibold leading-[1.25] text-ink md:text-[22px]">{ai.title}</h3>
        <p className="text-[14px] leading-[1.6] text-ink-muted">{ai.body}</p>
      </header>

      {/* chat mock */}
      <ul className="relative flex flex-col gap-2.5 rounded-[12px] border border-rule bg-canvas p-4" aria-label="Example conversation">
        {ai.chat.map((m, i) => {
          const agent = m.from === "agent";
          return (
            <li key={i} className={`flex ${agent ? "justify-start" : "justify-end"}`}>
              <div className={`max-w-[85%] rounded-[14px] px-3.5 py-2.5 text-[13px] leading-[1.5] ${agent ? "rounded-bl-[4px] bg-white/[0.06] text-ink" : "rounded-br-[4px] bg-accent text-canvas"}`}>
                {m.image && (
                  <span className={`mb-2 flex h-14 w-20 items-center justify-center rounded-[8px] ${agent ? "bg-white/[0.08]" : "bg-canvas/20"}`} aria-label="photo">
                    <Icon name="package-x" size={18} className={agent ? "text-ink-soft" : "text-canvas/70"} />
                  </span>
                )}
                {m.text}
              </div>
            </li>
          );
        })}
      </ul>

      <ul className="relative grid grid-cols-1 gap-3 sm:grid-cols-2">
        {ai.caps.map((c) => (
          <li key={c.title} className="flex gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-accent/10 text-accent">
              <Icon name={c.icon} size={15} />
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="text-[14px] font-semibold text-ink">{c.title}</span>
              <span className="text-[13px] leading-[1.5] text-ink-muted">{c.body}</span>
            </span>
          </li>
        ))}
      </ul>
    </article>
  );
}

export default function Work() {
  const { work } = content;
  return (
    <section id="work" aria-labelledby="work-title" className="scroll-mt-16 bg-canvas2">
      <div className="mx-auto flex max-w-site flex-col gap-10 px-5 py-16 md:px-10 lg:gap-12 lg:px-20 lg:py-[104px]">
        <SectionHead id="work-title" num={work.num} eyebrow={work.eyebrow} headline={work.headline} body={work.body} />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
          <OpsCase />
          <AiCase />
        </div>
        <dl className="grid grid-cols-2 gap-6 border-t border-rule pt-8 lg:grid-cols-4">
          {work.stats.map((s) => (
            <div key={s.label} className="flex flex-col gap-1">
              <dd className="display text-[30px] text-ink lg:text-[36px]">{s.value}</dd>
              <dt className="text-[13px] text-ink-soft">{s.label}</dt>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

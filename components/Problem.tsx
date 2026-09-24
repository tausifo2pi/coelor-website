import content from "@/data/site-content.json";
import SectionHead from "@/components/SectionHead";
import { Icon } from "@/components/icons";

export default function Problem() {
  const { problem } = content;
  return (
    <section id="problem" aria-labelledby="problem-title" className="scroll-mt-16">
      <div className="mx-auto grid max-w-site grid-cols-1 gap-10 px-5 py-16 md:px-10 lg:grid-cols-[440px_1fr] lg:gap-24 lg:px-20 lg:py-[104px]">
        <SectionHead id="problem-title" num={problem.num} eyebrow={problem.eyebrow} headline={problem.headline} body={problem.body} className="lg:sticky lg:top-28 lg:self-start" />
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
          {problem.items.map((it) => (
            <li key={it.title} className="panel flex flex-col gap-4 p-6 transition-colors hover:border-rule-strong">
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-rule bg-white/[0.04] text-ink-muted">
                  <Icon name={it.icon} size={18} />
                </span>
                <span className="rounded-md bg-white/[0.05] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.06em] text-ink-soft">{it.tag}</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-[17px] font-semibold text-ink">{it.title}</span>
                <span className="text-[14px] leading-[1.55] text-ink-muted">{it.body}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

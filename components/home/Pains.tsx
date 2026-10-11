import content from "@/data/site-content.json";
import SectionHead from "@/components/SectionHead";
import { Icon } from "@/components/icons";

// "Sounds familiar?": six jobs sellers do by hand today, in our own words (never a forum quote), each with how often it
// comes back. Amber for the hand work, then one green line for what we do about it.

export default function Pains() {
  const { pains } = content;
  return (
    <section id="pains" aria-labelledby="pains-title" className="scroll-mt-16 border-t border-rule bg-canvas2">
      <div className="mx-auto flex max-w-site flex-col gap-10 px-5 py-16 md:px-10 lg:gap-12 lg:px-20 lg:py-[104px]">
        <SectionHead id="pains-title" num={pains.num} eyebrow={pains.eyebrow} headline={pains.headline} body={pains.body} className="max-w-[680px] [&_h2]:text-balance" />

        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-3">
          {pains.items.map((it) => (
            // how often sits top-right but comes last in the reading order, after the job itself
            <li key={it.title} className="grid grid-cols-[1fr_auto] content-start gap-x-3 gap-y-3 rounded-[14px] border border-rule bg-panel p-6">
              <span className="col-start-1 row-start-1 flex h-10 w-10 items-center justify-center rounded-[10px] border border-warn/25 bg-warn/10 text-warn" aria-hidden>
                <Icon name={it.icon} size={18} />
              </span>
              <h3 className="col-span-2 mt-1 text-[17px] font-semibold leading-[1.3] text-ink">{it.title}</h3>
              <p className="col-span-2 text-[14px] leading-[1.6] text-ink-muted md:text-[15px]">{it.body}</p>
              <span className="col-start-2 row-start-1 self-start whitespace-nowrap rounded-full border border-rule-strong px-2.5 py-1 font-mono text-[11px] text-ink-muted">
                {it.every}
              </span>
            </li>
          ))}
        </ul>

        <p className="flex items-start gap-3 rounded-[12px] border border-ok/25 bg-ok/[0.06] px-5 py-4 text-[15px] font-medium leading-[1.5] text-ink md:text-[16px]">
          <Icon name="check" size={16} strokeWidth={2.4} className="mt-[3px] shrink-0 text-ok" />
          {pains.footer}
        </p>
      </div>
    </section>
  );
}

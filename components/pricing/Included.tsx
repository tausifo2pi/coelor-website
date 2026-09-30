import SectionHead from "@/components/SectionHead";
import { Icon } from "@/components/icons";
import { pricing } from "./content";

// What every build includes, whatever its number of connections.
export default function Included() {
  const { included } = pricing;
  return (
    <section id="included" aria-labelledby="included-title" className="scroll-mt-20 border-t border-rule bg-canvas2">
      <div className="mx-auto flex max-w-site flex-col gap-10 px-5 py-16 md:px-10 lg:gap-12 lg:px-20 lg:py-[96px]">
        <SectionHead id="included-title" num={included.num} eyebrow={included.eyebrow} headline={included.headline} size="md" className="max-w-[640px] [&_h2]:text-balance" />
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-3">
          {included.items.map((it) => (
            <li key={it.title} className="panel flex flex-col gap-3 p-6">
              <span className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-accent/10 text-accent" aria-hidden>
                <Icon name={it.icon} size={16} />
              </span>
              <h3 className="text-[17px] font-semibold text-ink">{it.title}</h3>
              <p className="text-[14px] leading-[1.6] text-ink-muted">{it.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

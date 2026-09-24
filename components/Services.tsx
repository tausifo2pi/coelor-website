import content from "@/data/site-content.json";
import SectionHead from "@/components/SectionHead";
import { Icon } from "@/components/icons";

export default function Services() {
  const { services } = content;
  return (
    <section id="services" aria-labelledby="services-title" className="scroll-mt-16 bg-canvas2">
      <div className="mx-auto flex max-w-site flex-col gap-10 px-5 py-16 md:px-10 lg:gap-12 lg:px-20 lg:py-[104px]">
        <SectionHead id="services-title" num={services.num} eyebrow={services.eyebrow} headline={services.headline} body={services.body} />
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-3">
          {services.items.map((s) => (
            <li key={s.title} className="group panel flex flex-col justify-between gap-6 p-6 transition-[border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-rule-strong md:p-7">
              <div className="flex flex-col gap-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-accent/10 text-accent">
                  <Icon name={s.icon} size={19} />
                </span>
                <div className="flex flex-col gap-2">
                  <span className="text-[18px] font-semibold text-ink">{s.title}</span>
                  <span className="text-[14px] leading-[1.6] text-ink-muted">{s.body}</span>
                </div>
              </div>
              <span className="inline-flex items-center gap-2 border-t border-rule pt-4 font-mono text-[11px] text-ink-soft">
                <span className="h-1.5 w-1.5 rounded-full bg-ok" />
                {s.meta}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

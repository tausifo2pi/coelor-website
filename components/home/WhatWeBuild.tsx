import content from "@/data/site-content.json";
import SectionHead from "@/components/SectionHead";
import { Icon } from "@/components/icons";

// What we build, by job (stock, orders, listings, supplier files, photos, reports and alerts), each with the platforms
// it often runs on written out in words. The platform marks follow in their own section (Integrations.tsx, #connect).

export default function WhatWeBuild() {
  const { build } = content;
  return (
    <section id="build" aria-labelledby="build-title" className="scroll-mt-16">
      <div className="mx-auto flex max-w-site flex-col gap-10 px-5 pb-12 pt-16 md:px-10 lg:gap-12 lg:px-20 lg:pb-14 lg:pt-[104px]">
        <SectionHead id="build-title" num={build.num} eyebrow={build.eyebrow} headline={build.headline} body={build.body} className="max-w-[720px] [&_h2]:text-balance" />

        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-3">
          {build.groups.map((g) => (
            <li key={g.title} className="panel flex flex-col gap-3 p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-accent/10 text-accent" aria-hidden>
                <Icon name={g.icon} size={18} />
              </span>
              <h3 className="mt-1 text-[18px] font-semibold leading-[1.3] text-ink">{g.title}</h3>
              <p className="flex-1 text-[14px] leading-[1.6] text-ink-muted md:text-[15px]">{g.body}</p>
              <p className="flex gap-2 border-t border-rule pt-3 text-[13px] leading-[1.5] text-ink-soft">
                <Icon name="link" size={13} className="mt-[3px] shrink-0" />
                {g.on}
              </p>
            </li>
          ))}
        </ul>

        <p className="text-[14px] leading-[1.6] text-ink-soft">{build.note}</p>
      </div>
    </section>
  );
}

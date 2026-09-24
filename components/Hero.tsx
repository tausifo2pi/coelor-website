"use client";

import content from "@/data/site-content.json";
import HeroScene from "@/components/HeroScene";
import HeroPanels from "@/components/HeroPanels";
import { Icon } from "@/components/icons";

export default function Hero() {
  const { hero } = content;
  const d = (ms: number) => ({ "--d": `${ms}ms` } as React.CSSProperties);

  return (
    <section id="top" aria-labelledby="hero-title" className="relative overflow-hidden bg-canvas">
      <div className="hero-band">
        <HeroScene />
      </div>

      <div className="relative z-10 mx-auto grid max-w-site grid-cols-1 gap-12 px-5 pb-12 pt-[124px] md:px-10 md:pb-12 md:pt-[144px] lg:grid-cols-[minmax(0,600px)_1fr] lg:items-start lg:gap-16 lg:px-20 lg:pb-10 lg:pt-[164px]">
        <div className="flex flex-col">
          <h1 id="hero-title" className="rise-in display text-[42px] text-ink sm:text-[52px] lg:text-[62px]" style={d(120)}>
            {hero.headline}
          </h1>
          <p className="rise-in mt-5 max-w-[460px] text-[16px] leading-[1.55] text-ink-muted md:text-[18px]" style={d(240)}>
            {hero.sub}
          </p>
          <div className="rise-in mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4" style={d(340)}>
            <a href={hero.primaryCta.href} className="btn-primary">
              {hero.primaryCta.label}
              <Icon name="arrow-right" size={15} strokeWidth={2.4} />
            </a>
            <a href={hero.secondaryCta.href} className="btn-ghost">
              {hero.secondaryCta.label}
            </a>
          </div>
        </div>

        <div className="rise-in lg:pt-1" style={d(460)}>
          <HeroPanels />
        </div>
      </div>
    </section>
  );
}

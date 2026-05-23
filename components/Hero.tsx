"use client";

import content from "@/data/site-content.json";

function ChannelBadge({ label, i }: { label: string; i: number }) {
  const colors = ["#0084ff", "#25d366", "#e1306c"];
  return (
    <div className="flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-3 py-2">
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: colors[i % colors.length] }} />
      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-muted">
        {label}
      </span>
    </div>
  );
}

export default function Hero() {
  const { hero, labels, visuals } = content;

  return (
    <section
      id="top"
      className="relative min-h-screen overflow-hidden pb-20 pt-[108px] md:pb-24 md:pt-[132px]"
    >
      <div
        aria-hidden
        className="absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(circle at 72% 22%, rgba(0,255,180,0.16), transparent 28%), radial-gradient(circle at 18% 78%, rgba(0,132,255,0.16), transparent 26%)",
        }}
      />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-mint-2/40 to-transparent" />

      <div className="relative mx-auto max-w-[1280px] px-6 md:px-10">
        <div className="mb-8 flex items-center justify-between md:mb-12">
          <span className="eyebrow">{hero.eyebrow}</span>
          <span className="eyebrow hidden md:inline">{hero.label}</span>
        </div>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-center lg:gap-12">
          <div className="lg:col-span-6">
            <div className="mb-5 flex flex-wrap gap-2">
              {hero.chatDemo.channels.map((channel, i) => (
                <ChannelBadge key={channel} label={channel} i={i} />
              ))}
            </div>
            <h1 className="display max-w-[11ch] text-[52px] leading-[0.96] md:text-[86px] lg:text-[104px]">
              {hero.headline}
            </h1>
            <p className="mt-7 max-w-[48ch] text-[17px] leading-relaxed text-ink-muted md:text-[19px]">
              {hero.body}
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-5">
              <a
                href={hero.primaryCta.href}
                className="group inline-flex items-center gap-3 rounded-full border border-mint-2 bg-mint-2 px-6 py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-mint-ink shadow-[0_0_32px_-4px_rgba(0,255,180,0.65)] transition-colors duration-200 hover:bg-transparent hover:text-mint-2"
              >
                <span>{hero.primaryCta.label}</span>
                <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1">→</span>
              </a>
              <a
                href={hero.secondaryCta.href}
                className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-muted transition-colors duration-200 hover:text-ink"
              >
                {hero.secondaryCta.label} →
              </a>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="relative mx-auto max-w-[620px]">
              <img
                src={visuals.heroImage}
                alt={visuals.heroImageAlt}
                className="absolute -right-12 -top-16 hidden w-[560px] max-w-none rounded-[32px] border border-white/10 opacity-35 shadow-2xl lg:block"
              />
              <div className="absolute -left-4 top-10 hidden w-48 rotate-[-6deg] rounded-lg border border-rule bg-canvasElev p-4 shadow-2xl md:block">
                <span className="eyebrow">{hero.chatDemo.inboxTitle}</span>
                <div className="mt-4 space-y-3">
                  {hero.chatDemo.cards.map((card) => (
                    <div key={card.label} className="rounded-md border border-rule bg-canvas p-3">
                      <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">
                        {card.label}
                      </div>
                      <div className="mt-1 display text-[30px] text-mint-2">{card.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative ml-auto overflow-hidden rounded-[28px] border border-white/12 bg-[#10101b] p-3 shadow-[0_50px_140px_-45px_rgba(0,255,180,0.5)] md:w-[430px]">
                <div className="rounded-[22px] border border-rule bg-canvas">
                  <div className="flex items-center justify-between border-b border-rule px-4 py-3">
                    <div>
                      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-muted">
                        {hero.chatDemo.title}
                      </div>
                      <div className="mt-1 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-mint-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-mint-2" />
                        {hero.chatDemo.status}
                      </div>
                    </div>
                    <div className="grid h-9 w-9 place-items-center rounded-full bg-mint-2 text-[13px] font-semibold text-mint-ink">
                      {hero.chatDemo.aiBadge}
                    </div>
                  </div>

                  <div className="space-y-3 p-4">
                    {hero.chatDemo.messages.map((message, index) => {
                      const isBot = message.from === "bot";
                      return (
                        <div
                          key={`${message.text}-${index}`}
                          className={`flex ${isBot ? "justify-start" : "justify-end"}`}
                        >
                          <div
                            className={`max-w-[86%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed shadow-sm ${
                              isBot
                                ? "rounded-bl-sm border border-rule bg-canvasElev text-ink"
                                : "rounded-br-sm bg-mint-2 text-mint-ink"
                            }`}
                          >
                            {message.text}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="border-t border-rule p-4">
                    <div className="rounded-xl border border-rule bg-canvasElev p-4">
                      <div className="flex items-center justify-between gap-4">
                        <span className="eyebrow">{hero.chatDemo.order.title}</span>
                        <span className="rounded-full bg-mint-2 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-mint-ink">
                          {hero.chatDemo.order.readyLabel}
                        </span>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-3 font-mono text-[10px] uppercase tracking-[0.13em]">
                        <div className="col-span-2">
                          <div className="text-ink-soft">{hero.chatDemo.order.itemsLabel}</div>
                          <div className="mt-1 text-ink">{hero.chatDemo.order.items}</div>
                        </div>
                        <div className="col-span-2">
                          <div className="text-ink-soft">{hero.chatDemo.order.customerLabel}</div>
                          <div className="mt-1 text-ink">{hero.chatDemo.order.customer}</div>
                        </div>
                        <div className="rounded-lg border border-rule p-3">
                          <div className="text-ink-soft">{hero.chatDemo.order.paymentLabel}</div>
                          <div className="mt-1 text-mint-2">{hero.chatDemo.order.payment}</div>
                        </div>
                        <div className="rounded-lg border border-rule p-3">
                          <div className="text-ink-soft">{hero.chatDemo.order.courierLabel}</div>
                          <div className="mt-1 text-mint-2">{hero.chatDemo.order.courier}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-wrap items-baseline gap-x-8 gap-y-3 border-t border-rule pt-6 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-muted md:mt-18">
          <span className="text-ink-soft">{labels.builtFor} —</span>
          {hero.proof.map((item, index) => (
            <span key={item} className="contents">
              {index > 0 && <span className="opacity-40">·</span>}
              <span>{item}</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

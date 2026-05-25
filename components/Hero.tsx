"use client";

import content from "@/data/site-content.json";

export default function Hero() {
  const { hero, labels } = content;

  return (
    <section
      id="top"
      className="border-b border-rule bg-[#FAFAFA]"
      style={{ paddingTop: "68px" }}
    >
      <div className="mx-auto max-w-[1100px] px-6 md:px-10">
        <div className="grid grid-cols-1 gap-12 py-16 lg:grid-cols-12 lg:items-start lg:gap-10 lg:py-20">

          {/* Left: value prop */}
          <div className="lg:col-span-7">
            <div className="mb-5 flex flex-wrap gap-2">
              {[
                { label: "Messenger", dot: "#0084ff" },
                { label: "WhatsApp", dot: "#25d366" },
                { label: "Instagram", dot: "#e1306c" },
              ].map((ch) => (
                <span
                  key={ch.label}
                  className="inline-flex items-center gap-2 rounded-full border border-rule bg-canvas px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted"
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: ch.dot }} />
                  {ch.label}
                </span>
              ))}
            </div>

            <h1 className="display text-[36px] leading-[1.04] md:text-[48px] lg:text-[54px]">
              {hero.headline}
            </h1>

            <p className="mt-5 max-w-[44ch] text-[15px] leading-[1.7] text-ink-muted">
              {hero.body}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href={hero.primaryCta.href}
                className="inline-flex items-center gap-2 rounded-md bg-ink px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.14em] text-canvas hover:opacity-80"
              >
                {hero.primaryCta.label} →
              </a>
              <a
                href={hero.secondaryCta.href}
                className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-muted hover:text-ink"
              >
                {hero.secondaryCta.label}
              </a>
            </div>
          </div>

          {/* Right: chat demo */}
          <div className="lg:col-span-5">
            <div className="overflow-hidden rounded-2xl border border-rule bg-canvas shadow-[0_4px_32px_-4px_rgba(0,0,0,0.1)]">

              {/* App chrome */}
              <div className="flex items-center gap-3 border-b border-rule bg-canvasElev px-4 py-2.5">
                <div className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-rule-strong" />
                  <span className="h-2.5 w-2.5 rounded-full bg-rule-strong" />
                  <span className="h-2.5 w-2.5 rounded-full bg-rule-strong" />
                </div>
                <span className="flex-1 text-center font-mono text-[9px] uppercase tracking-[0.18em] text-ink-soft">
                  {hero.chatDemo.title}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="active-dot h-1.5 w-1.5 rounded-full bg-mint-2" />
                  <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-mint-2">
                    {hero.chatDemo.status}
                  </span>
                </div>
              </div>

              {/* Body: stats col + chat col */}
              <div className="grid grid-cols-[88px_1fr]">

                {/* Stats column */}
                <div className="border-r border-rule bg-[#f7faf9] px-3 py-4">
                  <span className="mb-4 block font-mono text-[8px] uppercase tracking-[0.16em] text-ink-soft">
                    {hero.chatDemo.inboxTitle}
                  </span>
                  {hero.chatDemo.cards.map((card) => (
                    <div key={card.label} className="mb-4">
                      <div className="display text-[22px] leading-none text-mint-2">{card.value}</div>
                      <div className="mt-1 font-mono text-[8px] uppercase leading-tight tracking-[0.12em] text-ink-soft">
                        {card.label}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Chat column */}
                <div className="p-3.5">
                  <div className="space-y-2">
                    {hero.chatDemo.messages.map((msg, i) => {
                      const isBot = msg.from === "bot";
                      return (
                        <div key={i} className={`flex ${isBot ? "justify-start" : "justify-end"}`}>
                          <div
                            className={`max-w-[86%] rounded-xl px-3 py-2 text-[12px] leading-snug ${
                              isBot
                                ? "rounded-bl-sm bg-canvasElev text-ink"
                                : "rounded-br-sm bg-[#dcfce7] text-[#166534]"
                            }`}
                          >
                            {msg.text}
                          </div>
                        </div>
                      );
                    })}

                    {/* Typing indicator */}
                    <div className="flex justify-start">
                      <div className="flex items-center gap-1 rounded-xl rounded-bl-sm bg-canvasElev px-3 py-2.5">
                        <span className="typing-dot" />
                        <span className="typing-dot" style={{ animationDelay: "0.18s" }} />
                        <span className="typing-dot" style={{ animationDelay: "0.36s" }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order draft footer */}
              <div className="border-t border-rule bg-canvasElev px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-ink-muted">
                    {hero.chatDemo.order.title}
                  </span>
                  <span className="rounded-full bg-mint-2 px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.1em] text-mint-ink">
                    {hero.chatDemo.order.readyLabel}
                  </span>
                  <span className="mx-1 text-ink-soft">·</span>
                  <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink">{hero.chatDemo.order.items}</span>
                  <span className="text-ink-soft">·</span>
                  <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink">{hero.chatDemo.order.customer}</span>
                  <span className="text-ink-soft">·</span>
                  <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-mint-2">{hero.chatDemo.order.payment}</span>
                  <span className="text-ink-soft">·</span>
                  <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-mint-2">{hero.chatDemo.order.courier}</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

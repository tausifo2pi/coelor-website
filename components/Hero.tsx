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
            <div className="rounded-xl border border-rule bg-canvas shadow-sm">

              {/* Chat header */}
              <div className="flex items-center justify-between border-b border-rule px-4 py-3">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted">
                    {hero.chatDemo.title}
                  </p>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="active-dot h-1.5 w-1.5 rounded-full bg-mint-2" />
                    <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-mint-2">
                      {hero.chatDemo.status}
                    </span>
                  </div>
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ink font-mono text-[10px] font-semibold text-canvas">
                  {hero.chatDemo.aiBadge}
                </div>
              </div>

              {/* Messages */}
              <div className="space-y-2.5 p-4">
                {hero.chatDemo.messages.map((msg, i) => {
                  const isBot = msg.from === "bot";
                  return (
                    <div key={i} className={`flex ${isBot ? "justify-start" : "justify-end"}`}>
                      <div
                        className={`max-w-[82%] rounded-xl px-3.5 py-2.5 text-[13px] leading-snug ${
                          isBot
                            ? "rounded-bl-sm bg-canvasElev text-ink"
                            : "rounded-br-sm bg-ink text-canvas"
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  );
                })}

                {/* Typing indicator */}
                <div className="flex justify-start">
                  <div className="flex items-center gap-1 rounded-xl rounded-bl-sm bg-canvasElev px-4 py-3">
                    <span className="typing-dot" />
                    <span className="typing-dot" style={{ animationDelay: "0.18s" }} />
                    <span className="typing-dot" style={{ animationDelay: "0.36s" }} />
                  </div>
                </div>
              </div>

            </div>

            {/* Stat strip */}
            <div className="mt-3">
              <span className="mb-1.5 block px-1 font-mono text-[9px] uppercase tracking-[0.16em] text-ink-soft">
                {hero.chatDemo.inboxTitle}
              </span>
              <div className="grid grid-cols-3 divide-x divide-rule rounded-xl border border-rule bg-canvas">
                {hero.chatDemo.cards.map((card) => (
                  <div key={card.label} className="px-3 py-3 text-center">
                    <div className="font-mono text-[20px] font-semibold text-ink">{card.value}</div>
                    <div className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.12em] text-ink-soft">{card.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

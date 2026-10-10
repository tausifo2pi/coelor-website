"use client";

// The custom-build notice on the live demos (sneaker and store demos; lead-outreach PLAN_followups_custom_demo.md step
// 5a, user 2026-10-11): a reader must see at once that this is one business's heavily customised build, not a product
// they would get as it is: theirs is made for exactly their own platforms, rules and team, and the demo only shows how
// such a build behaves. Shown at the top of the first section until the reader closes it (remembered for the tab's
// session); closing it is a demo_action ("notice:dismiss"), never a cta (every demo_cta is a phone push). No "sample"
// or "real data" wording (memory: demo-no-sample-labels).
import { useEffect, useState } from "react";
import { ArrowRight, Wrench, X } from "lucide-react";
import type { DemoTracker } from "@/lib/demo/track";

const KEY = "coelor_demo_notice";

/** who: "one sneaker reseller"; setup: what their build is made around ("their StockX and Alias accounts, …"). */
export function CustomNotice({ who, setup, contact, t }: { who: string; setup: string; contact: string; t: DemoTracker | null }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    let seen = false;
    try { seen = sessionStorage.getItem(KEY) === "1"; } catch { /* storage blocked: show it */ }
    setOpen(!seen);
  }, []);
  if (!open) return null;
  const close = () => {
    setOpen(false);
    t?.action("notice", "dismiss");
    try { sessionStorage.setItem(KEY, "1"); } catch { /* storage blocked: it shows again next time */ }
  };
  return (
    <section aria-labelledby="notice-title" className="relative mb-5 overflow-hidden rounded-xl border border-[#c7d2fe] bg-[#eef2ff] p-4 md:p-5">
      <button type="button" onClick={close} className="absolute right-2.5 top-2.5 grid h-8 w-8 place-items-center rounded-lg text-[#6366f1] hover:bg-[#e0e7ff]" aria-label="Close the notice">
        <X size={16} />
      </button>
      <div className="flex gap-3.5 pr-8">
        <span className="hidden h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-[#4338ca] ring-1 ring-[#c7d2fe] sm:grid" aria-hidden>
          <Wrench size={19} />
        </span>
        <div className="min-w-0">
          <h2 id="notice-title" className="text-[15.5px] font-bold text-[#1e1b4b]">A custom build, not a product</h2>
          <p className="mt-1 max-w-[880px] text-[14px] leading-[1.6] text-[#312e81]">
            You&apos;re looking at {who}&apos;s own build, made around {setup}. It is heavily customised for them, so it will not match
            your setup, and it isn&apos;t meant to. Yours is built for exactly what you need: your platforms, your rules, your team.
            This demo only shows how a build like this behaves.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <a href={contact} onClick={() => t?.cta("get_this", "Plan my own build (notice)")} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#4338ca] px-3.5 text-[13.5px] font-semibold text-white hover:bg-[#3730a3]">
              Plan my own build<ArrowRight size={15} />
            </a>
            <button type="button" onClick={close} className="inline-flex h-9 items-center rounded-lg px-3 text-[13.5px] font-semibold text-[#4338ca] hover:bg-[#e0e7ff]">
              Got it, show me the demo
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

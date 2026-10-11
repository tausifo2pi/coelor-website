"use client";

// "Systems in this build": the "connections" section of both demos. Only the systems in the client's own build
// (lib/demo/clients.ts), each with how it is wired, the part built for this client and the rules that use it. No
// catalogue of platforms to switch on and no "Connect" tiles: that is what an off-the-shelf sync sells, and this is one
// business's build. The page ends with one card for the reader's own setup: a chip per platform opens the view-only
// dialog through ctx.connect, so the demo_connect signal (and its phone push) still fires.
import type { ReactNode } from "react";
import type { DemoClient, SystemSpec } from "@/lib/demo/clients";
import { monthDate, rulesUsing, shortName } from "@/lib/demo/rules";
import { BrandMark, Card, ago, hasMark } from "@/components/demo/ui";

/** A system's last run, from the jobs or rules that run on it; undefined where none maps (a sheet, the team chat). */
export type SystemHealth = { last: string };

type Chip = { slug: string; name: string };

// The platforms a reader of each demo may sell on or run on, for "Your setup is different". The boutique demo leaves
// out the sneaker marketplaces (a boutique reader never sees sneaker words). A slug with no logo on the page (GOAT has
// none yet) is left out until it has one (hasMark).
const SETUP_CHIPS: Record<DemoClient["id"], Chip[]> = {
  sneaker: [
    { slug: "stockx", name: "StockX" }, { slug: "alias-goat", name: "Alias" }, { slug: "goat", name: "GOAT" }, { slug: "ebay", name: "eBay" },
    { slug: "shopify", name: "Shopify" }, { slug: "amazon", name: "Amazon" }, { slug: "tiktok-shop", name: "TikTok Shop" }, { slug: "walmart", name: "Walmart" },
    { slug: "etsy", name: "Etsy" }, { slug: "depop", name: "Depop" }, { slug: "poshmark", name: "Poshmark" }, { slug: "whatnot", name: "Whatnot" },
    { slug: "picqer", name: "Picqer" }, { slug: "shipstation", name: "ShipStation" }, { slug: "shipbob", name: "ShipBob" }, { slug: "quickbooks", name: "QuickBooks" },
    { slug: "google-sheets", name: "Google Sheets" }, { slug: "slack", name: "Slack" },
  ],
  boutique: [
    { slug: "shopify", name: "Shopify" }, { slug: "tiktok-shop", name: "TikTok Shop" }, { slug: "amazon", name: "Amazon" }, { slug: "walmart", name: "Walmart" },
    { slug: "etsy", name: "Etsy" }, { slug: "depop", name: "Depop" }, { slug: "poshmark", name: "Poshmark" }, { slug: "whatnot", name: "Whatnot" },
    { slug: "ebay", name: "eBay" }, { slug: "picqer", name: "Picqer" }, { slug: "shipstation", name: "ShipStation" }, { slug: "shipbob", name: "ShipBob" },
    { slug: "quickbooks", name: "QuickBooks" }, { slug: "google-sheets", name: "Google Sheets" }, { slug: "slack", name: "Slack" },
  ],
};

type Props = {
  client: DemoClient;
  health: (slug: string) => SystemHealth | undefined;
  now: number;
  /** the view-only dialog (ctx.connect): tracks demo_connect */
  connect: (slug: string, name: string, body?: string) => void;
};

export function Systems({ client, health, now, connect }: Props) {
  const chips = SETUP_CHIPS[client.id].filter((c) => hasMark(c.slug));
  return (
    <div className="flex flex-col gap-5">
      <p className="text-[13.5px] text-[#64748b]">Every system in the {client.name} build, how it is wired, and what was built into it for them.</p>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 min-[1400px]:grid-cols-3">
        {client.systems.map((s) => <SystemCard key={s.slug} s={s} client={client} health={health(s.slug)} now={now} />)}
      </div>
      <Card>
        <h2 className="text-[15px] font-semibold text-[#0f172a]">Your setup is different</h2>
        <p className="mt-0.5 text-[13px] text-[#64748b]">Tell us what you use: each one is built into your own setup.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {chips.map((c) => (
            <button
              key={c.slug}
              type="button"
              onClick={() => connect(c.slug, c.name, `${c.name} in your own build: tell us how you use it and we wire it to your rules.`)}
              className="inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-full border border-[#e3e6eb] bg-white pl-1 pr-3.5 text-[13px] font-medium text-[#334155] transition-colors hover:border-[#cbd5e1] hover:bg-[#f8fafc] hover:text-[#0f172a]"
            >
              <BrandMark slug={c.slug} name={c.name} size={26} className="!rounded-full" />
              {c.name}
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  // phones: the label over its value; wider: label and value side by side
  return (
    <div className="flex min-w-0 flex-col gap-0.5 sm:grid sm:grid-cols-[132px_minmax(0,1fr)] sm:gap-3">
      <dt className="text-[11.5px] font-semibold uppercase tracking-[0.05em] text-[#94a3b8] sm:pt-[2px] sm:text-[12px] sm:normal-case sm:tracking-normal sm:font-medium">{label}</dt>
      <dd className="min-w-0 text-[13px] leading-[1.5] text-[#0f172a]">{children}</dd>
    </div>
  );
}

function SystemCard({ s, client, health, now }: { s: SystemSpec; client: DemoClient; health?: SystemHealth; now: number }) {
  const rules = rulesUsing(client, s.slug);
  return (
    <Card className="flex min-w-0 flex-col gap-3.5 !p-4 sm:!p-5">
      <div className="flex min-w-0 items-center gap-3">
        <BrandMark slug={s.slug} name={s.name} size={44} />
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold leading-tight text-[#0f172a]">{s.name}</p>
          <p className="mt-0.5 text-[12.5px] leading-snug text-[#64748b]">{s.kind}</p>
        </div>
      </div>
      <dl className="flex flex-col gap-2">
        <Row label="Wired">{s.how}</Row>
        <Row label={`Built for ${shortName(client)}`}>{s.custom}</Row>
        {rules.length > 0 && (
          <Row label="Rules">
            <span className="flex flex-wrap gap-1">
              {rules.map((r) => (
                <span key={r.code} title={r.name} className="inline-flex h-5 items-center rounded px-1 font-mono text-[11.5px] font-semibold tabular-nums" style={{ background: client.accentSoft, color: client.accentInk }}>
                  {r.code}
                </span>
              ))}
            </span>
          </Row>
        )}
      </dl>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-[#f1f3f5] pt-3 text-[12.5px] text-[#64748b]">
        {health ? (
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#16a34a]" aria-hidden />
            Running · last run {ago(health.last, now)}
          </span>
        ) : (
          <span />
        )}
        <span>In the build since {monthDate(s.since)}</span>
      </div>
    </Card>
  );
}

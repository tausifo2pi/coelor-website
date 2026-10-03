"use client";

// The sections of the live demo, read from the running sync (app/api/demo). Names, logos and accounts of the channels
// come from CHANNELS / STORES only, and every channel looks the same (a channel's `sample` flag is never shown).
// Anything that would change the store (connect, sync now, link, pull a listing, reports) opens the "view only" dialog.
import { useEffect, useRef, useState, type ReactNode } from "react";
import { getJson } from "@/lib/demo/get";
import { RoutinesCard } from "@/components/demo/SheetAssistant";
import { ArrowLeftRight, ArrowRight, Check, Lock, Plus, Settings2, TriangleAlert, Zap } from "lucide-react";
import { CHANNELS, PICQER, fromApi, type Channel as ChannelInfo } from "@/lib/demo/channels";
import { STORES, type Connection, type Job, type Linked, type Listing, type Overview, type Page, type Platform, type Sale, type SellPlatform, type Step, type StoreId } from "@/lib/demo/shape";
import type { DemoTracker } from "@/lib/demo/track";
import {
  Badge, BrandMark, Button, Card, CardHead, Empty, Logo, Pager, SearchInput, Skeleton, Tabs, Td, Th,
  ago, brandOf, clock, fmt, lag, type Tone,
} from "@/components/demo/ui";

export type Live<T> = { data: T; at: string; stale: boolean };
export type Ctx = {
  now: number;
  reload: number;
  t: DemoTracker | null;
  open: (id: string) => void;
  locked: (what: string, text?: string) => void;
  /** the view-only "Connect" dialog; `body` replaces the default text (a sales channel's) */
  connect: (slug: string, name: string, body?: string) => void;
  go: (section: SectionId) => void;
};
export type SectionId = "dashboard" | "connections" | "orders" | "products" | "listings" | "automations" | "assistant";

// the client's own channels (StockX, Alias), which have rules of their own on the automations page
const REAL = CHANNELS.filter((c) => fromApi(c.id));
// the other channels get the general rules
const OTHER = CHANNELS.filter((c) => !fromApi(c.id));

/* ---------- data ---------- */

function useLive<T>(url: string, ctx: Ctx, what: string) {
  const [state, setState] = useState<{ data: Live<T> | null; loading: boolean; failed: boolean }>({ data: null, loading: true, failed: false });
  const t = useRef(ctx.t);
  t.current = ctx.t;
  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true }));
    getJson<Live<T>>(url)
      .then((data) => alive && setState({ data, loading: false, failed: false }))
      .catch(() => {
        if (!alive) return;
        setState((s) => ({ ...s, loading: false, failed: true }));
        t.current?.error(what);
      });
    return () => {
      alive = false;
    };
  }, [url, ctx.reload, what]);
  return state;
}

// a search box that asks the server once typing stops
function useDebounced(v: string, ms = 450) {
  const [d, setD] = useState(v);
  useEffect(() => {
    const id = setTimeout(() => setD(v), ms);
    return () => clearTimeout(id);
  }, [v, ms]);
  return d;
}

/** A platform's logo by its id (a channel of CHANNELS, or Picqer). */
function PLogo({ platform, size, className }: { platform: string; size: number; className?: string }) {
  const b = brandOf(platform);
  return <Logo slug={b.slug} name={b.name} size={size} className={className} />;
}

const STEP_TONE: Record<Step["kind"], Tone> = { stock: "green", pulled: "violet", restock: "blue", flag: "amber" };

function Steps({ steps }: { steps: Step[] }) {
  if (!steps.length) return <span className="text-[13px] text-[#94a3b8]">Recorded</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {steps.map((s) => (
        <Badge key={s.kind} tone={STEP_TONE[s.kind]}>
          {s.kind === "flag" ? <TriangleAlert size={12} /> : <Check size={12} strokeWidth={2.6} />}
          {s.text}
        </Badge>
      ))}
    </div>
  );
}

function stateTone(state: string): Tone {
  return state === "Cancelled" ? "red" : state === "Being checked" ? "amber" : "green";
}

function Failed({ children = "Live data could not be loaded just now. It retries on the next refresh." }: { children?: ReactNode }) {
  return <Empty>{children}</Empty>;
}

/* ---------- dashboard ---------- */

/** "StockX EU · StockX US", or "1 store" when the only account is the channel itself */
function accountsText(c: ChannelInfo): string {
  if (c.accounts.length === 1 && c.accounts[0].label === c.name) return `1 ${/store|shop/i.test(c.role) ? "store" : "account"}`;
  return c.accounts.map((a) => a.label).join(" · ");
}

const connOf = (ov: Overview, platform: string): Connection | undefined => ov.connections.find((c) => c.platform === platform);

function HubChannel({ c, conn, cadence = false }: { c: ChannelInfo; conn?: Connection; cadence?: boolean }) {
  const healthy = conn ? conn.healthy : true;
  return (
    <div className="flex min-w-0 flex-col gap-2.5 rounded-xl border border-[#e3e6eb] bg-white p-3.5">
      <div className="flex min-w-0 items-center gap-3">
        <Logo slug={c.logo} name={c.name} size={40} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-[15px] font-semibold">{c.name}</span>
            <Badge tone={healthy ? "green" : "amber"} dot>{healthy ? "Connected" : "Catching up"}</Badge>
          </div>
          <p className="mt-0.5 truncate text-[12.5px] text-[#64748b]">{accountsText(c)}</p>
        </div>
      </div>
      {cadence && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] font-semibold">
          <ArrowLeftRight size={13} className="text-[#94a3b8]" />
          <span className="inline-flex items-center gap-1 text-[#15803d]">{c.realtime && <Zap size={12} />}Orders in · {c.ordersEvery}</span>
          <span className="text-[#cbd5e1]">·</span>
          <span className="text-[#6d28d9]">Sold out → pulled</span>
        </div>
      )}
    </div>
  );
}

function Spoke({ c }: { c: ChannelInfo }) {
  return (
    <div className="flex min-w-0 flex-col items-center justify-center gap-1 px-1.5">
      <span className="inline-flex items-center gap-1 whitespace-nowrap text-[11.5px] font-semibold text-[#15803d]">{c.realtime && <Zap size={11} />}Orders · {c.ordersEvery}</span>
      <span className="flex w-full items-center text-[#94a3b8]">
        <span className="h-0 flex-1 border-t-2 border-dashed border-[#cbd5e1]" />
        <ArrowLeftRight size={14} className="mx-1 shrink-0" />
        <span className="h-0 flex-1 border-t-2 border-dashed border-[#cbd5e1]" />
      </span>
      <span className="whitespace-nowrap text-[11.5px] font-semibold text-[#6d28d9]">Sold out → pulled</span>
    </div>
  );
}

function PicqerHub({ ov, wide }: { ov: Overview; wide: boolean }) {
  const conn = connOf(ov, "picqer");
  const healthy = conn ? conn.healthy : true;
  return (
    <div className={`flex min-w-0 rounded-xl border border-[#bfdbfe] bg-[#f8fbff] p-4 ${wide ? "h-full flex-col items-center justify-center gap-2 text-center" : "items-center gap-3"}`}>
      <Logo slug={PICQER.logo} name={PICQER.name} size={wide ? 56 : 48} />
      <div className="min-w-0">
        <div className={`flex flex-wrap items-center gap-2 ${wide ? "justify-center" : ""}`}>
          <span className="text-[16px] font-semibold">{PICQER.name}</span>
          <Badge tone={healthy ? "green" : "amber"} dot>{healthy ? "Connected" : "Catching up"}</Badge>
        </div>
        <p className="mt-0.5 text-[13px] text-[#64748b]">Warehouse · counts the stock</p>
        <p className="text-[13px] text-[#64748b]">{fmt(ov.kpis.products.total)} products · 1 warehouse</p>
      </div>
    </div>
  );
}

function Hub({ ov }: { ov: Overview }) {
  const half = Math.ceil(CHANNELS.length / 2);
  const left = CHANNELS.slice(0, half);
  const right = CHANNELS.slice(half);
  const rows = Math.max(left.length, right.length, 1);
  return (
    <>
      {/* wide screens: Picqer in the middle, the channels around it */}
      <div className="hidden grid-cols-[minmax(0,1fr)_132px_minmax(210px,0.85fr)_132px_minmax(0,1fr)] gap-y-3 xl:grid">
        {left.map((c, i) => (
          <div key={c.id} className="contents">
            <div style={{ gridColumn: 1, gridRow: i + 1 }} className="flex flex-col justify-center"><HubChannel c={c} conn={connOf(ov, c.id)} /></div>
            <div style={{ gridColumn: 2, gridRow: i + 1 }} className="flex"><Spoke c={c} /></div>
          </div>
        ))}
        <div style={{ gridColumn: 3, gridRow: `1 / span ${rows}` }}><PicqerHub ov={ov} wide /></div>
        {right.map((c, i) => (
          <div key={c.id} className="contents">
            <div style={{ gridColumn: 4, gridRow: i + 1 }} className="flex"><Spoke c={c} /></div>
            <div style={{ gridColumn: 5, gridRow: i + 1 }} className="flex flex-col justify-center"><HubChannel c={c} conn={connOf(ov, c.id)} /></div>
          </div>
        ))}
      </div>
      {/* smaller screens: Picqer first, then the channels */}
      <div className="flex flex-col gap-3 xl:hidden">
        <PicqerHub ov={ov} wide={false} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {CHANNELS.map((c) => <HubChannel key={c.id} c={c} conn={connOf(ov, c.id)} cadence />)}
        </div>
      </div>
    </>
  );
}

function Kpi({ label, value, sub, children }: { label: string; value: ReactNode; sub?: ReactNode; children?: ReactNode }) {
  return (
    <Card className="flex flex-col gap-1">
      <span className="text-[13px] font-medium text-[#64748b]">{label}</span>
      <span className="text-[28px] font-bold leading-tight tracking-[-0.02em] tabular-nums">{value}</span>
      {sub && <span className="text-[13px] leading-[1.5] text-[#64748b]">{sub}</span>}
      {children}
    </Card>
  );
}

function SaleRow({ s, ctx }: { s: Sale; ctx: Ctx }) {
  const b = brandOf(s.platform);
  const body = (
    <>
      <Logo slug={b.slug} name={b.name} size={36} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <span className="min-w-0 truncate text-[14px] font-semibold">{s.product}</span>
          <span className="shrink-0 text-[12.5px] text-[#64748b]">{ago(s.soldAt, ctx.now)}</span>
        </div>
        <p className="mt-0.5 text-[13px] text-[#64748b]">
          US {s.size || "–"} · Sold on {s.storeLabel}{s.ref && ` · ${s.ref}`}
          {lag(s.soldAt, s.syncedAt) && <> · in Picqer {lag(s.soldAt, s.syncedAt)} later</>}
        </p>
        <div className="mt-2">
          <Steps steps={s.steps} />
        </div>
      </div>
    </>
  );
  return s.detail ? (
    <button type="button" onClick={() => ctx.open(s.id)} className="flex w-full gap-3 px-5 py-3.5 text-left transition-colors hover:bg-[#f8fafc]">
      {body}
    </button>
  ) : (
    <div className="flex gap-3 px-5 py-3.5">{body}</div>
  );
}

const JOB_TONE: Record<Job["status"], Tone> = { ok: "green", running: "blue", late: "amber", error: "red" };
const JOB_TEXT: Record<Job["status"], string> = { ok: "On schedule", running: "Running now", late: "Late", error: "Retrying" };

const n0 = (r: Partial<Record<SellPlatform, number>>, id: SellPlatform) => r[id] ?? 0;

export function Dashboard({ ov, ctx }: { ov: Live<Overview> | null; ctx: Ctx }) {
  if (!ov) return <Card pad={false}><Skeleton rows={8} /></Card>;
  const k = ov.data.kpis;
  const day = CHANNELS.reduce((n, c) => n + n0(k.sales24h, c.id), 0);
  const linkedPct = k.products.total ? Math.round((k.products.linked / k.products.total) * 100) : 0;
  return (
    <div className="flex flex-col gap-5">
      <Card>
        <CardHead title="Your connected channels" sub="One stock count in Picqer, kept in step with every channel." />
        <Hub ov={ov.data} />
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Orders synced, last 24 h"
          value={`${fmt(day)}${k.sales24h.more ? "+" : ""}`}
          sub={CHANNELS.map((c) => `${fmt(n0(k.sales24h, c.id))} ${c.name}`).join(" · ")}
        />
        <Kpi label="Last order synced" value={ago(k.lastSale?.soldAt ?? null, ctx.now)} sub={k.lastSale ? `${k.lastSale.storeLabel} · ${k.lastSale.product}` : undefined} />
        <Kpi label="Products linked" value={fmt(k.products.linked)} sub={`of ${fmt(k.products.total)} in Picqer`}>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#eef0f3]">
            <div className="h-full rounded-full bg-[#2563eb]" style={{ width: `${linkedPct}%` }} />
          </div>
        </Kpi>
        <Kpi label="Automations" value={`${k.jobs.ok}/${k.jobs.total}`} sub="running on schedule" />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Card pad={false}>
          <div className="px-5 pt-5">
            <CardHead title="Latest orders" sub="Sold on a channel, then what the sync did" right={<Button small onClick={() => ctx.go("orders")}>All orders <ArrowRight size={14} /></Button>} />
          </div>
          <div className="divide-y divide-[#f1f3f5] border-t border-[#f1f3f5]">
            {ov.data.feed.slice(0, 8).map((s) => (
              <SaleRow key={s.id} s={s} ctx={ctx} />
            ))}
          </div>
        </Card>
        <div className="flex flex-col gap-5">
          <Card pad={false}>
            <div className="px-5 pt-5">
              <CardHead title="Automations" sub="Last run of each sync" right={<Button small onClick={() => ctx.go("automations")}>All <ArrowRight size={14} /></Button>} />
            </div>
            <ul className="divide-y divide-[#f1f3f5] border-t border-[#f1f3f5]">
              {ov.data.jobs.slice(0, 6).map((j) => (
                <li key={j.key} className="flex items-center gap-3 px-5 py-3">
                  <PLogo platform={j.platform} size={26} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-medium">{j.name}</p>
                    <p className="text-[12.5px] text-[#64748b]">{j.every} · {j.every.startsWith("real time") ? "last order " : ""}{ago(j.lastRun, ctx.now)}</p>
                  </div>
                  <Badge tone={JOB_TONE[j.status]} dot>{JOB_TEXT[j.status]}</Badge>
                </li>
              ))}
            </ul>
          </Card>
          <RoutinesCard ctx={ctx} onAll={() => ctx.go("assistant")} />
          <Card pad={false}>
            <div className="px-5 pt-5">
              <CardHead title="Since the sync started" />
            </div>
            <table className="w-full border-collapse">
              <thead>
                <tr><Th>Channel</Th><Th className="text-right">Orders</Th><Th className="text-right">Listings</Th></tr>
              </thead>
              <tbody>
                {CHANNELS.map((c) => (
                  <tr key={c.id}>
                    <Td className="!py-2.5">
                      <span className="flex min-w-0 items-center gap-2">
                        <Logo slug={c.logo} name={c.name} size={22} />
                        <span className="truncate font-medium">{c.name}</span>
                      </span>
                    </Td>
                    <Td className="!py-2.5 text-right font-semibold tabular-nums">{fmt(n0(k.salesTotal, c.id))}</Td>
                    <Td className="!py-2.5 text-right tabular-nums text-[#475569]">{fmt(n0(k.listings, c.id))}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="px-5 py-3 text-[12.5px] text-[#64748b]">Orders synced into Picqer, and listings the sync watches.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ---------- connections: one list of integrations, the connected ones first in each group ---------- */

type Tile = {
  slug: string;
  name: string;
  role: string;
  detail?: string;
  last?: string | null;
  state: "on" | "catching" | "off";
  /** the button on a connected tile (default: its settings, locked) */
  action?: { label: string; run: () => void };
  /** the Connect dialog's text */
  body?: string;
};

// more sales channels to connect: every one of these that is not one of CHANNELS already, in the order a sneaker
// reseller sells the most there (the resale marketplaces like StockX and GOAT first, then the social and resale apps,
// then the web stores). Only real marketplaces and stores: never a listing or stock-sync tool.
const MORE_CHANNELS = [
  { slug: "ebay", name: "eBay", role: "Authenticity Guarantee" },
  { slug: "grailed", name: "Grailed", role: "Streetwear marketplace" },
  { slug: "stadium-goods", name: "Stadium Goods", role: "Consignment marketplace" },
  { slug: "kicks-crew", name: "Kicks Crew", role: "Sneaker marketplace" },
  { slug: "klekt", name: "Klekt", role: "Sneaker marketplace (EU)" },
  { slug: "laced", name: "Laced", role: "Sneaker marketplace (UK)" },
  { slug: "tiktok-shop", name: "TikTok Shop", role: "Social shop and live selling" },
  { slug: "depop", name: "Depop", role: "Resale app" },
  { slug: "vinted", name: "Vinted", role: "Resale app (EU)" },
  { slug: "poshmark", name: "Poshmark", role: "Resale app" },
  { slug: "mercari", name: "Mercari", role: "Resale app" },
  { slug: "facebook-marketplace", name: "Facebook Marketplace", role: "Local and shipped sales" },
  { slug: "amazon", name: "Amazon", role: "Marketplace" },
  // the European marketplaces sneakers sell on (logos from data/platforms.json)
  { slug: "zalando", name: "Zalando", role: "Fashion marketplace (EU)" },
  { slug: "kaufland", name: "Kaufland", role: "Marketplace (DE, EU)" },
  { slug: "bol", name: "Bol", role: "Marketplace (NL, BE)" },
  { slug: "otto", name: "OTTO", role: "Marketplace (DE)" },
  { slug: "allegro", name: "Allegro", role: "Marketplace (PL)" },
  { slug: "cdiscount", name: "Cdiscount", role: "Marketplace (FR)" },
  { slug: "woocommerce", name: "WooCommerce", role: "Web store" },
  { slug: "wix", name: "Wix", role: "Web store" },
  { slug: "shopify", name: "Shopify", role: "Web store" },
  { slug: "whatnot", name: "Whatnot", role: "Live selling" },
].filter((m) => !CHANNELS.some((c) => c.logo === m.slug));

// other systems a reseller counts stock in (an ERP, a warehouse app, a fulfilment warehouse)
const MORE_STOCK = [
  { slug: "odoo", name: "Odoo", role: "ERP, stock and orders", body: "We connect Odoo as your stock count: every sale on every channel comes off it, and a size that sells out comes down everywhere." },
  { slug: "shiphero", name: "ShipHero", role: "Warehouse app", body: "We connect ShipHero for your store: orders from every channel go to the warehouse, and the stock it counts goes back to every channel." },
  { slug: "shipbob", name: "ShipBob", role: "Fulfilment warehouse", body: "We connect ShipBob for your store: orders from every channel go to their warehouse, and the stock they hold goes back to every channel." },
];

// more tools the sync can work with (shown to add, view only)
const MORE_TOOLS = [
  { slug: "excel", name: "Excel", role: "Stock and sales export" },
  { slug: "gemini", name: "Gemini", role: "AI assistant" },
  { slug: "gmail", name: "Gmail", role: "Order and alert emails" },
  { slug: "whatsapp", name: "WhatsApp", role: "Alerts to your phone" },
  { slug: "quickbooks", name: "QuickBooks", role: "Sales into the books" },
  { slug: "xero", name: "Xero", role: "Sales into the books" },
  { slug: "notion", name: "Notion", role: "Buying notes" },
  { slug: "airtable", name: "Airtable", role: "Product planning base" },
  { slug: "google-drive", name: "Google Drive", role: "Product photos" },
];

const CHANNEL_BODY = (name: string) =>
  `We connect ${name} for your store: every sale there comes off Picqer, and a size that sells out comes down everywhere.`;
const SHIP_BODY = (name: string) =>
  `We connect ${name} for your store: labels are made from the order in Picqer, and the tracking code goes back to the channel it sold on.`;
const AGENT_BODY = (name: string) =>
  `We set up an AI Sales Agent on ${name} for your store: it answers buyers from your live Picqer stock, and every sale it makes comes off the same stock count.`;

function IntegrationTile({ t, ctx }: { t: Tile; ctx: Ctx }) {
  const on = t.state !== "off";
  const status = on ? (
    <Badge tone={t.state === "on" ? "green" : "amber"} dot>{t.state === "on" ? "Connected" : "Catching up"}</Badge>
  ) : (
    <span className="min-w-0 truncate text-[12.5px] text-[#94a3b8]">Not connected</span>
  );
  const action =
    on && t.action ? (
      <Button small onClick={t.action.run}>{t.action.label}<ArrowRight size={14} /></Button>
    ) : on ? (
      <button
        type="button"
        onClick={() => ctx.locked(`settings:${t.slug}`, `${t.name} settings`)}
        title={`${t.name} settings`}
        aria-label={`${t.name} settings`}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-[#d9dde3] bg-white text-[#475569] hover:bg-[#f8fafc] hover:text-[#0f172a]"
      >
        <Settings2 size={15} />
      </button>
    ) : (
      <Button small onClick={() => ctx.connect(t.slug, t.slug === "custom" ? t.name.charAt(0).toLowerCase() + t.name.slice(1) : t.name, t.body)}><Plus size={14} />Connect</Button>
    );
  const details = (t.detail || t.last) && (
    <>
      {t.detail && <p className="text-[#334155]">{t.detail}</p>}
      {t.last && <p className="text-[#64748b]">Last sync {ago(t.last, ctx.now)}</p>}
    </>
  );
  // phones (one column): a compact row, the button at the right of the text. Wider: a tile, the status and button at
  // its foot. The text always has its own space (min-w-0), so a button never sits on it.
  return (
    <div className="flex min-w-0 flex-col rounded-xl border border-[#e3e6eb] bg-white p-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] min-[480px]:p-4">
      <div className="flex min-w-0 items-start gap-3">
        <BrandMark slug={t.slug} name={t.name} size={40} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14.5px] font-semibold leading-tight">{t.name}</p>
          <p className="mt-0.5 text-[12.5px] leading-snug text-[#64748b]">{t.role}</p>
          <div className="mt-1.5 flex flex-col gap-0.5 text-[12.5px] leading-snug min-[480px]:hidden">
            {details}
            {on && <div className="mt-1">{status}</div>}
          </div>
        </div>
        <div className="shrink-0 min-[480px]:hidden">{action}</div>
      </div>
      {details && <div className="mt-2.5 hidden flex-col gap-1 text-[12.5px] leading-snug min-[480px]:flex">{details}</div>}
      <div className="mt-auto hidden pt-3 min-[480px]:block">
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 border-t border-[#f1f3f5] pt-3">
          {status}
          {action}
        </div>
      </div>
    </div>
  );
}

export function Connections({ ov, ctx }: { ov: Live<Overview> | null; ctx: Ctx }) {
  if (!ov) return <Card pad={false}><Skeleton rows={8} /></Card>;
  const state = (platform: Platform): Tile["state"] => {
    const c = connOf(ov.data, platform);
    return !c || c.healthy ? "on" : "catching";
  };
  // a channel's last sync: its connection's, or the newest run of its own jobs
  const last = (platform: Platform): string | null => {
    const c = connOf(ov.data, platform);
    if (c) return c.lastSync;
    return ov.data.jobs.filter((j) => j.platform === platform).reduce<string | null>((a, j) => (!a || j.lastRun > a ? j.lastRun : a), null);
  };

  // every group ends with the connection we build for a platform that is not listed
  const customTile = (what: string): Tile => ({
    slug: "custom", name: `Your own ${what}`, role: "Built for your setup, as required", detail: "Any platform with an API, or its exports", state: "off",
    body: `Not in the list? We build the connection your store needs: any ${what} with an API, or its exports where there is none, on the same Picqer stock and orders. Tell us what you use.`,
  });
  const groups: { title: string; sub: string; what: string; tiles: Tile[] }[] = [
    {
      title: "Sales channels",
      what: "sales channel",
      sub: "Every sale comes off one stock count",
      tiles: [
        ...CHANNELS.map<Tile>((c) => ({
          slug: c.logo, name: c.name, role: c.role, detail: accountsText(c), last: last(c.id), state: state(c.id),
        })),
        ...MORE_CHANNELS.map<Tile>((m) => ({ slug: m.slug, name: m.name, role: m.role, state: "off", body: CHANNEL_BODY(m.name) })),
      ],
    },
    {
      title: "Warehouse & stock",
      what: "stock system",
      sub: "Where the stock is counted",
      tiles: [
        { slug: PICQER.logo, name: PICQER.name, role: "Warehouse, counts the stock", detail: `1 warehouse · ${fmt(ov.data.kpis.products.total)} products`, last: last("picqer"), state: state("picqer") },
        ...MORE_STOCK.map<Tile>((m) => ({ ...m, state: "off" })),
      ],
    },
    {
      title: "Shipping",
      what: "carrier",
      sub: "How the orders go out",
      tiles: [
        { slug: "ups", name: "UPS", role: "Shipping labels and tracking", state: "off", body: SHIP_BODY("UPS") },
        { slug: "dhl", name: "DHL", role: "Shipping labels and tracking", state: "off", body: SHIP_BODY("DHL") },
        { slug: "fedex", name: "FedEx", role: "Shipping labels and tracking", state: "off", body: SHIP_BODY("FedEx") },
      ],
    },
    {
      title: "AI sales agents",
      what: "chat channel",
      sub: "Sell in DMs and chats from the same stock",
      tiles: [
        { slug: "instagram", name: "Instagram", role: "AI Sales Agent", detail: "Answers buyers in DMs with the sizes in stock", state: "off", body: AGENT_BODY("Instagram") },
        { slug: "tiktok-shop", name: "TikTok Shop", role: "AI Sales Agent", detail: "Answers buyers in chat with the sizes in stock", state: "off", body: AGENT_BODY("TikTok Shop") },
      ],
    },
    {
      title: "Tools",
      what: "tool",
      sub: "Sheets, alerts and AI. The assistant's routines post only here, for data safety",
      tiles: [
        {
          slug: "google-sheets", name: "Google Sheets", role: "Live stock sheet + consignment report", state: "on",
          action: { label: "View", run: () => { ctx.t?.action("open_assistant", "connections"); ctx.go("assistant"); } },
        },
        { slug: "discord", name: "Discord", role: "Alerts", detail: "Sold-out sizes, cancellations and the not-listed report", state: "on" },
        { slug: "openai", name: "OpenAI", role: "GPT reads product names", detail: "Finds the size and colour in every Picqer name", state: "on" },
        {
          slug: "slack", name: "Slack", role: "Alerts", state: "off",
          body: "We send the sync's alerts to Slack for your team: sold-out sizes pulled, cancelled orders put back, and the not-listed report.",
        },
        {
          slug: "claude", name: "Claude", role: "Use the assistant from Claude", detail: "Ask stock, orders and routines in the Claude app (beta, read-only)", state: "off",
          body: "View only in this demo. For your store we connect your sync to Claude, so your team asks it right in the Claude app: “Which sizes sold out today, and where?” It reads the same data as the assistant and posts only to your team's sheets and chat: it never changes listings, prices or stock.",
        },
        {
          slug: "chatgpt", name: "ChatGPT", role: "Use the assistant from ChatGPT", detail: "Ask stock, orders and routines in the ChatGPT app (beta, read-only)", state: "off",
          body: "View only in this demo. For your store we connect your sync to ChatGPT, so your team asks it right in the ChatGPT app: “Make me tomorrow's pickup sheet for 8:00.” It reads the same data as the assistant and posts only to your team's sheets and chat: it never changes listings, prices or stock.",
        },
        ...MORE_TOOLS.map<Tile>((m) => ({ slug: m.slug, name: m.name, role: m.role, state: "off", body: `We connect ${m.name} to the sync for your store: ${m.role.charAt(0).toLowerCase() + m.role.slice(1)}, from the same Picqer stock and orders.` })),
      ],
    },
  ];

  return (
    <div className="flex flex-col gap-7">
      {groups.map((g) => (
        <section key={g.title}>
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <h2 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[#64748b]">{g.title}</h2>
            <span className="text-[12.5px] text-[#94a3b8]">{g.sub}</span>
          </div>
          <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 min-[1400px]:grid-cols-5">
            {[...g.tiles, customTile(g.what)].map((t) => <IntegrationTile key={t.slug} t={t} ctx={ctx} />)}
          </div>
        </section>
      ))}
    </div>
  );
}

/* ---------- orders ---------- */

type PlatformFilter = "all" | SellPlatform;
const PLATFORM_TABS: { id: PlatformFilter; label: string; logo?: string }[] = [
  { id: "all", label: "All" },
  ...CHANNELS.map((c) => ({ id: c.id, label: c.name, logo: c.logo })),
];

function Channel({ platform, label }: { platform: string; label: string }) {
  const b = brandOf(platform);
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      <Logo slug={b.slug} name={b.name} size={22} />
      {label}
    </span>
  );
}

function useFilters(ctx: Ctx, section: string) {
  const [platform, setPlatform] = useState<PlatformFilter>("all");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const dq = useDebounced(q.trim());
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (dq) ctx.t?.action(`${section}_search`, dq.slice(0, 40));
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dq]);
  return {
    platform, q, dq, page,
    setQ,
    setPlatform: (v: PlatformFilter) => {
      setPlatform(v);
      setPage(1);
      ctx.t?.action(`${section}_filter`, v);
    },
    setPage: (p: number) => {
      setPage(p);
      ctx.t?.action(`${section}_page`, String(p));
    },
  };
}

const query = (o: Record<string, string | number | undefined>) =>
  new URLSearchParams(Object.entries(o).filter(([, v]) => v !== undefined && v !== "" && v !== "all").map(([k, v]) => [k, String(v)])).toString();

export function Orders({ ctx }: { ctx: Ctx }) {
  const f = useFilters(ctx, "orders");
  const { data, loading, failed } = useLive<Page<Sale>>(`/api/demo/sales?${query({ platform: f.platform, q: f.dq, page: f.page })}`, ctx, "sales");
  const rows = data?.data.rows ?? [];
  return (
    <Card pad={false}>
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5">
        <Tabs value={f.platform} options={PLATFORM_TABS} onChange={f.setPlatform} />
        <SearchInput value={f.q} onChange={f.setQ} placeholder="Search product or style code" />
      </div>
      <p className="px-5 pb-4 pt-3 text-[13px] text-[#64748b]">Every order, as it came in, and what the sync did with the stock. Click one for the product.</p>
      {loading && !data ? <Skeleton /> : failed && !data ? <Failed /> : !rows.length ? <Empty>No orders match this search.</Empty> : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full border-collapse">
              <thead>
                <tr><Th>Order</Th><Th>Product</Th><Th>Channel</Th><Th>Status</Th><Th>Sync result</Th><Th className="text-right">In Picqer</Th></tr>
              </thead>
              <tbody className={loading ? "opacity-60" : ""}>
                {rows.map((s) => (
                  <tr key={s.id} onClick={s.detail ? () => ctx.open(s.id) : undefined} className={s.detail ? "cursor-pointer hover:bg-[#f8fafc]" : ""}>
                    <Td><div className="font-medium tabular-nums">{s.ref || "–"}</div><div className="whitespace-nowrap text-[12.5px] text-[#64748b]">{clock(s.soldAt)}</div></Td>
                    <Td><div className="max-w-[300px] truncate font-medium">{s.product}</div><div className="text-[12.5px] text-[#64748b]">{s.style} · US {s.size}</div></Td>
                    <Td><Channel platform={s.platform} label={s.storeLabel} /></Td>
                    <Td><Badge tone={stateTone(s.state)}>{s.state}</Badge></Td>
                    <Td><Steps steps={s.steps} /></Td>
                    <Td className="whitespace-nowrap text-right text-[13px] text-[#64748b]">{lag(s.soldAt, s.syncedAt) ? `${lag(s.soldAt, s.syncedAt)} later` : "–"}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="divide-y divide-[#f1f3f5] border-t border-[#f1f3f5] md:hidden">
            {rows.map((s) => <SaleRow key={s.id} s={s} ctx={ctx} />)}
          </div>
          <Pager page={f.page} pages={data?.data.pages ?? 1} total={data?.data.total ?? 0} onPage={f.setPage} noun="orders synced" />
        </>
      )}
    </Card>
  );
}

/* ---------- products (links between Picqer and the channel accounts) ---------- */

const STORE_TABS: { id: StoreId; label: string; logo: string }[] = STORES.map((s) => ({ id: s.id, label: s.label, logo: brandOf(s.platform).slug }));

const GPT_TIP = "Size and colour read from the Picqer name by GPT";
/** GPT read the size or colour from the Picqer product's name */
const gptParsed = (r: { us?: string; eu?: string; color?: string }) => !!(r.us || r.eu || r.color);

function GptTag() {
  return (
    <span title={GPT_TIP} className="inline-flex h-5 shrink-0 cursor-help items-center gap-1 whitespace-nowrap rounded-md bg-[#f5f3ff] px-1.5 text-[11px] font-semibold text-[#6d28d9] ring-1 ring-inset ring-[#ddd6fe]">
      <span aria-hidden>✦</span>GPT
    </span>
  );
}

function LinkChips({ links }: { links: Linked["links"] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {links.map((l) => (
        <span key={l.store} className="inline-flex h-7 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-[#e3e6eb] bg-white pl-1 pr-2.5 text-[12.5px] font-medium">
          <PLogo platform={l.platform} size={20} className="!rounded-full" />
          {l.storeLabel}
        </span>
      ))}
    </div>
  );
}

export function Products({ ctx }: { ctx: Ctx }) {
  const [store, setStore] = useState<StoreId>(STORE_TABS[0].id);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const dq = useDebounced(q.trim());
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (dq) ctx.t?.action("products_search", dq);
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dq]);
  const { data, loading, failed } = useLive<Page<Linked>>(`/api/demo/linked?${query({ store, q: dq, page })}`, ctx, "linked");
  const rows = data?.data.rows ?? [];
  return (
    <Card pad={false}>
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5">
        <Tabs value={store} options={STORE_TABS} onChange={(v) => { setStore(v); setPage(1); ctx.t?.action("products_store", v); }} />
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          <SearchInput value={q} onChange={setQ} placeholder="Search style code or size" />
          <Button onClick={() => ctx.locked("link_listing", "Linking a listing by hand")}><Plus size={15} />Link</Button>
        </div>
      </div>
      <p className="px-5 pb-4 pt-3 text-[13px] text-[#64748b]">
        Each Picqer product is one size of one sneaker. The sync links it to the same size on every account, so one sale counts everywhere.
        <span className="mt-1.5 flex items-center gap-2"><GptTag /><span>GPT read the size and colour from the product name.</span></span>
      </p>
      {loading && !data ? <Skeleton /> : failed && !data ? <Failed /> : !rows.length ? <Empty>No linked products match this search.</Empty> : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[640px] border-collapse">
              <thead>
                <tr><Th>Picqer product</Th><Th className="hidden xl:table-cell">Colour</Th><Th>Size</Th><Th>Linked to</Th><Th className="text-right">Linked</Th></tr>
              </thead>
              <tbody className={loading ? "opacity-60" : ""}>
                {rows.map((r) => (
                  <tr key={r.id} onClick={r.detail ? () => ctx.open(r.id) : undefined} className={r.detail ? "cursor-pointer hover:bg-[#f8fafc]" : ""}>
                    <Td>
                      <div className="flex items-center gap-2.5">
                        <Logo slug={PICQER.logo} name={PICQER.name} size={24} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="whitespace-nowrap font-medium tabular-nums">{r.code}</span>
                            {gptParsed(r) && <GptTag />}
                          </div>
                          {r.name && <div className="max-w-[260px] truncate text-[12.5px] text-[#64748b]">{r.name}</div>}
                        </div>
                      </div>
                    </Td>
                    <Td className="hidden whitespace-nowrap text-[13.5px] text-[#334155] xl:table-cell">{r.color || "–"}</Td>
                    <Td className="whitespace-nowrap text-[13.5px]">US {r.us || "–"} · EU {r.eu || "–"}</Td>
                    <Td><LinkChips links={r.links} /></Td>
                    <Td className="whitespace-nowrap text-right text-[13px] text-[#64748b]">{ago(r.linkedAt, ctx.now)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* phones: one card per product */}
          <div className="divide-y divide-[#f1f3f5] border-t border-[#f1f3f5] md:hidden">
            {rows.map((r) => {
              const body = (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold tabular-nums">{r.code}</span>
                        {gptParsed(r) && <GptTag />}
                      </div>
                      {r.name && <p className="truncate text-[12.5px] text-[#64748b]">{r.name}</p>}
                    </div>
                    <span className="shrink-0 text-[12.5px] text-[#64748b]">{ago(r.linkedAt, ctx.now)}</span>
                  </div>
                  <p className="mt-1 text-[13px] text-[#334155]">US {r.us || "–"} · EU {r.eu || "–"}{r.color && ` · ${r.color}`}</p>
                  <div className="mt-2"><LinkChips links={r.links} /></div>
                </>
              );
              return r.detail ? (
                <button key={r.id} type="button" onClick={() => ctx.open(r.id)} className="block w-full px-5 py-3.5 text-left text-[14px] hover:bg-[#f8fafc]">{body}</button>
              ) : (
                <div key={r.id} className="px-5 py-3.5 text-[14px]">{body}</div>
              );
            })}
          </div>
          <Pager page={page} pages={data?.data.pages ?? 1} total={data?.data.total ?? 0} onPage={(p) => { setPage(p); ctx.t?.action("products_page", String(p)); }} noun="products linked to this account" />
        </>
      )}
    </Card>
  );
}

/* ---------- listings ---------- */

export function Listings({ ctx }: { ctx: Ctx }) {
  const f = useFilters(ctx, "listings");
  const { data, loading, failed } = useLive<Page<Listing>>(`/api/demo/listings?${query({ platform: f.platform, q: f.dq, page: f.page })}`, ctx, "listings");
  const rows = data?.data.rows ?? [];
  return (
    <Card pad={false}>
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5">
        <Tabs value={f.platform} options={PLATFORM_TABS} onChange={f.setPlatform} />
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          <SearchInput value={f.q} onChange={f.setQ} placeholder="Search product or style code" />
          <Button onClick={() => ctx.locked("sync_listings", "Syncing listings now")}>Sync now</Button>
          <Button onClick={() => ctx.locked("not_listed_report", "The not-listed report (a spreadsheet of stock in Picqer that is not listed yet, sent to your team chat)")}>Not-listed report</Button>
        </div>
      </div>
      <p className="px-5 pb-4 pt-3 text-[13px] text-[#64748b]">Listings on the channel accounts the sync watches. When a size sells out in Picqer, its listings come down.</p>
      {loading && !data ? <Skeleton /> : failed && !data ? <Failed /> : !rows.length ? <Empty>No listings match this search.</Empty> : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[640px] border-collapse">
              <thead>
                <tr><Th>Product</Th><Th>Style</Th><Th>Size</Th><Th>Channel</Th><Th className="text-right">Picked up</Th></tr>
              </thead>
              <tbody className={loading ? "opacity-60" : ""}>
                {rows.map((l) => (
                  <tr key={l.id}>
                    <Td><div className="max-w-[340px] truncate font-medium">{l.product}</div></Td>
                    <Td className="whitespace-nowrap text-[13.5px] tabular-nums text-[#334155]">{l.style}</Td>
                    <Td className="whitespace-nowrap text-[13.5px]">US {l.size}</Td>
                    <Td><Channel platform={l.platform} label={l.storeLabel} /></Td>
                    <Td className="whitespace-nowrap text-right text-[13px] text-[#64748b]">{ago(l.at, ctx.now)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* phones: one line per listing */}
          <ul className="divide-y divide-[#f1f3f5] border-t border-[#f1f3f5] md:hidden">
            {rows.map((l) => {
              const b = brandOf(l.platform);
              return (
                <li key={l.id} className="flex gap-3 px-5 py-3">
                  <Logo slug={b.slug} name={b.name} size={32} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <span className="min-w-0 truncate text-[14px] font-medium">{l.product}</span>
                      <span className="shrink-0 text-[12.5px] text-[#64748b]">{ago(l.at, ctx.now)}</span>
                    </div>
                    <p className="mt-0.5 text-[12.5px] text-[#64748b]">{l.style} · US {l.size} · {l.storeLabel}</p>
                  </div>
                </li>
              );
            })}
          </ul>
          <Pager page={f.page} pages={data?.data.pages ?? 1} total={data?.data.total ?? 0} onPage={f.setPage} noun="listings" />
        </>
      )}
    </Card>
  );
}

/* ---------- automations ---------- */

// "real" = the client's live channels together; "chat" = the team chat (Discord)
type Ends = Platform | "real" | "chat";
type Rule = { id: string; job: string | null; from: Ends; to: Ends; when: string; then: string; every?: string };

const AUTOMATIONS: Rule[] = [
  { id: "stockx-sale", job: "stockx-orders", from: "stockx", to: "picqer", when: "A pair sells on StockX", then: "Take one off the Picqer stock, from the bin with the most free stock" },
  { id: "alias-sale", job: "alias-orders", from: "alias", to: "picqer", when: "A pair sells on Alias", then: "Take one off the Picqer stock and confirm the order on Alias" },
  ...OTHER.map<Rule>((c) => ({ id: `${c.id}-sale`, job: `${c.id}-orders`, from: c.id, to: "picqer", when: `A sale comes in on ${c.name}`, then: "Take one off the Picqer stock, so every other channel sees it" })),
  { id: "last-pair", job: "alias-orders", from: "alias", to: "stockx", when: "The last pair sells on Alias", then: "Pull that size from StockX EU and StockX US" },
  { id: "sold-out", job: "zero-stock", from: "picqer", to: "real", when: "A size is sold out in Picqer", then: "Pull its listings on StockX and Alias, and tell the team chat" },
  ...OTHER.map<Rule>((c) => ({ id: `${c.id}-sold-out`, job: "zero-stock", from: "picqer", to: c.id, when: "A size sells out in Picqer", then: `Take it off ${c.name}, so it can't be sold twice` })),
  ...OTHER.map<Rule>((c) => ({ id: `${c.id}-stock`, job: `${c.id}-stock`, from: "picqer", to: c.id, when: "The Picqer stock changes", then: `Send the new stock level to ${c.name}` })),
  { id: "restock", job: "alias-restock", from: "alias", to: "picqer", when: "An Alias buyer cancels", then: "Put the pair back into stock, in the bin it came from" },
  { id: "new-product", job: "picqer-products", from: "picqer", to: "real", when: "A new product is added in Picqer", then: "Link it to the same size on StockX and Alias, by style code and size" },
  { id: "sx-listings", job: "stockx-products", from: "stockx", to: "picqer", when: "New listings on StockX", then: "Pick them up and link them to their Picqer product" },
  { id: "al-listings", job: "alias-listings", from: "alias", to: "picqer", when: "New listings on Alias", then: "Keep the active listings current, so a sold-out size can be pulled" },
  { id: "photos", job: "picqer-images", from: "picqer", to: "picqer", when: "A Picqer product has no photo", then: "Find the sneaker's product photo and add it in Picqer" },
  { id: "unmatched", job: null, from: "real", to: "picqer", when: "An order can't be matched to a product", then: "Flag it in the orders list for a look, and leave the stock as it is", every: "with every order" },
  { id: "not-listed", job: null, from: "picqer", to: "chat", when: "You ask for the not-listed report", then: "Send a spreadsheet of stock in Picqer that is not listed on StockX or Alias yet", every: "on demand" },
];

function End({ e }: { e: Ends }) {
  if (e === "chat") return <BrandMark slug="discord" name="Discord" size={32} />;
  if (e === "real") {
    return (
      <span className="flex -space-x-2">
        {REAL.map((c) => <Logo key={c.id} slug={c.logo} name={c.name} size={32} className="ring-2 ring-white" />)}
      </span>
    );
  }
  return <PLogo platform={e} size={32} />;
}

export function Automations({ ov, ctx }: { ov: Live<Overview> | null; ctx: Ctx }) {
  if (!ov) return <Card pad={false}><Skeleton rows={8} /></Card>;
  const jobs = new Map(ov.data.jobs.map((j) => [j.key, j]));
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[13.5px] text-[#64748b]">What the sync does on its own, and when each rule last ran.</p>
      {AUTOMATIONS.map((a) => {
        const j = a.job ? jobs.get(a.job) : undefined;
        if (a.job && !j) return null;
        const toggle = (cls: string) => (
          <button
            type="button"
            onClick={() => ctx.locked(`toggle:${a.id}`, "Switching an automation off")}
            className={`relative h-6 w-11 shrink-0 rounded-full bg-[#16a34a] ${cls}`}
            role="switch"
            aria-checked="true"
            aria-label={`${a.when}: on`}
          >
            <span className="absolute right-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow" />
          </button>
        );
        return (
          <Card key={a.id} className="flex flex-col gap-3 !p-4 xl:flex-row xl:items-center xl:gap-5">
            <div className="flex min-w-0 flex-1 flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-4">
              {/* phones: the two ends and the switch on one row, the rule under them at full width */}
              <div className="flex shrink-0 items-center justify-between gap-2 sm:w-[124px]">
                <div className="flex items-center gap-2">
                  <End e={a.from} />
                  <ArrowRight size={16} className="text-[#94a3b8]" />
                  <End e={a.to} />
                </div>
                {toggle("sm:hidden")}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[14.5px] font-semibold"><span className="text-[#64748b]">When</span> {a.when.charAt(0).toLowerCase() + a.when.slice(1)}</p>
                <p className="mt-0.5 text-[13.5px] text-[#334155]"><span className="font-semibold text-[#64748b]">Then</span> {a.then.charAt(0).toLowerCase() + a.then.slice(1)}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-[#f1f3f5] pt-3 xl:justify-end xl:border-0 xl:pt-0">
              <span className="text-[12.5px] text-[#64748b]">{j ? `${j.every} · ${j.every.startsWith("real time") ? "last order" : "ran"} ${ago(j.lastRun, ctx.now)}` : a.every}</span>
              {j && <Badge tone={JOB_TONE[j.status]} dot>{JOB_TEXT[j.status]}</Badge>}
              {toggle("hidden sm:block")}
            </div>
          </Card>
        );
      })}
      <p className="flex items-center gap-2 pt-1 text-[12.5px] text-[#64748b]"><Lock size={13} />Switches are locked in this demo, so nothing changes in the live store.</p>
    </div>
  );
}

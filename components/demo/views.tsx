"use client";

// The sections of the live demo, read from the running sync (app/api/demo). Names, logos and accounts of the channels
// come from CHANNELS / STORES only, and every channel looks the same (a channel's `sample` flag is never shown).
// Anything that would change the store (connect, sync now, link, pull a listing, reports) opens the "view only" dialog.
import { useEffect, useRef, useState, type ReactNode } from "react";
import { getJson } from "@/lib/demo/get";
import { RoutinesCard } from "@/components/demo/SheetAssistant";
import { ArrowLeftRight, ArrowRight, Check, Plus, TriangleAlert, Zap } from "lucide-react";
import { CHANNELS, PICQER, type Channel as ChannelInfo } from "@/lib/demo/channels";
import { NORTHVALE } from "@/lib/demo/clients";
import { STORES, type Connection, type Job, type Linked, type Listing, type Overview, type Page, type Sale, type SellPlatform, type Step, type StoreId } from "@/lib/demo/shape";
import { Running, SneakerTiles } from "@/components/demo/workspace/Tiles";
import type { DemoTracker } from "@/lib/demo/track";
import {
  Badge, Button, Card, CardHead, Empty, Logo, Pager, SearchInput, Skeleton, Tabs, Td, Th,
  ago, brandOf, clock, fmt, lag, type Tone,
} from "@/components/demo/ui";
import { Rules, type RuleRun } from "@/components/demo/workspace/Rules";
import { Systems, type SystemHealth } from "@/components/demo/workspace/Systems";

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
export type SectionId = "dashboard" | "connections" | "orders" | "products" | "listings" | "automations" | "assistant" | "build" | "pricing";

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
            <Running ok={healthy} />
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
          <Running ok={healthy} />
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

// "5 Jan 2026": the day the client's build went live
const liveSince = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

export function Dashboard({ ov, ctx }: { ov: Live<Overview> | null; ctx: Ctx }) {
  if (!ov) return <Card pad={false}><Skeleton rows={8} /></Card>;
  const k = ov.data.kpis;
  // the owner's tiles first (what needs doing today), then the channels the build runs
  return (
    <div className="flex flex-col gap-5">
      <SneakerTiles ov={ov.data} now={ctx.now} />

      <Card>
        <CardHead title="Channels in this build" sub="Picqer holds the one stock count; every channel follows it." />
        <Hub ov={ov.data} />
      </Card>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Card pad={false}>
          <div className="px-5 pt-5">
            <CardHead title="Latest orders" sub="Sold on a channel, then what the build did" right={<Button small onClick={() => ctx.go("orders")}>All orders <ArrowRight size={14} /></Button>} />
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
              <CardHead title="Automations" sub="Last run of each job" right={<Button small onClick={() => ctx.go("automations")}>All <ArrowRight size={14} /></Button>} />
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
              <CardHead title="Since the build went live" sub={`${liveSince(NORTHVALE.since)}, version 1.0`} />
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
            <p className="px-5 py-3 text-[12.5px] text-[#64748b]">Orders into Picqer, and the listings it watches.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ---------- systems in this build (the "connections" section) ---------- */

// a system's last sync: the newest run of the jobs on its platform; Picqer's is the newest of all, as every sale lands there
function systemHealth(ov: Live<Overview> | null, slug: string): SystemHealth | undefined {
  if (!ov) return undefined;
  const last = ov.data.jobs
    .filter((j) => slug === PICQER.logo || brandOf(j.platform).slug === slug)
    .reduce<string | null>((a, j) => (!a || j.lastRun > a ? j.lastRun : a), null);
  return last ? { last } : undefined;
}

export function Connections({ ov, ctx }: { ov: Live<Overview> | null; ctx: Ctx }) {
  return <Systems client={NORTHVALE} health={(slug) => systemHealth(ov, slug)} now={ctx.now} connect={ctx.connect} />;
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
      <p className="px-5 pb-4 pt-3 text-[13px] text-[#64748b]">Every order as it came in, and what the build did with the stock. Click one for the product.</p>
      {loading && !data ? <Skeleton /> : failed && !data ? <Failed /> : !rows.length ? <Empty>No orders match this search.</Empty> : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full border-collapse">
              <thead>
                <tr><Th>Order</Th><Th>Product</Th><Th>Channel</Th><Th>Status</Th><Th>What happened</Th><Th className="text-right">In Picqer</Th></tr>
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
          <Pager page={f.page} pages={data?.data.pages ?? 1} total={data?.data.total ?? 0} onPage={f.setPage} noun="orders in" />
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
        Each Picqer product is one size of one sneaker. The build links it to the same size on every account, so one sale counts everywhere.
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
          <Button onClick={() => ctx.locked("sync_listings", "Checking every listing by hand")}>Check now</Button>
          <Button onClick={() => ctx.locked("not_listed_report", "The not-listed report (a spreadsheet of stock in Picqer that is not listed yet, sent to your team chat)")}>Not-listed report</Button>
        </div>
      </div>
      <p className="px-5 pb-4 pt-3 text-[13px] text-[#64748b]">Listings on the channel accounts the build watches. When a size sells out in Picqer, its listings come down.</p>
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

/* ---------- custom rules (the "automations" section) ---------- */

// each rule shows the last run of the job it names (lib/demo/clients.ts `job`), as the overview has it
export function Automations({ ov, ctx }: { ov: Live<Overview> | null; ctx: Ctx }) {
  const jobs = new Map((ov?.data.jobs ?? []).map((j) => [j.key, j]));
  const run = (key: string): RuleRun | undefined => {
    const j = jobs.get(key);
    return j && { every: j.every, lastRun: j.lastRun, running: j.status === "running" };
  };
  return <Rules client={NORTHVALE} run={run} now={ctx.now} loading={!ov} t={ctx.t} />;
}

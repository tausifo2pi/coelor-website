"use client";

// The sections of the live demo. Every number and row is read live from the running sync (app/api/demo). Anything that
// would change the store (connect, sync now, link, pull a listing, reports) opens the "view only" dialog instead.
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowLeftRight, ArrowRight, Check, CircleCheck, Lock, Plus, Settings2, TriangleAlert } from "lucide-react";
import { SiDiscord } from "@icons-pack/react-simple-icons";
import type { Job, Linked, Listing, Overview, Page, Sale, Step, StoreId } from "@/lib/demo/shape";
import type { DemoTracker } from "@/lib/demo/track";
import { Badge, Button, Card, CardHead, Empty, LOGO_SLUG, Logo, Pager, SearchInput, Skeleton, Tabs, Td, Th, ago, clock, fmt, lag, type Tone } from "@/components/demo/ui";

export type Live<T> = { data: T; at: string; stale: boolean };
export type Ctx = {
  now: number;
  reload: number;
  t: DemoTracker | null;
  open: (id: string) => void;
  locked: (what: string, text?: string) => void;
  connect: (slug: string, name: string) => void;
  go: (section: SectionId) => void;
};
export type SectionId = "dashboard" | "connections" | "orders" | "products" | "listings" | "automations";

/* ---------- data ---------- */

function useLive<T>(url: string, ctx: Ctx, what: string) {
  const [state, setState] = useState<{ data: Live<T> | null; loading: boolean; failed: boolean }>({ data: null, loading: true, failed: false });
  const t = useRef(ctx.t);
  t.current = ctx.t;
  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true }));
    fetch(url, { headers: { accept: "application/json" } })
      .then((r) => (r.ok ? (r.json() as Promise<Live<T>>) : Promise.reject(r.status)))
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

const PLATFORM = {
  stockx: { name: "StockX", slug: LOGO_SLUG.stockx },
  alias: { name: "Alias", slug: LOGO_SLUG.alias },
  picqer: { name: "Picqer", slug: LOGO_SLUG.picqer },
} as const;

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

function FlowNode({ platform, sub, big = false }: { platform: keyof typeof PLATFORM; sub: string; big?: boolean }) {
  const p = PLATFORM[platform];
  return (
    <div className={`flex min-w-0 items-center gap-3 rounded-xl border bg-white p-4 lg:flex-1 lg:flex-col lg:gap-2 lg:py-5 lg:text-center ${big ? "border-[#bfdbfe] bg-[#f8fbff]" : "border-[#e3e6eb]"}`}>
      <Logo slug={p.slug} name={p.name} size={big ? 56 : 48} />
      <div className="min-w-0 flex-1 lg:flex-none">
        <div className="flex flex-wrap items-center gap-2 lg:justify-center">
          <span className="text-[16px] font-semibold">{p.name}</span>
          <Badge tone="green" dot>Connected</Badge>
        </div>
        <p className="mt-0.5 text-[13px] text-[#64748b]">{sub}</p>
      </div>
    </div>
  );
}

function FlowLink({ top, bottom }: { top: string; bottom: string }) {
  return (
    <div className="flex shrink-0 items-center gap-3 py-2 pl-7 lg:w-[140px] lg:flex-col lg:gap-1 lg:py-0 lg:pl-0">
      <span className="flex items-center text-[#94a3b8] lg:order-2">
        <span className="hidden h-px w-9 border-t-2 border-dashed border-[#cbd5e1] lg:block" />
        <ArrowLeftRight size={16} className="rotate-90 lg:mx-1 lg:rotate-0" />
        <span className="hidden h-px w-9 border-t-2 border-dashed border-[#cbd5e1] lg:block" />
      </span>
      <span className="text-[12px] font-semibold text-[#15803d] lg:order-1">{top}</span>
      <span className="text-[12px] font-semibold text-[#6d28d9] lg:order-3">{bottom}</span>
    </div>
  );
}

function Kpi({ label, value, sub, children }: { label: string; value: ReactNode; sub?: ReactNode; children?: ReactNode }) {
  return (
    <Card className="flex flex-col gap-1">
      <span className="text-[13px] font-medium text-[#64748b]">{label}</span>
      <span className="text-[28px] font-bold leading-tight tracking-[-0.02em] tabular-nums">{value}</span>
      {sub && <span className="text-[13px] text-[#64748b]">{sub}</span>}
      {children}
    </Card>
  );
}

function SaleRow({ s, ctx }: { s: Sale; ctx: Ctx }) {
  const p = PLATFORM[s.platform];
  const body = (
    <>
      <Logo slug={p.slug} name={p.name} size={36} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <span className="truncate text-[14px] font-semibold">{s.product}</span>
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

export function Dashboard({ ov, ctx }: { ov: Live<Overview> | null; ctx: Ctx }) {
  if (!ov) return <Card pad={false}><Skeleton rows={8} /></Card>;
  const k = ov.data.kpis;
  const day = k.sales24h.stockx + k.sales24h.alias;
  const linkedPct = k.products.total ? Math.round((k.products.linked / k.products.total) * 100) : 0;
  return (
    <div className="flex flex-col gap-5">
      <Card>
        <CardHead title="Your connected channels" sub="One stock count in Picqer, kept in step with every marketplace account." />
        <div className="flex flex-col items-stretch lg:flex-row lg:items-center">
          <FlowNode platform="stockx" sub="StockX EU and StockX US" />
          <FlowLink top="Sales in · every 5 min" bottom="Sold out → pulled" />
          <FlowNode platform="picqer" sub={`Counts the stock · ${fmt(k.products.total)} products`} big />
          <FlowLink top="Sales in · every 7 min" bottom="Last pair → pulled" />
          <FlowNode platform="alias" sub="Alias and Alias USA" />
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Orders synced, last 24 h" value={`${fmt(day)}${k.sales24h.more ? "+" : ""}`} sub={`${fmt(k.sales24h.stockx)} StockX · ${fmt(k.sales24h.alias)} Alias`} />
        <Kpi label="Last order synced" value={ago(k.lastSale?.soldAt ?? null, ctx.now)} sub={k.lastSale ? `${k.lastSale.storeLabel} · ${k.lastSale.product}` : undefined} />
        <Kpi label="Products linked" value={fmt(k.products.linked)} sub={`of ${fmt(k.products.total)} in Picqer`}>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#eef0f3]">
            <div className="h-full rounded-full bg-[#2563eb]" style={{ width: `${linkedPct}%` }} />
          </div>
        </Kpi>
        <Kpi label="Automations" value={`${k.jobs.ok}/${k.jobs.total}`} sub="running on schedule" />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Card pad={false}>
          <div className="px-5 pt-5">
            <CardHead title="Latest orders" sub="Sold on a marketplace, then what the sync did" right={<Button small onClick={() => ctx.go("orders")}>All orders <ArrowRight size={14} /></Button>} />
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
                  <Logo slug={PLATFORM[j.platform].slug} name={PLATFORM[j.platform].name} size={26} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-medium">{j.name}</p>
                    <p className="text-[12.5px] text-[#64748b]">{j.every} · {ago(j.lastRun, ctx.now)}</p>
                  </div>
                  <Badge tone={JOB_TONE[j.status]} dot>{JOB_TEXT[j.status]}</Badge>
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <CardHead title="Since the sync started" />
            <dl className="grid grid-cols-2 gap-4">
              <Stat label="StockX orders synced" value={fmt(k.salesTotal.stockx)} />
              <Stat label="Alias orders synced" value={fmt(k.salesTotal.alias)} />
              <Stat label="StockX listings watched" value={fmt(k.listings.stockx)} />
              <Stat label="Alias listings watched" value={fmt(k.listings.alias)} />
            </dl>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[12.5px] text-[#64748b]">{label}</dt>
      <dd className="mt-0.5 text-[20px] font-bold tabular-nums">{value}</dd>
    </div>
  );
}

/* ---------- connections ---------- */

const ADD = [
  { slug: "whatnot", name: "Whatnot", type: "Live selling" },
  { slug: "ebay", name: "eBay", type: "Marketplace" },
  { slug: "shopify", name: "Shopify", type: "Web store" },
  { slug: "woocommerce", name: "WooCommerce", type: "Web store" },
  { slug: "tiktok-shop", name: "TikTok Shop", type: "Marketplace" },
  { slug: "stadium-goods", name: "Stadium Goods", type: "Marketplace" },
  { slug: "grailed", name: "Grailed", type: "Marketplace" },
  { slug: "vinted", name: "Vinted", type: "Marketplace" },
  { slug: "depop", name: "Depop", type: "Marketplace" },
  { slug: "amazon", name: "Amazon", type: "Marketplace" },
  { slug: "bol", name: "Bol", type: "Marketplace" },
];

export function Connections({ ov, ctx }: { ov: Live<Overview> | null; ctx: Ctx }) {
  if (!ov) return <Card pad={false}><Skeleton rows={8} /></Card>;
  return (
    <div className="flex flex-col gap-6">
      <section>
        <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.06em] text-[#64748b]">Connected</h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {ov.data.connections.map((c) => {
            const p = PLATFORM[c.platform];
            return (
              <Card key={c.platform} className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <Logo slug={p.slug} name={p.name} size={48} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[17px] font-semibold">{c.name}</p>
                    <p className="text-[13px] text-[#64748b]">{c.role}</p>
                  </div>
                  <Badge tone={c.healthy ? "green" : "amber"} dot>{c.healthy ? "Connected" : "Catching up"}</Badge>
                </div>
                <ul className="flex flex-col gap-2">
                  {c.accounts.map((a) => (
                    <li key={a} className="flex items-center gap-2.5 rounded-lg border border-[#eef0f3] bg-[#fafbfc] px-3 py-2 text-[13.5px]">
                      <Logo slug={p.slug} name={p.name} size={20} />
                      <span className="flex-1 font-medium">{a}</span>
                      <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[#15803d]"><span className="h-1.5 w-1.5 rounded-full bg-current" />Active</span>
                    </li>
                  ))}
                </ul>
                <ul className="flex flex-col gap-1.5">
                  {c.syncs.map((s) => (
                    <li key={s} className="flex gap-2 text-[13.5px] text-[#334155]">
                      <CircleCheck size={16} className="mt-[2px] shrink-0 text-[#16a34a]" />
                      {s}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-[#f1f3f5] pt-3">
                  <span className="text-[12.5px] text-[#64748b]">Last sync {ago(c.lastSync, ctx.now)}</span>
                  <div className="flex gap-2">
                    {c.platform !== "picqer" && (
                      <Button small onClick={() => ctx.locked(`add_account:${c.platform}`, `Adding another ${c.name} account`)}><Plus size={14} />Account</Button>
                    )}
                    <Button small onClick={() => ctx.locked(`settings:${c.platform}`, `${c.name} settings`)}><Settings2 size={14} />Settings</Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.06em] text-[#64748b]">Alerts</h2>
        <Card className="flex flex-wrap items-center gap-4">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#5865F2] text-white"><SiDiscord size={24} color="currentColor" /></span>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-semibold">Team chat (Discord)</p>
            <p className="text-[13px] text-[#64748b]">Sold-out sizes pulled, cancelled orders put back, and the not-listed report arrive here.</p>
          </div>
          <Badge tone="green" dot>Connected</Badge>
        </Card>
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[#64748b]">Add a channel</h2>
          <span className="text-[13px] text-[#64748b]">Sell the same stock on more channels</span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {ADD.map((a) => (
            <Card key={a.slug} className="flex items-center gap-3 !p-4">
              <Logo slug={a.slug} name={a.name} size={40} />
              <div className="min-w-0 flex-1">
                <p className="text-[14.5px] font-semibold">{a.name}</p>
                <p className="text-[12.5px] text-[#64748b]">{a.type}</p>
              </div>
              <Button small onClick={() => ctx.connect(a.slug, a.name)}>Connect</Button>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ---------- orders ---------- */

type PlatformFilter = "all" | "stockx" | "alias";
const PLATFORM_TABS: { id: PlatformFilter; label: string; logo?: string }[] = [
  { id: "all", label: "All" },
  { id: "stockx", label: "StockX", logo: LOGO_SLUG.stockx },
  { id: "alias", label: "Alias", logo: LOGO_SLUG.alias },
];

function Channel({ platform, label }: { platform: "stockx" | "alias"; label: string }) {
  const p = PLATFORM[platform];
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      <Logo slug={p.slug} name={p.name} size={22} />
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
      <p className="px-5 pb-4 pt-3 text-[13px] text-[#64748b]">Every marketplace order, as it came in, and what the sync did with the stock. Click one for the product.</p>
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
                    <Td><div className="font-medium tabular-nums">{s.ref || "–"}</div><div className="text-[12.5px] text-[#64748b]">{clock(s.soldAt)}</div></Td>
                    <Td><div className="max-w-[300px] truncate font-medium">{s.product}</div><div className="text-[12.5px] text-[#64748b]">{s.style} · US {s.size}</div></Td>
                    <Td><Channel platform={s.platform} label={s.storeLabel} /></Td>
                    <Td><Badge tone={stateTone(s.state)}>{s.state}</Badge></Td>
                    <Td><Steps steps={s.steps} /></Td>
                    <Td className="text-right text-[13px] text-[#64748b]">{lag(s.soldAt, s.syncedAt) ? `${lag(s.soldAt, s.syncedAt)} later` : "–"}</Td>
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

/* ---------- products (links between Picqer and the marketplace accounts) ---------- */

const STORE_TABS: { id: StoreId; label: string; logo: string }[] = [
  { id: "sx-eu", label: "StockX EU", logo: LOGO_SLUG.stockx },
  { id: "sx-us", label: "StockX US", logo: LOGO_SLUG.stockx },
  { id: "al-main", label: "Alias", logo: LOGO_SLUG.alias },
  { id: "al-usa", label: "Alias USA", logo: LOGO_SLUG.alias },
];

export function Products({ ctx }: { ctx: Ctx }) {
  const [store, setStore] = useState<StoreId>("sx-eu");
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
      <p className="px-5 pb-4 pt-3 text-[13px] text-[#64748b]">Each Picqer product is one size of one sneaker. The sync links it to the same size on every account, so one sale counts everywhere.</p>
      {loading && !data ? <Skeleton /> : failed && !data ? <Failed /> : !rows.length ? <Empty>No linked products match this search.</Empty> : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse">
              <thead>
                <tr><Th>Picqer product</Th><Th className="hidden xl:table-cell">Colour</Th><Th>Size</Th><Th>Linked to</Th><Th className="text-right">Linked</Th></tr>
              </thead>
              <tbody className={loading ? "opacity-60" : ""}>
                {rows.map((r) => (
                  <tr key={r.id} onClick={r.detail ? () => ctx.open(r.id) : undefined} className={r.detail ? "cursor-pointer hover:bg-[#f8fafc]" : ""}>
                    <Td>
                      <div className="flex items-center gap-2.5">
                        <Logo slug={LOGO_SLUG.picqer} name="Picqer" size={24} />
                        <div className="min-w-0">
                          <div className="font-medium tabular-nums">{r.code}</div>
                          {r.name && <div className="max-w-[260px] truncate text-[12.5px] text-[#64748b]">{r.name}</div>}
                        </div>
                      </div>
                    </Td>
                    <Td className="hidden text-[13.5px] text-[#334155] xl:table-cell">{r.color || "–"}</Td>
                    <Td className="whitespace-nowrap text-[13.5px]">US {r.us || "–"} · EU {r.eu || "–"}</Td>
                    <Td>
                      <div className="flex flex-wrap gap-1.5">
                        {r.links.map((l) => (
                          <span key={l.store} className="inline-flex h-7 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-[#e3e6eb] bg-white pl-1 pr-2.5 text-[12.5px] font-medium">
                            <Logo slug={PLATFORM[l.platform].slug} name={l.storeLabel} size={20} className="!rounded-full" />
                            {l.storeLabel}
                          </span>
                        ))}
                      </div>
                    </Td>
                    <Td className="whitespace-nowrap text-right text-[13px] text-[#64748b]">{ago(r.linkedAt, ctx.now)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
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
      <p className="px-5 pb-4 pt-3 text-[13px] text-[#64748b]">Listings on the marketplace accounts the sync watches. When a size sells out in Picqer, its listings come down.</p>
      {loading && !data ? <Skeleton /> : failed && !data ? <Failed /> : !rows.length ? <Empty>No listings match this search.</Empty> : (
        <>
          <div className="overflow-x-auto">
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
          <Pager page={f.page} pages={data?.data.pages ?? 1} total={data?.data.total ?? 0} onPage={f.setPage} noun="listings" />
        </>
      )}
    </Card>
  );
}

/* ---------- automations ---------- */

type Ends = "stockx" | "alias" | "picqer" | "both" | "chat";
const AUTOMATIONS: { id: string; job: string | null; from: Ends; to: Ends; when: string; then: string; every?: string }[] = [
  { id: "stockx-sale", job: "stockx-orders", from: "stockx", to: "picqer", when: "A pair sells on StockX", then: "Take one off the Picqer stock, from the bin with the most free stock" },
  { id: "alias-sale", job: "alias-orders", from: "alias", to: "picqer", when: "A pair sells on Alias", then: "Take one off the Picqer stock and confirm the order on Alias" },
  { id: "last-pair", job: "alias-orders", from: "alias", to: "stockx", when: "The last pair sells on Alias", then: "Pull that size from StockX EU and StockX US" },
  { id: "sold-out", job: "zero-stock", from: "picqer", to: "both", when: "A size is sold out in Picqer", then: "Pull its listings on StockX and Alias, and tell the team chat" },
  { id: "restock", job: "alias-restock", from: "alias", to: "picqer", when: "An Alias buyer cancels", then: "Put the pair back into stock, in the bin it came from" },
  { id: "new-product", job: "picqer-products", from: "picqer", to: "both", when: "A new product is added in Picqer", then: "Link it to the same size on StockX and Alias, by style code and size" },
  { id: "sx-listings", job: "stockx-products", from: "stockx", to: "picqer", when: "New listings on StockX", then: "Pick them up and link them to their Picqer product" },
  { id: "al-listings", job: "alias-listings", from: "alias", to: "picqer", when: "New listings on Alias", then: "Keep the active listings current, so a sold-out size can be pulled" },
  { id: "photos", job: "picqer-images", from: "picqer", to: "picqer", when: "A Picqer product has no photo", then: "Find the sneaker's product photo and add it in Picqer" },
  { id: "unmatched", job: null, from: "both", to: "picqer", when: "An order can't be matched to a product", then: "Flag it in the orders list for a look, and leave the stock as it is", every: "with every order" },
  { id: "not-listed", job: null, from: "picqer", to: "chat", when: "You ask for the not-listed report", then: "Send a spreadsheet of stock in Picqer that is not listed on StockX or Alias yet", every: "on demand" },
];

function End({ e }: { e: Ends }) {
  if (e === "chat") return <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#5865F2] text-white"><SiDiscord size={17} color="currentColor" /></span>;
  if (e === "both") {
    return (
      <span className="flex -space-x-2">
        <Logo slug={LOGO_SLUG.stockx} name="StockX" size={32} className="ring-2 ring-white" />
        <Logo slug={LOGO_SLUG.alias} name="Alias" size={32} className="ring-2 ring-white" />
      </span>
    );
  }
  return <Logo slug={PLATFORM[e].slug} name={PLATFORM[e].name} size={32} />;
}

export function Automations({ ov, ctx }: { ov: Live<Overview> | null; ctx: Ctx }) {
  if (!ov) return <Card pad={false}><Skeleton rows={8} /></Card>;
  const jobs = new Map(ov.data.jobs.map((j) => [j.key, j]));
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[13.5px] text-[#64748b]">What the sync does on its own. The times are the real last runs.</p>
      {AUTOMATIONS.map((a) => {
        const j = a.job ? jobs.get(a.job) : undefined;
        if (a.job && !j) return null;
        return (
          <Card key={a.id} className="flex flex-col gap-3 !p-4 xl:flex-row xl:items-center xl:gap-5">
            <div className="flex min-w-0 flex-1 items-center gap-4">
              <div className="flex shrink-0 items-center gap-2">
                <End e={a.from} />
                <ArrowRight size={16} className="text-[#94a3b8]" />
                <End e={a.to} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[14.5px] font-semibold"><span className="text-[#64748b]">When</span> {a.when.charAt(0).toLowerCase() + a.when.slice(1)}</p>
                <p className="mt-0.5 text-[13.5px] text-[#334155]"><span className="font-semibold text-[#64748b]">Then</span> {a.then.charAt(0).toLowerCase() + a.then.slice(1)}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 border-t border-[#f1f3f5] pt-3 xl:justify-end xl:border-0 xl:pt-0">
              <span className="text-[12.5px] text-[#64748b]">{j ? `${j.every} · ran ${ago(j.lastRun, ctx.now)}` : a.every}</span>
              {j && <Badge tone={JOB_TONE[j.status]} dot>{JOB_TEXT[j.status]}</Badge>}
              <button
                type="button"
                onClick={() => ctx.locked(`toggle:${a.id}`, "Switching an automation off")}
                className="relative h-6 w-11 shrink-0 rounded-full bg-[#16a34a]"
                role="switch"
                aria-checked="true"
                aria-label={`${a.when}: on`}
              >
                <span className="absolute right-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow" />
              </button>
            </div>
          </Card>
        );
      })}
      <p className="flex items-center gap-2 pt-1 text-[12.5px] text-[#64748b]"><Lock size={13} />Switches are locked in this demo, so nothing changes in the live store.</p>
    </div>
  );
}

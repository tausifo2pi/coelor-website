"use client";

// The sections of a store demo (/demo/<slug>), drawn from lib/storedemo/engine.ts over the store's live catalogue. The
// same look as the sneaker demo (components/demo): white cards on grey, platform logos, green "Connected" badges.
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowLeftRight, ArrowRight, Check, Lock, Package, Plus, RotateCcw, Truck, X, Zap } from "lucide-react";
import { Badge, BrandMark, Button, Card, CardHead, Empty, Pager, SearchInput, Skeleton, Tabs, ago, clock, fmt, type Tone } from "@/components/demo/ui";
import { RoutinesCard } from "@/components/demo/SheetAssistant";
import type { DemoTracker } from "@/lib/demo/track";
import { storeAssistant } from "@/lib/storedemo/assistant";
import type { ProductRow, StoreWorld } from "@/lib/storedemo/engine";
import type { ChannelCfg, DemoConfig, Happening, Order, Step } from "@/lib/storedemo/types";

export type SectionId = "dashboard" | "assistant" | "orders" | "products" | "shipping" | "automations" | "connections" | "pricing";

export type SCtx = {
  cfg: DemoConfig;
  world: StoreWorld | null;
  now: number;
  t: DemoTracker | null;
  go: (s: SectionId) => void;
  open: (productId: string) => void;
  locked: (what: string, text?: string) => void;
  connect: (slug: string, name: string, body?: string) => void;
};

/* ---------- small parts ---------- */

const money = (n: number) => `$${n % 1 ? n.toFixed(2) : n.toFixed(0)}`;
const chOf = (cfg: DemoConfig, id: string): ChannelCfg => cfg.channels.find((c) => c.id === id) ?? cfg.channels[0];

const STEP_TONE: Record<Step["kind"], Tone> = {
  stock: "green", pulled: "violet", label: "blue", shipped: "blue", delivered: "green", return: "amber", restock: "green", cancel: "red", listed: "violet",
};
const STATE_TONE: Record<string, Tone> = {
  Paid: "gray", "Label printed": "blue", Shipped: "blue", Delivered: "green", "Return started": "amber", Returned: "gray", Cancelled: "red",
};

function Steps({ steps, max = 3 }: { steps: Step[]; max?: number }) {
  if (!steps.length) return <span className="text-[13px] text-[#94a3b8]">Coming in</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {steps.slice(-max).map((s) => (
        <Badge key={s.kind + s.at} tone={STEP_TONE[s.kind]}>
          {s.kind === "cancel" ? <X size={12} /> : s.kind === "return" ? <RotateCcw size={12} /> : <Check size={12} strokeWidth={2.6} />}
          {s.text}
        </Badge>
      ))}
    </div>
  );
}

function Thumb({ src, size = 44 }: { src: string | null; size?: number }) {
  return (
    <span className="grid shrink-0 place-items-center overflow-hidden rounded-lg border border-[#eef0f3] bg-[#f8fafc]" style={{ width: size, height: size }}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
      ) : (
        <Package size={Math.round(size * 0.4)} className="text-[#cbd5e1]" />
      )}
    </span>
  );
}

function Kpi({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <Card className="flex flex-col gap-1">
      <span className="text-[13px] font-medium text-[#64748b]">{label}</span>
      <span className="text-[28px] font-bold leading-tight tracking-[-0.02em] tabular-nums">{value}</span>
      {sub && <span className="text-[13px] leading-[1.5] text-[#64748b]">{sub}</span>}
    </Card>
  );
}

function Loading() {
  return <Card pad={false}><Skeleton rows={8} /></Card>;
}

/** one order as a row: channel, what, where to, what the sync did */
function OrderRow({ o, ctx, compact = false }: { o: Order; ctx: SCtx; compact?: boolean }) {
  const ch = chOf(ctx.cfg, o.channel);
  const l = o.lines[0];
  return (
    <button type="button" onClick={() => ctx.open(l.productId)} className="flex w-full gap-3 px-5 py-3.5 text-left transition-colors hover:bg-[#f8fafc]">
      <span className="relative shrink-0">
        <Thumb src={l.image} size={compact ? 42 : 48} />
        <span className="absolute -bottom-1.5 -right-1.5"><BrandMark slug={ch.logo} name={ch.name} size={20} className="ring-2 ring-white" /></span>
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <span className="min-w-0 truncate text-[14px] font-semibold">
            {l.title}
            {o.lines.length > 1 && <span className="font-medium text-[#64748b]"> +{o.lines.length - 1} more</span>}
          </span>
          <span className="shrink-0 text-[12.5px] text-[#64748b]">{ago(o.placedAt, ctx.now)}</span>
        </div>
        <p className="mt-0.5 truncate text-[13px] text-[#64748b]">
          {[l.size, l.color].filter(Boolean).join(" · ")} · {money(o.total)} · Sold on {ch.name} · {o.ref} · to {o.shipTo}
        </p>
        <div className="mt-2">
          <Steps steps={o.steps} max={compact ? 2 : 3} />
        </div>
      </div>
    </button>
  );
}

const HAPPEN_TONE: Record<Happening["kind"], Tone> = { pulled: "violet", listed: "blue", restock: "green" };
const HAPPEN_LABEL: Record<Happening["kind"], string> = { pulled: "Sold out → pulled", listed: "New listing", restock: "Restock" };

function HappeningRow({ h, ctx }: { h: Happening; ctx: SCtx }) {
  const logo = h.kind === "restock" ? ctx.cfg.restock.logo : h.channel ? chOf(ctx.cfg, h.channel).logo : ctx.cfg.stock.logo;
  return (
    <div className="flex gap-3 px-5 py-3.5">
      <span className="relative shrink-0">
        {h.image ? <Thumb src={h.image} size={48} /> : <BrandMark slug={logo} name={h.title} size={48} />}
        {h.image && <span className="absolute -bottom-1.5 -right-1.5"><BrandMark slug={logo} name="" size={20} className="ring-2 ring-white" /></span>}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <span className="min-w-0 truncate text-[14px] font-semibold">{h.title}</span>
          <span className="shrink-0 text-[12.5px] text-[#64748b]">{ago(h.at, ctx.now)}</span>
        </div>
        <p className="mt-0.5 text-[13px] text-[#64748b]">{h.text}</p>
        <div className="mt-2"><Badge tone={HAPPEN_TONE[h.kind]}><Check size={12} strokeWidth={2.6} />{HAPPEN_LABEL[h.kind]}</Badge></div>
      </div>
    </div>
  );
}

/* ---------- dashboard ---------- */

function HubCard({ c, n, live }: { c: ChannelCfg; n: number; live: boolean }) {
  return (
    <div className="flex min-w-0 flex-col gap-2.5 rounded-xl border border-[#e3e6eb] bg-white p-3.5">
      <div className="flex min-w-0 items-center gap-3">
        <BrandMark slug={c.logo} name={c.name} size={40} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-[15px] font-semibold">{c.name}</span>
            {live ? <Badge tone="red" dot>LIVE now</Badge> : <Badge tone="green" dot>Connected</Badge>}
          </div>
          <p className="mt-0.5 truncate text-[12.5px] text-[#64748b]">{c.account} · {fmt(n)} listed</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] font-semibold">
        <ArrowLeftRight size={13} className="text-[#94a3b8]" />
        <span className="inline-flex items-center gap-1 text-[#15803d]">{c.realtime && <Zap size={12} />}Orders in · {c.every}</span>
        <span className="text-[#cbd5e1]">·</span>
        <span className="text-[#6d28d9]">Sold out → pulled</span>
      </div>
    </div>
  );
}

function ToolChip({ slug, name, role }: { slug: string; name: string; role: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5 rounded-xl border border-[#e3e6eb] bg-white px-3 py-2.5">
      <BrandMark slug={slug} name={name} size={30} />
      <div className="min-w-0">
        <p className="truncate text-[13.5px] font-semibold">{name}</p>
        <p className="truncate text-[12px] text-[#64748b]">{role}</p>
      </div>
    </div>
  );
}

export function Dashboard({ ctx }: { ctx: SCtx }) {
  const w = ctx.world;
  const ov = useMemo(() => (w ? w.overview(ctx.now) : null), [w, ctx.now]);
  const rules = useMemo(() => (w ? w.rules(ctx.now) : []), [w, ctx.now]);
  const assistant = useMemo(() => storeAssistant(ctx.cfg), [ctx.cfg]);
  if (!w || !ov) return <Loading />;
  const { cfg } = ctx;
  const k = ov.kpis;
  const live = w.liveNow(ctx.now);
  const day = cfg.channels.reduce((n, c) => n + (k.orders24h[c.id] ?? 0), 0);
  const last = k.lastOrder;
  // channels around the stock count: the first half on the left, the rest (and the tools) on the right
  const half = Math.ceil(cfg.channels.length / 2);
  return (
    <div className="flex flex-col gap-5">
      <Card>
        <CardHead title="Your connected channels" sub="One stock count for every size, kept in step with every channel, the stockroom and the parcels." />
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(220px,0.8fr)_minmax(0,1fr)]">
          <div className="flex flex-col gap-3">
            {cfg.channels.slice(0, half).map((c) => <HubCard key={c.id} c={c} n={k.live[c.id] ?? 0} live={live === c.id} />)}
          </div>
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-[#bfdbfe] bg-[#f8fbff] p-4 text-center">
            <BrandMark slug={cfg.stock.logo} name={cfg.stock.name} size={56} />
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="text-[16px] font-semibold">{cfg.stock.name}</span>
              <Badge tone="green" dot>Connected</Badge>
            </div>
            <p className="text-[13px] text-[#64748b]">{cfg.stock.role} · {cfg.stock.detail}</p>
            <p className="text-[13px] text-[#64748b]">{fmt(w.products)} products · {fmt(k.live[cfg.channels[0].id] ?? 0)} in stock</p>
          </div>
          <div className="flex flex-col gap-3">
            {cfg.channels.slice(half).map((c) => <HubCard key={c.id} c={c} n={k.live[c.id] ?? 0} live={live === c.id} />)}
            <div className="grid grid-cols-2 gap-3">
              <ToolChip slug={cfg.shipping.tool.logo} name={cfg.shipping.tool.name} role="Labels" />
              <ToolChip slug={cfg.returns.logo} name={cfg.returns.name} role="Returns" />
            </div>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[#f1f3f5] pt-3 text-[12.5px] text-[#64748b]">
          <Truck size={14} className="text-[#94a3b8]" />
          Ships with
          {cfg.shipping.carriers.map((c) => (
            <span key={c.name} className="inline-flex items-center gap-1.5 rounded-full border border-[#e3e6eb] bg-white py-0.5 pl-0.5 pr-2.5 font-medium text-[#334155]">
              <BrandMark slug={c.logo} name={c.name} size={20} className="!rounded-full" />{c.name}
            </span>
          ))}
          · tracking by
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e3e6eb] bg-white py-0.5 pl-0.5 pr-2.5 font-medium text-[#334155]">
            <BrandMark slug={cfg.tracking.logo} name={cfg.tracking.name} size={20} className="!rounded-full" />{cfg.tracking.name}
          </span>
          · restocks from
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e3e6eb] bg-white py-0.5 pl-0.5 pr-2.5 font-medium text-[#334155]">
            <BrandMark slug={cfg.restock.logo} name={cfg.restock.name} size={20} className="!rounded-full" />{cfg.restock.name}
          </span>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Orders, last 24 h" value={fmt(day)} sub={cfg.channels.map((c) => `${fmt(k.orders24h[c.id] ?? 0)} ${c.name}`).join(" · ")} />
        <Kpi label="Last order" value={ago(last?.placedAt ?? null, ctx.now)} sub={last ? `${chOf(cfg, last.channel).name} · ${last.lines[0].title}` : undefined} />
        <Kpi label={`${cfg.items.charAt(0).toUpperCase()}${cfg.items.slice(1)} shipped today`} value={fmt(k.unitsShippedToday)} sub={`Labels in ${cfg.shipping.tool.name}, tracking by ${cfg.tracking.name}`} />
        <Kpi label="Sold-out sizes pulled" value={fmt(k.pulled7d)} sub={`Last 7 days · ${fmt(k.returnsBack7d)} returns back in stock`} />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Card pad={false}>
          <div className="px-5 pt-5">
            <CardHead title="Latest activity" sub="Orders from every channel, and what the sync did with them" right={<Button small onClick={() => ctx.go("orders")}>All orders <ArrowRight size={14} /></Button>} />
          </div>
          <div className="divide-y divide-[#f1f3f5] border-t border-[#f1f3f5]">
            {ov.feed.slice(0, 9).map((f) => (f.type === "order" ? <OrderRow key={f.order.id} o={f.order} ctx={ctx} compact /> : <HappeningRow key={f.happening.id} h={f.happening} ctx={ctx} />))}
          </div>
        </Card>
        <div className="flex flex-col gap-5">
          <Card pad={false}>
            <div className="px-5 pt-5">
              <CardHead title="Automations" sub="Last run of each rule" right={<Button small onClick={() => ctx.go("automations")}>All <ArrowRight size={14} /></Button>} />
            </div>
            <ul className="divide-y divide-[#f1f3f5] border-t border-[#f1f3f5]">
              {rules.slice(0, 6).map((r) => (
                <li key={r.key} className="flex items-center gap-3 px-5 py-3">
                  <BrandMark slug={r.tools[0]} name={r.name} size={26} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-medium">{r.name}</p>
                    <p className="text-[12.5px] text-[#64748b]">{r.every} · {r.every.startsWith("real time") ? "last event " : ""}{ago(r.lastRun, ctx.now)}</p>
                  </div>
                  <Badge tone="green" dot>On schedule</Badge>
                </li>
              ))}
            </ul>
          </Card>
          <RoutinesCard ctx={ctx} profile={assistant} onAll={() => ctx.go("assistant")} />
          <Card pad={false}>
            <div className="px-5 pt-5">
              <CardHead title="Since the sync started" />
            </div>
            <ul className="divide-y divide-[#f1f3f5] border-t border-[#f1f3f5]">
              {cfg.channels.map((c) => (
                <li key={c.id} className="flex items-center gap-2 px-5 py-2.5 text-[14px]">
                  <BrandMark slug={c.logo} name={c.name} size={22} />
                  <span className="min-w-0 flex-1 truncate font-medium">{c.name}</span>
                  <span className="font-semibold tabular-nums">{fmt(k.ordersTotal[c.id] ?? 0)}</span>
                  <span className="w-[86px] text-right text-[13px] text-[#64748b]">orders</span>
                </li>
              ))}
            </ul>
            <p className="px-5 py-3 text-[12.5px] text-[#64748b]">Orders taken off the one stock count.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ---------- orders ---------- */

function useDebounced(v: string, ms = 350) {
  const [d, setD] = useState(v);
  useEffect(() => {
    const id = setTimeout(() => setD(v), ms);
    return () => clearTimeout(id);
  }, [v, ms]);
  return d;
}

export function Orders({ ctx }: { ctx: SCtx }) {
  const [channel, setChannel] = useState("all");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const dq = useDebounced(q.trim());
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (dq) ctx.t?.action("orders_search", dq);
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dq]);
  const w = ctx.world;
  const data = useMemo(() => (w ? w.orders({ now: ctx.now, channel: channel === "all" ? undefined : channel, q: dq, page }) : null), [w, ctx.now, channel, dq, page]);
  if (!w || !data) return <Loading />;
  const tabs = [{ id: "all", label: "All" }, ...ctx.cfg.channels.map((c) => ({ id: c.id, label: c.name, logo: c.logo }))];
  return (
    <Card pad={false}>
      <div className="flex flex-col gap-3 border-b border-[#f1f3f5] p-4 lg:flex-row lg:items-center lg:justify-between">
        <Tabs value={channel} options={tabs} onChange={(v) => { setChannel(v); setPage(1); ctx.t?.action("orders_filter", v); }} />
        <SearchInput value={q} onChange={setQ} placeholder="Search a product, size, colour or state" />
      </div>
      <p className="px-5 pt-3 text-[12.5px] text-[#64748b]">Every order of the last 45 days, where it came in and what the sync did. Click one for the product.</p>
      {data.rows.length ? (
        <div className="divide-y divide-[#f1f3f5]">
          {data.rows.map((o) => (
            <div key={o.id} className="relative">
              <OrderRow o={o} ctx={ctx} />
              <span className="pointer-events-none absolute right-5 top-[42px] hidden md:block"><Badge tone={STATE_TONE[o.state] ?? "gray"}>{o.state}</Badge></span>
            </div>
          ))}
        </div>
      ) : (
        <Empty>No orders match.</Empty>
      )}
      <Pager page={data.page} pages={data.pages} total={data.total} onPage={setPage} noun="orders" />
    </Card>
  );
}

/* ---------- products ---------- */

/** one chip per size (all colours together): what is left, struck through when every colour of it is sold out */
function SizeChips({ p }: { p: ProductRow }) {
  const sizes = new Map<string, number>();
  for (const v of p.stock) sizes.set(v.size, (sizes.get(v.size) ?? 0) + v.stock);
  const colors = new Set(p.stock.map((v) => v.color).filter(Boolean)).size;
  return (
    <div className="flex flex-wrap items-center gap-1">
      {[...sizes].map(([size, n]) => (
        <span key={size} className={`inline-flex h-6 items-center gap-1 rounded-md border px-1.5 text-[11.5px] font-semibold tabular-nums ${n ? "border-[#e3e6eb] bg-white text-[#334155]" : "border-[#f1f3f5] bg-[#f8fafc] text-[#94a3b8] line-through"}`}>
          {size}<span className={n ? "text-[#15803d]" : ""}>{n}</span>
        </span>
      ))}
      {colors > 1 && <span className="text-[11.5px] text-[#64748b]">{colors} colours</span>}
    </div>
  );
}

export function Products({ ctx }: { ctx: SCtx }) {
  const [cat, setCat] = useState("all");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const dq = useDebounced(q.trim());
  useEffect(() => {
    if (dq) ctx.t?.action("products_search", dq);
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dq]);
  const w = ctx.world;
  const data = useMemo(() => (w ? w.productRows({ now: ctx.now, q: dq, category: cat === "all" ? undefined : cat, page }) : null), [w, ctx.now, dq, cat, page]);
  if (!w || !data) return <Loading />;
  return (
    <Card pad={false}>
      <div className="flex flex-col gap-3 border-b border-[#f1f3f5] p-4 lg:flex-row lg:items-center lg:justify-between">
        <select
          value={cat}
          onChange={(e) => { setCat(e.target.value); setPage(1); ctx.t?.action("products_category", e.target.value); }}
          className="h-9 rounded-lg border border-[#d9dde3] bg-white px-3 text-[14px] font-medium text-[#334155]"
          aria-label="Category"
        >
          <option value="all">All categories</option>
          {data.categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <SearchInput value={q} onChange={setQ} placeholder="Search a product or brand" />
      </div>
      <p className="px-5 pt-3 text-[12.5px] text-[#64748b]">Each size on one count, the same on every channel. Sold today first. Click one for its stock and orders.</p>
      {data.rows.length ? (
        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.rows.map((p) => (
            <button key={p.id} type="button" onClick={() => ctx.open(p.id)} className="flex gap-3 rounded-xl border border-[#e3e6eb] bg-white p-3 text-left transition-colors hover:border-[#bfdbfe] hover:bg-[#f8fbff]">
              <Thumb src={p.image} size={76} />
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-[14px] font-semibold leading-snug">{p.title}</p>
                <p className="mt-0.5 truncate text-[12.5px] text-[#64748b]">{[p.brand, p.category, money(p.price)].filter(Boolean).join(" · ")}</p>
                <div className="mt-2"><SizeChips p={p} /></div>
                <div className="mt-2 flex items-center gap-1.5">
                  {p.listedOn.map((id) => <BrandMark key={id} slug={chOf(ctx.cfg, id).logo} name={chOf(ctx.cfg, id).name} size={18} />)}
                  <span className="ml-1 text-[12px] text-[#64748b]">{p.soldOut ? "Sold out · pulled everywhere" : p.soldToday ? `${p.soldToday} sold today` : `${fmt(p.inStock)} in stock`}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <Empty>No products match.</Empty>
      )}
      <Pager page={data.page} pages={data.pages} total={data.total} onPage={setPage} noun="products" />
    </Card>
  );
}

/* ---------- shipping and returns ---------- */

export function Shipping({ ctx }: { ctx: SCtx }) {
  const w = ctx.world;
  const data = useMemo(() => (w ? w.shipping(ctx.now) : null), [w, ctx.now]);
  const [tab, setTab] = useState<"parcels" | "returns">("parcels");
  if (!w || !data) return <Loading />;
  const { cfg } = ctx;
  const rows = tab === "parcels" ? data.rows : data.returns;
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cfg.shipping.carriers.map((c) => (
          <Card key={c.name} className="flex items-center gap-3">
            <BrandMark slug={c.logo} name={c.name} size={44} />
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-[#64748b]">{c.service}</p>
              <p className="text-[26px] font-bold leading-tight tabular-nums">{fmt(data.today[c.name] ?? 0)}</p>
              <p className="text-[12.5px] text-[#64748b]">labels today</p>
            </div>
          </Card>
        ))}
      </div>
      <Card pad={false}>
        <div className="flex flex-col gap-3 border-b border-[#f1f3f5] p-4 sm:flex-row sm:items-center sm:justify-between">
          <Tabs value={tab} options={[{ id: "parcels", label: "Parcels", logo: cfg.shipping.tool.logo }, { id: "returns", label: "Returns", logo: cfg.returns.logo }]} onChange={(v) => { setTab(v); ctx.t?.action("shipping_tab", v); }} />
          <span className="text-[12.5px] text-[#64748b]">
            {tab === "parcels" ? `Labels bought in ${cfg.shipping.tool.name}, tracking sent by ${cfg.tracking.name}` : `Returns started in ${cfg.returns.name}; checked ones go back on every channel`}
          </span>
        </div>
        {rows.length ? (
          <div className="divide-y divide-[#f1f3f5]">
            {rows.map((o) => {
              const ch = chOf(cfg, o.channel);
              const key = tab === "parcels" ? (["delivered", "shipped", "label"] as const).map((k) => o.steps.find((s) => s.kind === k)).find(Boolean) : o.steps.filter((s) => s.kind === "return" || s.kind === "restock").pop();
              return (
                <button key={o.id} type="button" onClick={() => ctx.open(o.lines[0].productId)} className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-[#f8fafc]">
                  <Thumb src={o.lines[0].image} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-semibold">{o.lines[0].title}{o.lines.length > 1 && <span className="font-medium text-[#64748b]"> +{o.lines.length - 1}</span>}</p>
                    <p className="truncate text-[12.5px] text-[#64748b]">{ch.name} · {o.ref} · to {o.shipTo} · {ch.label?.service ?? cfg.shipping.carriers.find((c) => c.name === o.carrier)?.service}</p>
                  </div>
                  <div className="hidden shrink-0 text-right sm:block">
                    <Badge tone={STATE_TONE[o.state] ?? "gray"}>{o.state}</Badge>
                    <p className="mt-1 text-[12px] text-[#64748b]">{key ? `${clock(key.at)} · ${ago(key.at, ctx.now)}` : ""}</p>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <Empty>{tab === "parcels" ? "No parcels yet today." : "No returns in the last 30 days."}</Empty>
        )}
      </Card>
    </div>
  );
}

/* ---------- automations ---------- */

export function Automations({ ctx }: { ctx: SCtx }) {
  const w = ctx.world;
  const rules = useMemo(() => (w ? w.rules(ctx.now) : null), [w, ctx.now]);
  if (!rules) return <Loading />;
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[13.5px] text-[#64748b]">What the sync does on its own, and when each rule last ran.</p>
      {rules.map((r) => {
        const toggle = (cls: string) => (
          <button type="button" onClick={() => ctx.locked(`toggle:${r.key}`, "Switching an automation off")} className={`relative h-6 w-11 shrink-0 rounded-full bg-[#16a34a] ${cls}`} role="switch" aria-checked="true" aria-label={`${r.name}: on`}>
            <span className="absolute right-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow" />
          </button>
        );
        return (
          <Card key={r.key} className="flex flex-col gap-3 !p-4 xl:flex-row xl:items-center xl:gap-5">
            <div className="flex min-w-0 flex-1 flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-4">
              <div className="flex shrink-0 items-center justify-between gap-2 sm:w-[132px]">
                <div className="flex -space-x-1.5">
                  {[...new Set(r.tools)].slice(0, 4).map((s) => <BrandMark key={s} slug={s} name={s} size={28} className="ring-2 ring-white" />)}
                </div>
                {toggle("sm:hidden")}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[14.5px] font-semibold">{r.name}</p>
                <p className="mt-0.5 text-[13.5px] text-[#334155]"><span className="font-semibold text-[#64748b]">When</span> {r.when.charAt(0).toLowerCase() + r.when.slice(1)} <span className="font-semibold text-[#64748b]">then</span> {r.then.charAt(0).toLowerCase() + r.then.slice(1)}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-[#f1f3f5] pt-3 xl:justify-end xl:border-0 xl:pt-0">
              <span className="text-[12.5px] text-[#64748b]">{r.every} · {r.every.startsWith("real time") ? "last event" : "ran"} {ago(r.lastRun, ctx.now)}</span>
              <Badge tone="green" dot>On schedule</Badge>
              {toggle("hidden sm:block")}
            </div>
          </Card>
        );
      })}
      <p className="flex items-center gap-2 pt-1 text-[12.5px] text-[#64748b]"><Lock size={13} />Switches are locked in this demo, so nothing changes in the store.</p>
    </div>
  );
}

/* ---------- connections ---------- */

function ConnTile({ slug, name, role, detail, on, onClick }: { slug: string; name: string; role: string; detail?: string; on: boolean; onClick: () => void }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-xl border border-[#e3e6eb] bg-white p-3.5">
      <BrandMark slug={slug} name={name} size={40} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-[14.5px] font-semibold">{name}</span>
          {on && <Badge tone="green" dot>Connected</Badge>}
        </div>
        <p className="mt-0.5 truncate text-[12.5px] text-[#64748b]">{role}{detail ? ` · ${detail}` : ""}</p>
      </div>
      <Button small onClick={onClick}>{on ? "Settings" : <><Plus size={14} />Connect</>}</Button>
    </div>
  );
}

export function Connections({ ctx }: { ctx: SCtx }) {
  const { cfg } = ctx;
  const w = ctx.world;
  const ov = useMemo(() => (w ? w.overview(ctx.now) : null), [w, ctx.now]);
  const settings = (name: string) => () => ctx.locked(`settings:${name}`, `${name}'s settings`);
  const groups: { title: string; sub: string; tiles: ReactNode[] }[] = [
    {
      title: "Sales channels",
      sub: "Where the store sells. Every order comes off the one stock count.",
      tiles: [
        ...cfg.channels.map((c) => <ConnTile key={c.id} slug={c.logo} name={c.name} role={c.role}
          detail={`${ov ? `${fmt(ov.kpis.live[c.id] ?? 0)} listed · ` : ""}${c.realtime ? "orders in real time (webhooks)" : `orders read ${c.every}`}`} on onClick={settings(c.name)} />),
        ...cfg.more.map((m) => (
          <ConnTile key={m.slug} slug={m.slug} name={m.name} role={m.why} on={false}
            onClick={() => ctx.connect(m.slug, m.name, `This demo is a store that is already running, so it is view only. For your store we connect ${m.name} to the same stock count: every sale there comes off the count, and sold-out sizes come down everywhere.`)} />
        )),
      ],
    },
    {
      title: "Stock, shipping and returns",
      sub: "Where the stock is counted and how the parcels go out and come back.",
      tiles: [
        <ConnTile key="stock" slug={cfg.stock.logo} name={cfg.stock.name} role={cfg.stock.role} detail={cfg.stock.detail} on onClick={settings(cfg.stock.name)} />,
        <ConnTile key="ship" slug={cfg.shipping.tool.logo} name={cfg.shipping.tool.name} role={cfg.shipping.tool.role} detail={cfg.shipping.carriers.map((c) => c.name).join(", ")} on onClick={settings(cfg.shipping.tool.name)} />,
        ...cfg.shipping.carriers.map((c) => <ConnTile key={c.name} slug={c.logo} name={c.name} role={c.service} detail={`Labels through ${cfg.shipping.tool.name}`} on onClick={settings(c.name)} />),
        <ConnTile key="track" slug={cfg.tracking.logo} name={cfg.tracking.name} role={cfg.tracking.role} on onClick={settings(cfg.tracking.name)} />,
        <ConnTile key="ret" slug={cfg.returns.logo} name={cfg.returns.name} role={cfg.returns.role} on onClick={settings(cfg.returns.name)} />,
        <ConnTile key="restock" slug={cfg.restock.logo} name={cfg.restock.name} role={cfg.restock.role} on onClick={settings(cfg.restock.name)} />,
        ...cfg.moreTools.map((m) => (
          <ConnTile key={m.slug} slug={m.slug} name={m.name} role={m.why} on={false}
            onClick={() => ctx.connect(m.slug, m.name, `View only in this demo. For your store we connect ${m.name} to the same stock count and the same orders, so nothing is typed over by hand.`)} />
        )),
      ],
    },
    {
      title: "Team, sheets and AI",
      sub: "Where the team sees the numbers and gets the alerts. The assistant's routines post only here, for data safety; Claude and ChatGPT ask the same data from their apps.",
      tiles: cfg.tools.map((x) => (
        <ConnTile key={x.slug} slug={x.slug} name={x.name} role={x.role} detail={x.detail} on={!!x.on}
          onClick={x.on ? settings(x.name) : () => ctx.connect(x.slug, x.name, /claude|chatgpt/.test(x.slug)
            ? `View only in this demo. For your store we connect your sync to ${x.name}, so your team asks it right in the ${x.name} app: stock, orders and routines. It reads the same data as the assistant and posts only to your team's sheets and chat: it never changes listings, prices or stock.`
            : `View only in this demo. For your store we connect ${x.name} to the same stock count and orders: ${x.role.charAt(0).toLowerCase() + x.role.slice(1)}, without anyone copying numbers over.`)} />
      )),
    },
  ];
  // every group ends with the connection we build for a platform that is not listed
  const custom = (what: string) => (
    <ConnTile key="custom" slug="custom" name={`Your own ${what}`} role="Built for your setup, as required" detail="Any platform with an API, or its exports" on={false}
      onClick={() => ctx.connect("custom", `your own ${what}`, `Not in the list? We build the connection your store needs: any ${what} with an API, or its exports where there is none, on the same stock count and orders. Tell us what you use.`)} />
  );
  const WHAT = ["sales channel", "system", "tool"];
  return (
    <div className="flex flex-col gap-5">
      {groups.map((g, i) => (
        <Card key={g.title}>
          <CardHead title={g.title} sub={g.sub} />
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">{[...g.tiles, custom(WHAT[i] ?? "platform")]}</div>
        </Card>
      ))}
    </div>
  );
}

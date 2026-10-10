"use client";

// A store demo (/demo/<slug>): a static page. The visitor's browser reads the store's live catalogue from its Shopify
// Storefront API (lib/storedemo/shopify.ts; the copy saved with the page when the store does not answer) and
// lib/storedemo/engine.ts tells the sync around it. Read-only, every click that would change something opens the
// "view only" dialog. lib/demo/track.ts records what the visitor looks at, like the sneaker demo.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, BadgeDollarSign, Boxes, LayoutDashboard, Lock, Plug, Receipt, RefreshCw, Sparkles, Truck, X, Zap, type LucideIcon } from "lucide-react";
import { Badge, BetaPill, BrandMark, Button, CoelorWordmark, ago, fmt, hasMark } from "@/components/demo/ui";
import { OfferCard, OfferLines, OfferNote } from "@/components/demo/Offer";
import { PricingView } from "@/components/demo/Pricing";
import { CustomNotice } from "@/components/demo/CustomNotice";
import { getJson } from "@/lib/demo/get";
import { startDemoTracker, type DemoTracker } from "@/lib/demo/track";
import { SheetAssistant } from "@/components/demo/SheetAssistant";
import { storeAssistant } from "@/lib/storedemo/assistant";
import { demoBySlug } from "@/lib/storedemo/configs";
import { storeWorld } from "@/lib/storedemo/engine";
import { fetchCatalog } from "@/lib/storedemo/shopify";
import type { Catalog, DemoConfig } from "@/lib/storedemo/types";
import { Automations, Connections, Dashboard, Orders, Products, Shipping, type SCtx, type SectionId } from "@/components/storedemo/sections";


const SECTIONS: { id: SectionId; label: string; icon: LucideIcon; title: string; sub: string; beta?: boolean }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, title: "Dashboard", sub: "This build right now: channels, orders, parcels and automations" },
  { id: "assistant", label: "Assistant", icon: Sparkles, title: "Assistant", sub: "Routines that get data and post it to your team, written from a chat (beta)", beta: true },
  { id: "orders", label: "Orders", icon: Receipt, title: "Orders", sub: "Orders from every channel, and what the sync did with them" },
  { id: "products", label: "Products", icon: Boxes, title: "Products", sub: "Every size on one count, the same on every channel" },
  { id: "shipping", label: "Shipping & returns", icon: Truck, title: "Shipping & returns", sub: "Labels, tracking and returns, back into stock" },
  { id: "automations", label: "Automations", icon: Zap, title: "Automations", sub: "What runs on its own, and when it last ran" },
  { id: "connections", label: "Connections", icon: Plug, title: "Connections", sub: "Sales channels, stock, shipping and returns, on one count" },
  { id: "pricing", label: "Your build & price", icon: BadgeDollarSign, title: "Your own build and its price", sub: "Scoped with you, $500 per connection, one-time. Try 1 connection free for 7 days." },
];

type Dialog = { title: string; body: string; slug?: string; name?: string } | null;
const CACHE_MS = 15 * 60_000;

function sectionFromUrl(): SectionId {
  const want = new URLSearchParams(location.search).get("section");
  return SECTIONS.some((s) => s.id === want) ? (want as SectionId) : "dashboard";
}

/** The catalogue: from this tab's last read (15 min), else the store, else the copy saved with the page. */
async function loadCatalog(cfg: DemoConfig): Promise<Catalog> {
  const key = `storedemo:${cfg.slug}`;
  try {
    const hit = JSON.parse(sessionStorage.getItem(key) ?? "null") as { t: number; cat: Catalog } | null;
    if (hit && Date.now() - hit.t < CACHE_MS && hit.cat?.products?.length) return hit.cat;
  } catch {
    // no storage (private window): read again
  }
  let cat: Catalog;
  try {
    cat = await fetchCatalog(cfg);
  } catch {
    cat = await getJson<Catalog>(`/storedemo/${cfg.slug}.json`);
  }
  try {
    sessionStorage.setItem(key, JSON.stringify({ t: Date.now(), cat }));
  } catch {
    // full or blocked: fine
  }
  return cat;
}

export default function StoreDemoApp({ slug }: { slug: string }) {
  const cfg = demoBySlug(slug)!;
  const [section, setSection] = useState<SectionId>("dashboard");
  const [cat, setCat] = useState<Catalog | null>(null);
  const [failed, setFailed] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [busy, setBusy] = useState(false);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [drawer, setDrawer] = useState<string | null>(null);
  const [t, setT] = useState<DemoTracker | null>(null);
  const tRef = useRef<DemoTracker | null>(null);

  useEffect(() => {
    let alive = true;
    loadCatalog(cfg)
      .then((c) => alive && setCat(c))
      .catch(() => {
        if (!alive) return;
        setFailed(true);
        tRef.current?.error("catalog");
      });
    const first = sectionFromUrl();
    setSection(first);
    const tr = startDemoTracker(first);
    tRef.current = tr;
    setT(tr);
    setNow(Date.now());
    const tick = window.setInterval(() => {
      if (document.visibilityState === "visible") setNow(Date.now());
    }, 15_000);
    return () => {
      alive = false;
      window.clearInterval(tick);
      tr.stop();
    };
  }, [cfg]);

  const world = useMemo(() => (cat ? storeWorld(cfg, cat) : null), [cfg, cat]);
  const assistant = useMemo(() => storeAssistant(cfg), [cfg]);

  const go = useCallback((s: SectionId) => {
    setSection(s);
    tRef.current?.view(s);
    const u = new URL(location.href);
    u.searchParams.set("section", s);
    history.replaceState(null, "", u);
    window.scrollTo({ top: 0 });
  }, []);

  const refresh = () => {
    setBusy(true);
    tRef.current?.action("refresh", section);
    setNow(Date.now());
    window.setTimeout(() => setBusy(false), 400);
  };

  const ctx: SCtx = {
    cfg,
    world,
    now,
    t,
    go,
    open: (id) => {
      setDrawer(id);
      tRef.current?.action("open_product", section);
    },
    locked: (what, text) => {
      tRef.current?.action("locked", what);
      setDialog({ title: "View only", body: `${text ?? "This"} is switched off in the demo, so nothing changes in the store. In your own build it works the way you decide.` });
    },
    connect: (s, name, body) => {
      tRef.current?.connect(s);
      setDialog({ title: `Connect ${name}`, slug: s, name, body: body ?? `This demo is one boutique's custom build, so it is view only. In your own build, ${name} is connected the way your setup needs it: what comes in, what goes out and the rules are decided with you.` });
    },
  };

  const closeDrawer = useCallback(() => setDrawer(null), []);
  const closeDialog = useCallback(() => setDialog(null), []);
  const cur = SECTIONS.find((s) => s.id === section)!;
  const live = world?.liveNow(now);

  return (
    <div data-track="off" className="min-h-screen bg-[#f4f5f7] font-sans text-[#0f172a] [color-scheme:light]">
      <div className="bg-[#0f172a] text-white">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 md:px-6 xl:py-2.5">
          <span className="order-1 inline-flex shrink-0 items-center gap-2 text-[13px] font-semibold">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#4ade80]" />
            Live demo
          </span>
          <p className="order-3 w-full text-[12.5px] leading-[1.5] text-[#cbd5e1] xl:order-2 xl:w-auto xl:min-w-0 xl:flex-1 xl:text-[13px]">
            <span className="sm:hidden">One store&apos;s custom build. Read-only.</span>
            <span className="hidden sm:inline">One {cfg.goods.toLowerCase()} store&apos;s custom build. Yours is built around your own platforms and rules. Read-only: nothing you click changes anything.</span>
          </p>
          <div className="order-2 ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1.5 xl:order-3">
            <a href={cfg.caseHref} onClick={() => tRef.current?.cta("back_case", "How it works")} className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-[13px] font-semibold text-[#cbd5e1] hover:text-white sm:px-2.5">
              <ArrowLeft size={14} className="hidden sm:block" />How it works
            </a>
            <button type="button" onClick={() => { tRef.current?.cta("pricing", "Pricing (top bar)"); go("pricing"); }} className="inline-flex h-8 items-center rounded-lg px-2 text-[13px] font-semibold text-[#cbd5e1] hover:text-white sm:px-2.5">
              Pricing
            </button>
            <a href={cfg.contactHref} onClick={() => tRef.current?.cta("get_this", "Plan my own build (top bar)")} className="ml-1 inline-flex h-8 items-center gap-1.5 rounded-lg bg-white px-2.5 text-[13px] font-semibold text-[#0f172a] hover:bg-[#e2e8f0] sm:px-3">
              <span className="sm:hidden">My build</span>
              <span className="hidden sm:inline">Plan my own build</span>
              <ArrowRight size={14} className="hidden sm:block" />
            </a>
          </div>
        </div>
      </div>

      <div className="md:grid md:grid-cols-[248px_minmax(0,1fr)]">
        <aside className="sticky top-0 hidden h-screen flex-col border-r border-[#e3e6eb] bg-white md:flex">
          <div className="flex h-[73px] shrink-0 flex-col justify-center gap-2 border-b border-[#e3e6eb] px-5">
            <a href="/" onClick={() => tRef.current?.cta("home", "Coelor logo (sidebar)")} className="self-start rounded-md" aria-label="Coelor home page">
              <CoelorWordmark height={19} />
            </a>
            <p className="truncate text-[12.5px] leading-tight text-[#64748b]"><b className="font-semibold text-[#334155]">{cfg.label}</b> · {cfg.goods}</p>
          </div>
          <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3" aria-label="Demo sections">
            {SECTIONS.map((s) => {
              const on = s.id === section;
              const Ico = s.icon;
              return (
                <button key={s.id} type="button" onClick={() => go(s.id)} aria-current={on ? "page" : undefined}
                  className={`flex h-10 shrink-0 items-center gap-3 rounded-lg px-3 text-left text-[14px] font-semibold transition-colors ${on ? "bg-[#eff6ff] text-[#1d4ed8]" : "text-[#475569] hover:bg-[#f4f5f7] hover:text-[#0f172a]"}`}>
                  <Ico size={18} />
                  {s.label}
                  {s.beta && <BetaPill />}
                </button>
              );
            })}
          </nav>
          <div className="m-3 rounded-xl border border-[#e3e6eb] bg-[#f8fafc] p-4">
            <p className="flex items-center gap-2 text-[13px] font-semibold"><Lock size={14} />One client&apos;s build</p>
            <p className="mt-1 text-[12.5px] leading-[1.5] text-[#64748b]">Made for this boutique&apos;s channels, stockroom, carriers and rules. Yours is scoped with you and built for your own.</p>
            <OfferLines />
            <a href={cfg.contactHref} onClick={() => tRef.current?.cta("get_this", "Plan my own build (sidebar)")} className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-[#2563eb] text-[13.5px] font-semibold text-white hover:bg-[#1d4ed8]">
              Plan my own build
            </a>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-20 border-b border-[#e3e6eb] bg-white/95 backdrop-blur">
            <div className="flex h-[60px] items-center gap-2.5 px-4 sm:gap-3 md:h-[72px] md:px-6">
              <a href="/" onClick={() => tRef.current?.cta("home", "Coelor logo (header)")} className="shrink-0 rounded-md md:hidden" aria-label="Coelor home page">
                <CoelorWordmark height={15} />
              </a>
              <span className="h-6 w-px shrink-0 bg-[#e3e6eb] md:hidden" aria-hidden />
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-[17px] font-bold leading-tight tracking-[-0.01em] sm:text-[19px] md:text-[21px]">{cur.title}</h1>
                <p className="hidden truncate text-[13px] text-[#64748b] sm:block">{cur.sub}</p>
              </div>
              {live && <span className="hidden lg:inline-flex"><Badge tone="red" dot>{cfg.channels.find((c) => c.id === live)?.name} LIVE now</Badge></span>}
              {world && (
                <Badge tone="green" dot>
                  Live<span className="hidden sm:inline"> · updated {ago(new Date(now).toISOString(), Date.now())}</span>
                </Badge>
              )}
              <button type="button" onClick={refresh} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[#d9dde3] bg-white text-[#475569] hover:bg-[#f8fafc]" aria-label="Refresh">
                <RefreshCw size={16} className={busy ? "animate-spin" : ""} />
              </button>
            </div>
            <nav className="flex gap-1 overflow-x-auto px-3 pb-2 [scrollbar-width:none] md:hidden [&::-webkit-scrollbar]:hidden" aria-label="Demo sections">
              {SECTIONS.map((s) => (
                <button key={s.id} type="button" onClick={() => go(s.id)} className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold ${s.id === section ? "bg-[#0f172a] text-white" : "bg-[#eef0f3] text-[#475569]"}`}>
                  {s.label}
                  {s.beta && <BetaPill />}
                </button>
              ))}
            </nav>
          </header>

          <main className="mx-auto max-w-[1320px] p-4 md:p-6 lg:p-8">
            {section !== "pricing" && <CustomNotice who={cfg.who} setup={cfg.setup} contact={cfg.contactHref} t={tRef.current} />}
            {section === "pricing" && <PricingView contact={cfg.contactHref} t={tRef.current} />}
            {failed ? (
              <div className="rounded-xl border border-[#e3e6eb] bg-white p-8 text-center text-[14px] text-[#64748b]">The store could not be read just now. Refresh the page in a moment.</div>
            ) : (
              <>
                {section === "dashboard" && <Dashboard ctx={ctx} />}
                {section === "assistant" && <SheetAssistant ctx={ctx} profile={assistant} />}
                {section === "orders" && <Orders ctx={ctx} />}
                {section === "products" && <Products ctx={ctx} />}
                {section === "shipping" && <Shipping ctx={ctx} />}
                {section === "automations" && <Automations ctx={ctx} />}
                {section === "connections" && <Connections ctx={ctx} />}
              </>
            )}
            {section !== "pricing" && <OfferCard contact={cfg.contactHref} t={tRef.current} open={() => go("pricing")} />}
            <p className="mt-8 text-center text-[12.5px] leading-[1.6] text-[#94a3b8]">
              A custom build by <a href="/" className="font-semibold text-[#64748b] hover:text-[#0f172a]">Coelor</a>, made for one store · customer names and order numbers hidden
            </p>
          </main>
        </div>
      </div>

      {dialog && <ViewOnly d={dialog} onClose={closeDialog} t={tRef.current} contact={cfg.contactHref} />}
      {drawer && world && <ProductDrawer id={drawer} ctx={ctx} onClose={closeDrawer} />}
    </div>
  );
}

/* ---------- the "view only" dialog ---------- */

function ViewOnly({ d, onClose, t, contact }: { d: NonNullable<Dialog>; onClose: () => void; t: DemoTracker | null; contact: string }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  const name = d.name ?? "it";
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-[#0f172a]/40 p-4 sm:items-center" onClick={onClose} role="presentation">
      <div role="dialog" aria-modal="true" aria-labelledby="vo-title" onClick={(e) => e.stopPropagation()} className="max-h-[calc(100dvh-2rem)] w-full max-w-[440px] overflow-y-auto rounded-2xl bg-white p-6 shadow-[0_24px_60px_-12px_rgba(15,23,42,0.35)]">
        <div className="flex items-start gap-3">
          {d.slug && hasMark(d.slug) ? <BrandMark slug={d.slug} name={name} size={44} /> : <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#eff6ff] text-[#1d4ed8]"><Lock size={20} /></span>}
          <div className="min-w-0 flex-1">
            <h2 id="vo-title" className="text-[17px] font-bold">{d.title}</h2>
            <p className="mt-0.5 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[#b45309]"><Lock size={12} />View only in this demo</p>
          </div>
          <button type="button" onClick={onClose} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[#94a3b8] hover:bg-[#f4f5f7] hover:text-[#0f172a]" aria-label="Close"><X size={16} /></button>
        </div>
        <p className="mt-4 text-[14.5px] leading-[1.6] text-[#334155]">{d.body}</p>
        <OfferNote name={d.slug ? name : undefined} />
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button onClick={onClose}>Keep looking</Button>
          <a href={contact} onClick={() => t?.cta("get_this", d.slug ? `Add ${d.slug} to my build` : "Plan my own build (view only)")}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#2563eb] px-3.5 text-[14px] font-semibold text-white hover:bg-[#1d4ed8]">
            {d.slug ? `Add ${name} to my build` : "Plan my own build"}<ArrowRight size={15} />
          </a>
        </div>
      </div>
    </div>
  );
}

/* ---------- one product ---------- */

function ProductDrawer({ id, ctx, onClose }: { id: string; ctx: SCtx; onClose: () => void }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  const d = useMemo(() => ctx.world?.product(id, ctx.now) ?? null, [ctx.world, id, ctx.now]);
  const { cfg } = ctx;
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[#0f172a]/30" onClick={onClose} role="presentation">
      <aside role="dialog" aria-modal="true" aria-label="Product" onClick={(e) => e.stopPropagation()} className="flex h-full w-full max-w-[480px] flex-col overflow-y-auto bg-white shadow-[-24px_0_60px_-24px_rgba(15,23,42,0.35)]">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#eef0f3] bg-white px-5 py-4">
          <span className="inline-flex items-center gap-2 text-[14px] font-semibold"><BrandMark slug={cfg.stock.logo} name={cfg.stock.name} size={22} />Product · stock count</span>
          <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-[#94a3b8] hover:bg-[#f4f5f7] hover:text-[#0f172a]" aria-label="Close"><X size={16} /></button>
        </div>
        {!d ? (
          <div className="p-5 text-[14px] text-[#64748b]">This product is not in the store any more.</div>
        ) : (
          <div className="flex flex-col gap-5 p-5">
            <div className="flex gap-4">
              <div className="h-32 w-24 shrink-0 overflow-hidden rounded-xl border border-[#eef0f3] bg-[#f8fafc]">
                {d.row.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={d.row.image} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                )}
              </div>
              <div className="min-w-0">
                <h2 className="text-[17px] font-bold leading-snug">{d.row.title}</h2>
                <p className="mt-1 text-[13px] text-[#64748b]">{[d.row.brand, d.row.category, `$${d.row.price}`].filter(Boolean).join(" · ")}</p>
                <p className="mt-2 text-[13px] font-medium text-[#15803d]">{d.row.soldOut ? "Sold out · pulled from every channel" : `${fmt(d.row.inStock)} in stock · ${d.row.soldToday} sold today`}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {d.row.listedOn.map((c) => {
                    const ch = cfg.channels.find((x) => x.id === c)!;
                    return <span key={c} className="inline-flex items-center gap-1.5 rounded-full border border-[#e3e6eb] py-0.5 pl-0.5 pr-2.5 text-[12px] font-medium"><BrandMark slug={ch.logo} name={ch.name} size={18} className="!rounded-full" />{ch.name}</span>;
                  })}
                </div>
              </div>
            </div>
            <section>
              <h3 className="mb-2 text-[12.5px] font-semibold uppercase tracking-[0.05em] text-[#64748b]">Stock per size · the same on every channel</h3>
              <div className="overflow-hidden rounded-xl border border-[#eef0f3]">
                {d.row.stock.map((v) => (
                  <div key={v.id} className="flex items-center gap-3 border-b border-[#f1f3f5] px-3.5 py-2.5 text-[13.5px] last:border-0">
                    <span className="w-14 font-semibold">{v.size}</span>
                    <span className="min-w-0 flex-1 truncate text-[#64748b]">{v.color || "–"}</span>
                    <span className="text-[12.5px] text-[#64748b]">{v.soldToday ? `${v.soldToday} sold today` : ""}</span>
                    <span className={`w-20 text-right font-semibold tabular-nums ${v.stock ? "text-[#0f172a]" : "text-[#b91c1c]"}`}>{v.stock ? `${v.stock} left` : "Sold out"}</span>
                  </div>
                ))}
              </div>
            </section>
            <section>
              <h3 className="mb-2 text-[12.5px] font-semibold uppercase tracking-[0.05em] text-[#64748b]">Recent orders</h3>
              {d.orders.length ? (
                <ul className="flex flex-col gap-2">
                  {d.orders.map((o) => {
                    const ch = cfg.channels.find((x) => x.id === o.channel)!;
                    const l = o.lines.find((x) => x.productId === id)!;
                    return (
                      <li key={o.id} className="flex items-center gap-2.5 rounded-lg border border-[#eef0f3] px-3 py-2 text-[13px]">
                        <BrandMark slug={ch.logo} name={ch.name} size={22} />
                        <span className="min-w-0 flex-1 truncate">{l.size}{l.color ? ` · ${l.color}` : ""} · {o.ref} · to {o.shipTo}</span>
                        <span className="shrink-0 text-[12px] text-[#64748b]">{o.state} · {ago(o.placedAt, ctx.now)}</span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-[13px] text-[#64748b]">No orders in the last 30 days.</p>
              )}
            </section>
            <div className="flex flex-wrap gap-2 border-t border-[#f1f3f5] pt-4">
              <Button onClick={() => ctx.locked("push_listing", "Pushing a listing")}>Push to a channel</Button>
              <Button onClick={() => ctx.locked("pull_listing", "Pulling a listing")}>Pull a listing</Button>
              <Button onClick={() => ctx.locked("adjust_stock", "Changing the stock")}>Adjust stock</Button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}

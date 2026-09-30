"use client";

// The live demo (/demo/multi-platform-sync): the sync we run for a Dutch sneaker reseller (StockX EU + US, Alias and
// Alias USA, one Picqer warehouse), as an integration app a seller would use. Real data, read-only. Sections switch
// without a page load (?section= in the address); lib/demo/track.ts records what the visitor looks at.
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Boxes, Lock, LayoutDashboard, Plug, Receipt, RefreshCw, Tag, X, Zap, type LucideIcon } from "lucide-react";
import type { Overview, Product } from "@/lib/demo/shape";
import { startDemoTracker, type DemoTracker } from "@/lib/demo/track";
import { Automations, Connections, Dashboard, Listings, Orders, Products, type Ctx, type Live, type SectionId } from "@/components/demo/views";
import { Badge, Button, LOGO_SLUG, Logo, ago, fmt } from "@/components/demo/ui";
import { platformInfo } from "@/lib/platforms";

const CONTACT = "/case-studies/stock-sync#contact";
const CASE = "/case-studies/stock-sync";

const SECTIONS: { id: SectionId; label: string; icon: LucideIcon; title: string; sub: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, title: "Dashboard", sub: "The sync right now: channels, orders and automations" },
  { id: "connections", label: "Connections", icon: Plug, title: "Connections", sub: "Marketplace accounts and the warehouse, connected to one stock count" },
  { id: "orders", label: "Orders", icon: Receipt, title: "Orders", sub: "StockX and Alias orders, and what the sync did with the stock" },
  { id: "products", label: "Products", icon: Boxes, title: "Products", sub: "Picqer products linked to the same size on every account" },
  { id: "listings", label: "Listings", icon: Tag, title: "Listings", sub: "Marketplace listings the sync watches" },
  { id: "automations", label: "Automations", icon: Zap, title: "Automations", sub: "What runs on its own, and when it last ran" },
];

type Dialog = { title: string; body: string; slug?: string } | null;

export default function DemoApp({ initial, first }: { initial: Live<Overview> | null; first: SectionId }) {
  const [section, setSection] = useState<SectionId>(first);
  const [ov, setOv] = useState<Live<Overview> | null>(initial);
  const [ovFailed, setOvFailed] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [reload, setReload] = useState(0);
  const [busy, setBusy] = useState(false);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [drawer, setDrawer] = useState<string | null>(null);
  const [t, setT] = useState<DemoTracker | null>(null);
  const tRef = useRef<DemoTracker | null>(null);

  useEffect(() => {
    const tr = startDemoTracker(first);
    tRef.current = tr;
    setT(tr);
    return () => tr.stop();
  }, [first]);

  // the overview (dashboard, connections, automations): fetched now if the page came without it, then every 30 s
  const loadOverview = useCallback(async () => {
    try {
      const r = await fetch("/api/demo/overview", { headers: { accept: "application/json" } });
      if (!r.ok) throw new Error(String(r.status));
      setOv((await r.json()) as Live<Overview>);
      setOvFailed(false);
    } catch {
      setOvFailed(true);
      tRef.current?.error("overview");
    }
  }, []);
  useEffect(() => {
    if (!initial) loadOverview();
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") loadOverview();
    }, 30_000);
    const tick = window.setInterval(() => setNow(Date.now()), 15_000);
    return () => {
      window.clearInterval(id);
      window.clearInterval(tick);
    };
  }, [initial, loadOverview]);

  const go = useCallback((s: SectionId) => {
    setSection(s);
    tRef.current?.view(s);
    const u = new URL(location.href);
    u.searchParams.set("section", s);
    history.replaceState(null, "", u);
    window.scrollTo({ top: 0 });
  }, []);

  const refresh = async () => {
    setBusy(true);
    tRef.current?.action("refresh", section);
    await loadOverview();
    setReload((n) => n + 1);
    setNow(Date.now());
    setBusy(false);
  };

  const ctx: Ctx = {
    now,
    reload,
    t,
    go,
    open: (id) => {
      setDrawer(id);
      tRef.current?.action("open_product", section);
    },
    locked: (what, text) => {
      tRef.current?.action("locked", what);
      setDialog({ title: "View only", body: `${text ?? "This"} is switched off in the demo, so nothing changes in the live store. In your own setup it works with one click.` });
    },
    connect: (slug, name) => {
      tRef.current?.connect(slug);
      setDialog({ title: `Connect ${name}`, slug, body: `This demo is a live store that is already running, so it is view only. We connect ${name} to the same stock count for your store: every sale there comes off Picqer, and sold-out sizes come down everywhere.` });
    },
  };

  const closeDrawer = useCallback(() => setDrawer(null), []);
  const closeDialog = useCallback(() => setDialog(null), []);
  const cur = SECTIONS.find((s) => s.id === section)!;
  const stale = ov?.stale || ovFailed;

  return (
    <div data-track="off" className="min-h-screen bg-[#f4f5f7] font-sans text-[#0f172a] [color-scheme:light]">
      {/* the demo's frame: what this is, and the way back */}
      <div className="bg-[#0f172a] text-white">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 md:px-6">
          <span className="inline-flex items-center gap-2 text-[13px] font-semibold">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#4ade80]" />
            Live demo
          </span>
          <span className="min-w-0 flex-1 text-[13px] text-[#cbd5e1]">Real data from a sneaker reseller&apos;s running sync. Read-only: nothing you click changes their store.</span>
          <div className="flex items-center gap-2">
            <a href={CASE} onClick={() => tRef.current?.cta("back_case", "Case study")} className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-semibold text-[#cbd5e1] hover:text-white">
              <ArrowLeft size={14} />Case study
            </a>
            <a href={CONTACT} onClick={() => tRef.current?.cta("get_this", "Get this for your store (top bar)")} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-white px-3 text-[13px] font-semibold text-[#0f172a] hover:bg-[#e2e8f0]">
              Get this for your store<ArrowRight size={14} />
            </a>
          </div>
        </div>
      </div>

      <div className="md:grid md:grid-cols-[248px_minmax(0,1fr)]">
        <aside className="sticky top-0 hidden h-screen flex-col border-r border-[#e3e6eb] bg-white md:flex">
          <div className="flex items-center gap-3 border-b border-[#eef0f3] px-4 py-4">
            <span className="flex -space-x-2">
              <Logo slug={LOGO_SLUG.stockx} name="StockX" size={28} className="ring-2 ring-white" />
              <Logo slug={LOGO_SLUG.picqer} name="Picqer" size={28} className="ring-2 ring-white" />
              <Logo slug={LOGO_SLUG.alias} name="Alias" size={28} className="ring-2 ring-white" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[14px] font-bold">Multi-platform sync</p>
              <p className="truncate text-[12px] text-[#64748b]">Sneaker reseller · NL</p>
            </div>
          </div>
          <nav className="flex flex-1 flex-col gap-0.5 p-3" aria-label="Demo sections">
            {SECTIONS.map((s) => {
              const on = s.id === section;
              const Ico = s.icon;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => go(s.id)}
                  aria-current={on ? "page" : undefined}
                  className={`flex h-10 items-center gap-3 rounded-lg px-3 text-left text-[14px] font-semibold transition-colors ${on ? "bg-[#eff6ff] text-[#1d4ed8]" : "text-[#475569] hover:bg-[#f4f5f7] hover:text-[#0f172a]"}`}
                >
                  <Ico size={18} />
                  {s.label}
                </button>
              );
            })}
          </nav>
          <div className="m-3 rounded-xl border border-[#e3e6eb] bg-[#f8fafc] p-4">
            <p className="flex items-center gap-2 text-[13px] font-semibold"><Lock size={14} />Read-only demo</p>
            <p className="mt-1 text-[12.5px] leading-[1.5] text-[#64748b]">This is a real store&apos;s sync. We set up the same for yours.</p>
            <a href={CONTACT} onClick={() => tRef.current?.cta("get_this", "Get this for your store (sidebar)")} className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-[#2563eb] text-[13.5px] font-semibold text-white hover:bg-[#1d4ed8]">
              Get this for your store
            </a>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-20 border-b border-[#e3e6eb] bg-white/95 backdrop-blur">
            <div className="flex items-center gap-3 px-4 py-3 md:px-6 md:py-4">
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-[19px] font-bold tracking-[-0.01em] md:text-[21px]">{cur.title}</h1>
                <p className="hidden truncate text-[13px] text-[#64748b] sm:block">{cur.sub}</p>
              </div>
              {ov && (
                <Badge tone={stale ? "amber" : "green"} dot>
                  {stale ? `Paused · data from ${ago(ov.at, now)}` : `Live · updated ${ago(ov.at, now)}`}
                </Badge>
              )}
              <button type="button" onClick={refresh} className="grid h-9 w-9 place-items-center rounded-lg border border-[#d9dde3] bg-white text-[#475569] hover:bg-[#f8fafc]" aria-label="Refresh">
                <RefreshCw size={16} className={busy ? "animate-spin" : ""} />
              </button>
            </div>
            {/* phones: the sections as a scrolling row */}
            <nav className="flex gap-1 overflow-x-auto px-3 pb-2 md:hidden" aria-label="Demo sections">
              {SECTIONS.map((s) => (
                <button key={s.id} type="button" onClick={() => go(s.id)} className={`h-8 shrink-0 rounded-full px-3 text-[13px] font-semibold ${s.id === section ? "bg-[#0f172a] text-white" : "bg-[#eef0f3] text-[#475569]"}`}>
                  {s.label}
                </button>
              ))}
            </nav>
          </header>

          <main className="mx-auto max-w-[1320px] p-4 md:p-6 lg:p-8">
            {section === "dashboard" && <Dashboard ov={ov} ctx={ctx} />}
            {section === "connections" && <Connections ov={ov} ctx={ctx} />}
            {section === "orders" && <Orders ctx={ctx} />}
            {section === "products" && <Products ctx={ctx} />}
            {section === "listings" && <Listings ctx={ctx} />}
            {section === "automations" && <Automations ov={ov} ctx={ctx} />}
            <p className="mt-8 text-center text-[12.5px] text-[#94a3b8]">
              Built and run by <a href="/" className="font-semibold text-[#64748b] hover:text-[#0f172a]">Coelor</a> · live data, names and order numbers hidden
            </p>
          </main>
        </div>
      </div>

      {dialog && <ViewOnly d={dialog} onClose={closeDialog} t={tRef.current} />}
      {drawer && <ProductDrawer id={drawer} ctx={ctx} onClose={closeDrawer} />}
    </div>
  );
}

/* ---------- the "view only" dialog ---------- */

function ViewOnly({ d, onClose, t }: { d: NonNullable<Dialog>; onClose: () => void; t: DemoTracker | null }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  const p = d.slug ? platformInfo(d.slug) : null;
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-[#0f172a]/40 p-4 sm:items-center" onClick={onClose} role="presentation">
      <div role="dialog" aria-modal="true" aria-labelledby="vo-title" onClick={(e) => e.stopPropagation()} className="w-full max-w-[440px] rounded-2xl bg-white p-6 shadow-[0_24px_60px_-12px_rgba(15,23,42,0.35)]">
        <div className="flex items-start gap-3">
          {p ? <Logo slug={d.slug!} name={p.name} size={44} /> : <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#eff6ff] text-[#1d4ed8]"><Lock size={20} /></span>}
          <div className="min-w-0 flex-1">
            <h2 id="vo-title" className="text-[17px] font-bold">{d.title}</h2>
            <p className="mt-0.5 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[#b45309]"><Lock size={12} />View only in this demo</p>
          </div>
          <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-[#94a3b8] hover:bg-[#f4f5f7] hover:text-[#0f172a]" aria-label="Close"><X size={16} /></button>
        </div>
        <p className="mt-4 text-[14.5px] leading-[1.6] text-[#334155]">{d.body}</p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button onClick={onClose}>Keep looking</Button>
          <a
            href={CONTACT}
            onClick={() => t?.cta("get_this", d.slug ? `Connect ${d.slug} for my store` : "Get this for your store (view only)")}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#2563eb] px-3.5 text-[14px] font-semibold text-white hover:bg-[#1d4ed8]"
          >
            {d.slug ? `Connect ${p?.name ?? "it"} for my store` : "Get this for your store"}<ArrowRight size={15} />
          </a>
        </div>
      </div>
    </div>
  );
}

/* ---------- one product ---------- */

function ProductDrawer({ id, ctx, onClose }: { id: string; ctx: Ctx; onClose: () => void }) {
  const [p, setP] = useState<Live<Product> | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let alive = true;
    fetch(`/api/demo/product?id=${encodeURIComponent(id)}`)
      .then((r) => (r.ok ? (r.json() as Promise<Live<Product>>) : Promise.reject(r.status)))
      .then((d) => alive && setP(d))
      .catch(() => alive && setFailed(true));
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => {
      alive = false;
      window.removeEventListener("keydown", k);
    };
  }, [id, onClose]);
  const d = p?.data;
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[#0f172a]/30" onClick={onClose} role="presentation">
      <aside role="dialog" aria-modal="true" aria-label="Product" onClick={(e) => e.stopPropagation()} className="flex h-full w-full max-w-[480px] flex-col overflow-y-auto bg-white shadow-[-24px_0_60px_-24px_rgba(15,23,42,0.35)]">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#eef0f3] bg-white px-5 py-4">
          <span className="inline-flex items-center gap-2 text-[14px] font-semibold"><Logo slug={LOGO_SLUG.picqer} name="Picqer" size={22} />Product in Picqer</span>
          <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-[#94a3b8] hover:bg-[#f4f5f7] hover:text-[#0f172a]" aria-label="Close"><X size={16} /></button>
        </div>
        {!d ? (
          <div className="p-5 text-[14px] text-[#64748b]">{failed ? "This product could not be loaded just now." : "Loading the live product…"}</div>
        ) : (
          <div className="flex flex-col gap-5 p-5">
            <div className="flex gap-4">
              <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-xl border border-[#eef0f3] bg-[#f8fafc]">
                {d.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={d.image} alt="" className="h-full w-full object-contain" referrerPolicy="no-referrer" />
                ) : (
                  <Boxes size={28} className="text-[#cbd5e1]" />
                )}
              </div>
              <div className="min-w-0">
                <h2 className="text-[16px] font-bold leading-snug">{d.name}</h2>
                <p className="mt-1 text-[13px] text-[#64748b]">{d.code}{d.color && ` · ${d.color}`}</p>
                <p className="text-[13px] text-[#64748b]">US {d.us || "–"} · EU {d.eu || "–"}</p>
                {d.photoAt && <p className="mt-1 text-[12px] font-medium text-[#15803d]">Photo added by the sync {ago(d.photoAt, ctx.now)}</p>}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 rounded-xl border border-[#e3e6eb] p-4 text-center">
              {d.stock ? (
                <>
                  <div><p className="text-[24px] font-bold tabular-nums">{fmt(d.stock.free)}</p><p className="text-[12px] text-[#64748b]">Free stock</p></div>
                  <div><p className="text-[24px] font-bold tabular-nums text-[#475569]">{fmt(d.stock.total)}</p><p className="text-[12px] text-[#64748b]">In stock</p></div>
                  <div><p className="text-[24px] font-bold tabular-nums text-[#475569]">{fmt(d.stock.reserved)}</p><p className="text-[12px] text-[#64748b]">Reserved</p></div>
                </>
              ) : (
                <p className="col-span-3 text-[13px] text-[#64748b]">Live stock could not be read just now.</p>
              )}
            </div>

            <section>
              <h3 className="mb-2 text-[12.5px] font-semibold uppercase tracking-[0.05em] text-[#64748b]">Linked to</h3>
              {d.links.length ? (
                <ul className="flex flex-col gap-2">
                  {d.links.map((l) => (
                    <li key={l.store} className="flex items-center gap-3 rounded-lg border border-[#eef0f3] px-3 py-2.5">
                      <Logo slug={l.platform === "stockx" ? LOGO_SLUG.stockx : LOGO_SLUG.alias} name={l.storeLabel} size={30} />
                      <div className="min-w-0 flex-1">
                        <p className="text-[13.5px] font-semibold">{l.storeLabel}</p>
                        <p className="truncate text-[12.5px] text-[#64748b]">{l.name || l.style} · US {l.size}</p>
                      </div>
                      <Badge tone="green">Linked</Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[13.5px] text-[#64748b]">Not linked to a marketplace listing yet.</p>
              )}
            </section>

            {d.aliasListings.length > 0 && (
              <section>
                <h3 className="mb-2 text-[12.5px] font-semibold uppercase tracking-[0.05em] text-[#64748b]">Live on Alias now</h3>
                <p className="text-[13.5px] text-[#334155]">{d.aliasListings.map((a) => `${a.count} listing${a.count === 1 ? "" : "s"} on ${a.storeLabel}`).join(" · ")}. They come down when this size sells out.</p>
              </section>
            )}

            <div className="flex flex-wrap gap-2 border-t border-[#f1f3f5] pt-4">
              <Button small onClick={() => ctx.locked("link_listing", "Linking another listing")}>Link a listing</Button>
              <Button small onClick={() => ctx.locked("pull_listing", "Pulling a listing by hand")}>Pull from StockX / Alias</Button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}

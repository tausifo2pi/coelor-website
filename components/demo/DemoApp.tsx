"use client";

// The live demo (/demo/multi-platform-sync): the custom build we run for a Dutch sneaker reseller (StockX EU + US, Alias
// and Alias USA, one Picqer warehouse) and the other channels of lib/demo/channels.ts. Shown as that one client's build
// (CustomNotice: theirs is made for their own setup), not as a product to pick (step 5a, user 2026-10-11). Read-only; every channel looks the same. Sections switch without a page load (?section= in the address);
// lib/demo/track.ts records what the visitor looks at.
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, BadgeDollarSign, Boxes, History, Lock, LayoutDashboard, Plug, Receipt, RefreshCw, Sparkles, Tag, X, Zap, type LucideIcon } from "lucide-react";
import { PICQER } from "@/lib/demo/channels";
import type { Overview, Product } from "@/lib/demo/shape";
import { startDemoTracker, type DemoTracker } from "@/lib/demo/track";
import { demoGet } from "@/lib/demo/gen";
import { NorthvaleFields } from "@/components/demo/workspace/Fields";
import { Automations, Connections, Dashboard, Listings, Orders, Products, type Ctx, type Live, type SectionId } from "@/components/demo/views";
import { Extra } from "@/components/demo/Extra";
import { Badge, BetaPill, BrandMark, Button, Logo, ago, brandOf, fmt, hasMark } from "@/components/demo/ui";
import { OfferCard, OfferNote } from "@/components/demo/Offer";
import { PricingView } from "@/components/demo/Pricing";
import { CustomNotice } from "@/components/demo/CustomNotice";
import { NORTHVALE } from "@/lib/demo/clients";
import { BuildLog } from "@/components/demo/workspace/BuildLog";
import { accentVars } from "@/components/demo/workspace/ClientMark";
import { DemoFooter, PageTitle, TopBarText, WorkspaceFoot, WorkspaceHead, navItem, navPill, primaryBtn } from "@/components/demo/workspace/Shell";
import { possessive } from "@/components/demo/workspace/format";

const CONTACT = "/case-studies/stock-sync#contact";
const CASE = "/case-studies/stock-sync";
// the demo shop this workspace is shown as (lib/demo/clients.ts): its name, colours, team and build log
const CLIENT = NORTHVALE;

const SECTIONS: { id: SectionId; label: string; icon: LucideIcon; title: string; sub: string; beta?: boolean }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, title: "Dashboard", sub: "This build right now: channels, orders and automations" },
  { id: "assistant", label: "Assistant", icon: Sparkles, title: "Assistant", sub: "Routines that get data and post it to your team, written from a chat (beta)", beta: true },
  { id: "connections", label: "Connections", icon: Plug, title: "Connections", sub: "Sales channels, the warehouse and the tools, on one stock count" },
  { id: "orders", label: "Orders", icon: Receipt, title: "Orders", sub: "Orders from every channel, and what the sync did with the stock" },
  { id: "products", label: "Products", icon: Boxes, title: "Products", sub: "Picqer products linked to the same size on every account" },
  { id: "listings", label: "Listings", icon: Tag, title: "Listings", sub: "Channel listings the sync watches" },
  { id: "automations", label: "Automations", icon: Zap, title: "Automations", sub: "What runs on its own, and when it last ran" },
  { id: "build", label: "Build log", icon: History, title: "Build log", sub: "Every change to this build: what the team asked for, and when it went live" },
  { id: "pricing", label: "Your build & price", icon: BadgeDollarSign, title: "Your own build and its price", sub: "Scoped with you, $500 per connection, one-time. Try 1 connection free for 7 days." },
];

type Dialog = { title: string; body: string; slug?: string; name?: string } | null;

/** the section the address asks for (?section=; "extra" was the Assistant's old name, old links still open it) */
function sectionFromUrl(): SectionId {
  const want = new URLSearchParams(location.search).get("section");
  const s = want === "extra" ? "assistant" : want;
  return SECTIONS.some((x) => x.id === s) ? (s as SectionId) : "dashboard";
}

// The page is static (built once, no data in it): the section and the live data are read here, in the browser.
export default function DemoApp() {
  const [section, setSection] = useState<SectionId>("dashboard");
  const [ov, setOv] = useState<Live<Overview> | null>(null);
  const [ovFailed, setOvFailed] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [reload, setReload] = useState(0);
  const [busy, setBusy] = useState(false);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [drawer, setDrawer] = useState<string | null>(null);
  const [t, setT] = useState<DemoTracker | null>(null);
  const tRef = useRef<DemoTracker | null>(null);
  // one "data did not load" event per page view, however often a refresh fails after that
  const failedSent = useRef(false);

  // the overview (dashboard, connections, automations): fetched at once, then every 30 s while the tab is visible
  const loadOverview = useCallback(async () => {
    try {
      setOv(await demoGet<Live<Overview>>("/api/demo/overview"));
      setOvFailed(false);
    } catch {
      setOvFailed(true);
      if (!failedSent.current) tRef.current?.error("overview");
      failedSent.current = true;
    }
  }, []);
  useEffect(() => {
    loadOverview();
    const first = sectionFromUrl();
    setSection(first);
    const tr = startDemoTracker(first);
    tRef.current = tr;
    setT(tr);
    setNow(Date.now());
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") loadOverview();
    }, 30_000);
    const tick = window.setInterval(() => setNow(Date.now()), 15_000);
    return () => {
      window.clearInterval(id);
      window.clearInterval(tick);
      tr.stop();
    };
  }, [loadOverview]);

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
      setDialog({ title: "View only", body: `${text ?? "This"} is switched off in the demo, so nothing in ${possessive(CLIENT.name)} build changes. In your own build it works the way you decide.` });
    },
    connect: (slug, name, body) => {
      tRef.current?.connect(slug);
      setDialog({
        title: `Connect ${name}`,
        slug,
        name,
        body: body ?? `This demo is ${possessive(CLIENT.name)} build, so it is view only. In your own build, ${name} is connected the way your setup needs it: what comes in, what goes out and the rules are decided with you.`,
      });
    },
  };

  const closeDrawer = useCallback(() => setDrawer(null), []);
  const closeDialog = useCallback(() => setDialog(null), []);
  const cur = SECTIONS.find((s) => s.id === section)!;
  const stale = ov?.stale || ovFailed;

  return (
    <div data-track="off" className="min-h-screen bg-[#f4f5f7] font-sans text-[#0f172a] [color-scheme:light]" style={accentVars(CLIENT)}>
      {/* the demo's frame: what this is, and the way back. Phones: the label and the links, then one line of text */}
      <div className="bg-[#0f172a] text-white">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 md:px-6 xl:py-2.5">
          <span className="order-1 inline-flex shrink-0 items-center gap-2 text-[13px] font-semibold">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#4ade80]" />
            Live demo
          </span>
          <p className="order-3 w-full text-[12.5px] leading-[1.5] text-[#cbd5e1] xl:order-2 xl:w-auto xl:min-w-0 xl:flex-1 xl:text-[13px]">
            <TopBarText client={CLIENT} />
          </p>
          <div className="order-2 ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1.5 xl:order-3">
            <a href={CASE} onClick={() => tRef.current?.cta("back_case", "Case study")} className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-[13px] font-semibold text-[#cbd5e1] hover:text-white sm:px-2.5">
              <ArrowLeft size={14} className="hidden sm:block" />Case study
            </a>
            <button type="button" onClick={() => { tRef.current?.cta("pricing", "Pricing (top bar)"); go("pricing"); }} className="inline-flex h-8 items-center rounded-lg px-2 text-[13px] font-semibold text-[#cbd5e1] hover:text-white sm:px-2.5">
              Pricing
            </button>
            <a href={CONTACT} onClick={() => tRef.current?.cta("get_this", "Plan my own build (top bar)")} className="ml-1 inline-flex h-8 items-center gap-1.5 rounded-lg bg-white px-2.5 text-[13px] font-semibold text-[#0f172a] hover:bg-[#e2e8f0] sm:px-3">
              <span className="sm:hidden">My build</span>
              <span className="hidden sm:inline">Plan my own build</span>
              <ArrowRight size={14} className="hidden sm:block" />
            </a>
          </div>
        </div>
      </div>

      <div className="md:grid md:grid-cols-[248px_minmax(0,1fr)]">
        <aside className="sticky top-0 hidden h-screen flex-col overflow-y-auto border-r border-[#e3e6eb] bg-white md:flex">
          <WorkspaceHead client={CLIENT} />
          <nav className="flex flex-col gap-0.5 p-3" aria-label="Demo sections">
            {SECTIONS.map((s) => {
              const on = s.id === section;
              const Ico = s.icon;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => go(s.id)}
                  aria-current={on ? "page" : undefined}
                  // our own section (the reader's build and its price) sits apart from the client's workspace
                  className={`${navItem(on)} ${s.id === "pricing" ? "mt-2.5" : ""}`}
                >
                  <Ico size={18} />
                  {s.label}
                  {s.beta && <BetaPill />}
                </button>
              );
            })}
          </nav>
          <WorkspaceFoot client={CLIENT} made="Made for their accounts, warehouse and rules." contact={CONTACT} t={t} />
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-20 border-b border-[#e3e6eb] bg-white/95 backdrop-blur">
            <div className="flex h-[60px] items-center gap-2.5 px-4 sm:gap-3 md:h-[72px] md:px-6">
              <PageTitle client={CLIENT} title={cur.title} sub={cur.sub} />
              {ov && (
                <Badge tone={stale ? "amber" : "green"} dot>
                  {stale ? "Updating" : "Live"}
                  <span className="hidden sm:inline">{stale ? ` · data from ${ago(ov.at, now)}` : ` · updated ${ago(ov.at, now)}`}</span>
                </Badge>
              )}
              <button type="button" onClick={refresh} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[#d9dde3] bg-white text-[#475569] hover:bg-[#f8fafc]" aria-label="Refresh">
                <RefreshCw size={16} className={busy ? "animate-spin" : ""} />
              </button>
            </div>
            {/* phones: the sections as a scrolling row */}
            <nav className="flex gap-1 overflow-x-auto px-3 pb-2 [scrollbar-width:none] md:hidden [&::-webkit-scrollbar]:hidden" aria-label="Demo sections">
              {SECTIONS.map((s) => (
                <button key={s.id} type="button" onClick={() => go(s.id)} aria-current={s.id === section ? "page" : undefined} className={navPill(s.id === section)}>
                  {s.label}
                  {s.beta && <BetaPill />}
                </button>
              ))}
            </nav>
          </header>

          <main className="mx-auto max-w-[1320px] p-4 md:p-6 lg:p-8">
            {section !== "pricing" && <CustomNotice client={CLIENT} contact={CONTACT} t={tRef.current} />}
            {section === "pricing" && <PricingView contact={CONTACT} t={tRef.current} />}
            {section === "dashboard" && <Dashboard ov={ov} ctx={ctx} />}
            {section === "connections" && <Connections ov={ov} ctx={ctx} />}
            {section === "orders" && <Orders ctx={ctx} />}
            {section === "products" && <Products ctx={ctx} />}
            {section === "listings" && <Listings ctx={ctx} />}
            {section === "automations" && <Automations ov={ov} ctx={ctx} />}
            {section === "assistant" && <Extra ctx={ctx} />}
            {section === "build" && <BuildLog client={CLIENT} ctx={ctx} />}
            {section !== "pricing" && <OfferCard contact={CONTACT} t={tRef.current} open={() => go("pricing")} />}
            <DemoFooter client={CLIENT} t={t} />
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
  const name = d.name ?? "it";
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-[#0f172a]/40 p-4 sm:items-center" onClick={onClose} role="presentation">
      <div role="dialog" aria-modal="true" aria-labelledby="vo-title" onClick={(e) => e.stopPropagation()} className="max-h-[calc(100dvh-2rem)] w-full max-w-[440px] overflow-y-auto rounded-2xl bg-white p-6 shadow-[0_24px_60px_-12px_rgba(15,23,42,0.35)]">
        <div className="flex items-start gap-3">
          {d.slug && hasMark(d.slug) ? <BrandMark slug={d.slug} name={name} size={44} /> : <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[color:var(--ws-soft)] text-[color:var(--ws-ink)]"><Lock size={20} /></span>}
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
          <a
            href={CONTACT}
            onClick={() => t?.cta("get_this", d.slug ? `Add ${d.slug} to my build` : "Plan my own build (view only)")}
            className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-3.5 text-[14px] font-semibold ${primaryBtn}`}
          >
            {d.slug ? `Add ${name} to my build` : "Plan my own build"}<ArrowRight size={15} />
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
    demoGet<Live<Product>>(`/api/demo/product?id=${encodeURIComponent(id)}`)
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
  const parsed = d ? [d.us && `US ${d.us}`, d.eu && `EU ${d.eu}`, d.color].filter(Boolean).join(" · ") : "";
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[#0f172a]/30" onClick={onClose} role="presentation">
      <aside role="dialog" aria-modal="true" aria-label="Product" onClick={(e) => e.stopPropagation()} className="flex h-full w-full max-w-[480px] flex-col overflow-y-auto bg-white shadow-[-24px_0_60px_-24px_rgba(15,23,42,0.35)]">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#eef0f3] bg-white px-5 py-4">
          <span className="inline-flex items-center gap-2 text-[14px] font-semibold"><Logo slug={PICQER.logo} name={PICQER.name} size={22} />Product in Picqer</span>
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
                {d.photoAt && <p className="mt-1 text-[12px] font-medium text-[#15803d]">Photo added by the build {ago(d.photoAt, ctx.now)}</p>}
              </div>
            </div>

            {parsed && (
              <p className="flex items-start gap-2 rounded-lg bg-[#f5f3ff] px-3 py-2 text-[13px] leading-[1.5] text-[#4c1d95] ring-1 ring-inset ring-[#ddd6fe]">
                <Sparkles size={14} className="mt-[3px] shrink-0 text-[#6d28d9]" />
                <span>Parsed by GPT from the product name: <b className="font-semibold">{parsed}</b></span>
              </p>
            )}

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

            <NorthvaleFields code={d.code || id} name={d.name} />

            <section>
              <h3 className="mb-2 text-[12.5px] font-semibold uppercase tracking-[0.05em] text-[#64748b]">Linked to</h3>
              {d.links.length ? (
                <ul className="flex flex-col gap-2">
                  {d.links.map((l) => {
                    const b = brandOf(l.platform);
                    return (
                      <li key={l.store} className="flex items-center gap-3 rounded-lg border border-[#eef0f3] px-3 py-2.5">
                        <Logo slug={b.slug} name={l.storeLabel} size={30} />
                        <div className="min-w-0 flex-1">
                          <p className="text-[13.5px] font-semibold">{l.storeLabel}</p>
                          <p className="truncate text-[12.5px] text-[#64748b]">{l.name || l.style} · US {l.size}</p>
                        </div>
                        <Badge tone="green">Linked</Badge>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-[13.5px] text-[#64748b]">Not linked to a channel listing yet.</p>
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
              <Button small onClick={() => ctx.locked("pull_listing", "Pulling a listing by hand")}>Pull a listing</Button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}

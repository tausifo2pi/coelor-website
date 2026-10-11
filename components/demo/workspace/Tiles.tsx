"use client";

// The dashboards' business tiles (step 5b): what the owner of Northvale Kicks or Fernhollow looks at first, in their
// own words, instead of a sync tool's counters. The numbers come from lib/demo/tiles.ts and lib/demo/fields.ts (pure,
// tested); this file only lays them out. A tile that belongs to one of the client's custom rules shows its code
// (R-07, F-06), the same codes as their rules list (lib/demo/clients.ts).
import { useMemo, type ReactNode } from "react";
import { PackageCheck, PackageOpen, Printer, Radio, RotateCcw, ShieldCheck, ShoppingBag, Tags } from "lucide-react";
import { BrandMark, Card, ago, brandOf, fmt, joinNames } from "@/components/demo/ui";
import { FERNHOLLOW, NORTHVALE, type DemoClient } from "@/lib/demo/clients";
import { CHANNELS } from "@/lib/demo/channels";
import { TZ as NORTHVALE_TZ } from "@/lib/demo/schedule";
import type { Overview } from "@/lib/demo/shape";
import { WEEKDAYS, dayStart, storeLive, time12, wallOf } from "@/lib/demo/fields";
import { labelsDue, nextRestock, returnsToGrade, showTile, sneakerTiles, soldToday } from "@/lib/demo/tiles";
import type { SCtx } from "@/components/storedemo/sections";

const DAY = 86_400_000;
const FULL_DAY: Record<string, string> = { Sun: "Sunday", Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday", Fri: "Friday", Sat: "Saturday" };
/** the team member doing a job, by role ("Tasha" for the show host) */
const who = (c: DemoClient, role: RegExp, fallback: string) => c.team.find((m) => role.test(m.role))?.name ?? fallback;
const plural = (n: number, one: string, many = `${one}s`) => (n === 1 ? one : many);

/* ---------- parts ---------- */

/** One tile: what it is, the number, a line of context. `code` ties it to one of the client's rules. */
export function Tile({ icon, label, value, unit, sub, code, client, className = "", children }: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  unit?: string;
  sub?: ReactNode;
  code?: string;
  client: DemoClient;
  className?: string;
  children?: ReactNode;
}) {
  const rule = code ? client.rules.find((r) => r.code === code) : undefined;
  return (
    <Card className={`flex flex-col gap-1 ${className}`}>
      <div className="flex items-start justify-between gap-2">
        <span className="flex min-w-0 items-start gap-1.5 text-[13px] font-medium leading-snug text-[#64748b]">
          <span className="mt-[2px] shrink-0 text-[#94a3b8]" aria-hidden>{icon}</span>
          {label}
        </span>
        {rule && (
          <span title={`Rule ${rule.code}: ${rule.name}`} className="shrink-0 rounded-md bg-[#f1f5f9] px-1.5 py-[1px] font-mono text-[11px] font-semibold text-[#64748b]">
            {rule.code}
          </span>
        )}
      </div>
      <span className="text-[28px] font-bold leading-tight tracking-[-0.02em] tabular-nums">
        {value}
        {unit && <span className="ml-1.5 text-[14px] font-semibold tracking-normal text-[#64748b]">{unit}</span>}
      </span>
      {sub && <span className="line-clamp-3 text-[13px] leading-[1.5] text-[#64748b]">{sub}</span>}
      {children}
    </Card>
  );
}

/** Counts per channel, each with its logo (a channel with none today is greyed, not hidden). */
export function ChannelSplit({ items }: { items: { slug: string; name: string; n: number }[] }) {
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {items.map((i) => (
        <span key={i.slug} className={`inline-flex h-7 items-center gap-1.5 rounded-full border border-[#e3e6eb] bg-white pl-1 pr-2.5 text-[12.5px] ${i.n ? "text-[#334155]" : "text-[#94a3b8]"}`}>
          <BrandMark slug={i.slug} name={i.name} size={20} className="!rounded-full" />
          <b className={`font-semibold tabular-nums ${i.n ? "text-[#0f172a]" : ""}`}>{fmt(i.n)}</b>
          {i.name}
        </span>
      ))}
    </div>
  );
}

/** A connection's health on the channels card: a quiet dot and a word, not a sales badge. */
export function Running({ ok = true }: { ok?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[12px] font-medium text-[#64748b]">
      <span className={`h-2 w-2 rounded-full ${ok ? "bg-[#22c55e]" : "bg-[#f59e0b]"}`} aria-hidden />
      {ok ? "running" : "catching up"}
    </span>
  );
}

// 1–3 in the first row, 4 and 5 (the per-channel one, wide) in the second; two to a row on tablets, one on phones
const GRID = "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6";
const THIRD = "xl:col-span-2";
const HALF = "xl:col-span-3";
const WIDE = "sm:col-span-2 xl:col-span-3";

/* ---------- Northvale Kicks ---------- */

export function SneakerTiles({ ov, now }: { ov: Overview; now: number }) {
  const t = useMemo(() => sneakerTiles(ov, now, { since: NORTHVALE.since, tz: NORTHVALE_TZ }), [ov, now]);
  const live = CHANNELS.find((c) => /live/i.test(c.role));
  const show = useMemo(() => (live && ov.nextShow?.platform === live.id ? showTile(ov, now, NORTHVALE_TZ) : null), [live, ov, now]);
  const host = who(NORTHVALE, /host/i, "The host");
  const due = WEEKDAYS[wallOf(t.toShip.firstDue, NORTHVALE_TZ).dow];
  const name = (id: string) => brandOf(id).name;
  const pct = t.notListed.total ? Math.round((t.notListed.linked / t.notListed.total) * 100) : 0;
  return (
    <div className={GRID}>
      <Tile
        client={NORTHVALE}
        className={THIRD}
        icon={<PackageCheck size={14} />}
        label="Pairs to ship before the StockX deadline"
        value={fmt(t.toShip.n)}
        unit={plural(t.toShip.n, "pair")}
        sub={`${t.toShip.by.map((x) => `${fmt(x.n)} ${name(x.id)}`).join(" · ")} sold in the last 24 h · 2 business days to ship, the first due ${due}`}
      />
      <Tile
        client={NORTHVALE}
        className={THIRD}
        code="R-07"
        icon={<ShieldCheck size={14} />}
        label="Last-pair guard: sizes pulled this week"
        value={fmt(t.pulled.n)}
        unit={plural(t.pulled.n, "size")}
        sub={t.pulled.latest
          ? `Latest: ${t.pulled.latest.product}, US ${t.pulled.latest.size}, off ${t.pulled.latest.where} ${ago(t.pulled.latest.at, now)}`
          : "The last pair of a size comes off every other channel the moment it sells."}
      />
      <Tile
        client={NORTHVALE}
        className={THIRD}
        code="R-14"
        icon={<Tags size={14} />}
        label="In Picqer, not listed on StockX yet"
        value={fmt(t.notListed.n)}
        unit={plural(t.notListed.n, "size")}
        sub={`${fmt(t.notListed.linked)} of ${fmt(t.notListed.total)} sizes listed · the rest are on the not-listed report`}
      >
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#eef0f3]" aria-hidden>
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: NORTHVALE.accent }} />
        </div>
      </Tile>
      {live && show && (
        <Tile
          client={NORTHVALE}
          className={HALF}
          code="R-04"
          icon={<Radio size={14} />}
          label={show.live ? `${live.name} show on air` : show.today ? `Tonight's ${live.name} show` : `Next ${live.name} show`}
          value={show.live ? "Live now" : show.today ? show.time : `${show.day} ${show.time}`}
          sub={show.live
            ? `${host} on air since ${show.time} · ${show.models} models in the lineup · sales into Picqer every 3 min`
            : `${host} hosts · ${show.models} models in the lineup · only sizes in stock go in`}
        />
      )}
      <Tile
        client={NORTHVALE}
        className={WIDE}
        icon={<ShoppingBag size={14} />}
        label="Sold in the last 24 hours"
        value={`${fmt(t.sold.n)}${t.sold.more ? "+" : ""}`}
        unit={plural(t.sold.n, "pair")}
      >
        <ChannelSplit items={t.sold.by.map((x) => ({ slug: brandOf(x.id).slug, name: name(x.id), n: x.n }))} />
      </Tile>
    </div>
  );
}

/* ---------- Fernhollow ---------- */

export function StoreTiles({ ctx }: { ctx: SCtx }) {
  const { cfg, world: w, now } = ctx;
  const d = useMemo(() => {
    if (!w) return null;
    const orders = w.orders({ now, per: 100_000 }).rows;
    const rows = w.productRows({ now, per: 100_000 }).rows;
    return {
      live: storeLive(rows, cfg.channels, cfg.tz, now),
      labels: labelsDue(orders, now, cfg.tz, cfg.shipping.cutoffHour, cfg.shipping.carriers.map((c) => c.name)),
      returns: returnsToGrade(orders, now),
      // the engine's restocks of the next week (a later `now` shows what is coming)
      restock: nextRestock(w.happenings(now + 8 * DAY, 9), now, cfg.tz),
      sold: soldToday(orders, now, cfg.tz, cfg.channels),
    };
  }, [w, cfg, now]);
  if (!d) return null;
  const host = who(FERNHOLLOW, /LIVE/i, "The host");
  const grader = who(FERNHOLLOW, /stockroom/i, "The stockroom");
  const buyer = who(FERNHOLLOW, /buyer/i, "The buyer");
  const cutoff = `${String(cfg.shipping.cutoffHour).padStart(2, "0")}:00`;
  const carriers = d.labels.by.filter((x) => x.n).map((x) => `${fmt(x.n)} ${x.id}`).join(" · ");
  const left = Math.max(0, Math.round((d.labels.cutoff - now) / 60_000));
  const leftText = left >= 60 ? `${Math.floor(left / 60)} h ${left % 60} min left` : `${left} min left`;
  const L = d.live;
  const liveName = L ? L.channel.name.replace(/\s+Shop$/i, "") : "";
  const holdNames = L ? joinNames(L.holdFrom.map((c) => c.name)) : "";
  const r = d.restock;
  const restockDay = r ? (dayStart(r.at, cfg.tz) === dayStart(now, cfg.tz) ? "today" : FULL_DAY[r.day]) : "";
  return (
    <div className={GRID}>
      {L && (
        <Tile
          client={FERNHOLLOW}
          className={THIRD}
          code="F-06"
          icon={<Radio size={14} />}
          label={L.show.phase === "live" ? `${liveName} LIVE now` : L.show.phase === "next" ? `Next ${liveName} LIVE` : `Tonight's ${liveName} LIVE · ${L.show.time}`}
          value={L.show.phase === "next" ? `${L.show.day} ${L.show.time}` : fmt(L.show.phase === "today" ? L.lineup.length : L.held.length)}
          unit={L.show.phase === "next" ? undefined : L.show.phase === "today" ? plural(L.lineup.length, cfg.item, cfg.items) : "held back"}
          sub={L.show.phase === "live"
            ? `${host} is on air · ${fmt(L.lineup.length)} ${plural(L.lineup.length, cfg.item, cfg.items)} in the lineup · back on ${holdNames} after ${L.show.endTime}`
            : L.show.phase === "hold"
              ? `of ${fmt(L.lineup.length)} ${plural(L.lineup.length, cfg.item, cfg.items)} in the lineup · off ${holdNames} since ${L.show.holdTime} · ${host} hosts`
              : L.show.phase === "today"
                ? `${fmt(L.held.length)} come off ${holdNames} at ${L.show.holdTime} · ${host} hosts`
                : `${fmt(L.lineup.length)} ${plural(L.lineup.length, cfg.item, cfg.items)} lined up · ${fmt(L.held.length)} held back from ${holdNames} from ${L.show.holdTime}`}
        />
      )}
      <Tile
        client={FERNHOLLOW}
        className={THIRD}
        code="F-04"
        icon={<Printer size={14} />}
        label={`Labels to buy before the ${cutoff} cutoff`}
        value={fmt(d.labels.n)}
        unit={plural(d.labels.n, "label")}
        sub={d.labels.n === 0
          ? "Every paid order has its label."
          : `${d.labels.phase === "before" ? leftText : d.labels.phase === "closed" ? `No pickup on Sundays: printed ${d.labels.nextDay} morning` : `Today's pickup has gone: these go out ${d.labels.nextDay}`} · ${carriers}`}
      />
      <Tile
        client={FERNHOLLOW}
        className={THIRD}
        code="F-07"
        icon={<RotateCcw size={14} />}
        label="Returns to grade"
        value={fmt(d.returns.inRoom)}
        unit="in the stockroom"
        sub={`${fmt(d.returns.onWay)} more on the way back in ${cfg.returns.name} · ${grader} grades each: back on sale, Poshmark pre-loved or written off`}
      />
      {r && (
        <Tile
          client={FERNHOLLOW}
          className={HALF}
          code="F-08"
          icon={<PackageOpen size={14} />}
          label={r.received ? `${cfg.restock.name} order in today` : `${cfg.restock.name} order arriving ${restockDay}`}
          value={r.units === null ? r.day : fmt(r.units)}
          unit={r.units === null ? undefined : plural(r.units, cfg.item, cfg.items)}
          sub={r.received
            ? `${r.brand ? `${r.brand} · ` : ""}on every channel since ${time12(wallOf(r.at, cfg.tz))}`
            : `${r.brand ? `${r.brand} · ` : ""}${buyer}'s order goes on every channel the day it lands`}
        />
      )}
      <Tile
        client={FERNHOLLOW}
        className={WIDE}
        icon={<ShoppingBag size={14} />}
        label="Sold today"
        value={fmt(d.sold.pieces)}
        unit={plural(d.sold.pieces, cfg.item, cfg.items)}
        sub={`$${fmt(d.sold.revenue)} from ${fmt(d.sold.orders)} ${plural(d.sold.orders, "order")}`}
      >
        <ChannelSplit items={cfg.channels.map((c) => ({ slug: c.logo, name: c.name, n: d.sold.by.find((x) => x.id === c.id)?.n ?? 0 }))} />
      </Tile>
    </div>
  );
}

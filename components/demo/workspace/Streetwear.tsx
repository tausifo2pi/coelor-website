"use client";

// The streetwear demo client's (Cinderlot, lib/demo/client-streetwear.ts) dashboard tiles and product-drawer fields:
// what the owner of a streetwear shop looks at first (the weekly drop and how fast it sold out, tonight's TikTok LIVE,
// labels before the pickup, the pre-owned one-offs, today's sales per channel) and the fields the team asked for on a
// product (drop, blank, print, run or wholesale order, reprint rule; condition, consignor and measurements on a
// pre-owned piece). The numbers come from lib/demo/streetwear.ts, lib/demo/tiles.ts and lib/demo/fields.ts (pure,
// tested); this file only lays them out, in the same tiles as the other demos (Tiles.tsx, Fields.tsx). A tile that
// belongs to one of the client's custom rules shows its code (C-02, C-07…).
import { useMemo } from "react";
import { Flame, Printer, Radio, Recycle, ShoppingBag } from "lucide-react";
import { ago, fmt, joinNames } from "@/components/demo/ui";
import { CINDERLOT } from "@/lib/demo/client-streetwear";
import { lotOf, storeLive, time12, wallOf } from "@/lib/demo/fields";
import { dropTile, oneOffTile, streetwearFields } from "@/lib/demo/streetwear";
import { labelsDue, soldToday } from "@/lib/demo/tiles";
import { DROP_MINUTE } from "@/lib/storedemo/catalog-streetwear";
import type { ProductRow } from "@/lib/storedemo/engine";
import type { SCtx } from "@/components/storedemo/sections";
import { ChannelSplit, Tile } from "./Tiles";
import { ClientFields, type FieldRow } from "./Fields";

const GRID = "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6";
const THIRD = "xl:col-span-2";
const HALF = "xl:col-span-3";
const WIDE = "sm:col-span-2 xl:col-span-3";
const plural = (n: number, one: string, many = `${one}s`) => (n === 1 ? one : many);
const who = (role: RegExp, fallback: string) => CINDERLOT.team.find((m) => role.test(m.role))?.name ?? fallback;

export function StreetwearTiles({ ctx }: { ctx: SCtx }) {
  const { cfg, world: w, now } = ctx;
  const d = useMemo(() => {
    if (!w) return null;
    const orders = w.orders({ now, per: 100_000 }).rows;
    const rows = w.productRows({ now, per: 100_000 }).rows;
    return {
      drop: dropTile(rows, now, cfg.tz, cfg.catalog.dropDays, DROP_MINUTE, orders),
      live: storeLive(rows, cfg.channels, cfg.tz, now),
      labels: labelsDue(orders, now, cfg.tz, cfg.shipping.cutoffHour, cfg.shipping.carriers.map((c) => c.name)),
      oneOff: oneOffTile(rows, w.happenings(now, 30), now),
      sold: soldToday(orders, now, cfg.tz, cfg.channels),
    };
  }, [w, cfg, now]);
  if (!d) return null;
  const host = who(/LIVE/i, "The host");
  const D = d.drop;
  const L = d.live;
  const liveName = L ? L.channel.name.replace(/\s+Shop$/i, "") : "";
  const holdNames = L ? joinNames(L.holdFrom.map((c) => c.name)) : "";
  const cutoff = `${String(cfg.shipping.cutoffHour).padStart(2, "0")}:00`;
  const carriers = d.labels.by.filter((x) => x.n).map((x) => `${fmt(x.n)} ${x.id}`).join(" · ");
  const left = Math.max(0, Math.round((d.labels.cutoff - now) / 60_000));
  const leftText = left >= 60 ? `${Math.floor(left / 60)} h ${left % 60} min left` : `${left} min left`;
  const toDrop = Math.max(0, Math.round((D.next - now) / 60_000));
  const firstText = D.first ? `first to go: ${D.first.title}, ${D.first.size}, ${D.first.mins < 120 ? `${D.first.mins} min in` : `at ${time12(wallOf(D.first.at, cfg.tz))}`}` : "";
  const chName = (id: string) => cfg.channels.find((c) => c.id === id)?.name ?? id;
  return (
    <div className={GRID}>
      <Tile
        client={CINDERLOT}
        className={THIRD}
        code={D.phase === "soon" ? "C-04" : "C-02"}
        icon={<Flame size={14} />}
        label={D.phase === "soon" ? `Today's drop · ${D.time}` : D.phase === "live" ? `Drop live since ${D.time}` : `${D.lastDay.split(" ")[0]}'s drop · sold out so far`}
        value={D.phase === "soon" ? (toDrop >= 60 ? `${Math.floor(toDrop / 60)} h ${toDrop % 60} min` : `${toDrop} min`) : D.phase === "live" ? fmt(D.sold) : `${D.pct}%`}
        unit={D.phase === "soon" ? "to go" : D.phase === "live" ? `${plural(D.sold, cfg.item, cfg.items)} sold` : "of sizes gone"}
        sub={D.phase === "soon"
          ? `On Shopify at ${D.time}, on TikTok Shop and eBay within minutes · last drop ${D.pct}% of sizes sold out`
          : D.phase === "live"
            ? `${fmt(D.orders)} ${plural(D.orders, "order")} · ${fmt(D.gone)} of ${fmt(D.sizes)} sizes sold out${firstText ? ` · ${firstText}` : ""}`
            : `${fmt(D.gone)} of ${fmt(D.sizes)} sizes across ${fmt(D.pieces)} ${plural(D.pieces, cfg.item, cfg.items)}${firstText ? ` · ${firstText}` : ""} · next drop ${D.nextDay.split(" ")[0]} ${D.time}`}
      />
      {L && (
        <Tile
          client={CINDERLOT}
          className={THIRD}
          code="C-07"
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
        client={CINDERLOT}
        className={THIRD}
        code="C-05"
        icon={<Printer size={14} />}
        label={`Labels to buy before the ${cutoff} cutoff`}
        value={fmt(d.labels.n)}
        unit={plural(d.labels.n, "label")}
        sub={d.labels.n === 0
          ? "Every paid order has its label."
          : `${d.labels.phase === "before" ? leftText : d.labels.phase === "closed" ? `No pickup on Sundays: printed ${d.labels.nextDay} morning` : `Today's pickup has gone: these go out ${d.labels.nextDay}`} · ${carriers}`}
      />
      <Tile
        client={CINDERLOT}
        className={HALF}
        code="C-03"
        icon={<Recycle size={14} />}
        label="Pre-owned one-offs up for sale"
        value={fmt(d.oneOff.up)}
        unit={plural(d.oneOff.up, cfg.item, cfg.items)}
        sub={d.oneOff.latest
          ? `${fmt(d.oneOff.sold)} sold this week · latest: ${d.oneOff.latest.title} on ${chName(d.oneOff.latest.channel)} ${ago(d.oneOff.latest.at, now)}${d.oneOff.latest.pulledFrom ? `, pulled from ${d.oneOff.latest.pulledFrom}` : ""}`
          : "One unit each, on the web store, eBay, Grailed and Depop: a sale on one pulls the others."}
      />
      <Tile
        client={CINDERLOT}
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

/** Cinderlot's fields of one product; its lot number when it is in the next TikTok LIVE (the dashboard tile's lineup). */
export function CinderlotFields({ ctx, row }: { ctx: SCtx; row: ProductRow }) {
  const { world: w, cfg, now } = ctx;
  const f = useMemo(() => streetwearFields(row, cfg.tz, CINDERLOT.name), [row, cfg.tz]);
  const live = useMemo(() => (w && f.kind === "drop" ? storeLive(w.productRows({ now, per: 100_000 }).rows, cfg.channels, cfg.tz, now) : null), [w, cfg, now, f.kind]);
  const at = live ? live.lineup.findIndex((p) => p.id === row.id) : -1;
  const rows: FieldRow[] =
    f.kind === "pre-owned"
      ? [
          { label: "Season", value: f.season },
          { label: "Condition", value: f.condition, warn: /8\/10/.test(f.condition) },
          { label: "Source", value: f.source, hint: f.payout ?? undefined, wide: true },
          { label: "Measurements", value: f.measure, wide: true },
        ]
      : [
          { label: "Drop", value: f.drop },
          { label: f.source.startsWith("Run") ? "Print-shop run" : "Wholesale", value: <span className="font-mono">{f.source.replace(/^(Run|Wholesale order) /, "")}</span> },
          { label: "Blank", value: f.blank, wide: true },
          { label: "Print", value: f.print },
          ...(live && at >= 0
            ? [{
                label: "LIVE lot",
                value: `${lotOf(at)} · ${live.show.phase === "next" ? live.show.day : "tonight"} ${live.show.time}`,
                hint: live.held.some((p) => p.id === row.id) ? `held back from ${joinNames(live.holdFrom.map((c) => c.name))} from ${live.show.holdTime}` : undefined,
              }]
            : []),
          { label: "Reprint rule", value: f.reprint, wide: true },
        ];
  return <ClientFields client={CINDERLOT} rows={rows} />;
}

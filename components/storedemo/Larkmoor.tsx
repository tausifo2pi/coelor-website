"use client";

// The jewelry demo's own parts (/demo/jewellery-shop, Larkmoor: lib/demo/larkmoor.ts): the dashboard's business tiles
// (labels before the cutoff, Faire orders to pack, returns and ring resizes at the bench, the casting batch, sold today)
// and the "Larkmoor fields" in the product drawer. The same parts as Fernhollow's (components/demo/workspace/Tiles.tsx,
// Fields.tsx), with the studio's own rules (J-04, J-08, J-07, J-09). The numbers come from pure, tested functions
// (lib/demo/tiles.ts, lib/demo/larkmoor.ts); this file only lays them out.
import { useMemo } from "react";
import { Gem, PackageOpen, Printer, RotateCcw, ShoppingBag, Store } from "lucide-react";
import { fmt } from "@/components/demo/ui";
import { ChannelSplit, Tile } from "@/components/demo/workspace/Tiles";
import { ClientFields, type FieldRow } from "@/components/demo/workspace/Fields";
import { LARKMOOR, larkmoorFields, resizesOpen, wholesaleOpen } from "@/lib/demo/larkmoor";
import { dayStart, time12, wallOf } from "@/lib/demo/fields";
import { labelsDue, nextRestock, returnsToGrade, soldToday } from "@/lib/demo/tiles";
import type { ProductRow } from "@/lib/storedemo/engine";
import type { SCtx } from "@/components/storedemo/sections";

const DAY = 86_400_000;
const FULL_DAY: Record<string, string> = { Sun: "Sunday", Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday", Fri: "Friday", Sat: "Saturday" };
const who = (role: RegExp, fallback: string) => LARKMOOR.team.find((m) => role.test(m.role))?.name ?? fallback;
const plural = (n: number, one: string, many = `${one}s`) => (n === 1 ? one : many);

// three in the first row, the casting batch and sold today (wide) in the second; two to a row on tablets, one on phones
const GRID = "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6";
const THIRD = "xl:col-span-2";
const HALF = "xl:col-span-3";
const WIDE = "sm:col-span-2 xl:col-span-3";

export function LarkmoorTiles({ ctx }: { ctx: SCtx }) {
  const { cfg, world: w, now } = ctx;
  const d = useMemo(() => {
    if (!w) return null;
    const orders = w.orders({ now, per: 100_000 }).rows;
    return {
      labels: labelsDue(orders, now, cfg.tz, cfg.shipping.cutoffHour, cfg.shipping.carriers.map((c) => c.name)),
      wholesale: wholesaleOpen(orders),
      returns: returnsToGrade(orders, now),
      resizes: resizesOpen(orders),
      // the engine's casting batches of the next week (a later `now` shows what is coming)
      restock: nextRestock(w.happenings(now + 8 * DAY, 9), now, cfg.tz),
      sold: soldToday(orders, now, cfg.tz, cfg.channels),
    };
  }, [w, cfg, now]);
  if (!d) return null;
  const packer = who(/wholesale/i, "Packing");
  const bench = who(/bench/i, "The bench");
  const owner = who(/owner/i, "The owner");
  const cutoff = `${String(cfg.shipping.cutoffHour).padStart(2, "0")}:00`;
  const carriers = d.labels.by.filter((x) => x.n).map((x) => `${fmt(x.n)} ${x.id}`).join(" · ");
  const left = Math.max(0, Math.round((d.labels.cutoff - now) / 60_000));
  const leftText = left >= 60 ? `${Math.floor(left / 60)} h ${left % 60} min left` : `${left} min left`;
  const r = d.restock;
  const restockDay = r ? (dayStart(r.at, cfg.tz) === dayStart(now, cfg.tz) ? "today" : FULL_DAY[r.day]) : "";
  const faire = cfg.channels.find((c) => c.id === "faire");
  return (
    <div className={GRID}>
      <Tile
        client={LARKMOOR}
        className={THIRD}
        code="J-04"
        icon={<Printer size={14} />}
        label={`Labels to buy before the ${cutoff} cutoff`}
        value={fmt(d.labels.n)}
        unit={plural(d.labels.n, "label")}
        sub={d.labels.n === 0
          ? "Every paid order has its label."
          : `${d.labels.phase === "before" ? leftText : d.labels.phase === "closed" ? `No pickup on Sundays: printed ${d.labels.nextDay} morning` : `Today's pickup has gone: these go out ${d.labels.nextDay}`} · ${carriers}`}
      />
      {faire && (
        <Tile
          client={LARKMOOR}
          className={THIRD}
          code="J-08"
          icon={<Store size={14} />}
          label={`${faire.name} orders to pack`}
          value={fmt(d.wholesale.orders)}
          unit={plural(d.wholesale.orders, "order")}
          sub={d.wholesale.orders
            ? `${fmt(d.wholesale.pieces)} ${plural(d.wholesale.pieces, cfg.item, cfg.items)} for stockists, $${fmt(d.wholesale.value)} wholesale · ${packer} packs them on ${faire.name}'s prepaid label`
            : `Every stockist order has shipped · the last 3 of each ${cfg.item} stay for retail`}
        />
      )}
      <Tile
        client={LARKMOOR}
        className={THIRD}
        code="J-07"
        icon={<RotateCcw size={14} />}
        label="Returns to check at the bench"
        value={fmt(d.returns.inRoom)}
        unit="in the studio"
        sub={`${fmt(d.returns.onWay)} more on the way in ${cfg.returns.name} · ${d.resizes ? `${fmt(d.resizes)} ${plural(d.resizes, "is a ring resize", "are ring resizes")}, sent as an exchange · ` : ""}${bench} checks each ${cfg.item}`}
      />
      {r && (
        <Tile
          client={LARKMOOR}
          className={HALF}
          code="J-09"
          icon={r.received ? <PackageOpen size={14} /> : <Gem size={14} />}
          label={r.received ? "Casting batch in today" : `Casting batch arriving ${restockDay}`}
          value={r.units === null ? r.day : fmt(r.units)}
          unit={r.units === null ? undefined : plural(r.units, cfg.item, cfg.items)}
          sub={r.received
            ? `${r.brand ? `${r.brand} · ` : ""}on every channel since ${time12(wallOf(r.at, cfg.tz))}`
            : `${r.brand ? `${r.brand} · ` : ""}${owner}'s casting order goes on every channel the day it lands`}
        />
      )}
      <Tile
        client={LARKMOOR}
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

/** Larkmoor's fields of one piece. */
export function LarkmoorFields({ ctx, row }: { ctx: SCtx; row: ProductRow }) {
  const share = ctx.cfg.channels.find((c) => c.id === "faire")?.priceShare ?? 0.5;
  const f = useMemo(() => larkmoorFields(row, share), [row, share]);
  const rows: FieldRow[] = [
    { label: "Metal", value: f.metal, wide: true },
    ...(f.stone ? [{ label: "Stone", value: f.stone, wide: true }] : []),
    { label: "Sizing", value: f.sizing, wide: true },
    { label: "Casting batch", value: <span className="font-mono">{f.batch}</span>, hint: "for repairs and recasts" },
    { label: "Wholesale", value: f.wholesale },
    { label: "Returns and repairs", value: f.care, wide: true },
  ];
  return <ClientFields client={LARKMOOR} rows={rows} />;
}

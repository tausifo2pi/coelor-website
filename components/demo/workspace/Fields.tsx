"use client";

// The client's own fields in a product drawer (step 5b): "Northvale fields" (bin, box, source, cost, floor price,
// consignor) and "Fernhollow fields" (fit note, fabric, Faire PO, LIVE lot, return grading). Fields like these are what
// makes a build theirs: each was asked for by someone on the team. The values come from lib/demo/fields.ts, the same for
// a product wherever it is opened from.
import { useMemo, type ReactNode } from "react";
import { joinNames } from "@/components/demo/ui";
import { FERNHOLLOW, NORTHVALE, type DemoClient } from "@/lib/demo/clients";
import { boutiqueFields, lotOf, sneakerFields, storeLive } from "@/lib/demo/fields";
import type { ProductRow } from "@/lib/storedemo/engine";
import type { SCtx } from "@/components/storedemo/sections";

export type FieldRow = { label: string; value: ReactNode; hint?: string; wide?: boolean; warn?: boolean };

/** A block of custom fields: two to a row, long ones across. */
export function ClientFields({ client, rows }: { client: DemoClient; rows: FieldRow[] }) {
  // a half-width field left alone on its row takes the whole row (no empty cell)
  let run = 0;
  const cells = rows.map((r, i) => {
    if (r.wide) {
      run = 0;
      return { ...r, span: true };
    }
    run++;
    const alone = run % 2 === 1 && (i === rows.length - 1 || rows[i + 1].wide);
    return { ...r, span: alone };
  });
  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-[12.5px] font-semibold uppercase tracking-[0.05em] text-[#64748b]">{client.name.split(" ")[0]} fields</h3>
        <span className="rounded-md px-1.5 py-[1px] text-[11px] font-semibold" style={{ background: client.accentSoft, color: client.accentInk }}>Custom</span>
      </div>
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-[#eef0f3] bg-[#eef0f3]">
        {cells.map((c) => (
          <div key={c.label} className={`min-w-0 bg-white px-3.5 py-2.5 ${c.span ? "col-span-2" : ""}`}>
            <dt className="text-[12px] text-[#64748b]">{c.label}</dt>
            <dd className={`mt-0.5 text-[13.5px] font-semibold leading-snug [overflow-wrap:anywhere] ${c.warn ? "text-[#b45309]" : "text-[#0f172a]"}`}>{c.value}</dd>
            {c.hint && <dd className="mt-0.5 text-[11.5px] leading-snug text-[#94a3b8]">{c.hint}</dd>}
          </div>
        ))}
      </dl>
    </section>
  );
}

/** Northvale's fields of one Picqer product (by its product code). */
export function NorthvaleFields({ code, name }: { code: string; name: string }) {
  const f = useMemo(() => sneakerFields(code, name), [code, name]);
  const rows: FieldRow[] = [
    { label: "Bin", value: <span className="font-mono">{f.bin}</span> },
    { label: "Box condition", value: f.box, warn: f.box !== "Original box" },
    { label: "Source", value: f.source, wide: !f.consignor },
    ...(f.consignor ? [{ label: "Consignor", value: f.consignor, hint: "Kiln Street Consign" }] : []),
    { label: "Cost basis", value: `$${f.cost}`, hint: f.consignor ? "payout to the consignor" : undefined },
    { label: "Floor price", value: `$${f.floor}`, hint: "the lowest-ask check never goes below it" },
  ];
  return <ClientFields client={NORTHVALE} rows={rows} />;
}

/** Fernhollow's fields of one product; its lot number when it is in the next LIVE (the dashboard tile's lineup). */
export function FernhollowFields({ ctx, row }: { ctx: SCtx; row: ProductRow }) {
  const { world: w, cfg, now } = ctx;
  const f = useMemo(() => boutiqueFields(row), [row]);
  const live = useMemo(() => (w ? storeLive(w.productRows({ now, per: 100_000 }).rows, cfg.channels, cfg.tz, now) : null), [w, cfg, now]);
  const at = live ? live.lineup.findIndex((p) => p.id === row.id) : -1;
  const rows: FieldRow[] = [
    { label: "Fit note", value: f.fit, wide: true },
    { label: "Fabric", value: f.fabric },
    { label: f.faire === "Own label" ? "Label" : `${cfg.restock.name} PO`, value: <span className={f.faire === "Own label" ? "" : "font-mono"}>{f.faire}</span> },
    ...(live && at >= 0
      ? [{
          label: "LIVE lot",
          value: `${lotOf(at)} · ${live.show.phase === "next" ? live.show.day : "tonight"} ${live.show.time}`,
          hint: live.held.some((p) => p.id === row.id) ? `held back from ${joinNames(live.holdFrom.map((c) => c.name))} from ${live.show.holdTime}` : undefined,
          wide: true,
        }]
      : []),
    { label: "Return grade rule", value: f.grade, wide: true },
  ];
  return <ClientFields client={FERNHOLLOW} rows={rows} />;
}

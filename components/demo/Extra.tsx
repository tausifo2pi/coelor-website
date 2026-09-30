"use client";

// The demo's "Extra" section: Google Sheets the sync keeps up to date from the Picqer stock and shares with partners.
// First the sheet assistant and the scheduler (SheetAssistant.tsx), then two sheets: a live stock sheet for a supplier
// (like live.gs) and the StockX US Flex "not listed" report for a consignment partner (like flex.gs), drawn from
// sample data with fictional partners (lib/demo/sheets.ts). Buttons that would change something open the view-only dialog.
import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { CircleCheck, ExternalLink, Lock, Plus, RefreshCw, SportShoe } from "lucide-react";
import { SiGooglesheets } from "@icons-pack/react-simple-icons";
import type { Ctx } from "@/components/demo/views";
import { Badge, Button, Card, Logo, ago, fmt } from "@/components/demo/ui";
import { Heading, SheetAssistant } from "@/components/demo/SheetAssistant";
import { PARTNERS, STOCK_SIZES, colLetter, flexGrid, flexReport, flexUpdatedAt, liveGrid, liveUpdatedAt, type Cell, type Grid } from "@/lib/demo/sheets";

type SheetId = "live" | "flex";
type TabId = "images" | "plain" | "flex";
type Tab = { id: TabId; name: string; track: string };

const SHEETS: Record<SheetId, { title: string; partner: string; every: string; tabs: Tab[] }> = {
  live: {
    title: "Inventory list (updates every 30 minutes)",
    partner: PARTNERS.supplier,
    every: "every 30 minutes",
    tabs: [
      { id: "images", name: "Live stock", track: "live/images" },
      { id: "plain", name: "Live stock (no images)", track: "live/no-images" },
    ],
  },
  flex: {
    title: "StockX US Flex: not listed",
    partner: PARTNERS.consign,
    every: "every 2 hours",
    tabs: [{ id: "flex", name: "Not on Flex", track: "flex" }],
  },
};

const MORE = [
  "One sheet per partner, always up to date from the stock count.",
  "Each partner's own columns, currency and prices, with or without photos.",
  "Reports next to the stock, like what is in stock but not listed on a channel yet.",
];

const iso = (ms: number) => new Date(ms).toISOString();

export function Extra({ ctx }: { ctx: Ctx }) {
  const [sheet, setSheet] = useState<SheetId>("live");
  const [tab, setTab] = useState<TabId>("images");
  const [sel, setSel] = useState<[number, number]>([0, 0]);
  const liveAt = liveUpdatedAt(ctx.now);
  const flexAt = flexUpdatedAt(ctx.now);
  const report = useMemo(() => flexReport(), []);
  const grid = useMemo(() => (tab === "flex" ? flexGrid(flexAt) : liveGrid(liveAt, tab === "images")), [tab, liveAt, flexAt]);
  const s = SHEETS[sheet];
  const at = sheet === "flex" ? flexAt : liveAt;

  const pickSheet = (id: SheetId) => {
    if (id === sheet) return;
    setSheet(id);
    setTab(SHEETS[id].tabs[0].id);
    setSel([0, 0]);
    ctx.t?.action("extra_sheet", id);
  };
  const pickTab = (t: Tab) => {
    if (t.id === tab) return;
    setTab(t.id);
    setSel([0, 0]);
    ctx.t?.action("extra_sheet", t.track);
  };

  return (
    <div className="flex flex-col gap-8">
      <SheetAssistant ctx={ctx} />

      <section className="flex flex-col gap-4">
        <Heading title="Google Sheets" sub="Kept up to date by the sync from the Picqer stock, and shared with the people you work with." />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Pick
            on={sheet === "live"}
            onClick={() => pickSheet("live")}
            icon={<SheetsTile size={40} />}
            title="Live stock sheet"
            badge={<Badge tone="green" dot>Live</Badge>}
            who={`For a supplier · ${PARTNERS.supplier}`}
            note={`Every size in stock (${fmt(STOCK_SIZES)}), with photos and EUR and USD prices. Updates every 30 min.`}
          />
          <Pick
            on={sheet === "flex"}
            onClick={() => pickSheet("flex")}
            icon={
              <span className="relative h-10 w-10 shrink-0 self-start">
                <SheetsTile size={40} />
                <Logo slug="stockx" name="StockX" size={20} className="absolute -bottom-1 -right-1 ring-2 ring-white" />
              </span>
            }
            title="Consignment report"
            badge={<Badge tone="amber">{report.missing.length} to send in</Badge>}
            who={`For a consignment partner · ${PARTNERS.consign}`}
            note="What is in stock but not on StockX Flex, StockX's consignment programme, yet. Updates every 2 h."
          />
        </div>

        <Card pad={false} className="overflow-hidden">
          <div className="flex flex-wrap items-start justify-between gap-3 px-4 py-4 sm:px-5">
            <div className="flex min-w-0 items-start gap-3">
              <SheetsTile size={40} />
              <div className="min-w-0">
                <h3 className="text-[15px] font-semibold leading-snug">{s.title}</h3>
                <p className="mt-0.5 text-[13px] text-[#64748b]">Shared with <span className="font-semibold text-[#334155]">{s.partner}</span> · view only</p>
                <p className="text-[12.5px] text-[#64748b]">Updated {ago(iso(at), ctx.now)} · refreshes {s.every}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button small onClick={() => ctx.locked(`sheet_refresh:${sheet}`, "Refreshing the sheet by hand")}><RefreshCw size={14} />Refresh now</Button>
              <Button small onClick={() => ctx.locked(`sheet_open:${sheet}`, "Opening the sheet in Google Sheets")}><ExternalLink size={14} />Open in Google Sheets</Button>
              <button
                type="button"
                onClick={() => ctx.locked(`sheet_share:${sheet}`, "Sharing the sheet with someone else")}
                className="inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-full bg-[#c2e7ff] px-3.5 text-[13px] font-semibold text-[#001d35] transition-colors hover:bg-[#b3dcf5]"
              >
                <Lock size={13} />Share
              </button>
            </div>
          </div>
          <SheetView grid={grid} sel={sel} onSelect={(r, c) => setSel([r, c])} />
          <div className="flex items-center gap-1 border-t border-[#e3e6eb] bg-[#f8f9fa] px-2 py-1.5">
            <button
              type="button"
              onClick={() => ctx.locked("sheet_add_tab", "Adding a tab to the sheet")}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[#444746] hover:bg-[#e8eaed]"
              aria-label="Add a tab"
            >
              <Plus size={17} />
            </button>
            <div className="flex min-w-0 gap-1 overflow-x-auto" role="tablist" aria-label="Sheet tabs">
              {s.tabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={t.id === tab}
                  onClick={() => pickTab(t)}
                  className={`h-8 shrink-0 whitespace-nowrap rounded-md px-3 text-[13px] font-semibold transition-colors ${
                    t.id === tab ? "bg-white text-[#188038] shadow-[0_1px_2px_rgba(60,64,67,0.3)]" : "text-[#444746] hover:bg-[#e8eaed]"
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>
        </Card>

        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {MORE.map((m) => (
            <li key={m} className="flex gap-2 text-[13.5px] text-[#334155]">
              <CircleCheck size={16} className="mt-[2px] shrink-0 text-[#16a34a]" />
              {m}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function SheetsTile({ size }: { size: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center bg-white ring-1 ring-[#e3e6eb]"
      style={{ width: size, height: size, borderRadius: Math.max(6, Math.round(size * 0.24)) }}
      aria-hidden
    >
      <SiGooglesheets size={Math.round(size * 0.55)} color="#34A853" />
    </span>
  );
}

function Pick({ on, onClick, icon, title, badge, who, note }: { on: boolean; onClick: () => void; icon: ReactNode; title: string; badge: ReactNode; who: string; note: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`flex min-w-0 gap-3 rounded-xl border p-4 text-left shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors ${
        on ? "border-[#2563eb] bg-[#f8fbff] ring-2 ring-[#2563eb]/15" : "border-[#e3e6eb] bg-white hover:border-[#cbd5e1]"
      }`}
    >
      {icon}
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-[15px] font-semibold text-[#0f172a]">{title}</span>
          {badge}
        </span>
        <span className="mt-0.5 block text-[13px] font-medium text-[#334155]">{who}</span>
        <span className="mt-1 block text-[12.5px] leading-[1.5] text-[#64748b]">{note}</span>
      </span>
    </button>
  );
}

/* ---------- the sheet itself ---------- */

const ARIAL = "Arial, Helvetica, sans-serif";
const ROW_HEAD = 46;
const LINE = "#e2e3e3";
const HEAD_LINE = "#c7c7c7";
const FROZEN_EDGE = "3px solid #c4c7c5";

function SheetView({ grid, sel, onSelect }: { grid: Grid; sel: [number, number]; onSelect: (r: number, c: number) => void }) {
  const [sr, sc] = sel;
  const cur = grid.rows[sr]?.cells[sc];
  const width = ROW_HEAD + grid.widths.reduce((a, b) => a + b, 0);
  const line = grid.gridlines ? LINE : "transparent";

  return (
    <>
      {/* the formula bar: the selected cell and what is in it */}
      <div className="flex h-8 items-center border-y border-[#e3e6eb] bg-white text-[13px] text-[#202124]" style={{ fontFamily: ARIAL }}>
        <span className="w-[64px] shrink-0 border-r border-[#e3e6eb] px-2.5 font-medium text-[#3c4043]">{colLetter(sc)}{sr + 1}</span>
        <span className="shrink-0 px-2.5 font-serif text-[14px] italic text-[#9aa0a6]" aria-hidden>fx</span>
        <span className="min-w-0 truncate pr-3">{cur ? cur.formula ?? cur.text : ""}</span>
      </div>
      <div className="relative overflow-x-auto bg-white">
        <table className="text-[13px] text-[#202124]" style={{ width, tableLayout: "fixed", borderCollapse: "separate", borderSpacing: 0, fontFamily: ARIAL }}>
          <colgroup>
            <col style={{ width: ROW_HEAD }} />
            {grid.widths.map((w, i) => <col key={i} style={{ width: w }} />)}
          </colgroup>
          <thead>
            <tr style={{ height: 22 }}>
              <th className="sticky left-0 z-[2] bg-[#f8f9fa]" style={{ borderRight: `1px solid ${HEAD_LINE}`, borderBottom: `1px solid ${HEAD_LINE}` }} aria-hidden />
              {grid.widths.map((_, c) => (
                <th
                  key={c}
                  scope="col"
                  className={`text-center text-[11px] ${c === sc ? "bg-[#d3e3fd] font-bold text-[#041e49]" : "bg-[#f8f9fa] font-normal text-[#5f6368]"}`}
                  style={{ borderRight: `1px solid ${LINE}`, borderBottom: `1px solid ${HEAD_LINE}` }}
                >
                  {colLetter(c)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.rows.map((row, r) => {
              const edge = grid.frozen > 0 && r === grid.frozen - 1;
              return (
                <tr key={r} style={{ height: row.h }}>
                  <th
                    scope="row"
                    className={`sticky left-0 z-[1] text-center text-[11px] ${r === sr ? "bg-[#d3e3fd] font-bold text-[#041e49]" : "bg-[#f8f9fa] font-normal text-[#5f6368]"}`}
                    style={{ borderRight: `1px solid ${HEAD_LINE}`, borderBottom: edge ? FROZEN_EDGE : `1px solid ${LINE}` }}
                  >
                    {r + 1}
                  </th>
                  {row.cells.map((cell, c) => (cell ? <SheetCell key={c} cell={cell} width={grid.widths[c]} line={line} edge={edge} on={r === sr && c === sc} onClick={() => onSelect(r, c)} /> : null))}
                </tr>
              );
            })}
            {grid.more && (
              <tr style={{ height: 26 }}>
                <th className="sticky left-0 z-[1] bg-[#f8f9fa] text-center text-[11px] font-normal text-[#5f6368]" style={{ borderRight: `1px solid ${HEAD_LINE}` }} aria-hidden>⋮</th>
                <td colSpan={grid.widths.length} className="px-[6px] text-[12.5px] italic text-[#5f6368]">{grid.more}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

function SheetCell({ cell, width, line, edge, on, onClick }: { cell: Cell; width: number; line: string; edge: boolean; on: boolean; onClick: () => void }) {
  // text running over its neighbours is still one cell: the selection frames that cell only (a merge is framed whole)
  const frameOwn = on && !!cell.span;
  const style: CSSProperties = {
    background: cell.bg,
    color: cell.color,
    fontWeight: cell.bold ? 700 : undefined,
    fontSize: cell.size,
    textAlign: cell.align ?? "left",
    verticalAlign: "middle",
    borderRight: `1px solid ${line}`,
    borderBottom: edge ? FROZEN_EDGE : `1px solid ${line}`,
    boxShadow: on && !frameOwn ? "inset 0 0 0 2px #1a73e8" : undefined,
    padding: 0,
    position: frameOwn ? "relative" : undefined,
  };
  return (
    <td colSpan={cell.span} rowSpan={cell.rows} style={style} onClick={onClick}>
      {frameOwn && <span className="pointer-events-none absolute inset-y-0 left-0 z-0" style={{ width, boxShadow: "inset 0 0 0 2px #1a73e8" }} aria-hidden />}
      {cell.image ? (
        <span
          className="inline-grid h-[26px] w-[40px] place-items-center rounded-[5px] align-middle"
          style={{ background: cell.image.bg, color: cell.image.fg, boxShadow: "inset 0 0 0 1px rgba(15,23,42,0.08)" }}
          role="img"
          aria-label="Product photo"
        >
          <SportShoe size={18} strokeWidth={1.8} />
        </span>
      ) : (
        // text runs over the empty cells it spans (the title, the summary), and is clipped everywhere else
        <div className={`whitespace-nowrap px-[5px] ${cell.span ? "overflow-visible" : "overflow-hidden"}`}>{cell.text}</div>
      )}
    </td>
  );
}

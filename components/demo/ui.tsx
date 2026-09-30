"use client";

// Small building blocks of the live demo: a light integration-app look (white cards on grey, platform logos, green
// "Connected" badges), apart from the dark site and from our own admin panel on purpose, so a seller sees the kind of
// app they know from their other tools.
import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { platformInfo } from "@/lib/platforms";

export const LOGO_SLUG = { stockx: "stockx", alias: "alias-goat", picqer: "picqer" } as const;

/** A platform's app icon on a white rounded tile (icons from data/platforms.json). */
export function Logo({ slug, name, size = 32, className = "" }: { slug: string; name: string; size?: number; className?: string }) {
  const p = platformInfo(slug);
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden bg-white ring-1 ring-[#e3e6eb] ${className}`}
      style={{ width: size, height: size, borderRadius: Math.max(6, Math.round(size * 0.24)) }}
      aria-hidden
    >
      {p?.logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.logo} alt="" className={p.bleed ? "h-full w-full object-cover" : "h-[68%] w-[68%] object-contain"} decoding="async" />
      ) : (
        <span className="font-semibold text-[#0f172a]" style={{ fontSize: Math.round(size * 0.44) }}>{name.slice(0, 1)}</span>
      )}
    </span>
  );
}

export function Card({ children, className = "", pad = true }: { children: ReactNode; className?: string; pad?: boolean }) {
  return <div className={`min-w-0 rounded-xl border border-[#e3e6eb] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${pad ? "p-5" : ""} ${className}`}>{children}</div>;
}

export function CardHead({ title, sub, right }: { title: string; sub?: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-[15px] font-semibold text-[#0f172a]">{title}</h2>
        {sub && <p className="mt-0.5 text-[13px] text-[#64748b]">{sub}</p>}
      </div>
      {right && <div className="flex flex-wrap items-center gap-2">{right}</div>}
    </div>
  );
}

const TONES = {
  green: "bg-[#ecfdf3] text-[#15803d] ring-[#bbf7d0]",
  blue: "bg-[#eff6ff] text-[#1d4ed8] ring-[#bfdbfe]",
  amber: "bg-[#fffbeb] text-[#b45309] ring-[#fde68a]",
  red: "bg-[#fef2f2] text-[#b91c1c] ring-[#fecaca]",
  violet: "bg-[#f5f3ff] text-[#6d28d9] ring-[#ddd6fe]",
  gray: "bg-[#f1f5f9] text-[#475569] ring-[#e2e8f0]",
} as const;
export type Tone = keyof typeof TONES;

export function Badge({ tone = "gray", dot = false, children }: { tone?: Tone; dot?: boolean; children: ReactNode }) {
  return (
    <span className={`inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-[12px] font-semibold ring-1 ring-inset ${TONES[tone]}`}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

export function Button({ children, onClick, primary = false, small = false, title }: { children: ReactNode; onClick?: () => void; primary?: boolean; small?: boolean; title?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg font-semibold transition-colors ${small ? "h-8 px-3 text-[13px]" : "h-9 px-3.5 text-[14px]"} ${
        primary ? "bg-[#2563eb] text-white hover:bg-[#1d4ed8]" : "border border-[#d9dde3] bg-white text-[#0f172a] hover:bg-[#f8fafc]"
      }`}
    >
      {children}
    </button>
  );
}

/** Segmented tabs (filters). */
export function Tabs<T extends string>({ value, options, onChange }: { value: T; options: { id: T; label: string; logo?: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex max-w-full flex-wrap gap-1 rounded-lg bg-[#eef0f3] p-1">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={`inline-flex h-8 items-center gap-2 whitespace-nowrap rounded-md px-3 text-[13px] font-semibold transition-colors ${
            o.id === value ? "bg-white text-[#0f172a] shadow-[0_1px_2px_rgba(15,23,42,0.1)]" : "text-[#64748b] hover:text-[#0f172a]"
          }`}
          aria-pressed={o.id === value}
        >
          {o.logo && <Logo slug={o.logo} name={o.label} size={18} />}
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <label className="relative flex h-9 w-full items-center sm:w-[260px]">
      <Search size={15} className="pointer-events-none absolute left-3 text-[#94a3b8]" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={40}
        className="h-full w-full rounded-lg border border-[#d9dde3] bg-white pl-9 pr-8 text-[16px] text-[#0f172a] outline-none placeholder:text-[#94a3b8] focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/15 sm:text-[14px]"
        aria-label={placeholder}
      />
      {value && (
        <button type="button" onClick={() => onChange("")} className="absolute right-2 grid h-6 w-6 place-items-center rounded text-[#94a3b8] hover:text-[#0f172a]" aria-label="Clear search">
          <X size={14} />
        </button>
      )}
    </label>
  );
}

export function Pager({ page, pages, total, onPage, noun }: { page: number; pages: number; total: number; onPage: (p: number) => void; noun: string }) {
  const last = Math.min(pages, 25);
  return (
    <div className="flex items-center justify-between gap-3 border-t border-[#eef0f3] px-5 py-3 text-[13px] text-[#64748b]">
      <span>
        <b className="font-semibold text-[#0f172a]">{total.toLocaleString("en-US")}</b> {noun}
      </span>
      <div className="flex items-center gap-2">
        <span className="tabular-nums">Page {page} of {last.toLocaleString("en-US")}</span>
        <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} className="grid h-8 w-8 place-items-center rounded-md border border-[#d9dde3] bg-white disabled:opacity-40" aria-label="Previous page">
          <ChevronLeft size={15} />
        </button>
        <button type="button" disabled={page >= last} onClick={() => onPage(page + 1)} className="grid h-8 w-8 place-items-center rounded-md border border-[#d9dde3] bg-white disabled:opacity-40" aria-label="Next page">
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}

export function Th({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return <th className={`whitespace-nowrap border-b border-[#eef0f3] bg-[#f8fafc] px-4 py-2.5 text-left text-[12px] font-semibold uppercase tracking-[0.04em] text-[#64748b] ${className}`}>{children}</th>;
}
export function Td({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return <td className={`border-b border-[#f1f3f5] px-4 py-3 align-middle text-[14px] text-[#0f172a] ${className}`}>{children}</td>;
}

export function Skeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-3 p-5" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="h-9 animate-pulse rounded-md bg-[#f1f3f5]" />
      ))}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="px-5 py-12 text-center text-[14px] text-[#64748b]">{children}</div>;
}

/* ---------- time ---------- */

export function ago(iso: string | null, now: number): string {
  if (!iso) return "–";
  const s = Math.max(0, Math.round((now - Date.parse(iso)) / 1000));
  if (s < 45) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  return d === 1 ? "yesterday" : `${d} days ago`;
}

export function clock(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

/** "+2 min": how long after the sale the sync had it in Picqer. */
export function lag(sold: string | null, synced: string | null): string {
  if (!sold || !synced) return "";
  const s = Math.max(0, Math.round((Date.parse(synced) - Date.parse(sold)) / 1000));
  return s < 60 ? `${s} s` : s < 3600 ? `${Math.round(s / 60)} min` : `${Math.round(s / 3600)} h`;
}

export const fmt = (n: number) => n.toLocaleString("en-US");

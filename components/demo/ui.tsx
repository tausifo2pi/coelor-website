"use client";

// Small building blocks of the live demo: a light integration-app look (white cards on grey, platform logos, green
// "Connected" badges), apart from the dark site and from our own admin panel on purpose, so a seller sees the kind of
// app they know from their other tools.
import type { CSSProperties, ReactNode } from "react";
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { SiClaude, SiDhl, SiDiscord, SiFedex, SiInstagram, SiUps } from "@icons-pack/react-simple-icons";
import { PICQER, channel } from "@/lib/demo/channels";
import { platformInfo } from "@/lib/platforms";

export const LOGO_SLUG = { stockx: "stockx", alias: "alias-goat", picqer: "picqer" } as const;

/** Name and logo slug of a platform id ("stockx", "shopify", "picqer", …), from lib/demo/channels.ts. Every channel
 * looks the same on the page: a channel's `sample` flag is never shown. */
export function brandOf(platform: string): { name: string; slug: string } {
  if (platform === "picqer") return { name: PICQER.name, slug: PICQER.logo };
  const c = channel(platform);
  return c ? { name: c.name, slug: c.logo } : { name: platform, slug: platform };
}

/** "A", "A and B", "A, B and C" */
export const joinNames = (xs: string[]) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);

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

/* ---------- marks of the tools that are not sales platforms (shipping, AI, chat) ---------- */

function OpenAIKnot({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden>
      <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" />
    </svg>
  );
}

function SlackHash({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 122.8 122.8" width={size} height={size} aria-hidden>
      <path d="M25.8 77.6c0 7.1-5.8 12.9-12.9 12.9S0 84.7 0 77.6s5.8-12.9 12.9-12.9h12.9v12.9zm6.5 0c0-7.1 5.8-12.9 12.9-12.9s12.9 5.8 12.9 12.9v32.3c0 7.1-5.8 12.9-12.9 12.9s-12.9-5.8-12.9-12.9V77.6z" fill="#E01E5A" />
      <path d="M45.2 25.8c-7.1 0-12.9-5.8-12.9-12.9S38.1 0 45.2 0s12.9 5.8 12.9 12.9v12.9H45.2zm0 6.5c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9H12.9C5.8 58.1 0 52.3 0 45.2s5.8-12.9 12.9-12.9h32.3z" fill="#36C5F0" />
      <path d="M97 45.2c0-7.1 5.8-12.9 12.9-12.9s12.9 5.8 12.9 12.9-5.8 12.9-12.9 12.9H97V45.2zm-6.5 0c0 7.1-5.8 12.9-12.9 12.9s-12.9-5.8-12.9-12.9V12.9C64.7 5.8 70.5 0 77.6 0s12.9 5.8 12.9 12.9v32.3z" fill="#2EB67D" />
      <path d="M77.6 97c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9-12.9-5.8-12.9-12.9V97h12.9zm0-6.5c-7.1 0-12.9-5.8-12.9-12.9s5.8-12.9 12.9-12.9h32.3c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9H77.6z" fill="#ECB22E" />
    </svg>
  );
}

// slug → tile colour and glyph (brand colours); anything else is a data/platforms.json logo
const MARKS: Record<string, { bg: string; fg?: string; ring?: boolean; scale?: number; glyph: (px: number) => ReactNode }> = {
  ups: { bg: "#351C15", fg: "#FFB500", glyph: (px) => <SiUps size={px} color="currentColor" title="" /> },
  dhl: { bg: "#FFCC00", fg: "#D40511", scale: 0.8, glyph: (px) => <SiDhl size={px} color="currentColor" title="" /> },
  fedex: { bg: "#FFFFFF", fg: "#4D148C", ring: true, scale: 0.78, glyph: (px) => <SiFedex size={px} color="currentColor" title="" /> },
  instagram: {
    bg: "radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285aeb 90%)",
    fg: "#FFFFFF",
    glyph: (px) => <SiInstagram size={px} color="currentColor" title="" />,
  },
  discord: { bg: "#5865F2", fg: "#FFFFFF", glyph: (px) => <SiDiscord size={px} color="currentColor" title="" /> },
  openai: { bg: "#000000", fg: "#FFFFFF", glyph: (px) => <OpenAIKnot size={px} /> },
  slack: { bg: "#FFFFFF", ring: true, glyph: (px) => <SlackHash size={px} /> },
  claude: { bg: "#FAF9F5", fg: "#D97757", ring: true, glyph: (px) => <SiClaude size={px} color="currentColor" title="" /> },
};

/** Any integration's icon: a platform logo (data/platforms.json) or one of the tool marks above. */
export function BrandMark({ slug, name, size = 32, className = "" }: { slug: string; name: string; size?: number; className?: string }) {
  const m = MARKS[slug];
  if (!m) return <Logo slug={slug} name={name} size={size} className={className} />;
  const style: CSSProperties = { width: size, height: size, borderRadius: Math.max(6, Math.round(size * 0.24)), background: m.bg, color: m.fg };
  return (
    <span className={`inline-flex shrink-0 items-center justify-center overflow-hidden ${m.ring ? "ring-1 ring-[#e3e6eb]" : ""} ${className}`} style={style} aria-hidden>
      {m.glyph(Math.round(size * (m.scale ?? 0.58)))}
    </span>
  );
}
export const hasMark = (slug: string) => !!MARKS[slug] || !!platformInfo(slug)?.logo;

/* ---------- the Coelor wordmark, drawn for a light background ---------- */

// public/coelor-wordmark.svg is drawn for the dark site (light pixels); the same pixels here in ink and a deeper accent
const WM_ACCENT = "49.5,45.2 66,45.2 33,61.8 49.5,61.8 16.5,78.2 33,78.2 16.5,94.8 33,94.8 33,111.2 49.5,111.2 49.5,127.8 66,127.8";
const WM_INK =
  "115.5,53.5 132,53.5 148.5,53.5 99,70 165,70 99,86.5 165,86.5 99,103 165,103 115.5,119.5 132,119.5 148.5,119.5 214.5,53.5 231,53.5 247.5,53.5 198,70 264,70 198,86.5 214.5,86.5 231,86.5 247.5,86.5 264,86.5 198,103 214.5,119.5 231,119.5 247.5,119.5 297,20.5 313.5,20.5 313.5,37 313.5,53.5 313.5,70 313.5,86.5 313.5,103 297,119.5 313.5,119.5 330,119.5 379.5,53.5 396,53.5 412.5,53.5 363,70 429,70 363,86.5 429,86.5 363,103 429,103 379.5,119.5 396,119.5 412.5,119.5 462,53.5 495,53.5 511.5,53.5 462,70 478.5,70 462,86.5 462,103 462,119.5";
const cells = (s: string) => s.split(" ").map((p) => p.split(",").map(Number) as [number, number]);
const ACC_CELLS = cells(WM_ACCENT);
const INK_CELLS = cells(WM_INK);

export function CoelorWordmark({ height = 20, className = "" }: { height?: number; className?: string }) {
  // the drawn area of the 528×154 original, so the mark sits on the text line
  const vb = { x: 14, y: 18, w: 514, h: 126 };
  return (
    <svg viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`} height={height} width={Math.round((height * vb.w) / vb.h)} role="img" aria-label="Coelor" className={`block ${className}`}>
      {ACC_CELLS.map(([x, y]) => <rect key={`a${x}-${y}`} x={x} y={y} width={14} height={14} rx={3.2} fill="#5b6cf0" />)}
      {INK_CELLS.map(([x, y]) => <rect key={`i${x}-${y}`} x={x} y={y} width={14} height={14} rx={3.2} fill="#0f172a" />)}
    </svg>
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

/** Segmented tabs (filters); on a narrow screen they scroll sideways inside their own row. */
export function Tabs<T extends string>({ value, options, onChange }: { value: T; options: { id: T; label: string; logo?: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex max-w-full gap-1 overflow-x-auto rounded-lg bg-[#eef0f3] p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={`inline-flex h-8 shrink-0 items-center gap-2 whitespace-nowrap rounded-md px-3 text-[13px] font-semibold transition-colors ${
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

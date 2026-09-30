"use client";

// The Extra section's sheet assistant: a chat (labelled GPT) that turns "Pickup sheet every weekday at 8:00" into a
// schedule, next to the scheduler with every sheet and when it runs. The answers come from a small deterministic
// parser (lib/demo/schedule.ts), with no network call; what the visitor adds lives in this page only.
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { ArrowUp, FileSpreadsheet, Info, Lock, MapPin, PackageCheck, Sparkles, Store, X } from "lucide-react";
import type { Ctx } from "@/components/demo/views";
import { Badge, Card, Logo, ago } from "@/components/demo/ui";
import { GREETING, SEEDED, START_CHIPS, answer, describe, freqKey, inText, nextRun, prevRun, runLabel, type Chip, type Kind, type Pending, type Schedule } from "@/lib/demo/schedule";

type Msg = { id: number; from: "bot" | "you"; text: string };

const TYPING_MS = 600;
const MAX_MSGS = 40;
const MAX_ADDED = 8;

export function SheetAssistant({ ctx }: { ctx: Ctx }) {
  const [msgs, setMsgs] = useState<Msg[]>([{ id: 0, from: "bot", text: GREETING }]);
  const [typing, setTyping] = useState(false);
  const [chips, setChips] = useState<Chip[]>(START_CHIPS);
  const [pending, setPending] = useState<Pending>(null);
  const [added, setAdded] = useState<Schedule[]>([]);
  const [text, setText] = useState("");
  const seq = useRef(1);
  const timer = useRef<number | null>(null);
  const list = useRef<HTMLDivElement>(null);

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);
  // keep the newest message in view, inside the chat only (the page itself doesn't move)
  useEffect(() => {
    const el = list.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs.length, typing]);

  const send = (raw: string, chip?: Chip) => {
    const q = raw.trim().replace(/\s+/g, " ").slice(0, 140);
    if (!q || typing) return;
    const a = answer(q, pending, Date.now());
    if (chip) ctx.t?.action("assistant_chip", chip.id);
    else ctx.t?.action("assistant_ask", a.kind ?? "unknown");
    setMsgs((m) => [...m, { id: seq.current++, from: "you" as const, text: q }].slice(-MAX_MSGS));
    setText("");
    setTyping(true);
    timer.current = window.setTimeout(() => {
      timer.current = null;
      setTyping(false);
      setMsgs((m) => [...m, { id: seq.current++, from: "bot" as const, text: a.text }].slice(-MAX_MSGS));
      if (a.ok) {
        const id = `new-${seq.current++}`;
        setAdded((l) => [{ ...a.schedule, id }, ...l].slice(0, MAX_ADDED));
        setPending(null);
        setChips(START_CHIPS);
        ctx.t?.action("assistant_created", `${a.kind}:${freqKey(a.schedule.freq)}`);
      } else {
        setPending(a.pending);
        setChips(a.chips);
      }
    }, TYPING_MS);
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    send(text);
  };

  return (
    <div className="grid grid-cols-1 items-start gap-8 min-[1400px]:grid-cols-[380px_minmax(0,1fr)] min-[1400px]:gap-5">
      <section className="flex min-w-0 flex-col gap-4">
        <Heading title="Ask for a sheet" sub="Say which sheet, when it should run and who gets it." />
      <Card pad={false} className="flex flex-col">
        <div className="flex items-center gap-3 border-b border-[#eef0f3] px-4 py-3.5 sm:px-5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#0f172a] text-white"><Sparkles size={17} /></span>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 text-[15px] font-semibold">
              Sheet assistant
              <span className="rounded-md bg-[#0f172a] px-1.5 py-[1px] text-[11px] font-bold tracking-[0.04em] text-white">GPT</span>
            </p>
            <p className="truncate text-[12.5px] text-[#64748b]">Makes a sheet and schedules it, in plain words</p>
          </div>
        </div>

        <div ref={list} className="flex h-[320px] flex-col gap-3 overflow-y-auto px-4 py-4 sm:px-5" aria-live="polite" aria-label="Chat with the sheet assistant">
          {msgs.map((m) => <Bubble key={m.id} m={m} />)}
          {typing && (
            <div className="flex items-start gap-2" aria-label="Typing">
              <Avatar />
              <span className="inline-flex gap-1 rounded-2xl rounded-tl-md bg-[#f1f5f9] px-3.5 py-3">
                {[0, 1, 2].map((i) => <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#94a3b8]" style={{ animationDelay: `${i * 0.15}s` }} />)}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 px-4 pb-3 sm:px-5">
          {chips.map((c) => (
            <button
              key={c.id}
              type="button"
              disabled={typing}
              onClick={() => send(c.text, c)}
              className="inline-flex min-h-8 items-center rounded-full border border-[#d9dde3] bg-white px-3 py-1 text-left text-[13px] font-medium text-[#0f172a] transition-colors hover:border-[#bfdbfe] hover:bg-[#eff6ff] disabled:opacity-50"
            >
              {c.text}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="flex items-center gap-2 border-t border-[#eef0f3] px-4 py-3 sm:px-5">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={140}
            placeholder="Which sheet, and when?"
            aria-label="Message the sheet assistant"
            className="h-10 min-w-0 flex-1 rounded-lg border border-[#d9dde3] bg-white px-3 text-[16px] text-[#0f172a] outline-none placeholder:text-[#94a3b8] focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/15 sm:text-[14px]"
          />
          <button type="submit" disabled={!text.trim() || typing} aria-label="Send" className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#2563eb] text-white transition-colors hover:bg-[#1d4ed8] disabled:opacity-40">
            <ArrowUp size={18} />
          </button>
        </form>
        <p className="flex items-center gap-1.5 px-4 pb-3.5 text-[12.5px] text-[#94a3b8] sm:px-5"><Info size={13} className="shrink-0" />Schedules you add here are not saved.</p>
      </Card>
      </section>

      <section className="flex min-w-0 flex-col gap-4">
        <Heading title="Schedules" sub="Every sheet and when it runs on its own, in Amsterdam time." />
        <Scheduler rows={[...added, ...SEEDED]} ctx={ctx} onRemove={(id) => setAdded((l) => l.filter((s) => s.id !== id))} />
      </section>
    </div>
  );
}

export function Heading({ title, sub }: { title: string; sub: string }) {
  return (
    <div>
      <h2 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[#64748b]">{title}</h2>
      <p className="mt-1 text-[13.5px] text-[#64748b]">{sub}</p>
    </div>
  );
}

function Avatar() {
  return <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#0f172a] text-white" aria-hidden><Sparkles size={13} /></span>;
}

function Bubble({ m }: { m: Msg }) {
  if (m.from === "you") {
    return (
      <div className="flex justify-end">
        <p className="max-w-[min(85%,560px)] rounded-2xl rounded-br-md bg-[#2563eb] px-3.5 py-2 text-[14px] leading-[1.5] text-white [overflow-wrap:anywhere]">{m.text}</p>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-2">
      <Avatar />
      <p className="max-w-[min(85%,560px)] rounded-2xl rounded-tl-md bg-[#f1f5f9] px-3.5 py-2 text-[14px] leading-[1.5] text-[#0f172a] [overflow-wrap:anywhere]">{m.text}</p>
    </div>
  );
}

/* ---------- the scheduler ---------- */

const ICON: Record<Kind, ReactNode> = {
  pickup: <PackageCheck size={16} />,
  location: <MapPin size={16} />,
  supplier: <Store size={16} />,
  consignment: <Logo slug="stockx" name="StockX" size={32} />,
  custom: <FileSpreadsheet size={16} />,
};

function KindIcon({ kind }: { kind: Kind }) {
  if (kind === "consignment") return <>{ICON.consignment}</>;
  return <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#f1f5f9] text-[#475569]" aria-hidden>{ICON[kind]}</span>;
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const iso = (ms: number) => new Date(ms).toISOString();

function Scheduler({ rows, ctx, onRemove }: { rows: Schedule[]; ctx: Ctx; onRemove: (id: string) => void }) {
  const view = rows.map((s) => {
    const next = nextRun(s, ctx.now);
    const last = s.seeded ? prevRun(s, ctx.now) : null;
    return {
      s,
      runs: cap(describe(s.freq)),
      next: next === null ? "With the next sale" : runLabel(next),
      nextSub: next === null ? "on each order" : inText(next, ctx.now),
      last: last === null ? "Not yet" : ago(iso(last), ctx.now),
      share: s.share ? `Shared with ${s.share}` : "Not shared",
    };
  });
  const action = (s: Schedule) =>
    s.seeded ? (
      <button type="button" onClick={() => ctx.locked(`schedule_edit:${s.id}`, "Changing a running schedule")} className="grid h-8 w-8 place-items-center rounded-lg text-[#94a3b8] hover:bg-[#f4f5f7] hover:text-[#0f172a]" aria-label={`Edit ${s.name}`}>
        <Lock size={14} />
      </button>
    ) : (
      <button type="button" onClick={() => onRemove(s.id)} className="grid h-8 w-8 place-items-center rounded-lg text-[#94a3b8] hover:bg-[#fef2f2] hover:text-[#b91c1c]" aria-label={`Remove ${s.name}`}>
        <X size={15} />
      </button>
    );
  const status = (s: Schedule) => (s.seeded ? <Badge tone="green" dot>Active</Badge> : <Badge tone="blue" dot>Scheduled</Badge>);
  const name = (s: Schedule, share: string) => (
    <div className="flex min-w-0 items-center gap-2.5">
      <KindIcon kind={s.kind} />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[14px] font-semibold leading-snug">{s.name}</span>
          {!s.seeded && <Badge tone="violet">New</Badge>}
        </div>
        <div className="text-[12.5px] text-[#64748b] [overflow-wrap:anywhere]">{share}</div>
      </div>
    </div>
  );

  return (
    <Card pad={false} className="overflow-hidden">
      {/* narrower screens: one block per schedule */}
      <ul className="divide-y divide-[#f1f3f5] lg:hidden">
        {view.map((v) => (
          <li key={v.s.id} className={`flex flex-col gap-2 px-4 py-3.5 ${v.s.seeded ? "" : "bg-[#faf5ff]"}`}>
            <div className="flex items-start justify-between gap-2">
              {name(v.s, v.share)}
              {action(v.s)}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pl-[42px] text-[12.5px] text-[#64748b]">
              {status(v.s)}
              <span className="text-[#334155]">{v.runs}</span>
              <span>Next {v.next} · {v.nextSub}</span>
              <span>Last run {v.last}</span>
            </div>
          </li>
        ))}
      </ul>

      {/* wider: the table */}
      <div className="relative hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[560px] border-collapse">
          <thead>
            <tr className="border-b border-[#eef0f3] bg-[#f8fafc] text-left text-[12px] font-semibold uppercase tracking-[0.04em] text-[#64748b]">
              <th className="px-4 py-2.5 font-semibold sm:pl-5">Sheet</th>
              <th className="px-3 py-2.5 font-semibold">Runs</th>
              <th className="px-3 py-2.5 font-semibold">Next run</th>
              <th className="px-3 py-2.5 font-semibold">Last run</th>
              <th className="px-3 py-2.5 font-semibold">Status</th>
              <th className="w-12 px-3 py-2.5 sm:pr-5"><span className="sr-only">Edit</span></th>
            </tr>
          </thead>
          <tbody>
            {view.map((v) => (
              <tr key={v.s.id} className={`border-b border-[#f1f3f5] align-middle last:border-b-0 ${v.s.seeded ? "" : "bg-[#faf5ff]"}`}>
                <td className="px-4 py-3 sm:pl-5">{name(v.s, v.share)}</td>
                <td className="px-3 py-3 text-[13.5px] text-[#334155]">{v.runs}</td>
                <td className="whitespace-nowrap px-3 py-3">
                  <div className="text-[13.5px] font-medium tabular-nums">{v.next}</div>
                  <div className="text-[12.5px] text-[#64748b]">{v.nextSub}</div>
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-[13px] text-[#64748b]">{v.last}</td>
                <td className="px-3 py-3">{status(v.s)}</td>
                <td className="px-3 py-3 text-right sm:pr-5">{action(v.s)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

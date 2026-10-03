"use client";

// The Assistant section: a chat (labelled GPT) that turns "Hide sold-out sizes on Shopify every 15 minutes" into a
// routine. It writes the routine's script (shown as code), checks it step by step without changing anything, and
// schedules it with a cron line; below, the routines table with every routine, its cron line, next and last run, and
// its script. The answers come from a small deterministic parser (lib/demo/schedule.ts), with no network call; what
// the visitor adds lives in this page only.
import { createContext, useContext, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { ArrowUp, Check, FileCode2, FileSpreadsheet, Info, Loader2, Lock, MapPin, PackageCheck, Sparkles, Store, X } from "lucide-react";
import { SiDiscord } from "@icons-pack/react-simple-icons";
import { Badge, BrandMark, Card, ago } from "@/components/demo/ui";
import type { DemoTracker } from "@/lib/demo/track";
import { SNEAKER, answer, cronOf, describe, freqKey, inText, nextRun, prevRun, runLabel, scriptOf, verifyOf, type Check as CheckStep, type Chip, type Pending, type Profile, type Schedule, type Script } from "@/lib/demo/schedule";

/** what the assistant needs from its demo page (the sneaker demo's Ctx and a store demo's SCtx both have it) */
export type AssistantCtx = { now: number; t: DemoTracker | null; locked: (what: string, text?: string) => void };
// the demo's routines, words and time zone (lib/demo/schedule.ts Profile): the sneaker demo's unless a page passes its own
const ProfileOf = createContext<Profile>(SNEAKER);

type Msg =
  | { id: number; from: "bot" | "you"; text: string }
  | { id: number; from: "bot"; script: Script }
  | { id: number; from: "bot"; checks: CheckStep[]; shown: number };

const TYPING_MS = 600;
const WRITE_MS = 900; // "writing the script"
const CHECK_MS = 420; // one verification step
const MAX_MSGS = 40;
const MAX_ADDED = 8;

export function SheetAssistant({ ctx, profile = SNEAKER }: { ctx: AssistantCtx; profile?: Profile }) {
  const [msgs, setMsgs] = useState<Msg[]>([{ id: 0, from: "bot", text: profile.greeting }]);
  const [typing, setTyping] = useState(false);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState<Schedule | null>(null);
  const [chips, setChips] = useState<Chip[]>(profile.startChips);
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
  }, [msgs, typing]);

  const later = (ms: number, fn: () => void) =>
    new Promise<void>((done) => {
      timer.current = window.setTimeout(() => {
        timer.current = null;
        fn();
        done();
      }, ms);
    });
  const say = (m: Omit<Extract<Msg, { text: string }>, "id"> | Omit<Extract<Msg, { script: Script }>, "id"> | Omit<Extract<Msg, { checks: CheckStep[] }>, "id">) => {
    const id = seq.current++;
    setMsgs((l) => [...l, { ...m, id } as Msg].slice(-MAX_MSGS));
    return id;
  };

  const send = async (raw: string, chip?: Chip) => {
    const q = raw.trim().replace(/\s+/g, " ").slice(0, 140);
    if (!q || busy) return;
    const now = Date.now();
    const a = answer(q, pending, now, profile);
    if (chip) ctx.t?.action("assistant_chip", chip.id);
    else ctx.t?.action("assistant_ask", a.kind ?? "unknown");
    say({ from: "you", text: q });
    setText("");
    setBusy(true);
    setTyping(true);
    if (!a.ok) {
      await later(TYPING_MS, () => {
        setTyping(false);
        say({ from: "bot", text: a.text });
        setPending(a.pending);
        setChips(a.chips);
      });
      setBusy(false);
      return;
    }
    // write the script, check it step by step, then schedule it
    const sched = a.schedule;
    await later(TYPING_MS, () => {
      say({ from: "bot", text: `On it. Writing "${sched.name}" as a routine…` });
    });
    await later(WRITE_MS, () => {
      setTyping(false);
      say({ from: "bot", script: scriptOf(sched, profile) });
    });
    const checks = verifyOf(sched, now, profile);
    let checkId = -1;
    await later(TYPING_MS, () => {
      checkId = say({ from: "bot", checks, shown: 0 });
    });
    for (let i = 1; i <= checks.length; i++) {
      await later(CHECK_MS, () => setMsgs((l) => l.map((m) => (m.id === checkId && "checks" in m ? { ...m, shown: i } : m))));
    }
    await later(TYPING_MS, () => {
      say({ from: "bot", text: a.text });
      const id = `new-${seq.current++}`;
      setAdded((l) => [{ ...sched, id }, ...l].slice(0, MAX_ADDED));
      setPending(null);
      setChips(profile.startChips);
      ctx.t?.action("assistant_created", `${a.kind}:${freqKey(sched.freq)}`);
    });
    setBusy(false);
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    send(text);
  };

  return (
    <ProfileOf.Provider value={profile}>
    <div className="flex flex-col gap-8">
      <section className="flex min-w-0 flex-col gap-4">
        <Heading title="Ask the assistant" sub="Say what should run and when. It writes the routine, tests it and puts it on a schedule." />
        <Card pad={false} className="flex flex-col">
          <div className="flex items-center gap-3 border-b border-[#eef0f3] px-4 py-3.5 sm:px-5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] text-white"><Sparkles size={17} /></span>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 text-[15px] font-semibold">
                Assistant
                <span className="rounded-md bg-[#0f172a] px-1.5 py-[1px] text-[11px] font-bold tracking-[0.04em] text-white">GPT</span>
              </p>
              <p className="truncate text-[12.5px] text-[#64748b]">Writes, tests and schedules routines on your sync</p>
            </div>
          </div>

          <div ref={list} className="flex h-[440px] flex-col gap-3 overflow-y-auto px-4 py-4 sm:px-5" aria-live="polite" aria-label="Chat with the assistant">
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
                disabled={busy}
                onClick={() => send(c.text, c)}
                className="inline-flex min-h-8 items-center rounded-full border border-[#d9dde3] bg-white px-3 py-1 text-left text-[13px] font-medium text-[#0f172a] transition-colors hover:border-[#c7d2fe] hover:bg-[#eef2ff] disabled:opacity-50"
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
              placeholder="What should run, and when?"
              aria-label="Message the assistant"
              className="h-10 min-w-0 flex-1 rounded-lg border border-[#d9dde3] bg-white px-3 text-[16px] text-[#0f172a] outline-none placeholder:text-[#94a3b8] focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/15 sm:text-[14px]"
            />
            <button type="submit" disabled={!text.trim() || busy} aria-label="Send" className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#4f46e5] text-white transition-colors hover:bg-[#4338ca] disabled:opacity-40">
              <ArrowUp size={18} />
            </button>
          </form>
          <p className="flex items-center gap-1.5 px-4 pb-3.5 text-[12.5px] text-[#94a3b8] sm:px-5"><Info size={13} className="shrink-0" />Routines you add here are not saved.</p>
        </Card>
      </section>

      <section className="flex min-w-0 flex-col gap-4">
        <Heading title="Routines" sub={`Everything that runs on its own, with its cron line, in ${profile.tzName} time.`} />
        <Scheduler
          rows={[...added, ...profile.seeded]}
          ctx={ctx}
          onRemove={(id) => setAdded((l) => l.filter((s) => s.id !== id))}
          onScript={(s) => { setOpen(s); ctx.t?.action("view_script", s.seeded ? s.id : s.kind); }}
        />
      </section>

      {open && <ScriptDialog s={open} onClose={() => setOpen(null)} />}
    </div>
    </ProfileOf.Provider>
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
  return <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] text-white" aria-hidden><Sparkles size={13} /></span>;
}

function Bubble({ m }: { m: Msg }) {
  if ("script" in m) {
    return (
      <div className="flex items-start gap-2">
        <Avatar />
        <div className="min-w-0 max-w-[min(92%,640px)] flex-1"><Code script={m.script} /></div>
      </div>
    );
  }
  if ("checks" in m) {
    return (
      <div className="flex items-start gap-2">
        <Avatar />
        <div className="min-w-0 max-w-[min(92%,640px)] flex-1 rounded-2xl rounded-tl-md border border-[#e3e6eb] bg-white px-3.5 py-3">
          <p className="mb-2 text-[12.5px] font-semibold uppercase tracking-[0.05em] text-[#64748b]">Verifying the routine</p>
          <ul className="flex flex-col gap-1.5">
            {m.checks.map((c, i) => {
              const done = i < m.shown;
              const now = i === m.shown;
              return (
                <li key={c.label} className={`flex items-start gap-2 text-[13.5px] ${done || now ? "" : "opacity-40"}`}>
                  <span className={`mt-[1px] grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full ${done ? "bg-[#16a34a] text-white" : "bg-[#eef2ff] text-[#4f46e5]"}`}>
                    {done ? <Check size={11} strokeWidth={3} /> : now ? <Loader2 size={11} className="animate-spin" /> : null}
                  </span>
                  <span className="min-w-0"><b className="font-semibold text-[#0f172a]">{c.label}</b> <span className="text-[#64748b] [overflow-wrap:anywhere]">{c.detail}</span></span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    );
  }
  if (m.from === "you") {
    return (
      <div className="flex justify-end">
        <p className="max-w-[min(85%,560px)] rounded-2xl rounded-br-md bg-[#4f46e5] px-3.5 py-2 text-[14px] leading-[1.5] text-white [overflow-wrap:anywhere]">{m.text}</p>
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

/** A script as the assistant wrote it: the file name, then the code (comments dimmed). */
function Code({ script, tall = false }: { script: Script; tall?: boolean }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#1e293b] bg-[#0f172a]">
      <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
        <FileCode2 size={14} className="shrink-0 text-[#a5b4fc]" />
        <span className="min-w-0 flex-1 truncate font-mono text-[12px] text-[#e2e8f0]">{script.file}</span>
        <span className="rounded bg-white/10 px-1.5 py-[1px] font-mono text-[10.5px] text-[#cbd5e1]">TypeScript</span>
      </div>
      <pre className={`overflow-auto px-3 py-2.5 font-mono text-[12px] leading-[1.6] text-[#e2e8f0] ${tall ? "max-h-[60vh]" : "max-h-[230px]"}`}>
        {script.code.split("\n").map((line, i) => {
          const at = line.indexOf("//");
          return (
            <span key={i} className="block whitespace-pre">
              {at >= 0 ? <>{line.slice(0, at)}<span className="text-[#64748b]">{line.slice(at)}</span></> : line || " "}
            </span>
          );
        })}
      </pre>
    </div>
  );
}

function ScriptDialog({ s, onClose }: { s: Schedule; onClose: () => void }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  const cron = cronOf(s.freq);
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-[#0f172a]/40 p-4 sm:items-center" onClick={onClose} role="presentation">
      <div role="dialog" aria-modal="true" aria-label={`Script of ${s.name}`} onClick={(e) => e.stopPropagation()} className="flex w-full max-w-[680px] flex-col gap-4 rounded-2xl bg-white p-5 shadow-[0_24px_60px_-12px_rgba(15,23,42,0.35)]">
        <div className="flex items-start gap-3">
          <KindIcon kind={s.kind} />
          <div className="min-w-0 flex-1">
            <p className="text-[16px] font-bold">{s.name}</p>
            <p className="text-[13px] text-[#64748b]">{cap(describe(s.freq))}{cron ? ` · cron ${cron}` : " · on each order"}</p>
          </div>
          <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-[#94a3b8] hover:bg-[#f4f5f7] hover:text-[#0f172a]" aria-label="Close"><X size={16} /></button>
        </div>
        <Code script={scriptOf(s, useContext(ProfileOf))} tall />
      </div>
    </div>
  );
}

/* ---------- the scheduler ---------- */

const ICON: Partial<Record<string, ReactNode>> = {
  pickup: <PackageCheck size={16} />,
  location: <MapPin size={16} />,
  supplier: <Store size={16} />,
  custom: <FileSpreadsheet size={16} />,
};

/** The platform a routine works on (its logo), else an icon for the kind of sheet. */
function KindIcon({ kind }: { kind: string }) {
  const k = useContext(ProfileOf).kinds[kind];
  const logo = k?.logo;
  if (logo === "discord") return <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#5865F2] text-white" aria-hidden><SiDiscord size={17} color="currentColor" /></span>;
  if (logo) return <BrandMark slug={logo} name={k.name} size={32} />;
  return <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#f1f5f9] text-[#475569]" aria-hidden>{ICON[kind] ?? <FileSpreadsheet size={16} />}</span>;
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const iso = (ms: number) => new Date(ms).toISOString();

function Scheduler({ rows, ctx, onRemove, onScript }: { rows: Schedule[]; ctx: AssistantCtx; onRemove: (id: string) => void; onScript: (s: Schedule) => void }) {
  const { tz } = useContext(ProfileOf);
  const view = rows.map((s) => {
    const next = nextRun(s, ctx.now, tz);
    const last = s.seeded ? prevRun(s, ctx.now, tz) : null;
    return {
      s,
      runs: cap(describe(s.freq)),
      cron: cronOf(s.freq) ?? "on order",
      next: next === null ? "With the next sale" : runLabel(next, tz),
      nextSub: next === null ? "on each order" : inText(next, ctx.now),
      last: last === null ? "Not yet" : ago(iso(last), ctx.now),
      share: s.share ? `Shared with ${s.share}` : "Not shared",
    };
  });
  const scriptBtn = (s: Schedule) => (
    <button type="button" onClick={() => onScript(s)} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#d9dde3] bg-white px-2.5 text-[12.5px] font-semibold text-[#334155] hover:bg-[#f8fafc]" aria-label={`Script of ${s.name}`}>
      <FileCode2 size={14} />Script
    </button>
  );
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
              <div className="flex shrink-0 items-center gap-1">{scriptBtn(v.s)}{action(v.s)}</div>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pl-[42px] text-[12.5px] text-[#64748b]">
              {status(v.s)}
              <span className="text-[#334155]">{v.runs}</span>
              <code className="rounded bg-[#f1f5f9] px-1.5 py-[1px] font-mono text-[12px] text-[#334155]">{v.cron}</code>
              <span>Next {v.next} · {v.nextSub}</span>
              <span>Last run {v.last}</span>
            </div>
          </li>
        ))}
      </ul>

      {/* wider: the table */}
      <div className="relative hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[760px] border-collapse">
          <thead>
            <tr className="border-b border-[#eef0f3] bg-[#f8fafc] text-left text-[12px] font-semibold uppercase tracking-[0.04em] text-[#64748b]">
              <th className="px-4 py-2.5 font-semibold sm:pl-5">Routine</th>
              <th className="px-3 py-2.5 font-semibold">Runs</th>
              <th className="px-3 py-2.5 font-semibold">Cron</th>
              <th className="px-3 py-2.5 font-semibold">Next run</th>
              <th className="px-3 py-2.5 font-semibold">Last run</th>
              <th className="px-3 py-2.5 font-semibold">Status</th>
              <th className="px-3 py-2.5 sm:pr-5"><span className="sr-only">Script and edit</span></th>
            </tr>
          </thead>
          <tbody>
            {view.map((v) => (
              <tr key={v.s.id} className={`border-b border-[#f1f3f5] align-middle last:border-b-0 ${v.s.seeded ? "" : "bg-[#faf5ff]"}`}>
                <td className="px-4 py-3 sm:pl-5">{name(v.s, v.share)}</td>
                <td className="px-3 py-3 text-[13.5px] text-[#334155]">{v.runs}</td>
                <td className="whitespace-nowrap px-3 py-3"><code className="rounded bg-[#f1f5f9] px-1.5 py-[2px] font-mono text-[12px] text-[#334155]">{v.cron}</code></td>
                <td className="whitespace-nowrap px-3 py-3">
                  <div className="text-[13.5px] font-medium tabular-nums">{v.next}</div>
                  <div className="text-[12.5px] text-[#64748b]">{v.nextSub}</div>
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-[13px] text-[#64748b]">{v.last}</td>
                <td className="px-3 py-3">{status(v.s)}</td>
                <td className="whitespace-nowrap px-3 py-3 text-right sm:pr-5"><div className="inline-flex items-center gap-1">{scriptBtn(v.s)}{action(v.s)}</div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

"use client";

// The client's custom rules: the "automations" section of both demos. One card per rule of the client's build
// (lib/demo/clients.ts): its code, what triggers it and what it does, why the team wanted it, who asked and when it was
// built, the file it lives in, and the last run of the job it belongs to. No on/off switches: a rule is part of the
// client's own code, changed by asking for it, not toggled (a board of switches is what an off-the-shelf sync sells).
// A click opens a read-only detail: the file, the systems it touches, its recent runs.
import { useState } from "react";
import { Check, ChevronDown, FileCode2 } from "lucide-react";
import type { CustomRule, DemoClient } from "@/lib/demo/clients";
import { RULE_GROUPS, dayDate, groupOf, recentRuns, shippedIn, touches } from "@/lib/demo/rules";
import type { DemoTracker } from "@/lib/demo/track";
import { Badge, BrandMark, Card, ago, clock } from "@/components/demo/ui";

/** The last run of the job a rule belongs to, as the demo's data has it. Rules always run fine here: no "Late". */
export type RuleRun = { every: string; lastRun: string; running?: boolean };

type Props = {
  client: DemoClient;
  /** a job's last run by its key; undefined while the data loads */
  run: (job: string) => RuleRun | undefined;
  now: number;
  loading?: boolean;
  t: DemoTracker | null;
};

export function Rules({ client, run, now, loading = false, t }: Props) {
  const [open, setOpen] = useState<string | null>(null);
  const toggle = (code: string) => {
    const opening = open !== code;
    setOpen(opening ? code : null);
    if (opening) t?.action("rule", code);
  };
  const groups = RULE_GROUPS.map((g) => ({ g, rules: client.rules.filter((r) => groupOf(r) === g) })).filter((x) => x.rules.length);
  return (
    <div className="flex flex-col gap-6">
      <p className="text-[13.5px] text-[#64748b]">Rules written for {client.name}: each one asked for by the team, built into their own code.</p>
      {groups.map(({ g, rules }) => (
        <section key={g} className="flex min-w-0 flex-col gap-3">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[#64748b]">{g}</h2>
            <span className="text-[12.5px] text-[#94a3b8]">{rules.length} {rules.length === 1 ? "rule" : "rules"}</span>
          </div>
          {rules.map((r) => (
            <RuleCard key={r.code} r={r} client={client} run={r.job ? run(r.job) : undefined} now={now} loading={loading} open={open === r.code} onToggle={() => toggle(r.code)} />
          ))}
        </section>
      ))}
      <p className="text-[12.5px] leading-[1.6] text-[#64748b]">
        Every rule lives in <code className="rounded bg-[#eef0f3] px-1.5 py-[1px] font-mono text-[12px] text-[#334155]">{client.repo}</code>, the code {client.name} owns. A new rule is asked for the same way.
      </p>
    </div>
  );
}

/** "R-07" in the client's own colours */
function CodeChip({ code, client }: { code: string; client: DemoClient }) {
  return (
    <span className="inline-flex h-6 shrink-0 items-center rounded-md px-1.5 font-mono text-[12px] font-semibold tabular-nums" style={{ background: client.accentSoft, color: client.accentInk }}>
      {code}
    </span>
  );
}

function FileChip({ file }: { file: string }) {
  return (
    <span className="inline-flex min-w-0 max-w-full items-center gap-1 rounded-md bg-[#f1f5f9] px-1.5 py-[2px] font-mono text-[11.5px] text-[#334155]">
      <FileCode2 size={12} className="shrink-0 text-[#64748b]" />
      <span className="truncate">{file}</span>
    </span>
  );
}

function Status({ r, run }: { r: CustomRule; run?: RuleRun }) {
  if (!r.job) return <Badge tone="gray">On demand</Badge>;
  if (run?.running) return <Badge tone="blue" dot>Running now</Badge>;
  return <Badge tone="green" dot>On schedule</Badge>;
}

/** "every 7 min · ran 3 min ago"; a job on events: "real time · last event 2 min ago" */
function lastRunText(run: RuleRun, now: number) {
  return `${run.every} · ${run.every.startsWith("real time") ? "last event" : "ran"} ${ago(run.lastRun, now)}`;
}

function RuleCard({ r, client, run, now, loading, open, onToggle }: { r: CustomRule; client: DemoClient; run?: RuleRun; now: number; loading: boolean; open: boolean; onToggle: () => void }) {
  const systems = touches(r, client.systems);
  const id = `rule-${r.code}`;
  return (
    <Card pad={false} className={open ? "ring-1 ring-[#cbd5e1]" : ""}>
      <button type="button" onClick={onToggle} aria-expanded={open} aria-controls={id} className={`flex w-full min-w-0 flex-col gap-3 p-4 text-left transition-colors hover:bg-[#fafbfc] sm:px-5 ${open ? "rounded-t-xl" : "rounded-xl"}`}>
        <div className="flex w-full min-w-0 items-start gap-2.5">
          <CodeChip code={r.code} client={client} />
          <span className="min-w-0 flex-1 pt-[1px] text-[15px] font-semibold leading-snug text-[#0f172a]">{r.name}</span>
          {/* the systems it works with, at a glance (wider screens; the detail lists them on every screen) */}
          <span className="hidden shrink-0 -space-x-1.5 sm:flex">
            {systems.slice(0, 4).map((s) => <BrandMark key={s.slug} slug={s.slug} name={s.name} size={24} className="ring-2 ring-white" />)}
            {systems.length > 4 && (
              <span className="grid h-6 min-w-6 place-items-center rounded-md bg-[#f1f5f9] px-1 text-[11px] font-semibold text-[#475569] ring-2 ring-white">+{systems.length - 4}</span>
            )}
          </span>
          <ChevronDown size={18} className={`mt-[3px] shrink-0 text-[#94a3b8] transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
        </div>
        <dl className="grid w-full grid-cols-[44px_minmax(0,1fr)] gap-x-2 gap-y-1 text-[13.5px] leading-[1.5]">
          <dt className="font-semibold text-[#64748b]">When</dt>
          <dd className="text-[#0f172a]">{r.when}</dd>
          <dt className="font-semibold text-[#64748b]">Then</dt>
          <dd className="text-[#0f172a]">{r.then}</dd>
          <dt className="font-semibold text-[#94a3b8]">Why</dt>
          <dd className="text-[#64748b]">{r.why}</dd>
        </dl>
        <div className="flex w-full min-w-0 flex-wrap items-center gap-x-3 gap-y-2 border-t border-[#f1f3f5] pt-3 text-[12.5px] text-[#64748b]">
          <span>Asked by {r.by} · built {dayDate(r.built)}</span>
          <FileChip file={r.file} />
          <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 lg:ml-auto">
            {!r.job ? null : run ? <span>{lastRunText(run, now)}</span> : loading ? <span className="h-3.5 w-36 animate-pulse rounded bg-[#f1f3f5]" /> : null}
            <Status r={r} run={run} />
          </span>
        </div>
      </button>
      {open && <RuleDetail id={id} r={r} client={client} run={run} loading={loading} />}
    </Card>
  );
}

function Label({ children }: { children: string }) {
  return <h3 className="mb-2 text-[11.5px] font-semibold uppercase tracking-[0.06em] text-[#94a3b8]">{children}</h3>;
}

/** The read-only detail under a rule: where its code is, what it works with, its last runs. */
function RuleDetail({ id, r, client, run, loading }: { id: string; r: CustomRule; client: DemoClient; run?: RuleRun; loading: boolean }) {
  const shipped = shippedIn(client, r);
  const asker = client.team.find((m) => m.name === r.by);
  const systems = touches(r, client.systems);
  return (
    <div id={id} className="grid grid-cols-1 gap-5 rounded-b-xl border-t border-[#eef0f3] bg-[#f8fafc] p-4 sm:px-5 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="min-w-0">
        <Label>Code</Label>
        <p className="break-all font-mono text-[12.5px] text-[#0f172a]">
          <span className="text-[#64748b]">{client.repo}/</span>{r.file}
        </p>
        <p className="mt-1.5 text-[12.5px] leading-[1.55] text-[#64748b]">
          {shipped ? <>Shipped in v{shipped.version} on {dayDate(shipped.date)}: {shipped.title}.</> : <>Built {dayDate(r.built)}.</>}
          {" "}Asked for by {r.by}{asker ? ` (${asker.role})` : ""}.
        </p>
      </div>
      <div className="min-w-0">
        <Label>Works with</Label>
        <div className="flex flex-wrap gap-1.5">
          {systems.map((s) => (
            <span key={s.slug} className="inline-flex h-7 items-center gap-1.5 whitespace-nowrap rounded-full border border-[#e3e6eb] bg-white pl-1 pr-2.5 text-[12.5px] font-medium text-[#334155]">
              <BrandMark slug={s.slug} name={s.name} size={20} className="!rounded-full" />
              {s.name}
            </span>
          ))}
        </div>
      </div>
      <div className="min-w-0 md:col-span-2 xl:col-span-1">
        <Label>Recent runs</Label>
        {!r.job ? (
          <p className="text-[12.5px] text-[#64748b]">Runs on demand, with no schedule of its own.</p>
        ) : run ? (
          <ul className="divide-y divide-[#eef0f3] rounded-lg border border-[#eef0f3] bg-white">
            {recentRuns(r.code, run.lastRun, run.every).map((x) => (
              <li key={x.at} className="flex items-center justify-between gap-3 px-3 py-1.5 text-[12.5px]">
                <span className="tabular-nums text-[#334155]">{clock(x.at)}</span>
                <span className="inline-flex items-center gap-1 text-[#15803d]">
                  <Check size={12} strokeWidth={2.6} />Done<span className="tabular-nums text-[#64748b]"> · {x.secs.toFixed(1)} s</span>
                </span>
              </li>
            ))}
          </ul>
        ) : loading ? (
          <div className="h-[120px] animate-pulse rounded-lg bg-[#eef0f3]" />
        ) : (
          <p className="text-[12.5px] text-[#64748b]">On schedule; its runs show here once the data is in.</p>
        )}
      </div>
    </div>
  );
}

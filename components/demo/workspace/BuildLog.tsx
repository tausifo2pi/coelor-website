"use client";

// The "Build log" section of both demos (?section=build): every change to the client's build, newest first, with what
// someone on their team asked for in their own words, what was built and how fast it went live (lib/demo/clients.ts
// buildLog). It shows the build as one business's software that grows with them, which a product to pick can't.
// Read-only like the rest of the demo: "Ask for a change" opens the view-only dialog.
import { Check, Plus } from "lucide-react";
import type { BuildEntry, DemoClient } from "@/lib/demo/clients";
import { Button, Card, CardHead } from "@/components/demo/ui";
import { ClientMark, accentVars, clientFont } from "./ClientMark";
import { Avatar, TeamCard } from "./Team";
import { buildSummary, fullDate, liveIn, medianDays, monthYear, newestFirst, possessive } from "./format";

/** "v3.2": a major release (x.0) filled in the client's colour, the others tinted */
export function VersionChip({ version }: { version: string }) {
  const major = version.endsWith(".0");
  return (
    <span className={`inline-flex h-[22px] shrink-0 items-center rounded-md px-1.5 font-mono text-[12px] font-semibold tabular-nums ${major ? "bg-[color:var(--ws)] text-white" : "bg-[color:var(--ws-soft)] text-[color:var(--ws-ink)]"}`}>
      v{version}
    </span>
  );
}

function Stat({ label, value, sub, mono = false, className = "" }: { label: string; value: string; sub: string; mono?: boolean; className?: string }) {
  return (
    <div className={`min-w-0 ${className}`}>
      <dt className="text-[12px] font-semibold uppercase tracking-[0.04em] text-[#64748b]">{label}</dt>
      <dd className={`mt-0.5 truncate font-bold text-[#0f172a] ${mono ? "font-mono text-[15px]" : "text-[20px] tabular-nums"}`}>{value}</dd>
      <dd className="truncate text-[12.5px] text-[#64748b]">{sub}</dd>
    </div>
  );
}

function Entry({ e, client, last }: { e: BuildEntry; client: DemoClient; last: boolean }) {
  const major = e.version.endsWith(".0");
  return (
    <li className={`relative flex gap-4 ${last ? "" : "pb-7"}`}>
      {/* the rail between the dots */}
      {!last && <span className="absolute -bottom-[2px] left-[7px] top-[21px] w-px bg-[#e3e6eb]" aria-hidden />}
      <span className={`relative mt-[4px] h-[15px] w-[15px] shrink-0 rounded-full ${major ? "bg-[color:var(--ws)]" : "border-2 border-[color:var(--ws)] bg-white"}`} aria-hidden />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] text-[#64748b]">
          <VersionChip version={e.version} />
          <time dateTime={e.date}>{fullDate(e.date)}</time>
          <span aria-hidden>·</span>
          <span className="inline-flex items-center gap-1 font-medium text-[#15803d]">
            <Check size={13} strokeWidth={2.6} />
            {liveIn(e.days)}
          </span>
        </div>
        <h3 className="mt-1.5 text-[15px] font-semibold leading-snug text-[#0f172a]">{e.title}</h3>
        <div className="mt-2 flex items-start gap-2.5">
          <Avatar client={client} name={e.by} size={22} />
          <p className="min-w-0 text-[13.5px] leading-[1.55] text-[#334155]">
            <span className="font-semibold text-[#0f172a]">Asked by {e.by}:</span> &ldquo;{e.asked}&rdquo;
          </p>
        </div>
        <p className="mt-2.5 rounded-lg bg-[#f8fafc] px-3 py-2 text-[13.5px] leading-[1.55] text-[#334155] ring-1 ring-inset ring-[#eef0f3]">
          <span className="font-semibold text-[#0f172a]">Built: </span>
          {e.done}
        </p>
      </div>
    </li>
  );
}

/** `ctx` is the demo's own (sneaker Ctx or store SCtx): only its view-only dialog is used here. */
export function BuildLog({ client, ctx }: { client: DemoClient; ctx: { locked: (what: string, text?: string) => void } }) {
  const log = newestFirst(client.buildLog);
  const med = medianDays(client.buildLog);
  return (
    <div className="flex flex-col gap-5" style={accentVars(client)}>
      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3.5">
            <ClientMark client={client} size={44} />
            <div className="min-w-0">
              <h2 className={`text-[18px] font-bold leading-tight text-[#0f172a] ${clientFont(client)}`}>{possessive(client.name)} build</h2>
              <p className="mt-1 text-[13px] leading-[1.5] text-[#64748b]">{buildSummary(client)}</p>
            </div>
          </div>
          <div className="shrink-0">
            <Button small onClick={() => ctx.locked("ask_change", "Asking for a change")}>
              <Plus size={14} />
              Ask for a change
            </Button>
          </div>
        </div>
        <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-[#f1f3f5] pt-4 sm:grid-cols-3">
          <Stat label="Releases" value={String(client.buildLog.length)} sub={`since ${monthYear(client.since)}`} />
          <Stat label="Ask to live" value={`${med} day${med === 1 ? "" : "s"}`} sub="median, working days" />
          <Stat label="Code" value={client.repo} sub={`owned by ${client.name}`} mono className="col-span-2 sm:col-span-1" />
        </dl>
      </Card>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <Card>
          <CardHead title="Every change, newest first" sub="What the team asked for, what was built, and when it went live" />
          <ol className="max-w-[820px]">
            {log.map((e, i) => (
              <Entry key={e.version} e={e} client={client} last={i === log.length - 1} />
            ))}
          </ol>
        </Card>
        <div className="xl:sticky xl:top-[92px] xl:self-start">
          <TeamCard client={client} />
        </div>
      </div>
    </div>
  );
}

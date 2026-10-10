"use client";

// The client's team (lib/demo/clients.ts: first names and roles) as small initial avatars: in the sidebar of the
// workspace, next to who asked for each change in the build log, and as a card on the build log with how many of the
// changes each of them asked for. Everyone keeps one colour wherever they show up; the owner (first in the list) wears
// the client's own.
import type { DemoClient } from "@/lib/demo/clients";
import { Card, CardHead } from "@/components/demo/ui";

const TONES = [
  { bg: "#e0e7ff", fg: "#3730a3" },
  { bg: "#fef3c7", fg: "#92400e" },
  { bg: "#e0f2fe", fg: "#075985" },
  { bg: "#f3e8ff", fg: "#6b21a8" },
  { bg: "#dcfce7", fg: "#166534" },
];
const NOBODY = { bg: "#f1f5f9", fg: "#475569" };

function tone(client: DemoClient, name: string) {
  const i = client.team.findIndex((m) => m.name === name);
  if (i < 0) return NOBODY;
  if (i === 0) return { bg: client.accentSoft, fg: client.accentInk };
  return TONES[(i - 1) % TONES.length];
}

export function Avatar({ client, name, size = 24 }: { client: DemoClient; name: string; size?: number }) {
  const c = tone(client, name);
  return (
    <span
      className="inline-grid shrink-0 select-none place-items-center rounded-full font-bold leading-none"
      style={{ width: size, height: size, background: c.bg, color: c.fg, fontSize: Math.round(size * 0.46) }}
      aria-hidden
    >
      {name.slice(0, 1)}
    </span>
  );
}

/** The sidebar's team: "Dani · Owner", one per line. */
export function TeamList({ client }: { client: DemoClient }) {
  return (
    <div className="px-5 pt-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#94a3b8]">Team</p>
      <ul className="mt-2 flex flex-col gap-1.5">
        {client.team.map((m) => (
          <li key={m.name} className="flex min-w-0 items-center gap-2 text-[12.5px] leading-tight">
            <Avatar client={client} name={m.name} size={22} />
            <span className="truncate">
              <b className="font-semibold text-[#0f172a]">{m.name}</b>
              <span className="text-[#64748b]"> · {m.role}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** The build log's team card: each person, their role and how many of the changes they asked for. */
export function TeamCard({ client }: { client: DemoClient }) {
  const asks = (name: string) => client.buildLog.filter((e) => e.by === name).length;
  return (
    <Card>
      <CardHead title="Team" sub="Who asks for the changes" />
      <ul className="flex flex-col gap-3">
        {client.team.map((m) => {
          const n = asks(m.name);
          return (
            <li key={m.name} className="flex items-center gap-3">
              <Avatar client={client} name={m.name} size={32} />
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-semibold leading-tight">{m.name}</p>
                <p className="truncate text-[12.5px] text-[#64748b]">{m.role}</p>
              </div>
              <span className="shrink-0 text-[12.5px] tabular-nums text-[#64748b]">{n ? `${n} change${n === 1 ? "" : "s"}` : "–"}</span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

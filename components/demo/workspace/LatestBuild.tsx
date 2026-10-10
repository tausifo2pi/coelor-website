"use client";

// A small card with the two newest changes of the client's build and a link to the full build log (?section=build), for
// the dashboards of both demos: the first screen then shows the build growing with the business, not only its numbers.
// `ctx` is the demo's own (sneaker Ctx or store SCtx); only ctx.go is used.
import { ArrowRight } from "lucide-react";
import type { DemoClient } from "@/lib/demo/clients";
import { Button, Card, CardHead } from "@/components/demo/ui";
import { VersionChip } from "./BuildLog";
import { accentVars } from "./ClientMark";
import { dayMonth, liveIn, newestFirst, possessive } from "./format";

export function LatestBuild({ client, ctx }: { client: DemoClient; ctx: { go: (section: "build") => void } }) {
  const top = newestFirst(client.buildLog).slice(0, 2);
  return (
    <Card pad={false}>
      <div style={accentVars(client)}>
        <div className="px-5 pt-5">
          <CardHead
            title="Latest in the build"
            sub={`${possessive(client.name)} build · v${client.version}`}
            right={<Button small onClick={() => ctx.go("build")}>Build log <ArrowRight size={14} /></Button>}
          />
        </div>
        <ul className="divide-y divide-[#f1f3f5] border-t border-[#f1f3f5]">
          {top.map((e) => (
            <li key={e.version} className="px-5 py-3.5">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] text-[#64748b]">
                <VersionChip version={e.version} />
                <time dateTime={e.date}>{dayMonth(e.date)}</time>
                <span aria-hidden>·</span>
                <span className="font-medium text-[#15803d]">{liveIn(e.days)}</span>
              </div>
              <p className="mt-1.5 text-[13.5px] font-semibold leading-snug text-[#0f172a]">{e.title}</p>
              <p className="mt-0.5 line-clamp-2 text-[12.5px] leading-[1.5] text-[#64748b]">
                Asked by {e.by}: &ldquo;{e.asked}&rdquo;
              </p>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

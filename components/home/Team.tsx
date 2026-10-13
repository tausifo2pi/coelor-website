import content from "@/data/site-content.json";
import SectionHead from "@/components/SectionHead";
import { Icon } from "@/components/icons";
import { fill } from "@/components/home/figures";

// Who builds it: where the team is, no personal names (user 2026-10-14: no names, no roles, no photos), and how access
// works: the client's own scoped API keys, revocable, no passwords; it runs in the client's cloud account.

export default function Team() {
  const { team } = content;
  return (
    <section id="team" aria-labelledby="team-title" className="scroll-mt-16 border-t border-rule bg-canvas2">
      <div className="mx-auto grid max-w-site grid-cols-1 gap-10 px-5 py-16 md:px-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)] lg:items-start lg:gap-20 lg:px-20 lg:py-[104px]">
        <SectionHead id="team-title" num={team.num} eyebrow={team.eyebrow} headline={team.headline} body={team.body} className="[&_h2]:text-balance" />

        <div className="panel flex flex-col p-6 md:p-8">
          <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-soft">{team.accessTitle}</span>
          <ul className="mt-2 flex flex-col">
            {team.access.map((a, i) => (
              <li key={a.title} className={`grid grid-cols-[36px_1fr] gap-x-4 py-4 last:pb-0 ${i ? "border-t border-rule" : ""}`}>
                <span className="facet-tile h-9 w-9 rounded-[9px]" aria-hidden>
                  <Icon name={a.icon} size={16} />
                </span>
                <div className="flex flex-col gap-1">
                  <h3 className="text-[15px] font-semibold leading-[1.35] text-ink md:text-[16px]">{a.title}</h3>
                  <p className="text-[14px] leading-[1.6] text-ink-muted">{fill(a.body)}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

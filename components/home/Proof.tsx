import content from "@/data/site-content.json";
import SectionHead from "@/components/SectionHead";
import Logo from "@/components/Logo";
import { Icon } from "@/components/icons";

// The one real client project, told without naming the client or its platforms: its setup as neutral tiles and the
// numbers the build runs at today.

type Node = { icon: string; name: string; note: string };

function Nodes({ items }: { items: Node[] }) {
  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((n) => (
        <li key={n.name} className="flex items-center gap-3 rounded-[12px] border border-rule bg-white/[0.03] px-3.5 py-3">
          <span className="facet-tile h-9 w-9 rounded-[9px]" aria-hidden>
            <Icon name={n.icon} size={17} />
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="text-[14px] font-semibold text-ink">{n.name}</span>
            {n.note && <span className="text-[12px] text-ink-soft">{n.note}</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}

const Arrow = () => (
  <span className="flex justify-center text-ink-soft" aria-hidden>
    <Icon name="arrow-right" size={16} className="rotate-90 lg:rotate-0" />
  </span>
);

export default function Proof() {
  const { proof } = content;
  return (
    <section id="proof" aria-labelledby="proof-title" className="scroll-mt-16 bg-canvas2">
      <div className="mx-auto flex max-w-site flex-col gap-10 px-5 py-16 md:px-10 lg:gap-14 lg:px-20 lg:py-[104px]">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[400px_1fr] lg:items-center lg:gap-20">
          <SectionHead id="proof-title" num={proof.num} eyebrow={proof.eyebrow} headline={proof.headline} body={proof.body} />

          <div className="panel grid grid-cols-1 items-center gap-3 p-6 md:p-8 lg:grid-cols-[1fr_auto_auto_auto_1fr] lg:gap-4">
            <Nodes items={proof.from} />
            <Arrow />
            <span className="mx-auto inline-flex w-fit items-center gap-2 rounded-[10px] border border-accent/30 bg-accent/10 px-3 py-2.5">
              <Logo height={13} />
              <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-accent">engine</span>
            </span>
            <Arrow />
            <Nodes items={proof.to} />
          </div>
        </div>

        <dl className="grid grid-cols-1 gap-6 border-t border-rule pt-8 sm:grid-cols-3">
          {proof.stats.map((s) => (
            <div key={s.label} className="flex flex-col-reverse gap-1">
              <dt className="text-[13px] leading-[1.45] text-ink-soft md:text-[14px]">{s.label}</dt>
              <dd className="display m-0 text-[30px] text-ink lg:text-[36px]">{s.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

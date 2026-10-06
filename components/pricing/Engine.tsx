import SectionHead from "@/components/SectionHead";
import { Icon } from "@/components/icons";
import { pricing } from "./content";

// Why the price is one-time: the engine exists, so a build pays for the client's version only (what is and is not in
// the price is in Included.tsx). Then the proof that it
// runs today (the real client, kept anonymous and told generically: neutral icons, no platform names or logos). No link
// to the live demo (email readers only). The proof block is its own tracked section (id="proof").

function Proof() {
  const { proof } = pricing.engine;
  return (
    <article id="proof" data-track-section aria-labelledby="proof-title" className="scroll-mt-20 overflow-hidden rounded-[16px] border border-rule bg-panel">
      <div className="grid grid-cols-1 gap-8 p-6 md:p-8 lg:grid-cols-[1fr_360px] lg:gap-12 lg:p-10">
        <div className="flex flex-col gap-4">
          <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.08em] text-ok">
            <span className="pulse h-2 w-2 rounded-full bg-ok" aria-hidden />
            {proof.eyebrow}
          </span>
          <h3 id="proof-title" className="text-balance text-[22px] font-semibold leading-[1.25] text-ink md:text-[26px]">
            {proof.title}
          </h3>
          <p className="max-w-[560px] text-[15px] leading-[1.6] text-ink-muted">{proof.body}</p>
        </div>
        <ul className="flex flex-col gap-2 self-start" aria-label={proof.setupLabel}>
          {proof.setup.map((p) => (
            <li key={p.name} className="flex items-center gap-3 rounded-[12px] border border-rule bg-white/[0.03] p-2 pr-3">
              <span className="facet-tile h-[34px] w-[34px] rounded-[8px]" aria-hidden>
                <Icon name={p.icon} size={17} />
              </span>
              <span className="min-w-0 flex-1 text-[14px] font-medium text-ink">{p.name}</span>
              <span className="text-right text-[12px] text-ink-soft">{p.role}</span>
            </li>
          ))}
        </ul>
      </div>
      <dl className="grid grid-cols-1 border-t border-rule sm:grid-cols-3">
        {proof.stats.map((s, i) => (
          <div key={s.label} className={`flex flex-col-reverse justify-end gap-1.5 px-6 py-6 md:px-8 lg:px-10 ${i ? "border-t border-rule sm:border-l sm:border-t-0" : ""}`}>
            <dt className="text-[13px] leading-[1.45] text-ink-muted md:text-[14px]">{s.label}</dt>
            <dd className="display m-0 text-[26px] text-ink md:text-[30px]">{s.value}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

export default function Engine() {
  const { engine } = pricing;
  return (
    <section id="engine" aria-labelledby="engine-title" className="scroll-mt-20 border-t border-rule bg-canvas2">
      <div className="mx-auto flex max-w-site flex-col gap-10 px-5 py-16 md:px-10 lg:gap-12 lg:px-20 lg:py-[104px]">
        <SectionHead id="engine-title" num={engine.num} eyebrow={engine.eyebrow} headline={engine.headline} body={engine.body} className="max-w-[720px] [&_h2]:text-balance" />

        <Proof />
      </div>
    </section>
  );
}

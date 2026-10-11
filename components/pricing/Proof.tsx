import { IDS, pricing } from "./content";

// The proof line: the one client, anonymous, in the brief's exact words, and only what its build really does (no order
// import, labels, listing creation, supplier feeds or repricing; no marketplace or warehouse brand names next to the
// country). The same numbers as the homepage. No link to the live demo or the case studies (email readers only).

export default function Proof() {
  const { proof } = pricing;
  return (
    <section id={IDS.proof} aria-labelledby="proof-title" className="scroll-mt-20 border-t border-rule">
      <div className="mx-auto max-w-site px-5 py-6 md:px-10 md:py-14 lg:px-20 lg:py-16">
        <div className="grid grid-cols-1 gap-6 rounded-[16px] border border-rule bg-panel p-5 md:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-12 lg:p-10">
          <div className="flex flex-col gap-3">
            <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.08em] text-ok">
              <span className="pulse h-2 w-2 rounded-full bg-ok" aria-hidden />
              {proof.eyebrow}
            </span>
            <h2 id="proof-title" className="text-balance text-[18px] font-semibold leading-[1.4] text-ink md:text-[24px]">
              {proof.line}
            </h2>
          </div>
          <ul className="flex flex-col gap-2.5 self-center">
            {proof.points.map((p) => (
              <li key={p} className="flex items-start gap-2.5 text-[14px] leading-[1.5] text-ink-muted md:text-[15px]">
                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-ok" aria-hidden />
                {p}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

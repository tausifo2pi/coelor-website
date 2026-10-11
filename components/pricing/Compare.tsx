import SectionHead from "@/components/SectionHead";
import { IDS, INNER, SECTION, pricing } from "./content";

// The first 12 months compared by kind of option (monthly apps, a freelancer, an agency, us), never by company name
// (REBUILD_BRIEF "Comparison"). A real table from tablet width; on phones each row stacks (option, what you pay, after
// 12 months), so nothing scrolls sideways. Under it, the one-time price spread over two years.

export default function Compare() {
  const { compare } = pricing;
  const [colWho, colPay, colAfter] = compare.cols;
  return (
    <section id={IDS.compare} aria-labelledby="compare-title" className={SECTION}>
      <div className={`${INNER} flex flex-col gap-6 lg:gap-10`}>
        <SectionHead id="compare-title" num={compare.num} eyebrow={compare.eyebrow} headline={compare.headline} body={compare.body} size="md" className="max-w-[640px] [&_h2]:text-balance" />
        <table className="w-full border-collapse text-left">
          <thead className="hidden md:table-header-group">
            <tr className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-soft">
              <th scope="col" className="w-[22%] pb-3 pr-6 font-normal">{colWho}</th>
              <th scope="col" className="w-[33%] pb-3 pr-6 font-normal">{colPay}</th>
              <th scope="col" className="pb-3 font-normal">{colAfter}</th>
            </tr>
          </thead>
          <tbody>
            {compare.rows.map((r) => {
              const us = "us" in r && r.us === true;
              const pad = us ? "px-4" : "px-0"; // our row is a tinted box: its text stays off the edges
              return (
                <tr key={r.who} className={`block md:table-row ${us ? "rounded-[12px] border border-accent/30 bg-accent/[0.07]" : "border-t border-rule"}`}>
                  <th scope="row" className={`block ${pad} pt-4 text-[16px] font-semibold text-ink md:table-cell md:py-4 md:pr-6 ${us ? "md:pl-4" : "md:pl-0"}`}>
                    {r.who}
                  </th>
                  <td className={`block ${pad} pt-1 text-[15px] font-medium tabular-nums text-ink md:table-cell md:py-4 md:pl-0 md:pr-6`}>{r.pay}</td>
                  <td className={`block ${pad} pb-4 pt-1 text-[14px] leading-[1.55] md:table-cell md:py-4 md:pl-0 md:text-[15px] ${us ? "text-ink md:pr-4" : "text-ink-muted md:pr-0"}`}>{r.after}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="text-[15px] font-semibold leading-[1.55] text-ink md:text-[16px]">{compare.monthly}</p>
      </div>
    </section>
  );
}

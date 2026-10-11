import content from "@/data/site-content.json";
import SectionHead from "@/components/SectionHead";
import { fill } from "@/components/home/figures";

// Why custom: the alternatives by category, never by brand (monthly apps, DIY automation tools, freelancers and
// agencies), against a Coelor build, on the same five rows. One card per option: stacked on phones (label beside the
// answer), 2 across on tablets, 4 across on desktop with the rows lined up through a subgrid (each card spans its
// heading + 5 rows: lg:row-span-6, so a sixth row in why.rows needs row-span-7). Prices that are not ours come from
// figures.ts ({apps}, {freelancer}, {agency}).

export default function WhyCustom() {
  const { why } = content;
  return (
    <section id="why" aria-labelledby="why-title" className="scroll-mt-16 border-t border-rule bg-canvas2">
      <div className="mx-auto flex max-w-site flex-col gap-10 px-5 py-16 md:px-10 lg:gap-12 lg:px-20 lg:py-[104px]">
        <SectionHead id="why-title" num={why.num} eyebrow={why.eyebrow} headline={why.headline} body={why.body} className="max-w-[720px] [&_h2]:text-balance" />

        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-4">
          {why.columns.map((c) => (
            <li
              key={c.name}
              className={`flex flex-col rounded-[16px] border p-5 md:p-6 lg:row-span-6 lg:grid lg:grid-rows-subgrid lg:gap-0 ${
                c.highlight ? "border-accent/40 bg-accent/[0.07] shadow-[0_24px_60px_-28px_rgba(159,176,255,0.45)]" : "border-rule bg-panel"
              }`}
            >
              <h3 className="flex items-center gap-2.5 pb-4 text-[17px] font-semibold leading-[1.3] text-ink">
                {c.highlight && <span className="pulse h-2 w-2 shrink-0 rounded-full bg-ok" aria-hidden />}
                {c.name}
              </h3>
              {why.rows.map((r, i) => (
                <div key={r} className={`grid grid-cols-[96px_1fr] gap-3 border-t py-3 md:flex md:flex-col md:gap-1 ${c.highlight ? "border-accent/20" : "border-rule"}`}>
                  <span className="pt-[3px] font-mono text-[11px] uppercase leading-[1.4] tracking-[0.08em] text-ink-soft md:pt-0">{r}</span>
                  <span className={`text-[14px] leading-[1.55] ${c.highlight ? "font-medium text-ink" : "text-ink-muted"}`}>{fill(c.cells[i])}</span>
                </div>
              ))}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

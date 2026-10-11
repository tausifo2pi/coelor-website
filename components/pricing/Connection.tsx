import SectionHead from "@/components/SectionHead";
import { Icon } from "@/components/icons";
import { IDS, INNER, SECTION, pricing } from "./content";

// What a connection is, right under the quote: one platform or account we build for, each account on its own, how team
// tools and supplier files are priced (listed on the call, price in writing first: nothing promised beyond that), and
// adding one later.

export default function Connection() {
  const { connection } = pricing;
  return (
    <section id={IDS.connection} aria-labelledby="connection-title" className={`${SECTION} bg-canvas2`}>
      <div className={`${INNER} grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-20`}>
        <SectionHead id="connection-title" num={connection.num} eyebrow={connection.eyebrow} headline={connection.headline} body={connection.body} size="md" className="[&_h2]:text-balance" />
        <ul className="flex flex-col border-t border-rule lg:mt-2">
          {connection.items.map((it) => (
            <li key={it.title} className="grid grid-cols-[36px_1fr] gap-x-4 border-b border-rule py-4">
              <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-accent/10 text-accent" aria-hidden>
                <Icon name={it.icon} size={17} />
              </span>
              <div className="flex flex-col gap-1">
                <h3 className="text-[16px] font-semibold leading-[1.35] text-ink md:text-[17px]">{it.title}</h3>
                <p className="text-[14px] leading-[1.6] text-ink-muted md:text-[15px]">{it.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

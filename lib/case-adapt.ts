import base from "@/data/case-sneakers.json";
import type { CaseMix, CasePlatform, CaseWords } from "@/lib/case-mix";

// The case study content for one reader: told for their platform mix when their email link carries one, and for the
// real client's own stack otherwise (data/case-sneakers.json). The real client's results always stay under a proof line
// that names its real stack.

export type Named = { name: string; slug: string };
export type HookItem = { angle: string; viz: string; title: string; body: string };
type Row = { icon: string; label: string; meta: string; state: string };

export type CaseContent = {
  adapted: boolean;
  seo: { title: string; description: string };
  hero: {
    eyebrow: string;
    lead: string; // the headline is `lead` + the platforms (with their logos) + "."
    platforms: CasePlatform[];
    sub: string;
    primaryCta: { label: string; href: string };
    secondaryCta: { label: string; href: string };
    panel: { title: string; rows: Row[] };
  };
  /** the platforms the hook cards draw: two places to sell (B may be missing) and the stock system (may be missing) */
  cast: { a: Named; b: Named | null; system: Named | null };
  words: CaseWords;
  hook: { num: string; eyebrow: string; headline: string; body: string; footer: string; items: HookItem[] };
  proof: { lead: string; platforms: Named[]; tail: string };
  stats: { value: string; label: string }[];
  setup: Omit<typeof base.setup, "flowFrom" | "flowTo" | "steps"> & { flowFrom: Named[]; flowTo: Named[]; steps: { icon: string; title: string; body: string }[] };
  offer: typeof base.offer;
  faq: typeof base.faq;
  contact: typeof base.contact;
};

const join = (xs: string[]) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const COUNT = ["none", "one", "two", "three", "four", "five"];
const named = (xs: { name: string; slug: string }[]) => xs.map(({ name, slug }) => ({ name, slug }));

// angles that describe the opposite setup: a reader with one never sees cards of the other
const OPPOSITE: Record<string, string> = { warehouse_system: "no_stock_system", no_stock_system: "warehouse_system" };

// items with the reader's angles first (in their order), then the ones for everybody, then the rest; stable
function byAngle<T extends { angle: string }>(xs: T[], angle: string[], n: number): T[] {
  const skip = new Set(angle.map((a) => OPPOSITE[a]).filter(Boolean));
  const rank = (x: T) => (angle.includes(x.angle) ? angle.indexOf(x.angle) : x.angle === "*" ? 50 : 100);
  return xs.filter((x) => !skip.has(x.angle)).sort((a, b) => rank(a) - rank(b)).slice(0, n);
}

// what the real client's own page leads with
const REAL_ANGLES = ["marketplace_listing", "multi_marketplace", "warehouse_system", "many_variants"];

// A mix is told with 2 places to sell and a stock system, as lead-outreach picks it. One that came back thinner (a
// platform it named may no longer be shown) is filled up the same way: well-known places to sell, then the real case's system.
const FILL_SELL: CasePlatform[] = [{ name: "eBay", slug: "ebay", kind: "sell" }, { name: "Etsy", slug: "etsy", kind: "sell" }, { name: "Amazon", slug: "amazon", kind: "sell" }];
const FILL_SYSTEM: CasePlatform = { name: "Picqer", slug: "picqer", kind: "system" };
function filled(ps: CasePlatform[]): CasePlatform[] {
  const sells = ps.filter((p) => p.kind === "sell"), systems = ps.filter((p) => p.kind === "system");
  for (const f of FILL_SELL) if (sells.length < 2 && !sells.some((p) => p.slug === f.slug)) sells.push(f);
  return [...sells, ...(systems.length ? systems : [FILL_SYSTEM])];
}

export function adaptCase(mix: CaseMix | null): CaseContent {
  const { adaptive: A, realStack, realWords, ...cs } = base;
  const own = mix && mix.platforms.some((p) => p.kind === "sell") ? mix : null; // a sync needs somewhere to sell
  const platforms = own ? filled(own.platforms) : (realStack as CasePlatform[]);
  const words = own ? own.words : realWords;
  const sells = platforms.filter((p) => p.kind === "sell"), systems = platforms.filter((p) => p.kind === "system");
  const sys = systems[0]?.name ?? "your warehouse";
  const other = "your other channels";
  const v: Record<string, string> = {
    all: join(platforms.map((p) => p.name)),
    sells: join(sells.map((p) => p.name)),
    sellA: sells[0].name,
    sellB: sells[1]?.name ?? other,
    SellB: sells[1]?.name ?? cap(other),
    system: sys,
    System: cap(sys),
    count: COUNT[platforms.length] ?? String(platforms.length),
    item: words.item, items: words.items, Item: cap(words.item), Items: cap(words.items),
    variant: words.variant, variants: words.variants, Variants: cap(words.variants),
  };
  const f = (s: string) => s.replace(/\{(\w+)\}/g, (m, k: string) => v[k] ?? m);

  const common = {
    adapted: !!own,
    cast: { a: sells[0], b: sells[1] ?? null, system: systems[0] ?? null },
    words,
    hook: { ...cs.hook, headline: f(cs.hook.headline), body: f(cs.hook.body), footer: f(cs.hook.footer),
      items: byAngle(cs.hook.items, own ? own.angle : REAL_ANGLES, 8).map((it) => ({ ...it, title: f(it.title), body: f(it.body) })) },
    stats: cs.stats, offer: cs.offer, faq: cs.faq, contact: cs.contact,
  };
  const heroBase = { ...cs.hero, platforms: named(platforms).map((p, i) => ({ ...p, kind: platforms[i].kind })) };

  if (!own) {
    return {
      ...common,
      seo: cs.seo,
      hero: heroBase,
      proof: { lead: cs.proof.generic, platforms: named(realStack), tail: cs.proof.tail },
      setup: { ...cs.setup, flowFrom: named(cs.setup.flowFrom), flowTo: named(cs.setup.flowTo) },
    };
  }
  return {
    ...common,
    seo: { title: f(A.seoTitle), description: f(A.seoDescription) },
    hero: { ...heroBase, eyebrow: f(A.eyebrow), sub: f(A.sub), panel: { title: f(A.panelTitle), rows: A.panelRows.map((r) => ({ ...r, label: f(r.label) })) } },
    proof: { lead: cs.proof.adapted, platforms: named(realStack), tail: cs.proof.tail },
    setup: { ...cs.setup, headline: f(A.setupHeadline), body: f(A.setupBody),
      steps: A.steps.map((s) => ({ ...s, title: f(s.title), body: f(s.body) })), before: A.before.map(f), after: A.after.map(f),
      flowFrom: named(sells), flowTo: systems.length ? named(systems) : [{ name: "Your warehouse", slug: "warehouse" }] },
    faq: { ...cs.faq, items: [{ q: f(A.faqTop.q), a: f(A.faqTop.a) }, ...cs.faq.items] },
  };
}

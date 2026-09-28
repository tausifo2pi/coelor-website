import base from "@/data/case-sneakers.json";
import type { CaseMix, CasePlatform, CaseWords } from "@/lib/case-mix";
import { platformInfo } from "@/lib/platforms";

// The case study content for one reader (data/case-sneakers.json). A reader who came through their email link sees it
// told for their own setup: the places they sell (their platforms, or "your shop counter"), where their stock is
// counted, the gap in between and what the sync does. Only their own platforms are named; logos appear in the hero only.
// Without an email link the page tells the real client's story. The real client's results always stay attributed to it,
// in sneaker words only for sneaker readers.

/** A place in a setup: a platform (slug from lib/platforms.ts, shown with its logo) or a "facet:…" stand-in (an icon). */
export type Place = { name: string; slug: string; role?: string };
/** what the hook card drawings show for the first place to sell, the second one and the stock (neutral icons) */
export type Role = "web" | "market" | "counter" | "system" | "sheet" | "warehouse";
export type HookItem = { angle: string; needs: string; viz: string; title: string; body: string };

export type CaseContent = {
  adapted: boolean;
  seo: { title: string; description: string };
  hero: {
    eyebrow: string;
    lead: string; // the headline: lead + places (with logos / icons) + tail + "."
    places: Place[];
    tail: string;
    sub: string;
    primaryCta: { label: string; href: string };
    secondaryCta: { label: string; href: string };
    setupTitle: string;
    setup: Place[];
    gapTitle: string;
    gap: string;
    fixTitle: string;
    fix: string;
  };
  cast: { a: Role; b: Role | null; stock: Role | null };
  words: CaseWords;
  hook: { num: string; eyebrow: string; headline: string; body: string; footer: string; items: HookItem[] };
  proof: { text: string; origin: string | null };
  stats: { value: string; label: string }[];
  setup: { num: string; eyebrow: string; headline: string; body: string; beforeLabel: string; before: string[]; afterLabel: string; after: string[];
    steps: { icon: string; title: string; body: string }[] };
  offer: typeof base.offer;
  faq: typeof base.faq;
  contact: typeof base.contact;
};

const join = (xs: string[]) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const COUNT = ["none", "one", "two", "three", "four", "five", "six"];

// the items for the reader's angles (in their order), then the ones for everybody; an item about a setup the reader
// doesn't have (buy-ins, several shops…) is never shown
function byAngle<T extends { angle: string }>(xs: T[], angle: string[], n: number): T[] {
  const rank = (x: T) => (angle.includes(x.angle) ? angle.indexOf(x.angle) : 50);
  return xs.filter((x) => x.angle === "*" || angle.includes(x.angle)).sort((a, b) => rank(a) - rank(b)).slice(0, n);
}

const A = base.adaptive;
const role = (p: CasePlatform) => (A.roles as Record<string, string>)[platformInfo(p.slug)?.type ?? ""] ?? "";
const FACET = {
  web: { name: "your online listings", slug: "facet:web" },
  counter: { name: "your shop counter", slug: "facet:counter" },
  warehouse: { name: "your warehouse", slug: "facet:warehouse" },
  sheet: { name: "your stock sheet", slug: "facet:sheet" },
};

/** The reader's setup and the words the texts are told with. */
function setupOf(platforms: CasePlatform[], angle: string[], words: CaseWords) {
  const own = platforms.filter((p) => p.own !== false);
  const sells = own.filter((p) => p.kind === "sell").slice(0, 2);
  const sys = own.find((p) => p.kind === "system") ?? null;
  const has = new Set(angle);
  const counter = has.has("store_and_web");
  const sheet = !sys && has.has("no_stock_system");
  const warehouse = !sys && !sheet && has.has("warehouse_system");

  const sellPlaces: Place[] = sells.length ? sells.map((p) => ({ name: p.name, slug: p.slug, role: role(p) })) : [{ ...FACET.web, role: A.roles.web }];
  const onA = sells.length ? `on ${sells[0].name}` : "online";
  const b = sells[1] ? { name: sells[1].name, on: `on ${sells[1].name}` } : counter ? { name: FACET.counter.name, on: "at your shop counter" } : null;
  const stock: Place | null = sys ? { name: sys.name, slug: sys.slug, role: role(sys) }
    : warehouse ? { ...FACET.warehouse, role: A.roles.warehouse } : sheet ? { ...FACET.sheet, role: A.roles.sheet } : null;
  const placeNames = [...sellPlaces.map((p) => p.name), ...(counter ? [FACET.counter.name] : []), ...(stock ? [stock.name] : [])];
  const onSells = sells.length ? `on ${join(sells.map((p) => p.name))}` : "online";
  const system = sys?.name ?? (warehouse ? FACET.warehouse.name : "one stock list");

  const v: Record<string, string> = {
    A: sellPlaces[0].name,
    onA,
    B: b?.name ?? "",
    onB: b?.on ?? "",
    sells: join([...sellPlaces.map((p) => p.name), ...(counter ? [FACET.counter.name] : [])]),
    where: [onSells, ...(counter ? ["at your shop counter"] : [])].join(" and "),
    onSells,
    places: join(placeNames),
    count: COUNT[placeNames.length] ?? String(placeNames.length),
    system,
    System: cap(system),
    inStock: sys ? `in ${sys.name}` : warehouse ? "in your warehouse" : "in one stock list",
    andSystem: sys ? ` and in ${sys.name}` : sheet ? " and in the stock sheet" : warehouse ? " and in the warehouse count" : "",
    everywhere: placeNames.length > 1 ? "in every place it is for sale" : onA,
    item: words.item, items: words.items, Item: cap(words.item), Items: cap(words.items),
    variant: words.variant, variants: words.variants, Variants: cap(words.variants),
  };
  const f = (s: string) => s.replace(/\{(\w+)\}/g, (m, k: string) => v[k] ?? m);
  const flags: Record<string, boolean> = {
    "": true, counter, sheet, B: !!b, twoSells: sells.length >= 2, two: placeNames.length >= 2, system: !!sys,
    unique_items: has.has("unique_items"), variants: !has.has("unique_items") && words.variant !== words.item,
  };
  const meets = (when: string) => when.split("+").every((k) => flags[k] ?? has.has(k));
  const roleOf = (p: CasePlatform): Role => (platformInfo(p.slug)?.type === "marketplace" ? "market" : "web");
  const cast = {
    a: sells[0] ? roleOf(sells[0]) : ("web" as Role),
    b: sells[1] ? roleOf(sells[1]) : counter ? ("counter" as Role) : null,
    stock: sys ? ("system" as Role) : sheet ? ("sheet" as Role) : warehouse ? ("warehouse" as Role) : null,
  };
  const headline = [...sellPlaces, ...(counter ? [FACET.counter] : []), ...(stock && !sheet ? [stock] : [])].map(({ name, slug }) => ({ name, slug }));
  const hook = base.hook;
  const items = byAngle(hook.items.filter((it) => meets(it.needs)), angle, 8).map((it) => ({ ...it, title: f(it.title), body: f(it.body) }));
  return {
    f, meets, cast, headline,
    setup: [...sellPlaces, ...(counter ? [{ ...FACET.counter, role: A.roles.counter }] : []), ...(stock ? [stock] : [])],
    hook: { ...hook, headline: f(hook.headline), body: f(hook.body), footer: f(hook.footer), items },
  };
}

const up = (p: Place) => ({ ...p, name: cap(p.name) });

export function adaptCase(mix: CaseMix | null): CaseContent {
  const { real, proof, stats } = base;
  const common = { offer: base.offer, contact: base.contact };

  if (!mix) {
    // the real client's own story
    const s = setupOf(real.platforms as CasePlatform[], real.angles, real.words);
    return {
      ...common,
      adapted: false,
      seo: base.seo,
      hero: { ...base.hero, places: real.platforms.map(({ name, slug }) => ({ name, slug })), tail: "",
        setup: real.setup, gap: real.gap, fix: real.fix },
      cast: s.cast,
      words: real.words,
      hook: s.hook,
      proof: { text: proof.sneaker, origin: null },
      stats: stats.sneaker,
      setup: base.setup,
      faq: base.faq,
    };
  }

  const s = setupOf(mix.platforms, mix.angle, mix.words);
  const f = s.f;
  const sneaker = mix.words.item === "pair";
  const gap = A.gaps.find((g) => s.meets(g.when)) ?? A.gaps[A.gaps.length - 1];
  const one = s.headline.length < 2;
  return {
    ...common,
    adapted: true,
    seo: { title: f(A.seoTitle), description: f(A.seoDescription) },
    hero: {
      ...base.hero,
      eyebrow: A.eyebrow,
      lead: one ? A.leadOne : A.leadMany,
      places: s.headline,
      tail: one ? A.tailOne : "",
      sub: f(A.sub),
      setupTitle: A.setupTitle,
      setup: s.setup.map(up),
      gapTitle: A.gapTitle,
      gap: f(gap.gap),
      fixTitle: A.fixTitle,
      fix: f(gap.fix),
    },
    cast: s.cast,
    words: mix.words,
    hook: s.hook,
    proof: { text: sneaker ? proof.sneaker : proof.neutral, origin: sneaker ? null : proof.origin },
    stats: sneaker ? stats.sneaker : stats.neutral,
    setup: { ...base.setup, headline: f(A.setupHeadline), body: f(A.setupBody),
      steps: A.steps.map((st) => ({ ...st, title: f(st.title), body: f(st.body) })), before: A.before.map(f), after: A.after.map(f) },
    faq: { ...base.faq, items: [{ q: f(A.faqTop.q), a: f(A.faqTop.a) }, ...base.faq.items] },
  };
}

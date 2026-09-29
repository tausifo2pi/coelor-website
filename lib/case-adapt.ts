import base from "@/data/case-sneakers.json";
import type { CaseMix, CasePlatform, CaseWords } from "@/lib/case-mix";
import { platformInfo } from "@/lib/platforms";

// The case study content for one reader (data/case-sneakers.json). A reader who came through their email link sees it
// told for their own web store and the tools behind it: the places they sell (their own platforms), where their stock
// is counted, what is often still done by hand and what we would connect. Only their own platforms are named, and each
// logo appears once (the hero's setup card). Without an email link the page tells the real client's story. The real
// client's results always stay attributed to it, in sneaker words only for sneaker readers.

/** A place in a setup: a platform (slug from lib/platforms.ts, shown with its logo) or a "facet:…" stand-in (an icon). */
export type Place = { name: string; slug: string; role?: string };
/** a row of hand work: `every` says how often it comes back; one row per `group` */
export type HookItem = { key: string; angle: string; needs: string; group: string; every: string; title: string; body: string };

export type CaseContent = {
  adapted: boolean;
  seo: { title: string; description: string };
  hero: {
    eyebrow: string;
    headline: string;
    sub: string;
    primaryCta: { label: string; href: string };
    secondaryCta: { label: string; href: string };
    setupTitle: string;
    /** a live-status pill on the setup card: only for the real client's setup, where a sync does run */
    status: string | null;
    setup: Place[];
    gapTitle: string;
    gap: string;
    fixTitle: string;
    fix: string;
  };
  words: CaseWords;
  /** items[0] is where it slips most for this reader (the same gap as the hero's) */
  hook: { num: string; eyebrow: string; headline: string; body: string; footer: string; lead: string; items: HookItem[] };
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

// The rows for one reader: the `first` row (where it slips most), then the reader's angles in their order, then the
// rows for everybody. A row about a setup the reader doesn't have (buy-ins, several shops…) is never shown, and rows
// that tell the same story (the same `group`) are shown once.
function pickRows<T extends { key: string; angle: string; group: string }>(xs: T[], angle: string[], first: string, n: number): T[] {
  const rank = (x: T) => (x.key === first ? -1 : angle.includes(x.angle) ? angle.indexOf(x.angle) : 50);
  const seen = new Set<string>();
  return xs.filter((x) => x.key === first || x.angle === "*" || angle.includes(x.angle)).sort((a, b) => rank(a) - rank(b))
    .filter((x) => !seen.has(x.group) && !!seen.add(x.group)).slice(0, n);
}

const A = base.adaptive;
const role = (p: CasePlatform) => (A.roles as Record<string, string>)[platformInfo(p.slug)?.type ?? ""] ?? "";
const FACET = {
  web: { name: "your web store", slug: "facet:web" },
  warehouse: { name: "your warehouse", slug: "facet:warehouse" },
  sheet: { name: "your stock sheet", slug: "facet:sheet" },
};

/** The reader's setup and the words the texts are told with. `gapItem`: the row that leads (the hero's gap).
 * v6 subtle-offer rule (leads/outreach/drafts/v6/SUBTLE_OFFER_RULES.md): the page is about the web store and the tools
 * behind it. A shop counter, till or location is never named as the gap or as something we connect, so a store angle
 * and a POS system are left out here. */
function setupOf(platforms: CasePlatform[], angle: string[], words: CaseWords, gapItem: (meets: (when: string) => boolean) => string) {
  const own = platforms.filter((p) => p.own !== false);
  const sells = own.filter((p) => p.kind === "sell").slice(0, 2);
  const sys = own.find((p) => p.kind === "system" && platformInfo(p.slug)?.type !== "pos") ?? null;
  const has = new Set(angle);
  const sheet = !sys && has.has("no_stock_system");
  const warehouse = !sys && !sheet && has.has("warehouse_system");

  const sellPlaces: Place[] = sells.length ? sells.map((p) => ({ name: p.name, slug: p.slug, role: role(p) })) : [{ ...FACET.web, role: A.roles.web }];
  const b = sells[1]?.name ?? null;
  const stock: Place | null = sys ? { name: sys.name, slug: sys.slug, role: role(sys) }
    : warehouse ? { ...FACET.warehouse, role: A.roles.warehouse } : sheet ? { ...FACET.sheet, role: A.roles.sheet } : null;
  const placeNames = [...sellPlaces.map((p) => p.name), ...(stock ? [stock.name] : [])];
  const onSells = sells.length ? `on ${join(sells.map((p) => p.name))}` : "online";
  const system = sys?.name ?? (warehouse ? FACET.warehouse.name : "one stock list");

  const v: Record<string, string> = {
    A: sellPlaces[0].name,
    B: b ?? "",
    where: onSells,
    onSells,
    places: join(placeNames),
    count: COUNT[placeNames.length] ?? String(placeNames.length),
    system,
    andSystem: sys ? ` and in ${sys.name}` : sheet ? " and in the stock sheet" : warehouse ? " and in the warehouse count" : "",
    item: words.item, items: words.items, Item: cap(words.item), Items: cap(words.items),
    variant: words.variant, variants: words.variants, Variants: cap(words.variants),
  };
  const f = (s: string) => s.replace(/\{(\w+)\}/g, (m, k: string) => v[k] ?? m);
  const flags: Record<string, boolean> = {
    "": true, sheet, twoSells: sells.length >= 2, two: placeNames.length >= 2, system: !!sys,
    unique_items: has.has("unique_items"), variants: !has.has("unique_items") && words.variant !== words.item,
  };
  const meets = (when: string) => when.split("+").every((k) => flags[k] ?? has.has(k));
  const hook = base.hook;
  const items = pickRows(hook.items.filter((it) => meets(it.needs)), angle, gapItem(meets), 6).map((it) => ({ ...it, title: cap(f(it.title)), body: cap(f(it.body)) }));
  return {
    f, meets,
    setup: [...sellPlaces, ...(stock ? [stock] : [])],
    hook: { ...hook, headline: f(hook.headline), body: f(hook.body), footer: f(hook.footer), items },
  };
}

const up = (p: Place) => ({ ...p, name: cap(p.name) });

export function adaptCase(mix: CaseMix | null): CaseContent {
  const { real, proof, stats } = base;
  const common = { offer: base.offer, contact: base.contact };

  if (!mix) {
    // the real client's own story
    const s = setupOf(real.platforms as CasePlatform[], real.angles, real.words, () => real.gapItem);
    return {
      ...common,
      adapted: false,
      seo: base.seo,
      hero: { ...base.hero, headline: `${base.hero.lead} ${join(real.platforms.map((p) => p.name))}.`,
        setup: real.setup, gap: real.gap, fix: real.fix },
      words: real.words,
      hook: s.hook,
      proof: { text: proof.sneaker, origin: null },
      stats: stats.sneaker,
      setup: base.setup,
      faq: base.faq,
    };
  }

  const gapOf = (meets: (when: string) => boolean) => A.gaps.find((g) => meets(g.when)) ?? A.gaps[A.gaps.length - 1];
  const s = setupOf(mix.platforms, mix.angle, mix.words, (meets) => gapOf(meets).item);
  const f = s.f;
  const sneaker = mix.words.item === "pair";
  const gap = gapOf(s.meets);
  return {
    ...common,
    adapted: true,
    seo: { title: f(A.seoTitle), description: f(A.seoDescription) },
    hero: {
      ...base.hero,
      eyebrow: A.eyebrow,
      headline: cap(f(s.meets("twoSells") ? A.headlineTwo : A.headlineOne)),
      sub: f(A.sub),
      setupTitle: A.setupTitle,
      status: null,
      setup: s.setup.map(up),
      gapTitle: A.gapTitle,
      gap: cap(f(gap.gap)),
      fixTitle: A.fixTitle,
      fix: cap(f(gap.fix)),
    },
    words: mix.words,
    hook: s.hook,
    proof: { text: sneaker ? proof.sneaker : proof.neutral, origin: sneaker ? null : proof.origin },
    stats: sneaker ? stats.sneaker : stats.neutral,
    setup: { ...base.setup, headline: f(A.setupHeadline), body: f(A.setupBody),
      steps: A.steps.map((st) => ({ ...st, title: cap(f(st.title)), body: cap(f(st.body)) })), before: A.before.map(f), after: A.after.map(f) },
    faq: { ...base.faq, items: [{ q: f(A.faqTop.q), a: f(A.faqTop.a) }, ...base.faq.items] },
  };
}

import base from "@/data/case-sneakers.json";
import type { CaseMix } from "@/lib/case-mix";

// The case study content for one reader: the generic page, or, with a platform mix, the same page told for those
// platforms (the "adaptive" texts in data/case-sneakers.json). The real client's results stay as they are, under a
// proof line that names its real stack.

type Base = typeof base;
type Named = { name: string; slug: string };
export type CaseContent = Omit<Base, "setup" | "adaptive"> & {
  setup: Omit<Base["setup"], "flowFrom" | "flowTo"> & { flowFrom: Named[]; flowTo: Named[] };
  proof: string | null;
};

const join = (xs: string[]) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// items with the reader's angles first (in their order), then the ones for everybody, then the rest; stable
function byAngle<T extends { angle: string }>(xs: T[], angle: string[], n: number): T[] {
  const rank = (x: T) => (angle.includes(x.angle) ? angle.indexOf(x.angle) : x.angle === "*" ? 50 : 100);
  return [...xs].sort((a, b) => rank(a) - rank(b)).slice(0, n);
}

export function adaptCase(mix: CaseMix | null): CaseContent {
  const { adaptive: A, ...cs } = base;
  const generic: CaseContent = { ...cs, proof: null };
  if (!mix) return generic;
  const sells = mix.platforms.filter((p) => p.kind === "sell"), systems = mix.platforms.filter((p) => p.kind === "system");
  if (!sells.length) return generic; // a sync needs somewhere to sell
  const w = mix.words, sys = systems[0]?.name ?? "your warehouse";
  const v: Record<string, string> = {
    all: join(mix.platforms.map((p) => p.name)),
    sells: join(sells.map((p) => p.name)),
    sellA: sells[0].name,
    sellB: (sells[1] ?? sells[0]).name,
    system: sys,
    System: cap(sys),
    systems: join(systems.length ? systems.map((p) => p.name) : ["your warehouse"]),
    item: w.item, items: w.items, Items: cap(w.items), variant: w.variant, variants: w.variants, Variants: cap(w.variants),
  };
  const f = (s: string) => s.replace(/\{(\w+)\}/g, (m, k: string) => v[k] ?? m);
  const named = (xs: { name: string; slug: string }[]) => xs.map(({ name, slug }) => ({ name, slug }));
  return {
    ...cs,
    seo: { title: f(A.seoTitle), description: f(A.seoDescription) },
    hero: { ...cs.hero, eyebrow: f(A.eyebrow), headline: f(A.headline), sub: f(A.sub),
      panel: { title: f(A.panelTitle), rows: A.panelRows.map((r) => ({ ...r, label: f(r.label) })) } },
    problem: { ...cs.problem, headline: f(A.problemHeadline), body: f(A.problemBody),
      items: byAngle(A.problemItems, mix.angle, 4).map(({ icon, title, body, tag }) => ({ icon, title: f(title), body: f(body), tag })) },
    setup: { ...cs.setup, headline: f(A.setupHeadline), body: f(A.setupBody),
      steps: A.steps.map((s) => ({ ...s, title: f(s.title), body: f(s.body) })), before: A.before.map(f), after: A.after.map(f),
      flowFrom: named(sells), flowTo: systems.length ? named(systems) : [{ name: "Your warehouse", slug: "warehouse" }] },
    fit: { ...cs.fit, headline: f(A.fitHeadline), items: byAngle(A.fitItems, mix.angle, 4).map((x) => f(x.text)) },
    faq: { ...cs.faq, items: [{ q: f(A.faqTop.q), a: f(A.faqTop.a) }, ...cs.faq.items] },
    proof: A.proof,
  };
}

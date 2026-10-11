// node --test lib/site-guard.test.mts
// The public pages (homepage, /pricing, nav, footer, legal pages) keep the site's hard rules:
// - no link to the email-only pages (/demo, /case-studies): they are reached from our emails only;
// - no competitor or connector-tool names (compare by category: "monthly apps", "DIY automation tools", "freelancers");
// - search basics: homepage title ≤ 60 and description ≤ 155 characters, legal pages linked in the footer and indexable,
//   the sitemap lists public pages only.
// New files in components/home and components/pricing are checked automatically.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";

const root = new URL("../", import.meta.url);
const read = (rel: string) => readFileSync(new URL(rel, root), "utf8");
const has = (rel: string) => existsSync(new URL(rel, root));
const dir = (rel: string) => (has(rel) ? readdirSync(new URL(`${rel}/`, root)).filter((f) => /\.(tsx?|json)$/.test(f)).map((f) => `${rel}/${f}`) : []);

const PUBLIC = [
  "data/site-content.json",
  "data/pricing.json",
  "app/page.tsx",
  "app/layout.tsx",
  "app/sitemap.ts",
  "app/pricing/page.tsx",
  "app/privacy/page.tsx",
  "app/terms/page.tsx",
  "components/Navbar.tsx",
  "components/Footer.tsx",
  "components/Contact.tsx",
  "components/ContactForm.tsx",
  "components/LegalPage.tsx",
  "components/Hero.tsx",
  "components/Integrations.tsx",
  "components/Process.tsx",
  "components/Faq.tsx",
  "lib/seo.ts",
  ...dir("components/home"),
  ...dir("components/pricing"),
].filter(has);

// Names from the rebuild brief (2026-10-11). Words that are also plain English ("Trunk", "Make", "Stock Sync") only
// count in their brand spelling.
const COMPETITORS: [string, RegExp][] = [
  ["ChannelEngine", /channel\s?engine/i],
  ["Sellbrite", /sellbrite/i],
  ["Linnworks", /linnworks/i],
  ["BaseLinker", /base\s?linker/i],
  ["Codisto", /codisto/i],
  ["Lengow", /lengow/i],
  ["Channable", /channable/i],
  ["Veeqo", /veeqo/i],
  ["Sumtracker", /sumtracker/i],
  ["Trunk", /\bTrunk\b/],
  ["Syncio", /syncio/i],
  ["Stock Sync", /\bStock Sync\b/],
  ["Copyt", /\bcopyt\b/i],
  ["ConsignR", /consignr/i],
  ["Zapier", /zapier/i],
  ["Make", /\bMake\.com\b|\bMake \(formerly|\bintegromat\b/i],
  ["Celigo", /celigo/i],
  ["n8n", /\bn8n\b/i],
  ["IFTTT", /\bifttt\b/i],
  ["Workato", /workato/i],
  ["Pabbly", /pabbly/i],
];

test("the public files exist (the guard reads the real pages)", () => {
  for (const f of ["data/site-content.json", "data/pricing.json", "app/page.tsx", "app/pricing/page.tsx", "components/Footer.tsx"]) {
    assert.ok(PUBLIC.includes(f), `${f} is missing`);
  }
});

test("no links to /demo or /case-studies on public pages", () => {
  // a path in quotes or backticks ("/demo…", '/case-studies…', `/demo…`) or a full coelor.com URL to one
  const link = /["'`]\/(?:demo|case-studies)\b|coelor\.com\/(?:demo|case-studies)\b/;
  for (const f of PUBLIC) {
    const src = read(f);
    const hit = src.split("\n").find((line) => link.test(line));
    assert.equal(hit, undefined, `${f} links to an email-only page: ${hit?.trim()}`);
  }
});

test("no competitor or connector-tool names on public pages", () => {
  for (const f of PUBLIC) {
    const src = read(f);
    for (const [name, re] of COMPETITORS) {
      const hit = src.split("\n").find((line) => re.test(line));
      assert.equal(hit, undefined, `${f} names ${name}: ${hit?.trim()}`);
    }
  }
});

test("homepage search basics: title ≤ 60, description ≤ 155", () => {
  const { seo } = JSON.parse(read("data/site-content.json"));
  assert.ok(seo.title.length <= 60, `seo.title is ${seo.title.length} characters`);
  assert.ok(seo.description.length <= 155, `seo.description is ${seo.description.length} characters`);
  assert.match(seo.title, /custom/i, "the title says custom");
});

test("footer: Privacy and Terms, the platform-names note; both pages exist and are indexable", () => {
  const { footer } = JSON.parse(read("data/site-content.json"));
  const hrefs = footer.legal.map((l: { href: string }) => l.href);
  assert.deepEqual(hrefs, ["/privacy", "/terms"]);
  assert.match(footer.note, /belong to their owners/);
  for (const page of ["app/privacy/page.tsx", "app/terms/page.tsx"]) {
    const src = read(page);
    assert.doesNotMatch(src, /index:\s*false/, `${page} must be indexable`);
    assert.match(src, /canonical/, `${page} has a canonical`);
  }
});

test("sitemap: public pages only", () => {
  const src = read("app/sitemap.ts");
  const paths = [...src.matchAll(/path:\s*"([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(paths, ["/", "/pricing", "/privacy", "/terms"]);
  assert.match(read("app/robots.ts"), /sitemap\.xml/);
});

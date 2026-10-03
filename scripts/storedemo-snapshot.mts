// node scripts/storedemo-snapshot.mts [slug]
// Saves each store demo's catalogue next to the page (public/storedemo/<slug>.json): the copy the demo shows when the
// store's Shopify API does not answer in the visitor's browser. Run it before a deploy now and then so the copy stays
// recent; the live store is always read first.
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { STORE_DEMOS } from "../lib/storedemo/configs.ts";
import { catalogOf, catalogQuery } from "../lib/storedemo/shopify.ts";

const only = process.argv[2];
const dir = path.join(process.cwd(), "public", "storedemo");
mkdirSync(dir, { recursive: true });

for (const c of STORE_DEMOS.filter((d) => !only || d.slug === only)) {
  const r = await fetch(`https://${c.store.domain}/api/2025-07/graphql.json`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json", "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36" },
    body: JSON.stringify({ query: catalogQuery(c) }),
  });
  if (!r.ok) throw new Error(`${c.slug}: store answered ${r.status}`);
  const cat = catalogOf(await r.json(), new Date().toISOString());
  if (cat.products.length < 12) throw new Error(`${c.slug}: only ${cat.products.length} products`);
  const file = path.join(dir, `${c.slug}.json`);
  writeFileSync(file, JSON.stringify(cat));
  const gone = cat.products.reduce((n, p) => n + p.variants.filter((v) => !v.available).length, 0);
  console.log(`${c.slug}: ${cat.products.length} products (${cat.products.filter((p) => p.best !== null).length} best sellers, ${gone} sold-out sizes) → ${path.relative(process.cwd(), file)}`);
}

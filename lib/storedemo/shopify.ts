// A store demo's catalogue, read from the store's public Shopify Storefront API (keyless; it answers CORS *, so the
// visitor's browser asks it directly, no server of ours in between). One request: the newest products and the store's
// best-seller collection, with sizes, colours, what can be sold now, price and photo. When the store does not answer,
// the demo reads the copy saved with the page (public/storedemo/<slug>.json, made by scripts/storedemo-snapshot.mts).
// Pure apart from fetch; no "@/" imports.
import type { Catalog, DemoConfig, Product, Variant } from "./types.ts";

const API = "2025-07";

const FIELDS = `id title vendor productType publishedAt
  priceRange { minVariantPrice { amount } }
  featuredImage { url(transform: { maxWidth: 480 }) }
  variants(first: 40) { nodes { availableForSale selectedOptions { name value } } }`;

export function catalogQuery(c: DemoConfig): string {
  const best = c.store.bestCollection
    ? `best: collection(handle: "${c.store.bestCollection}") { products(first: 40) { nodes { ${FIELDS} } } }`
    : "";
  return `{ newest: products(first: ${c.store.newest}, sortKey: CREATED_AT, reverse: true) { nodes { ${FIELDS} } } ${best} }`;
}

type Obj = Record<string, unknown>;
const obj = (v: unknown): Obj => (v && typeof v === "object" && !Array.isArray(v) ? (v as Obj) : {});
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const text = (v: unknown, max = 120) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "");

/** a short stable key for a Shopify id (FNV-1a) */
function key(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(36);
}

const titleCase = (s: string) => s.toLowerCase().replace(/(^|[\s-])([a-z])/g, (m) => m.toUpperCase());

// a shopper's categories, first match wins (the store's own types carry price bands and codes: "141 - Tops over $50")
const CATEGORIES: [RegExp, string][] = [
  [/romper|jumpsuit|overall/, "Rompers & Jumpsuits"],
  [/dress/, "Dresses"],
  [/skirt|skort/, "Skirts"],
  [/\bshorts?\b(?! sleeve)/, "Shorts"],
  [/jean|denim/, "Denim"],
  [/legging/, "Leggings"],
  [/pant|trouser|bottom|jogger/, "Pants"],
  [/sweatshirt|hoodie|crew neck|pullover hood/, "Sweatshirts"],
  [/sweater|cardigan|knit/, "Sweaters"],
  [/jacket|coat|blazer|shacket|vest/, "Jackets"],
  [/bodysuit|brami|\bbras?\b/, "Bodysuits"],
  [/boot|shoe|sandal|sneaker|heel|loafer/, "Shoes"],
  [/accessor|\bbag|\bhat\b|jewel|belt|scarf|earring|necklace/, "Accessories"],
  [/\bset\b/, "Sets"],
  [/top|tee|blouse|shirt|tunic|tank|cami/, "Tops"],
];

/** The store's product type as a shopper reads it: "141 - Tops over $50" → "Tops", "Dresses Between $50 - $70" → "Dresses". */
export function categoryOf(type: string, title: string): string {
  for (const src of [type, title]) {
    const t = src.toLowerCase();
    if (!t.trim()) continue;
    const hit = CATEGORIES.find(([re]) => re.test(t));
    if (hit) return hit[1];
  }
  return "Tops";
}

/** A brand as written on a tag: "SKYLAR ROSE" → "Skylar Rose"; a code-like vendor ("SM/T10681A") is not a brand. */
export function brandOf(vendor: string): string {
  const v = vendor.trim();
  if (!v || /\d{3,}|\//.test(v)) return "";
  return v === v.toUpperCase() ? titleCase(v) : v;
}

function variantsOf(p: Obj, pid: string): Variant[] {
  const out: Variant[] = [];
  for (const n of arr(obj(p.variants).nodes).map(obj)) {
    let color = "";
    let size = "";
    for (const o of arr(n.selectedOptions).map(obj)) {
      const name = text(o.name, 30).toLowerCase();
      const value = text(o.value, 30);
      if (/size/.test(name)) size = value;
      else if (/colou?r/.test(name)) color = value;
    }
    if (!size || /default title/i.test(size)) size = "One size";
    if (/default title/i.test(color)) color = "";
    out.push({ id: key(`${pid}|${color}|${size}`), color: titleCase(color), size, available: n.availableForSale === true });
  }
  return out;
}

function productOf(p: Obj, best: number | null): Product | null {
  const id = text(p.id, 80);
  const title = text(p.title, 90);
  const price = Number(obj(obj(p.priceRange).minVariantPrice).amount);
  const publishedAt = text(p.publishedAt, 40);
  if (!id || !title || !Number.isFinite(price) || price <= 0 || !Date.parse(publishedAt)) return null;
  const type = text(p.productType, 60);
  if (/gift\s*card|gift\s*cert/i.test(`${title} ${type}`)) return null;
  const pid = key(id);
  const variants = variantsOf(p, pid);
  if (!variants.length) return null;
  const image = text(obj(p.featuredImage).url, 400);
  return {
    id: pid,
    title,
    brand: brandOf(text(p.vendor, 60)),
    category: categoryOf(type, title),
    price: Math.round(price * 100) / 100,
    image: /^https:\/\/cdn\.shopify\.com\//.test(image) ? image : null,
    publishedAt: new Date(publishedAt).toISOString(),
    best,
    variants,
  };
}

/** The store's answer → the demo's catalogue: newest products and best sellers, once each, with a photo. */
export function catalogOf(raw: unknown, at: string): Catalog {
  const d = obj(obj(raw).data);
  const seen = new Map<string, Product>();
  arr(obj(obj(d.best).products).nodes).map(obj).forEach((p, i) => {
    const x = productOf(p, i);
    if (x && x.image) seen.set(x.id, x);
  });
  for (const p of arr(obj(d.newest).nodes).map(obj)) {
    const x = productOf(p, null);
    if (x && x.image && !seen.has(x.id)) seen.set(x.id, x);
  }
  return { products: [...seen.values()], at };
}

/** Asks the store (from the browser). Throws when it does not answer well, so the caller falls back to the copy. */
export async function fetchCatalog(c: DemoConfig, timeoutMs = 8000): Promise<Catalog> {
  const r = await fetch(`https://${c.store.domain}/api/${API}/graphql.json`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ query: catalogQuery(c) }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!r.ok) throw new Error(`store ${r.status}`);
  const cat = catalogOf(await r.json(), new Date().toISOString());
  if (cat.products.length < 12) throw new Error("store answered too few products");
  return cat;
}

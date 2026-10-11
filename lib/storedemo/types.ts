// The store demos (/demo/<slug>): a static page whose browser builds the shop's generated catalogue
// (lib/storedemo/catalog.ts) and shows the sync around it (sales channels, warehouse, shipping, returns), told by
// lib/storedemo/engine.ts. One config per demo (lib/storedemo/configs.ts). No "@/" imports here: node --test loads it.

/** One size/colour of a product, as the store shows it today (available = the store can sell it now). */
export type Variant = { id: string; color: string; size: string; available: boolean };

export type Product = {
  id: string;
  title: string;
  brand: string;
  category: string;
  price: number;
  /** the price before a markdown, when the piece is marked down */
  compareAt?: number;
  image: string | null;
  publishedAt: string;
  /** place on the store's best-seller list (0 = first), null when not on it */
  best: number | null;
  variants: Variant[];
};

export type Catalog = { products: Product[]; at: string };

/** A sales channel the demo shows. `rhythm`: a web store (steady, evening peak), live selling (show evenings) or a
 * marketplace (steady through the day). */
export type ChannelCfg = {
  id: string;
  name: string;
  /** a slug of data/platforms.json or a tool mark of components/demo/ui.tsx */
  logo: string;
  role: string;
  account: string;
  rhythm: "store" | "live" | "steady";
  /** orders on an ordinary day (live: outside the shows) */
  perDay: [number, number];
  /** live selling: the show days (0 = Sunday) and the orders of one show */
  showDays?: number[];
  perShow?: [number, number];
  /** share of the catalogue listed there (the web store lists everything) */
  listShare: number;
  /** order numbers as the channel writes them: the start of the number, masked on the page */
  refStart: number;
  every: string;
  /** the platform sends webhooks: an order reaches the stock count within seconds; else it is read every `pollMin` */
  realtime?: boolean;
  pollMin?: number;
  /** the channel buys the label itself (Poshmark's prepaid label): its words and the carrier (index in shipping.carriers) */
  label?: { service: string; carrier: number };
};

export type Carrier = { name: string; service: string; logo: string; share: number; days: [number, number] };
export type Tool = { name: string; logo: string; role: string };

export type DemoConfig = {
  slug: string;
  /** shown in the sidebar: "<label> · <goods>" */
  label: string;
  goods: string;
  /** the custom-build notice: whose build this is ("one women's boutique") and what it is made around */
  who: string;
  setup: string;
  /** the noun for one unit and many ("piece", "pieces") */
  item: string;
  items: string;
  /** the generated catalogue (lib/storedemo/catalog.ts): its seed, how many of the newest pieces it holds, how many best
   * sellers, the weekdays new pieces come out (0 = Sunday) and how many come out each time */
  catalog: { seed: string; newest: number; best: number; dropDays: number[]; perDrop: [number, number] };
  /** the time zone the shop works in (orders follow its day) */
  tz: string;
  /** local date the sync started (Y, M 1-12, D) */
  since: [number, number, number];
  stock: Tool & { detail: string };
  channels: ChannelCfg[];
  shipping: { tool: Tool; carriers: Carrier[]; cutoffHour: number };
  tracking: Tool;
  returns: Tool & { rate: number; reasons: string[] };
  restock: Tool & { weekday: number };
  sizes: Record<string, number>;
  /** other places a shop like this sells: the assistant refuses to post onto them (lib/storedemo/assistant.ts) */
  more: { slug: string; name: string; why: string }[];
  /** the team's sheets and chat (`on` = in the build): the assistant posts to the chat */
  tools: { slug: string; name: string; role: string; detail?: string; on?: boolean }[];
  caseHref: string;
  contactHref: string;
};

export type StepKind = "stock" | "label" | "shipped" | "delivered" | "return" | "restock" | "cancel" | "pulled" | "listed";
export type Step = { kind: StepKind; at: string; text: string };

export type Line = { productId: string; title: string; brand: string; color: string; size: string; price: number; image: string | null };

export type Order = {
  id: string;
  channel: string;
  ref: string;
  placedAt: string;
  state: string;
  shipTo: string;
  carrier: string;
  lines: Line[];
  total: number;
  steps: Step[];
};

/** Something the sync did that is not an order: a sold-out size pulled, a new product listed, a restock received. */
export type Happening = { id: string; kind: "pulled" | "listed" | "restock"; at: string; title: string; text: string; channel?: string; image?: string | null };

export type Page<T> = { rows: T[]; total: number; page: number; pages: number };

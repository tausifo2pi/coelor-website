# CLAUDE.md: coelor.com (website)

Coelor builds **custom ecommerce integrations** for online sellers: software made for their own platforms
(marketplaces, web store, warehouse/3PL, supplier files, team tools) and rules. $500 per connection, paid once, live in
about a day once we have access, free 7-day trial first, and the client owns the code. Umbrella line:
**"Built for how you sell. Paid once. Yours to keep."** A small team of engineers in Dhaka, Bangladesh.

Copy and positioning rules for every change: `lead-outreach/docs/website/REBUILD_BRIEF_2026-10-11.md` (user decisions,
plain US English, proof claims, what never goes on the site). The audit behind it: `AUDIT_2026-10-11.md` next to it.

## Stack

- Next.js 16 (App Router, `output: "standalone"`), React 19, TypeScript, Tailwind CSS 3.4. Fonts via `next/font`
  (Manrope, JetBrains Mono; self-hosted at build, nothing fetched at runtime). Icons: lucide-react, simple-icons.
- Mail: nodemailer over Spacemail SMTP (`EMAIL`, `EMAIL_PASSWORD`; `SMTP_HOST`/`SMTP_PORT` optional).
- No database. Tracking events are JSON lines in `$TRACK_DIR/events.jsonl` (`/data/track` in Docker).
- Node 24 locally (`~/.nvm/versions/node/v24.18.0`): it runs the `.mts` tests' TypeScript directly.

## Pages

| Route | What | Indexed | Linked from public pages |
|---|---|---|---|
| `/` | homepage (`app/page.tsx`, sections in `components/` + `components/home/`) | yes | yes |
| `/pricing` | pricing (`app/pricing/page.tsx`, `components/pricing/*`, copy `data/pricing.json`) | yes | yes |
| `/privacy`, `/terms` | plain-language legal pages (`components/LegalPage.tsx`) | yes | footer |
| `/demo`, `/demo/multi-platform-sync`, `/demo/[slug]` | live demos (email-only) | no | **never** |
| `/case-studies/*` | case studies (email-only, `components/CaseStudy.tsx`) | no | **never** |
| `/r/<token>`, `/o/<token>.gif`, `/u/<token>`, `/p/<token>` | email click, open pixel, unsubscribe, preview | no | no |
| `/api/contact`, `/api/t`, `/api/t/export`, `/api/u/*`, `/api/demo/*` | form, beacon, export for lead-outreach, unsubscribe, demo data | no | no |

## Where things live

- **Copy:** `data/site-content.json` (homepage, nav, contact form, footer, brand, seo), `data/pricing.json` (/pricing).
  Components read copy from these files, server-side; client components get it as props.
- **The offer:** `lib/offer.ts` is the single source of the numbers ($500 per connection, 3 for 2, the trial, the
  contact-form prefills). `lib/offer.test.mts` checks that the JSON copy agrees; change both in one commit.
- **SEO:** `lib/seo.ts` (social card `public/og.png`, `openGraph()` for a page, homepage metadata, JSON-LD:
  Organization + WebSite in `app/layout.tsx`, `serviceJsonLd()` for /pricing), `app/sitemap.ts` (public pages only),
  `app/robots.ts`. A page that sets `openGraph` replaces the layout's whole block: use `openGraph(title, desc, path)`.
  `public/og.png` (1200×630) was rendered once with `next/og` `ImageResponse` (bundled Geist font, the wordmark SVG,
  "Built for how you sell."); re-render it the same way if the line changes.
- **Contact form:** `components/Contact.tsx` (server) + `components/ContactForm.tsx` (client) + `app/api/contact/`
  (`route.ts`, email `template.ts`, `logo.ts`). Shared by the homepage, /pricing and the case studies: pages override
  only `num`/`headline`/`body` by props. Choice "Free 7-day trial" / "Price for my setup"; `?plan=trial|<n>` in the
  address and `[data-prefill]` on a link fill in the message and pick the choice. The endpoint has a spam-trap field,
  5 submits per 10 min per /24, 3 receipts per address a day, and the receipt never repeats the message.
- **Hero animation: `components/HeroScene.tsx` and `components/HeroPanels.tsx` are untouchable.** Only the `hero.feed`
  text in site-content.json may change (≤ 24 characters per title/detail, ≥ 5 events, unique ids, icons from
  `components/icons.tsx`).
- **Demos (email-only):** `lib/demo/*` + `components/demo/*` (sneaker reseller "Northvale Kicks",
  `/demo/multi-platform-sync`), `lib/storedemo/*` + `components/storedemo/*` (women's boutique "Fernhollow",
  `/demo/womens-boutique`; jewelry studio "Larkmoor", `/demo/jewellery-shop`: config `lib/storedemo/jewellery-config.ts`,
  its own catalogue `jewellery.ts` + art `jewellery-art.ts`, client `lib/demo/larkmoor.ts`, tiles and fields
  `components/storedemo/Larkmoor.tsx`; streetwear shop "Cinderlot", `/demo/streetwear-shop`: config
  `lib/storedemo/config-streetwear.ts`, its own catalogue `catalog-streetwear.ts` (weekly drops, dated sell-outs,
  one-of-a-kind pre-owned pieces) + art `art-streetwear.ts` + assistant routines `assistant-streetwear.ts`, client
  `lib/demo/client-streetwear.ts` + `lib/demo/streetwear.ts`, tiles and fields `components/demo/workspace/Streetwear.tsx`).
  Invented demo shops, every number generated in the browser; no client data, no third-party store's catalog, no
  "sample" badges. `instrumentation.ts` keeps the demo and case study warm on the small server.
- **Case studies (email-only):** `components/CaseStudy.tsx`, `lib/case-*.ts`, `data/case-*.json`.

## Hard rules

1. **Email-only pages stay email-only:** never link `/demo` or `/case-studies` from the homepage, /pricing, the nav,
   the footer or the legal pages. They are `noindex`; robots.txt disallows `/demo`. `lib/site-guard.test.mts` fails
   the build if a public file links them.
2. **No competitor or connector-tool names** anywhere on the site (ChannelEngine, Sellbrite, Linnworks, BaseLinker,
   Zapier, Make, …; full list in the brief and the guard test). Compare by category: "monthly apps", "DIY automation
   tools", "freelancers and agencies".
3. **The only client is anonymous:** "a reseller in the Netherlands with EU and US accounts on two resale marketplaces,
   connected to its warehouse system". Never put StockX/Alias/Picqer next to "Dutch"/"Netherlands". Claim only what that
   build really does (see the brief). No invented testimonials, logos or "clients" plural.
4. Platform logos mean "platforms we build for", not partnerships; the footer says "Platform names and logos belong to
   their owners. No endorsement implied."
5. Case pages: only the reader's own kind of platforms, no sneaker words for other goods, no store-versus-site pitch.

## Tracking (first-party, for the lead-outreach panel)

- `components/Tracker.tsx` (in the root layout) sends pageview, `section_view`, scroll depth, active time and every
  link/button click (`cta_click`) to `/api/t`. **Every `cta_click` is a push on the owner's phone.**
- Sections: each homepage/pricing section is a server-rendered `<section id>` inside `<main>`; ids unique across both
  pages (the panel merges equal ids).
- Put `data-track="off"` on controls that are not CTAs (menu toggle, logo-to-top, skip link, steppers, spam trap).
  The push label is the element's `aria-label`, else its text: keep labels short and human; where the same text appears
  twice, add where it sits (`"Free trial (nav)"`, `"Pricing (footer)"`) without changing the visible text.
- Trial and quote CTAs carry `data-prefill` (from `PREFILL` in lib/offer.ts) and point at `#contact`.
- Cookies: `cv` (random visitor id, 365 days) and `ct` (email token, 180 days), set only by `/r/<token>` (an email
  click). Normal visitors get no cookie. Only an IP prefix (/24 or /48) is stored. `/privacy` describes all of this:
  update it when tracking changes.
- Internal visits are filtered in lead-outreach, not here.

## Tests and checks

```bash
export PATH=~/.nvm/versions/node/v24.18.0/bin:$PATH
npx tsc --noEmit -p .   # types
npm test                # node --test lib/**/*.test.mts lib/*.test.mts (offer, demos, site guard)
```

`tsconfig.tsbuildinfo` is tracked but generated: never commit it. In git worktrees `node_modules` is a symlink to the
main checkout's: never commit it either. Stage files explicitly (`git add <files>`).

## Deploy

Push to `main` = deploy. GitHub Actions (`.github/workflows/ci.yml`): **test** (npm ci, tsc, npm test) → **build**
(Docker image to Docker Hub) → **deploy** (writes the runtime env from the `WEBSITE_ENV` secret to the EC2 server,
`docker-compose pull && up`) → **cleanup**. A red test stops the deploy. The server: one EC2 instance in Frankfurt
(eu-central-1, `infra/`, Pulumi), nginx in front (`infra/server/nginx.conf`, TLS, `X-Real-IP`), the lead-outreach
container next to it on the same Docker network. Secrets: `cd infra && npm run push-secrets` (never in the image).
Only deploy when the user says so.

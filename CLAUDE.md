# CLAUDE.md — Coelor Website

## Project Overview

Coelor is a software services company. The name is derived from Coelophysis, a small, fast, agile prehistoric predator. The website is a single-page Next.js application that serves as the company's primary web presence. The site must be a benchmark in modern web design — not a typical dark tech template.

**Tagline:** "Agile by Nature."
**Subtitle:** "Software that evolves with your ambition."
**Site type:** Single-page app with smooth scroll navigation between sections
**Framework:** Next.js (App Router)

---

## Brand Narrative — "Digital Fossil"

The entire site follows an excavation and discovery narrative. The user scrolls and uncovers layers — like digging through geological strata to reveal advanced technology buried within ancient rock. Each section is a "layer" with its own color zone, and transitions between them are smooth and continuous, never hard section breaks.

This narrative is expressed subtly through:
- Color zone shifts as the user scrolls (like descending through rock)
- Faint topographic/geological textures in backgrounds
- Horizontal stratum lines in the services section
- The particle Coelophysis as the "discovered specimen" — technology emerging from nature

---

## Color System

The page is NOT one flat dark color. It shifts subtly per zone.

```
Zone 1 — Hero:       Background #07070d (near-black)         Accent #00ffb4 (cyber green)
Zone 2 — Services:   Background #0a1118 (deep teal-black)    Accent #ffb347 (warm amber)
Zone 3 — About:      Background #0d0f14 (dark slate)         Accent #ffffff (ice white)
Zone 4 — Stats:      Background #07070d (back to obsidian)   Accent #00ffb4 (green returns)
Zone 5 — Contact:    Background #07070d                      Accent #00ffb4
Zone 6 — Footer:     Background #050508                      Accent #00ffb4
```

### Utility Colors
```
Text primary:      #e8e8e8 (off-white)
Text secondary:    #7a7a8a (muted gray)
Text faded:        rgba(255,255,255,0.06) — used for oversized background numbers
Card/surface:      rgba(255,255,255,0.02) with 1px border rgba(255,255,255,0.06)
Green glow:        rgba(0,255,180,0.4) — for drop-shadows and glows
Amber glow:        rgba(255,179,71,0.4) — for service number glows
```

### Gradients
- Primary gradient: `linear-gradient(135deg, #00ffb4, #00c8ff)` — used on logo, CTA button, footer line
- Stat bar gradient: `linear-gradient(90deg, #00ffb4, #00c8ff)`
- Zone transitions: Use CSS scroll-driven animations or IntersectionObserver to smoothly interpolate background-color between zones. No hard cuts.

---

## Typography

Three fonts, three roles. No exceptions.

### 1. Clash Display (Display / Headlines)
- **Source:** https://fonts.cdnfonts.com/css/clash-display or Fontshare
- **Usage:** Hero tagline, section headlines, stat numbers, about statement
- **Weight:** 700 (Bold)
- **Sizes:**
  - Hero tagline: 80px desktop / 40px mobile
  - Section headlines: 48–56px desktop / 28–32px mobile
  - Stat numbers: 120px desktop / 64px mobile
  - About statement: 48px desktop / 28px mobile
- **Style notes:** Tight letter-spacing (-0.02em). Angular, aggressive, geometric. This font has teeth.

### 2. Switzer (Body / Reading)
- **Source:** Fontshare
- **Usage:** Descriptions, about paragraph, form labels readable text
- **Weight:** 400 (Regular), 500 (Medium for emphasis)
- **Size:** 16–18px body, 14px small text
- **Line-height:** 1.6 for body text
- **Style notes:** Humanist, warm, excellent dark-background readability.

### 3. JetBrains Mono (Monospaced / Interface)
- **Source:** Google Fonts
- **Usage:** Navigation links, stat labels, section spine labels, form field labels, footer text, micro UI elements
- **Weight:** 400
- **Size:** 12–14px, always ALL CAPS
- **Letter-spacing:** 0.1em
- **Style notes:** Technical, precise. Gives "system interface" feel to small UI elements.

---

## Sections — Detailed Specification

### Section 1: HERO — "The Emergence"

**Layout:** Full viewport (100vh), no traditional split layout. The dinosaur dominates.

**Background:**
- Base color: #07070d
- Slow-moving grid pattern (60px cells, rgba(0,255,180,0.03) lines, animating diagonally at ~20s loop)
- Two large soft radial gradient orbs floating gently (green and blue, heavily blurred, ~5-6% opacity)

**Coelophysis Particle Animation (centerpiece):**
- 300+ small particles (2–3px circles) with green glow (#00ffb4, opacity 0.6–1.0 varying)
- Connected by thin translucent lines (rgba(0,200,255,0.15), 0.5px width) when particles are within proximity threshold
- The particles form the silhouette of a running Coelophysis — side profile, mid-stride, tail extended back, head forward
- **Load animation:** Particles start scattered randomly across the full viewport like stars. Over 3 seconds, they converge and assemble into the dinosaur shape using eased interpolation (cubic-bezier(0.22, 1, 0.36, 1))
- **Idle animation:** Once assembled, particles have subtle drift (±2px random movement, 3–5s loop per particle) so the shape breathes and feels alive. Lines reconnect dynamically based on proximity.
- **Implementation:** Use HTML Canvas or Three.js for performance. Each particle is an object with: startX, startY (random), targetX, targetY (dinosaur shape coordinate), currentX, currentY.
- The dinosaur shape coordinates should be predefined as a point cloud dataset representing the Coelophysis silhouette. Approximately 300 points distributed along the outline and key internal features (spine, legs, tail, jaw).
- Canvas should be full viewport, positioned absolute behind the text content.

**Text content (overlaid on top of the particle animation):**
- "Agile by Nature." — Clash Display, 80px, weight 700, color #e8e8e8
- The text should be **partially masked behind the dinosaur**. The dinosaur runs "in front of" the text, creating depth. Implementation: render text on a layer, render dinosaur particles on a layer above, so particles visually overlap portions of the text. Alternatively, use CSS mix-blend-mode or canvas compositing.
- Subtitle below tagline: "Software that evolves with your ambition." — Switzer, 18px, color #7a7a8a, fades in 0.5s after tagline
- CTA: Not a traditional button. Text link style: "Explore what we build →" — JetBrains Mono, 14px, uppercase, color #00ffb4. The arrow (→) slides 8px right on hover with 0.3s ease transition. On click, smooth scrolls to Services section.

**Text entrance animation:**
- Tagline: Slides up 30px + fades in, 0.6s duration, 0.5s delay after page load (after particles begin converging)
- Subtitle: Same animation, 0.3s delay after tagline
- CTA: Same animation, 0.3s delay after subtitle
- Easing: cubic-bezier(0.22, 1, 0.36, 1) for all

**Navbar:**
- NOT visible in the hero. The hero is an immersive full-screen moment with zero chrome.
- Navbar fades in (opacity 0→1, translateY -10px→0, 0.3s ease) only after the user scrolls past the hero section (use IntersectionObserver on the hero element).
- Once visible, navbar is fixed to top, height 64px, background rgba(7,7,13,0.8) with backdrop-filter: blur(16px).
- Left: Logo mark (geometric Coelophysis icon as SVG, ~28px) + "COELOR" in JetBrains Mono, 14px, uppercase, letter-spacing 0.15em, color #e8e8e8.
- Right: Nav links — HOME, SERVICES, ABOUT, STATS, CONTACT — JetBrains Mono, 12px, uppercase, letter-spacing 0.1em, color #7a7a8a. On hover: color transitions to #00ffb4, 0.2s ease. Active section link is #00ffb4.
- Bottom border: 1px solid rgba(255,255,255,0.06)
- On mobile: Hamburger menu icon (three horizontal lines, green). Opens a full-screen overlay with nav links centered vertically.

**Scroll indicator:**
- Positioned bottom center of hero, 32px from bottom
- A thin vertical line (1px, 24px tall, #7a7a8a) with a small dot that animates downward repeatedly (1.5s loop, ease-in-out). Fades out when user begins scrolling.

---

### Section 2: SERVICES — "Excavation Layer"

**Layout:** No card grid. Each service is a full-width horizontal strip, stacked vertically. Total 4 strips.

**Background:** Smooth transition from #07070d to #0a1118 (deep teal-black) as this section enters view.

**Per-service strip structure:**
```
|  01  |  Service Title                    |  Description text here,         |
|      |                                    |  two lines max.                 |
```

- **Number:** Clash Display, 120px, color rgba(255,179,71,0.12) (faded amber). Positioned left side. The number has a subtle amber glow on scroll-reveal: text-shadow 0 0 40px rgba(255,179,71,0.15).
- **Title:** Clash Display, 48px, weight 700, color #e8e8e8. Positioned center-left.
- **Description:** Switzer, 16px, weight 400, color #7a7a8a. Positioned right side, max-width 400px.
- **Stratum line:** Below each strip, a thin horizontal line (1px, color rgba(255,255,255,0.06)) that **draws itself** from left to right (width 0% → 100%) over 0.8s when the strip enters viewport. Use CSS animation with IntersectionObserver trigger.

**The 4 services:**
```
01 — AI-Powered Automation
    Building intelligent systems that automate repetitive business workflows, from customer support bots to order processing pipelines.

02 — Custom Software Solutions
    End-to-end software built around your specific business needs, not off-the-shelf compromises.

03 — System Integration
    Connecting your existing tools, platforms, and data sources into one seamless ecosystem that actually talks to each other.

04 — Cloud Infrastructure & Scaling
    Architecting systems that handle growth effortlessly — from startup traffic to enterprise-level demand.
```

**Entrance animation per strip:**
- Horizontal wipe reveal: content slides in from left, 0.6s, staggered 0.15s between strips
- NOT typical fade-up. Use clip-path or transform translateX(-40px) → 0 with opacity.
- Triggered by IntersectionObserver (threshold 0.3)

**Section label:**
- "SERVICES" written vertically along the left edge, rotated -90deg, JetBrains Mono, 11px, uppercase, letter-spacing 0.15em, color rgba(255,255,255,0.08). Position: sticky within the section so it stays visible while scrolling through services.

---

### Section 3: ABOUT — "The Core"

**Layout:** Full-width, generous vertical padding (120px top/bottom desktop).

**Background:** Transitions to #0d0f14 (dark slate). A very faint topographic map / contour line pattern in the background at 3% opacity. The pattern should be SVG-based — concentric irregular curved lines suggesting geological terrain maps.

**Content:**
- **Hero statement:** One powerful sentence in Clash Display, 48px, weight 700, color #e8e8e8, spanning full width (max-width 900px, centered):
  *"We don't build software. We engineer unfair advantages."*
- **Body paragraph:** Below, in Switzer, 18px, weight 400, color #7a7a8a, max-width 640px, centered, line-height 1.7:
  *"Coelor was born from a simple belief: technology should be a predator, not prey. We build lean, fast systems designed to outlast and outperform — because in the digital era, agility isn't a luxury. It's survival."*

**Section spine label:**
- "ABOUT" written vertically on the left edge, rotated -90deg, JetBrains Mono, 11px, uppercase, letter-spacing 0.15em, color rgba(255,255,255,0.08).

**Entrance animation:**
- Hero statement: Each word fades in sequentially, 0.08s per word, creating a typewriter-like reveal but with opacity (not cursor). Total ~1s for the full sentence.
- Body paragraph: Fades up (translateY 20px → 0, opacity 0 → 1), 0.6s, 0.3s delay after statement completes.

---

### Section 4: STATS — "Proof Layer"

**Layout:** Three stats stacked vertically, each taking ~200px vertical space. Centered. NOT a horizontal row.

**Background:** Transitions back to #07070d. Green accent returns.

**Per-stat structure:**
```
100+
━━━━━━━━━━━━━━━━━━ (progress bar fills to proportional width)
PROJECTS DELIVERED
```

- **Number:** Clash Display, 120px desktop / 64px mobile, weight 700, color #e8e8e8.
  - Animated count-up from 0 to target value when scrolled into view.
  - Duration: 2s, easing: cubic-bezier(0.22, 1, 0.36, 1) (fast start, smooth end).
  - Each stat triggers independently when IT enters the viewport, not all at once.

- **Progress bar:** Below the number, a horizontal bar, height 3px, border-radius 2px.
  - Background track: rgba(255,255,255,0.06)
  - Fill: linear-gradient(90deg, #00ffb4, #00c8ff)
  - Fill animates from width 0% to target width over 1.5s, 0.3s delay after counter starts.
  - Target widths: 100+ → 80% width, 20 → 40% width, 95% → 95% width (proportional visual representation).

- **Label:** JetBrains Mono, 12px, uppercase, letter-spacing 0.12em, color #7a7a8a. Below the bar, 12px gap.

**The 3 stats:**
```
100+    PROJECTS DELIVERED
20      COUNTRIES SERVED
95%     SATISFACTION RATE
```

**Section spine label:**
- "PROOF" written vertically on the left edge, same style as other spines.

---

### Section 5: CONTACT — "Signal"

**Layout:** Centered, max-width 560px. Generous padding.

**Background:** Remains #07070d.

**Headline:** "Ready to evolve?" — Clash Display, 48px, weight 700, color #e8e8e8, centered.

**Form fields (3, stacked vertically, 24px gap):**
- **Name** / **Email** / **Message** (textarea, 4 rows)
- **Rest state:** No visible borders. Only a bottom line (1px solid rgba(255,255,255,0.1)). Background transparent.
- **Label:** JetBrains Mono, 11px, uppercase, letter-spacing 0.1em, color #7a7a8a. Positioned above the field.
- **Input text:** Switzer, 16px, color #e8e8e8.
- **Focus state:** Bottom line transitions to #00ffb4 (0.3s ease), and a subtle green glow appears: box-shadow 0 2px 12px rgba(0,255,180,0.1). Label color transitions to #00ffb4.
- **Placeholder text:** color #3a3a4a

**Submit button:**
- Text: "Send Message" — JetBrains Mono, 14px, uppercase, letter-spacing 0.08em
- Rest: background #00ffb4, color #07070d (dark text on green), padding 16px 40px, border-radius 6px, no border.
- Hover: background transparent, color #00ffb4, border 1px solid #00ffb4. Transition 0.3s ease.
- Width: auto, centered.

**Fallback line:**
- Below button, 24px gap: "Or reach us at hello@coelor.com" — Switzer, 14px, color #7a7a8a. Email is color #00ffb4, underline on hover.

**Entrance animation:**
- Headline fades up, then form fields stagger in (0.1s delay each), then button fades in last.

---

### Section 6: FOOTER — "Bedrock"

**Layout:** Full width, padding 32px vertical.

**Background:** #050508

**Top border:** 1px line with gradient: linear-gradient(90deg, transparent, #00ffb4, transparent) — creates a centered glow fade.

**Content:**
- Left: "© 2026 Coelor" — JetBrains Mono, 12px, color #7a7a8a
- Right: 2–3 social icons (GitHub, LinkedIn, Twitter/X) — 18px, color #7a7a8a, hover color #00ffb4, transition 0.2s. Use simple SVG icons, not a library.

**No fat footer. Clean ending.**

---

## Background & Atmosphere Details

### Moving Grid (Hero background layer)
- CSS background-image: two sets of 1px lines forming 60px grid cells
- Line color: rgba(0,255,180,0.03)
- Animation: translateX and translateY shifting by one cell (60px) over 20s, linear, infinite loop
- Creates a subtle "data flowing" feeling

### Floating Gradient Orbs (Hero background layer)
- Two radial gradient circles, positioned absolute
- Orb 1: ~500px diameter, rgba(0,255,180,0.05), positioned top-right area, blur 80px, floating animation (translate ±40px over 12s ease-in-out)
- Orb 2: ~400px diameter, rgba(0,200,255,0.04), positioned bottom-left area, blur 80px, floating animation (translate ±30px over 15s ease-in-out, offset phase)
- Both behind all content (z-index 0)

### Topographic Pattern (About section)
- SVG pattern of concentric irregular curved lines
- Stroke: rgba(255,255,255,0.03), stroke-width 0.5px, no fill
- Covers the full about section background
- Parallax: scrolls at 0.5x speed relative to content

### Grain Texture (Global)
- A subtle film grain overlay across the entire page
- Implementation: CSS pseudo-element with a tiny noise texture (base64 PNG, ~100x100px) tiled, opacity 0.03
- mix-blend-mode: overlay
- Adds analog warmth to the digital dark theme

---

## Scroll Behavior

- All navigation uses smooth scrolling with easing (CSS scroll-behavior: smooth or JS with custom easing)
- Zone background color transitions should use IntersectionObserver on each section, interpolating the body/main background-color smoothly as sections enter/exit
- Parallax layers: grain texture at 0.5x, content at 1x (use CSS transform: translateZ for GPU acceleration or a lightweight parallax library)
- No scroll hijacking. No horizontal scroll takeovers. Natural scroll speed, enhanced visually.

---

## Responsive Breakpoints

```
Desktop:  1200px+    — Full experience, all animations
Tablet:   768–1199px — Reduce particle count to 200, scale down typography, stack service strips differently
Mobile:   <768px     — Particle count 120, hero tagline 40px, service strips fully stacked (number above title above description), stats numbers 64px, single column everything, hamburger nav
```

### Mobile-specific adjustments:
- Particle Coelophysis should be smaller and positioned above the text (vertical stack) instead of overlapping
- Service strips: number, title, description all stacked vertically per service
- Stats: keep vertical stack, works naturally
- Contact form: full width with 16px horizontal padding
- Reduce all vertical paddings by ~40%
- Disable parallax on mobile for performance

---

## Logo Mark

A geometric SVG icon inspired by the Coelophysis silhouette. Abstract and angular:
- Formed by 2–3 sharp triangular shapes suggesting a head/jaw and body in motion
- Uses the primary gradient (green to blue) as fill
- Works at small sizes (28px in navbar) and as a favicon
- Should feel like a speed/motion mark — think angular, forward-leaning geometry

---

## Performance Requirements

- Target: Lighthouse score 90+ across all categories
- Canvas/Three.js particle system should run at 60fps. Use requestAnimationFrame. Reduce particle count on low-end devices (check navigator.hardwareConcurrency or use matchMedia for prefers-reduced-motion).
- Lazy load all sections below the fold
- Fonts: Preload Clash Display and Switzer (critical path). Load JetBrains Mono async.
- Images: None required (fully CSS/SVG/Canvas driven). The only image asset is the grain texture (tiny, base64 inlined).
- Use next/font for font optimization if available in Next.js
- IntersectionObserver for all scroll-triggered animations (no scroll event listeners)

---

## Tech Stack

- **Framework:** Next.js (App Router, React 18+)
- **Styling:** CSS Modules or Tailwind CSS — developer's choice, but must implement the exact design tokens above
- **Animation:** CSS animations for simple transitions. Framer Motion for scroll-triggered reveals and staggered entrances. Canvas API or Three.js for the particle Coelophysis.
- **Fonts:** Self-hosted or via Fontshare CDN (Clash Display, Switzer) + Google Fonts (JetBrains Mono)
- **No component libraries.** No Material UI, no Chakra, no shadcn. Everything is custom to maintain the unique aesthetic.
- **Deployment:** Vercel (recommended for Next.js)

---

## File Structure (suggested)

```
coelor/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   └── fonts/
│       ├── ClashDisplay-Bold.woff2
│       └── Switzer-Regular.woff2
├── components/
│   ├── Navbar.tsx
│   ├── Hero.tsx
│   ├── ParticleCoelophysis.tsx    ← Canvas-based particle animation
│   ├── Services.tsx
│   ├── About.tsx
│   ├── Stats.tsx
│   ├── Contact.tsx
│   ├── Footer.tsx
│   ├── ScrollIndicator.tsx
│   └── SectionSpine.tsx           ← Reusable vertical label component
├── hooks/
│   ├── useInView.ts               ← IntersectionObserver hook
│   ├── useCountUp.ts              ← Counter animation hook
│   └── useScrollProgress.ts       ← Scroll position tracking
├── data/
│   └── coelophysis-points.json    ← 300 point cloud coordinates for the dinosaur shape
├── public/
│   └── favicon.svg
├── next.config.js
├── tailwind.config.js (if using Tailwind)
├── package.json
└── CLAUDE.md                       ← This file
```

---

## Key Implementation Notes

1. **Particle Coelophysis is the #1 priority.** If this doesn't look stunning, the whole site fails. Spend the most effort here. The point cloud data must produce a clearly recognizable running dinosaur silhouette.

2. **Color zone transitions are #2 priority.** The smooth background shifts as the user scrolls are what make this feel like one continuous experience rather than a stack of sections.

3. **Typography discipline is critical.** Three fonts only. Never mix up their roles. Clash Display never appears at body size. Switzer never appears in headlines. JetBrains Mono only for small UI/labels.

4. **The amber accent in Services is intentional.** It breaks the green monotony and creates a visual "warm layer" in the middle of the page. Do not replace it with green.

5. **No generic patterns.** No card grids, no icon circles, no gradient border cards, no "floating mockup" images. Every element is custom-designed for this specific site.

6. **The site should feel like one continuous descent** — not 6 separate blocks stacked on top of each other. Smooth transitions, no hard edges between sections.

---

## Content Summary

**Company:** Coelor
**Tagline:** Agile by Nature.
**Subtitle:** Software that evolves with your ambition.
**About statement:** "We don't build software. We engineer unfair advantages."
**About body:** "Coelor was born from a simple belief: technology should be a predator, not prey. We build lean, fast systems designed to outlast and outperform — because in the digital era, agility isn't a luxury. It's survival."
**Contact headline:** "Ready to evolve?"
**Contact email:** hello@coelor.com

**Services:**
1. AI-Powered Automation — Building intelligent systems that automate repetitive business workflows, from customer support bots to order processing pipelines.
2. Custom Software Solutions — End-to-end software built around your specific business needs, not off-the-shelf compromises.
3. System Integration — Connecting your existing tools, platforms, and data sources into one seamless ecosystem that actually talks to each other.
4. Cloud Infrastructure & Scaling — Architecting systems that handle growth effortlessly — from startup traffic to enterprise-level demand.

**Stats:**
- 100+ Projects Delivered
- 20 Countries Served
- 95% Satisfaction Rate

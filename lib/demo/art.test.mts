// node --test lib/demo/art.test.mts
// The product drawings (lib/demo/art.ts) and the catalogue they are drawn for (lib/demo/catalog.ts): a data URL that
// loads nothing from another site, no text, the colourway's colours, one of five shapes; and a catalogue of real
// models a reseller holds, the recent releases weighted, no Yeezy.
import { test } from "node:test";
import assert from "node:assert/strict";
import { colourOf, light, paletteOf, sneakerArt, sneakerSvg } from "./art.ts";
import { MODELS, RUNS, aliasName, priceOf, shapeOf } from "./catalog.ts";

const svgOf = (url: string) => decodeURIComponent(url.replace(/^data:image\/svg\+xml,/, ""));

test("a drawing is an SVG data URL with no text, no links and nothing to load", () => {
  for (const m of MODELS) {
    const url = sneakerArt(m.shape, m.color, m.name);
    assert.match(url, /^data:image\/svg\+xml,%3Csvg/);
    const svg = svgOf(url);
    assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" width="120" height="80" viewBox="0 0 120 80">.*<\/svg>$/);
    // the namespace is a name, not an address that is fetched; nothing else may point anywhere
    assert.ok(!/https?:\/\//.test(svg.replace('xmlns="http://www.w3.org/2000/svg"', "")), m.name);
    assert.ok(!/<(text|image|use|a|script|foreignObject)\b|href|url\(/i.test(svg), m.name);
    assert.ok(url.length < 4000, `${m.name}: ${url.length} characters`);
    assert.equal(url, sneakerArt(m.shape, m.color, m.name), "the same model draws the same");
  }
});

test("colours come from the colourway: the body, the panels and the sole", () => {
  const bred = paletteOf("Black/Fire Red");
  assert.ok(light(bred.base) < 0.2 && bred.accent === colourOf("Fire Red"));
  const panda = paletteOf("White/Black");
  assert.equal(panda.base, "#ffffff");
  assert.ok(light(panda.accent) < 0.2);
  assert.equal(paletteOf("Core Black/Gum").sole, colourOf("gum light brown"));
  assert.equal(paletteOf("Sail/Dark Mocha").sole, colourOf("sail"));
  assert.ok(light(paletteOf("Black").sole) < 0.3, "an all-black pair has a black sole");
  // one colour only: the panels a shade of it; nothing known: a neutral grey
  const grey = paletteOf("Grey");
  assert.notEqual(grey.accent, grey.base);
  assert.match(paletteOf("Unheard Of/Colours").base, /^#[0-9a-f]{6}$/);
  // every colourway in the catalogue reads at least one colour
  for (const m of MODELS) assert.ok(m.color.split("/").some((p) => colourOf(p)), `${m.name}: ${m.color}`);
});

test("five shapes, each a distinct drawing", () => {
  const p = paletteOf("White/Black");
  const shapes = ["low", "mid", "high", "runner", "slide"] as const;
  assert.equal(new Set(shapes.map((s) => sneakerSvg(s, p))).size, 5);
  assert.equal(shapeOf("Jordan 1 Retro High OG Taxi"), "high");
  assert.equal(shapeOf("Jordan 4 Retro Military Black"), "mid");
  assert.equal(shapeOf("Jordan 1 Retro Low OG Mocha"), "low");
  assert.equal(shapeOf("New Balance 9060 Rain Cloud Grey"), "runner");
  assert.equal(shapeOf("Nike Calm Slide Black"), "slide");
  for (const s of shapes) assert.ok(MODELS.some((m) => m.shape === s), s);
});

test("the catalogue: 250–400 real models, unique style codes, recent releases weighted, no Yeezy", () => {
  assert.ok(MODELS.length >= 250 && MODELS.length <= 400, `${MODELS.length} models`);
  assert.equal(new Set(MODELS.map((m) => m.style)).size, MODELS.length);
  assert.ok(!MODELS.some((m) => /yeezy/i.test(m.name)));
  const recent = MODELS.filter((m) => m.rel >= Date.UTC(2025, 0, 1));
  assert.ok(recent.length / MODELS.length > 0.25, `${recent.length} from 2025–2026`);
  assert.ok(MODELS.every((m) => m.rel < Date.UTC(2026, 9, 1)), "nothing that hasn't come out yet");
  for (const family of [/^Jordan 1 Retro High/, /^Jordan 4 /, /^Jordan 11 /, /^Nike Dunk Low/, /^Nike SB Dunk/, /^Nike Air Max (1|90|95|Plus)/, /^New Balance (550|990|2002R|9060|1906)/,
    /^adidas (Samba|Gazelle|Campus)/, /^ASICS Gel-(1130|Kayano 14|NYC)/, /^Salomon XT-6/, /^Nike Mind 001/, /^Nike Zoom Vomero 5/]) {
    assert.ok(MODELS.some((m) => family.test(m.name)), `${family}`);
  }
  for (const m of MODELS) {
    assert.match(m.style, /^[A-Z0-9]+(-[A-Z0-9]+)?$/, m.name);
    assert.ok(m.hype >= 1 && m.hype <= 5);
    // women's and kids' models in their own size runs
    if (/\(Women's\)$/.test(m.name)) assert.equal(m.run, "w", m.name);
    if (/\(GS\)$/.test(m.name)) assert.equal(m.run, "gs", m.name);
    assert.equal(m.sizes.length, RUNS[m.run].sizes.length);
    for (const s of m.sizes) assert.equal(s.code, `${m.style}-${s.eu}`);
    const lo = Math.min(...m.sizes.map((_, i) => priceOf(m, i)));
    const hi = Math.max(...m.sizes.map((_, i) => priceOf(m, i)));
    assert.ok(lo >= 50 && hi <= 1700 && hi >= lo, `${m.name}: €${lo}–${hi}`);
  }
  const variants = MODELS.reduce((n, m) => n + m.sizes.length, 0);
  assert.ok(variants > 3500 && variants < 6000, `${variants} sizes`);
});

test("Alias names: the slug made readable, as the Alias pages show them", () => {
  assert.equal(aliasName("Jordan 4 Retro Bred Reimagined"), "Air Jordan 4 Retro Bred Reimagined");
  assert.equal(aliasName("Jordan 4 Retro Frozen Moments (Women's)"), "Wmns Air Jordan 4 Retro Frozen Moments");
  assert.equal(aliasName("Nike Dunk Low Retro White Black Panda (GS)"), "Dunk Low Retro White Black Panda Gs");
  assert.equal(aliasName("adidas Samba OG Cloud White Core Black"), "Adidas Samba Og Cloud White Core Black");
});

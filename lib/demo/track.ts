// Tracking for the live demo (/demo/multi-platform-sync), next to the site-wide Tracker (which still sends the
// pageview, scroll depth and time on page; it skips clicks inside the demo, see data-track="off"). Events go to /api/t
// like the Tracker's, so a visitor who came through an email link is tied to their lead by the cookie.
//   demo_view     a section opened (value = section; meta.n = its place in the visit; the first one also has
//                 meta.src / vp / touch: where the visitor came from and on what)
//   demo_dwell    active time in a section, cumulative per page load (value = "section:seconds"; meta.scroll = max %)
//                 active = the tab is visible and there was input in the last 30 s
//   demo_action   filter, store, search, page, product opened, refresh, a locked button (value = "action:target")
//   demo_connect  "Connect" on a platform that is not connected (value = platform slug; meta.n = clicks on it)
//   demo_cta      "Get this for your store", back to the case study (value = which)
//   demo_error    live data did not load (value = which view)

type Meta = Record<string, string | number | boolean>;
type Ev = { type: string; path: string; value?: string; label?: string; meta?: Meta };

export type DemoTracker = {
  view: (section: string) => void;
  action: (what: string, target?: string) => void;
  connect: (slug: string) => void;
  cta: (which: string, label?: string) => void;
  error: (what: string) => void;
  stop: () => void;
};

const ENDPOINT = "/api/t";
const IDLE_MS = 30_000;

export function startDemoTracker(first: string): DemoTracker {
  const page = Math.random().toString(36).slice(2, 12);
  const path = location.pathname;
  const bot = navigator.webdriver === true;
  let queue: Ev[] = [];

  const flush = () => {
    if (!queue.length) return;
    const body = JSON.stringify({ page, bot, events: queue.splice(0, 20) });
    if (!navigator.sendBeacon?.(ENDPOINT, new Blob([body], { type: "text/plain" }))) {
      fetch(ENDPOINT, { method: "POST", body, keepalive: true }).catch(() => {});
    }
  };
  const push = (e: Omit<Ev, "path">, now = false) => {
    queue.push({ path, ...e });
    if (now || queue.length >= 10) flush();
  };

  // where the visitor came from and on what (sent once, with the first section)
  const q = new URLSearchParams(location.search);
  const ref = document.referrer;
  const src = (q.get("src") ?? (ref.includes("/case-studies/") ? "case" : ref ? "link" : "direct")).slice(0, 20);
  const vp = innerWidth < 640 ? "phone" : innerWidth < 1024 ? "tablet" : "desk";
  const touch = matchMedia("(pointer: coarse)").matches;

  // active time per section
  let current = first;
  let n = 0;
  let lastInput = Date.now();
  const active = new Map<string, number>();
  const reported = new Map<string, number>();
  const scroll = new Map<string, number>();
  const tick = window.setInterval(() => {
    if (document.visibilityState === "visible" && Date.now() - lastInput < IDLE_MS) active.set(current, (active.get(current) ?? 0) + 1);
  }, 1000);
  const onInput = () => {
    lastInput = Date.now();
  };
  const onScroll = () => {
    onInput();
    const max = document.documentElement.scrollHeight - innerHeight;
    const pct = max <= 0 ? 100 : Math.min(100, Math.round((scrollY / max) * 100));
    if (pct > (scroll.get(current) ?? 0)) scroll.set(current, pct);
  };
  const dwell = () => {
    const secs = active.get(current) ?? 0;
    if (secs > (reported.get(current) ?? 0)) {
      reported.set(current, secs);
      push({ type: "demo_dwell", value: `${current}:${secs}`, meta: { section: current, secs, scroll: scroll.get(current) ?? 0 } });
    }
  };
  const onHide = () => {
    if (document.visibilityState === "hidden") {
      dwell();
      flush();
    }
  };
  const onPageHide = () => {
    dwell();
    flush();
  };
  window.addEventListener("pointerdown", onInput, { passive: true });
  window.addEventListener("keydown", onInput);
  window.addEventListener("wheel", onInput, { passive: true });
  window.addEventListener("scroll", onScroll, { passive: true });
  document.addEventListener("visibilitychange", onHide);
  window.addEventListener("pagehide", onPageHide);
  const timer = window.setInterval(flush, 15_000);

  const view = (section: string) => {
    if (n > 0 && section === current) return;
    if (n > 0) dwell();
    const from = current;
    current = section;
    n += 1;
    push({ type: "demo_view", value: section, meta: n === 1 ? { n, src, vp, touch } : { n, from } }, true);
  };
  view(first);

  const clicks = new Map<string, number>();
  return {
    view,
    action: (what, target = "") => push({ type: "demo_action", value: `${what}:${target}`.slice(0, 120), meta: { section: current } }),
    connect: (slug) => {
      const c = (clicks.get(slug) ?? 0) + 1;
      clicks.set(slug, c);
      push({ type: "demo_connect", value: slug, meta: { n: c, section: current } }, true);
    },
    cta: (which, label) => push({ type: "demo_cta", value: which, label, meta: { section: current } }, true),
    error: (what) => push({ type: "demo_error", value: what.slice(0, 60) }),
    stop: () => {
      onPageHide();
      window.clearInterval(tick);
      window.clearInterval(timer);
      window.removeEventListener("pointerdown", onInput);
      window.removeEventListener("keydown", onInput);
      window.removeEventListener("wheel", onInput);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onPageHide);
      queue = [];
    },
  };
}

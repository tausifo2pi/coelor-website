"use client";

// On-page analytics for the outreach DB: pageview, which sections were seen, scroll depth,
// active time and CTA clicks. Cookieless for normal visitors; after an email click the server
// attributes events to the lead via the first-party cookie set by /r/<token>.
import { useEffect } from "react";

type Ev = { type: string; path?: string; ref?: string; value?: string | number; label?: string };

const ENDPOINT = "/api/t";
const SCROLL_MARKS = [25, 50, 75, 100];

export default function Tracker() {
  useEffect(() => {
    const page = Math.random().toString(36).slice(2, 12);
    const path = location.pathname + location.hash;
    const bot = navigator.webdriver === true;
    let queue: Ev[] = [];

    const flush = () => {
      if (!queue.length) return;
      const body = JSON.stringify({ page, bot, events: queue.splice(0, 20) });
      const blob = new Blob([body], { type: "text/plain" });
      if (!navigator.sendBeacon?.(ENDPOINT, blob)) {
        fetch(ENDPOINT, { method: "POST", body, keepalive: true }).catch(() => {});
      }
    };
    const push = (e: Ev) => {
      queue.push(e);
      if (queue.length >= 10) flush();
    };

    push({ type: "pageview", path, ref: document.referrer || undefined });
    flush();

    // Sections seen (each once)
    const seen = new Set<string>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const en of entries) {
          const id = (en.target as HTMLElement).id;
          if (en.isIntersecting && id && !seen.has(id)) {
            seen.add(id);
            push({ type: "section_view", path, value: id });
          }
        }
      },
      // A section counts once it reaches the middle band of the screen (works for tall sections too)
      { rootMargin: "-40% 0px -40% 0px", threshold: 0 },
    );
    document.querySelectorAll("main section[id], main [data-track-section]").forEach((el) => io.observe(el));

    // Scroll depth milestones
    const hit = new Set<number>();
    const onScroll = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const pct = max <= 0 ? 100 : Math.round((window.scrollY / max) * 100);
      for (const m of SCROLL_MARKS) {
        if (pct >= m && !hit.has(m)) {
          hit.add(m);
          push({ type: "scroll", path, value: m });
        }
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    // CTA / link clicks
    const onClick = (ev: MouseEvent) => {
      const el = (ev.target as HTMLElement | null)?.closest("a, button");
      if (!el) return;
      const label = (el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 80);
      const href = el instanceof HTMLAnchorElement ? el.getAttribute("href") ?? undefined : undefined;
      push({ type: "cta_click", path, value: href, label });
      flush();
    };
    document.addEventListener("click", onClick, { capture: true });

    // Active (visible) time, sent when the tab is hidden or closed
    // (visibilitychange and pagehide both fire on close; only report when the total grew)
    let activeMs = 0;
    let reportedS = -1;
    let since = document.visibilityState === "visible" ? Date.now() : 0;
    const report = () => {
      if (since) activeMs += Date.now() - since;
      since = 0;
      const secs = Math.round(activeMs / 1000);
      if (secs > reportedS) {
        reportedS = secs;
        push({ type: "time_on_page", path, value: secs });
      }
      flush();
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") report();
      else if (!since) since = Date.now();
    };
    // Page opened in a background tab: start the clock at the first interaction
    const onInteract = () => {
      if (!since && document.visibilityState === "visible") since = Date.now();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", report);
    window.addEventListener("pointerdown", onInteract, { passive: true });
    window.addEventListener("scroll", onInteract, { passive: true });

    const timer = window.setInterval(flush, 15000);

    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("click", onClick, { capture: true });
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", report);
      window.removeEventListener("pointerdown", onInteract);
      window.removeEventListener("scroll", onInteract);
      window.clearInterval(timer);
      queue = [];
    };
  }, []);

  return null;
}

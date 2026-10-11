// Runs once when the server starts (Next.js instrumentation): on the small production server, this server loads the
// outreach pages (live demo, case study) for itself every 2 minutes, so they stay in memory and the first visitor from
// an email doesn't wait for a cold page (a server-side load logs no tracking event). The demo's data is generated in
// the browser (lib/demo/gen.ts): nothing here reads another system.
const WARM_PAGES = ["/demo/multi-platform-sync", "/case-studies/stock-sync"];

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.NODE_ENV !== "production") return;
  const self = `http://127.0.0.1:${process.env.PORT || 3000}`;
  const warm = () => {
    for (const page of WARM_PAGES) {
      fetch(`${self}${page}`, { cache: "no-store", signal: AbortSignal.timeout(15_000) }).then((r) => r.arrayBuffer()).catch(() => {});
    }
  };
  const ticking = setInterval(warm, 120_000);
  ticking.unref?.();
}

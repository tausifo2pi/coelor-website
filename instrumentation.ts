// Runs once when the server starts (Next.js instrumentation): keep the live demo's data fresh and the outreach pages
// (live demo, case study) in memory (lib/demo/ak.ts).
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startDemoRefresh } = await import("@/lib/demo/ak");
    startDemoRefresh();
  }
}

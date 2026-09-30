// Runs once when the server starts (Next.js instrumentation): keep the case-study lookup warm from the first minute,
// not only after the first reader (lib/case-mix.ts).
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startKeepWarm } = await import("@/lib/case-mix");
    startKeepWarm();
  }
}

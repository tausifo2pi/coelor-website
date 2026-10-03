// The demo page's reads of /api/demo/*: a failed or slow answer is asked again twice (after 1.5 s and 4 s) before the
// page says the data did not load. "Not found" and "slow down" are final answers, not retried.
const FINAL = new Set([400, 404, 429]);

export async function getJson<T>(url: string, waits: number[] = [1500, 4000]): Promise<T> {
  for (let i = 0; ; i++) {
    let final = false;
    try {
      const r = await fetch(url, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(10_000) });
      if (r.ok) return (await r.json()) as T;
      final = FINAL.has(r.status);
      throw new Error(`demo api ${r.status}`);
    } catch (err) {
      if (final || i >= waits.length) throw err;
      await new Promise((res) => setTimeout(res, waits[i]));
    }
  }
}

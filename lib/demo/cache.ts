// The live demo's copy of the client's sync API (ak-api) reads: each path is read once and shared by every visitor.
// Once a copy is older than its ttl it is still answered at once, while one fresh read runs behind it
// (stale-while-revalidate), so a visitor never waits for the client's API when a copy exists. Only the very first read
// of a path waits, up to the fetcher's own timeout. A copy older than `staleAfterMs` is marked stale (the page then
// says "data from … ago"): its fresh reads keep failing. Pure (no I/O, no "@/" imports): `node --test lib/demo/cache.test.mts`.

export type Got = { data: unknown; at: number; stale: boolean };

type Entry = { at: number; data?: unknown; wait?: Promise<unknown>; failing?: boolean };

export type ReadCache = {
  /** the copy of `path` (fetched now if there is none); `ttl`: how long a copy counts as fresh */
  read(path: string, ttl: number): Promise<Got>;
  /** resolves once every read in flight has settled (the refresher waits for it before it saves the answers) */
  settle(): Promise<void>;
  size(): number;
};

export function readCache(
  fetcher: (path: string) => Promise<unknown>,
  opts: { staleAfterMs: number; max: number; now?: () => number; onError?: (path: string, err: unknown) => void },
): ReadCache {
  const cache = new Map<string, Entry>();
  const now = opts.now ?? Date.now;

  function start(path: string, hit: Entry | undefined): Promise<unknown> {
    const wait = fetcher(path);
    cache.set(path, { at: hit?.at ?? 0, data: hit?.data, failing: hit?.failing, wait });
    wait.then(
      (data) => {
        cache.delete(path);
        cache.set(path, { at: now(), data });
        if (cache.size > opts.max) cache.delete(cache.keys().next().value as string);
      },
      (err) => {
        const e = cache.get(path);
        // say it once when a path starts failing, not on every retry
        if (!e?.failing) opts.onError?.(path, err);
        cache.set(path, { at: hit?.at ?? 0, data: hit?.data, failing: true });
      },
    );
    return wait;
  }

  const got = (e: Entry): Got => ({ data: e.data, at: e.at, stale: now() - e.at > opts.staleAfterMs });

  return {
    async read(path, ttl) {
      const hit = cache.get(path);
      if (hit && hit.data !== undefined) {
        if (now() - hit.at >= ttl && !hit.wait) start(path, hit).catch(() => {});
        return got(hit);
      }
      // no copy yet: this visitor waits for the first read (shared with anyone asking at the same time)
      await (hit?.wait ?? start(path, hit));
      const e = cache.get(path);
      if (!e || e.data === undefined) throw new Error(`no data for ${path}`);
      return got(e);
    },
    async settle() {
      const waits = [...cache.values()].map((e) => e.wait).filter((w): w is Promise<unknown> => !!w);
      await Promise.allSettled(waits);
    },
    size: () => cache.size,
  };
}

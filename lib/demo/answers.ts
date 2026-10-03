// The live demo's last good answers, kept on disk: after a restart or a deploy the first visitor gets the dashboard,
// the first page of every list and the products they can open at once, while the fresh reads of the client's API run
// behind it. Only answers the page shows publicly are stored (shaped by lib/demo/shape.ts), plus the row key → Picqer
// product id map that lets a stored row open its product (server side only, never sent to the browser).
// No "@/" imports: `node --test lib/demo/answers.test.mts`.
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";

export type AnswerStore = {
  get<T>(key: string): T | undefined;
  /** keeps the answer and writes the file a moment later (one write for a burst of answers) */
  put(key: string, value: unknown): void;
  /** writes now (tests; the refresher after a full round) */
  flush(): void;
  keys(): string[];
};

const MAX_KEYS = 60;

/** `file` null: kept in memory only (no disk). */
export function answerStore(file: string | null, opts: { delayMs?: number } = {}): AnswerStore {
  const map = new Map<string, unknown>();
  if (file) {
    try {
      const saved = JSON.parse(readFileSync(file, "utf8")) as Record<string, unknown>;
      for (const [k, v] of Object.entries(saved ?? {})) map.set(k, v);
    } catch {
      // no file yet, or a broken one: start empty
    }
  }
  let timer: ReturnType<typeof setTimeout> | null = null;

  function flush() {
    if (timer) clearTimeout(timer);
    timer = null;
    if (!file) return;
    try {
      mkdirSync(path.dirname(file), { recursive: true });
      const tmp = `${file}.${process.pid}.tmp`;
      writeFileSync(tmp, JSON.stringify(Object.fromEntries(map)));
      renameSync(tmp, file); // never a half-written file
    } catch (err) {
      console.error("demo: answers not saved", err instanceof Error ? err.message : err);
    }
  }

  return {
    get: <T>(key: string) => map.get(key) as T | undefined,
    put(key, value) {
      map.delete(key);
      map.set(key, value);
      while (map.size > MAX_KEYS) map.delete(map.keys().next().value as string);
      if (file && !timer) {
        timer = setTimeout(flush, opts.delayMs ?? 5_000);
        timer.unref?.();
      }
    },
    flush,
    keys: () => [...map.keys()],
  };
}

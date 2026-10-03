// node --test lib/demo/cache.test.mts
// The demo's read cache (lib/demo/cache.ts): one shared read per path, an old copy answered at once while a fresh read
// runs behind it, the first read the only one that waits, failures said once and marked stale only when old.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readCache } from "./cache.ts";

function setup(opts: { fail?: Set<string> } = {}) {
  let t = 1_000_000;
  const calls: string[] = [];
  const errors: string[] = [];
  const pending: { path: string; resolve: (v: unknown) => void; reject: (e: unknown) => void }[] = [];
  const c = readCache(
    (path) => {
      calls.push(path);
      if (opts.fail?.has(path)) return Promise.reject(new Error("down"));
      return new Promise((resolve, reject) => pending.push({ path, resolve, reject }));
    },
    { staleAfterMs: 600_000, max: 10, now: () => t, onError: (p) => errors.push(p) },
  );
  const answerAll = (v: (p: string) => unknown) => {
    for (const p of pending.splice(0)) p.resolve(v(p.path));
  };
  return { c, calls, errors, pending, answerAll, tick: (ms: number) => (t += ms) };
}

const flush = () => new Promise((r) => setImmediate(r));

test("the first read waits, and visitors asking at the same time share it", async () => {
  const s = setup();
  const a = s.c.read("/x", 30_000);
  const b = s.c.read("/x", 30_000);
  await flush();
  assert.equal(s.calls.length, 1);
  s.answerAll(() => ({ n: 1 }));
  assert.deepEqual((await a).data, { n: 1 });
  assert.deepEqual((await b).data, { n: 1 });
});

test("a fresh copy is answered without a read", async () => {
  const s = setup();
  const a = s.c.read("/x", 30_000);
  await flush();
  s.answerAll(() => 1);
  await a;
  s.tick(10_000);
  const got = await s.c.read("/x", 30_000);
  assert.equal(got.data, 1);
  assert.equal(s.calls.length, 1);
});

test("an old copy is answered at once while one fresh read runs behind it", async () => {
  const s = setup();
  const a = s.c.read("/x", 30_000);
  await flush();
  s.answerAll(() => "old");
  await a;
  s.tick(31_000);
  const got = await s.c.read("/x", 30_000); // does not wait for the fresh read
  assert.equal(got.data, "old");
  assert.equal(got.stale, false);
  await s.c.read("/x", 30_000); // a second visitor meanwhile: no second read
  assert.equal(s.calls.length, 2);
  s.answerAll(() => "new");
  await s.c.settle();
  assert.equal((await s.c.read("/x", 30_000)).data, "new");
});

test("failing fresh reads keep the old copy; it is marked stale once old, and the failure is said once", async () => {
  const fail = new Set<string>();
  const s = setup({ fail });
  const a = s.c.read("/x", 30_000);
  await flush();
  s.answerAll(() => "good");
  await a;
  fail.add("/x");
  for (let i = 0; i < 3; i++) {
    s.tick(60_000);
    assert.equal((await s.c.read("/x", 30_000)).data, "good");
    await s.c.settle();
  }
  assert.equal(s.errors.length, 1);
  s.tick(10 * 60_000);
  const got = await s.c.read("/x", 30_000);
  assert.equal(got.data, "good");
  assert.equal(got.stale, true);
});

test("with no copy a failed read throws, and the next visitor tries again", async () => {
  const fail = new Set(["/x"]);
  const s = setup({ fail });
  await assert.rejects(s.c.read("/x", 30_000));
  fail.clear();
  const b = s.c.read("/x", 30_000);
  await flush();
  s.answerAll(() => 2);
  assert.equal((await b).data, 2);
  assert.equal(s.calls.length, 2);
});

test("settle waits for every read in flight", async () => {
  const s = setup();
  s.c.read("/a", 1000).catch(() => {});
  s.c.read("/b", 1000).catch(() => {});
  await flush();
  let done = false;
  const w = s.c.settle().then(() => (done = true));
  await flush();
  assert.equal(done, false);
  s.answerAll(() => 0);
  await w;
  assert.equal(done, true);
});

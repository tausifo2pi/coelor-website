// node --test lib/demo/answers.test.mts
// The demo's answers on disk (lib/demo/answers.ts): kept across a restart, one write for a burst, never a half file,
// a broken or missing file means an empty start, and only so many answers are kept.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { answerStore } from "./answers.ts";

const dir = () => mkdtempSync(path.join(tmpdir(), "demo-answers-"));

test("answers survive a restart", () => {
  const file = path.join(dir(), "sub", "demo-answers.json");
  const a = answerStore(file);
  a.put("overview", { data: { n: 1 }, at: "2026-10-04T10:00:00.000Z", stale: false });
  a.put("_products", [["k1", "123"]]);
  a.flush();
  const b = answerStore(file); // a new process
  assert.deepEqual(b.get("overview"), { data: { n: 1 }, at: "2026-10-04T10:00:00.000Z", stale: false });
  assert.deepEqual(b.get("_products"), [["k1", "123"]]);
});

test("a burst of answers is one write, a moment later", async () => {
  const d = dir();
  const file = path.join(d, "a.json");
  const a = answerStore(file, { delayMs: 30 });
  a.put("x", 1);
  a.put("y", 2);
  assert.throws(() => readFileSync(file)); // not yet
  await new Promise((r) => setTimeout(r, 60));
  assert.deepEqual(JSON.parse(readFileSync(file, "utf8")), { x: 1, y: 2 });
  assert.deepEqual(readdirSync(d), ["a.json"]); // no temp file left behind
});

test("a broken or missing file starts empty", () => {
  const d = dir();
  const file = path.join(d, "a.json");
  writeFileSync(file, "{not json");
  assert.deepEqual(answerStore(file).keys(), []);
  assert.deepEqual(answerStore(path.join(d, "none.json")).keys(), []);
});

test("only the newest 60 answers are kept; a new answer for a key moves it to the end", () => {
  const a = answerStore(null);
  for (let i = 0; i < 70; i++) a.put(`k${i}`, i);
  assert.equal(a.keys().length, 60);
  assert.equal(a.get("k0"), undefined);
  a.put("k10", "again");
  assert.equal(a.keys().at(-1), "k10");
});

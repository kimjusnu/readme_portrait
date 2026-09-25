import { test } from "node:test";
import assert from "node:assert/strict";
import { createStore } from "../js/store.js";
import { moveFrame, zoomFrame } from "../js/frame.js";
import { DEFAULTS } from "../js/convert.js";

test("store merges patches immutably and notifies subscribers", () => {
  const store = createStore({ a: 1, opts: { x: 1 } });
  const seen = [];
  store.subscribe((s) => seen.push(s));
  const before = store.get();
  store.set({ a: 2 });
  store.setOpts({ y: 2 });
  assert.equal(before.a, 1);
  assert.deepEqual(store.get(), { a: 2, opts: { x: 1, y: 2 } });
  assert.equal(seen.length, 2);
  assert.notEqual(seen[0], seen[1]);
});

test("unsubscribe stops notifications", () => {
  const store = createStore({});
  let calls = 0;
  const off = store.subscribe(() => { calls += 1; });
  off();
  store.set({ a: 1 });
  assert.equal(calls, 0);
});

test("moveFrame shifts the window and reports clamped values", () => {
  const opts = { ...DEFAULTS, zoom: 2, cropX: 0.5, cropTop: 0.1 };
  const moved = moveFrame(460, 460, opts, -1000, 0);
  assert.equal(moved.cropX > 0 && moved.cropX < 0.5, true);
  assert.ok(Math.abs(moved.cropX * 460 - (460 * 0.88 / 2) * (520 / 555) / 2) < 1);
  assert.equal(moved.cropTop, 0.1);
});

test("moveFrame clamps at the top edge", () => {
  const moved = moveFrame(460, 460, DEFAULTS, 0, -1000);
  assert.equal(moved.cropTop, 0);
});

test("zoomFrame clamps between 1 and 4", () => {
  assert.equal(zoomFrame(DEFAULTS, 10).zoom, 4);
  assert.equal(zoomFrame(DEFAULTS, 0.1).zoom, 1);
  assert.equal(zoomFrame({ ...DEFAULTS, zoom: 2 }, 1.1).zoom, 2.2);
});

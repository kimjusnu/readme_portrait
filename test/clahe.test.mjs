import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { clahe } from "../js/clahe.js";
import { toLuma, crop } from "../js/convert.js";

const fixture = (name) => new URL(`./fixtures/${name}`, import.meta.url);

test("clahe matches OpenCV createCLAHE(2.0, 8×8) within ±1 on a real photo", () => {
  const pixels = new Uint8Array(readFileSync(fixture("sample.rgb")));
  const lum = toLuma(crop(pixels, 460, { x: 40, y: 9, w: 379, h: 405 }));
  const expected = new Uint8Array(readFileSync(fixture("sample-crop.clahe")));
  const out = clahe(lum, 379, 405);
  let exact = 0;
  let maxDiff = 0;
  out.forEach((v, i) => {
    const d = Math.abs(v - expected[i]);
    if (d === 0) exact += 1;
    maxDiff = Math.max(maxDiff, d);
  });
  console.log(`clahe exact ${exact}/${out.length} (${((exact / out.length) * 100).toFixed(2)}%), max diff ${maxDiff}`);
  assert.ok(maxDiff <= 1);
  assert.ok(exact / out.length >= 0.99);
});

test("clahe keeps a flat image flat", () => {
  const out = clahe(new Uint8Array(64 * 64).fill(100), 64, 64);
  assert.equal(new Set(out).size, 1);
});

test("clahe does not mutate its input", () => {
  const lum = Uint8Array.from({ length: 32 * 32 }, (_, i) => i % 256);
  const copy = Uint8Array.from(lum);
  clahe(lum, 32, 32);
  assert.deepEqual(lum, copy);
});

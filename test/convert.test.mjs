import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  toLuma, equalize, resize, enhance, cropBox, crop, toCells, analyze, layoutFor, rgbaToRgb, DEFAULTS,
} from "../js/convert.js";

const fixture = (name) => new URL(`./fixtures/${name}`, import.meta.url);
const small = JSON.parse(readFileSync(fixture("small.json"), "utf8"));
const rgb = Uint8Array.from(small.rgb);

test("toLuma matches Pillow convert('L')", () => {
  assert.deepEqual(Array.from(toLuma(rgb)), small.luma);
});

test("equalize matches Pillow ImageOps.equalize", () => {
  assert.deepEqual(Array.from(equalize(Uint8Array.from(small.luma))), small.equalized);
});

test("equalize matches Pillow on a real photo crop (skewed histogram)", () => {
  const pixels = new Uint8Array(readFileSync(fixture("sample.rgb")));
  const lum = toLuma(crop(pixels, 460, { x: 40, y: 9, w: 379, h: 405 }));
  const expected = new Uint8Array(readFileSync(fixture("sample-crop.eq")));
  assert.deepEqual(equalize(lum), expected);
});

test("equalize leaves a flat image unchanged", () => {
  assert.deepEqual(Array.from(equalize(Uint8Array.from([9, 9, 9]))), [9, 9, 9]);
});

test("resize matches Pillow LANCZOS for one channel", () => {
  const { w, h, data } = small.resizedLuma;
  const out = resize(Uint8Array.from(small.equalized), small.w, small.h, 1, w, h);
  assert.deepEqual(Array.from(out), data);
});

test("resize matches Pillow LANCZOS for RGB", () => {
  const { w, h, data } = small.resizedRgb;
  assert.deepEqual(Array.from(resize(rgb, small.w, small.h, 3, w, h)), data);
});

test("enhance matches Pillow Color(1.3) then Brightness(1.6)", () => {
  const out = enhance(rgb, { saturation: 1.3, brightness: 1.6 });
  assert.deepEqual(Array.from(out), small.enhanced);
});

test("enhance does not mutate its input", () => {
  const copy = Uint8Array.from(rgb);
  enhance(rgb, { saturation: 2, brightness: 2 });
  assert.deepEqual(rgb, copy);
});

test("cropBox reproduces portrait.py crop for a 460px avatar", () => {
  assert.deepEqual(cropBox(460, 460, layoutFor(DEFAULTS), DEFAULTS.cropTop), { x: 40, y: 9, w: 379, h: 405 });
});

test("zoom 2 halves the crop window around the same centre", () => {
  const base = cropBox(460, 460, layoutFor(DEFAULTS), DEFAULTS.cropTop);
  const zoomed = cropBox(460, 460, layoutFor(DEFAULTS), 0.2, { zoom: 2 });
  assert.ok(Math.abs(zoomed.w - base.w / 2) <= 1);
  assert.ok(Math.abs(zoomed.h - base.h / 2) <= 1);
  assert.ok(Math.abs(zoomed.x + zoomed.w / 2 - 230) <= 1);
});

test("cropX moves the window horizontally and clamps at the edges", () => {
  const l = layoutFor(DEFAULTS);
  assert.equal(cropBox(460, 460, l, 0, { zoom: 2, cropX: 0 }).x, 0);
  const right = cropBox(460, 460, l, 0, { zoom: 2, cropX: 1 });
  assert.ok(right.x + right.w <= 460 && right.x + right.w >= 459);
});

test("a wide card on a tall image is limited by width, never squashed", () => {
  const l = layoutFor({ ...DEFAULTS, card: "wide" });
  const box = cropBox(400, 800, l, 0);
  assert.equal(box.w, 400);
  assert.ok(Math.abs(box.w / box.h - l.textW / l.textH) < 0.02);
});

test("crop copies the requested window", () => {
  const img = Uint8Array.from([1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4]); // 2×2
  assert.deepEqual(Array.from(crop(img, 2, { x: 1, y: 1, w: 1, h: 1 })), [4, 4, 4]);
});

test("rgbaToRgb drops alpha", () => {
  assert.deepEqual(Array.from(rgbaToRgb(Uint8Array.from([1, 2, 3, 255, 4, 5, 6, 0]))), [1, 2, 3, 4, 5, 6]);
});

test("layoutFor keeps 110×62 for the default card", () => {
  const l = layoutFor(DEFAULTS);
  assert.equal(l.cols, 110);
  assert.equal(l.rows, 62);
});

test("sample avatar: every cell matches the reference (spec requires 90%)", () => {
  const sample = JSON.parse(readFileSync(fixture("sample.json"), "utf8"));
  const pixels = new Uint8Array(readFileSync(fixture("sample.rgb")));
  const cells = toCells(pixels, sample.w, sample.h, DEFAULTS);
  let chars = 0;
  let fills = 0;
  cells.forEach((row, y) => row.forEach(([ch, fill], x) => {
    if (ch === sample.chars[y][x]) chars += 1;
    if (fill === sample.fills[y][x]) fills += 1;
  }));
  const total = 110 * 62;
  console.log(`char match ${chars}/${total} (${((chars / total) * 100).toFixed(2)}%), fill match ${fills}/${total}`);
  assert.equal(chars, total);
  assert.equal(fills, total);
});

test("gray mode colours every cell with a gray fill", () => {
  const cells = toCells(rgb, small.w, small.h, { ...DEFAULTS, colorMode: "gray", cols: 60 });
  for (const row of cells) for (const [, fill] of row) assert.match(fill, /^#([0-9a-f])\1\1$/);
});

test("analyze exposes every pipeline stage and agrees with toCells", () => {
  const opts = { ...DEFAULTS, cols: 60 };
  const a = analyze(rgb, small.w, small.h, opts);
  const { box, layout } = a;
  assert.equal(a.cropped.length, box.w * box.h * 3);
  assert.equal(a.luma.length, box.w * box.h);
  assert.equal(a.contrast.length, box.w * box.h);
  assert.equal(a.lum.length, layout.cols * layout.rows);
  assert.equal(a.color.length, layout.cols * layout.rows * 3);
  assert.deepEqual(a.cells, toCells(rgb, small.w, small.h, opts));
});

test("contrast none keeps the raw luma", () => {
  const a = analyze(rgb, small.w, small.h, { ...DEFAULTS, cols: 60, contrast: "none" });
  assert.deepEqual(a.contrast, a.luma);
});

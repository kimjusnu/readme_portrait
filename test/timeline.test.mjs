import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { animationLength, frameTimes } from "../js/timeline.js";
import { renderSvg } from "../js/svg.js";
import { DEFAULTS } from "../js/convert.js";

const sample = JSON.parse(readFileSync(new URL("./fixtures/sample.json", import.meta.url), "utf8"));
const cells = sample.chars.map((line, y) => [...line].map((ch, x) => [ch, sample.fills[y][x]]));

test("typing lasts rows × step (the looping cursor blink is ignored)", () => {
  assert.equal(animationLength(renderSvg(cells, DEFAULTS)), 4.34);
});

test("a static file has no animation length", () => {
  assert.equal(animationLength(renderSvg(cells, { ...DEFAULTS, animate: false })), 0);
});

test("every style reports a positive length", () => {
  for (const anim of ["reveal", "scan", "matrix"]) assert.ok(animationLength(renderSvg(cells, { ...DEFAULTS, anim })) > 1);
});

test("frame times cover the animation and end exactly on it", () => {
  const times = frameTimes(1, 10);
  assert.equal(times.length, 11);
  assert.equal(times[0], 0);
  assert.equal(times.at(-1), 1);
});

test("frame count is capped so GIFs stay small", () => {
  assert.ok(frameTimes(30, 12).length <= 90);
});

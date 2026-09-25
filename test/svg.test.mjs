import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderSvg, rowSpans, esc } from "../js/svg.js";
import { DEFAULTS } from "../js/convert.js";

const sample = JSON.parse(readFileSync(new URL("./fixtures/sample.json", import.meta.url), "utf8"));
const cells = sample.chars.map((line, y) => [...line].map((ch, x) => [ch, sample.fills[y][x]]));
const reference = readFileSync(new URL("../reference/portrait.sample.svg", import.meta.url), "utf8");

test("default options reproduce reference/portrait.sample.svg byte for byte", () => {
  const svg = renderSvg(cells, { ...DEFAULTS, title: "kimjusnu", name: "kimjusnu" });
  assert.equal(svg, reference);
});

test("esc escapes XML specials", () => {
  assert.equal(esc("a&b<c>d"), "a&amp;b&lt;c&gt;d");
});

test("rowSpans merges runs of the same colour", () => {
  assert.equal(rowSpans([["a", "#fff"], ["b", "#fff"], ["<", "#000"]]), '<tspan fill="#fff">ab</tspan><tspan fill="#000">&lt;</tspan>');
});

test("static mode has no animation and every row stays visible", () => {
  const svg = renderSvg(cells, { ...DEFAULTS, animate: false });
  assert.doesNotMatch(svg, /<animate/);
  assert.equal((svg.match(/textLength="520"/g) || []).length, 62);
});

test("animated rows start fully visible (width=520) before SMIL runs", () => {
  const svg = renderSvg(cells, DEFAULTS);
  const widths = [...svg.matchAll(/<clipPath id="r\d+"><rect [^>]*width="(\d+)"/g)].map((m) => m[1]);
  assert.equal(widths.length, 62);
  assert.ok(widths.every((w) => w === "520"));
});

test("user text is escaped in the title and prompt", () => {
  const svg = renderSvg(cells, { ...DEFAULTS, title: "<x>", name: "a&b" });
  assert.match(svg, /&lt;x&gt;@github/);
  assert.match(svg, /whoami <tspan fill="#c9d1d9">a&amp;b<\/tspan>/);
});

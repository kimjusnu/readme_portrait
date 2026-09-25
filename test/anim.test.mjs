import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderSvg } from "../js/svg.js";
import { DEFAULTS } from "../js/convert.js";
import { STYLES } from "../js/anim.js";

const sample = JSON.parse(readFileSync(new URL("./fixtures/sample.json", import.meta.url), "utf8"));
const cells = sample.chars.map((line, y) => [...line].map((ch, x) => [ch, sample.fills[y][x]]));
const reference = readFileSync(new URL("../reference/portrait.sample.svg", import.meta.url), "utf8");

// What a renderer without SMIL shows: the document with every <animate*> removed
const frozen = (svg) => svg.replace(/<animate(Transform)?\b[^>]*\/>/g, "");

test("the default style is still byte-identical to the reference", () => {
  assert.equal(renderSvg(cells, { ...DEFAULTS, title: "kimjusnu", name: "kimjusnu" }), reference);
});

for (const style of STYLES) {
  test(`${style}: without SMIL every row is fully visible`, () => {
    const svg = frozen(renderSvg(cells, { ...DEFAULTS, anim: style }));
    const clips = [...svg.matchAll(/<clipPath id="r\d+"><rect x="([\d.]+)" [^>]*width="([\d.]+)"/g)];
    for (const [, x, w] of clips) {
      assert.equal(x, "20");
      assert.equal(w, "520");
    }
    assert.equal((svg.match(/textLength="520"/g) || []).length, 62);
    // content groups must not start hidden
    assert.doesNotMatch(svg, /<g[^>]*opacity="0"/);
  });

  test(`${style}: decorations are hidden unless animated`, () => {
    const svg = frozen(renderSvg(cells, { ...DEFAULTS, anim: style }));
    for (const [tag] of svg.matchAll(/<[^>]*class="deco"[^>]*>/g)) assert.match(tag, /opacity="0"/);
  });

  test(`${style}: text content is well-formed XML (no raw < > &)`, () => {
    const svg = renderSvg(cells, { ...DEFAULTS, anim: style });
    const textOnly = svg.replace(/<[^<>]+>/g, "");
    assert.doesNotMatch(textOnly, /[<>]/);
    assert.doesNotMatch(textOnly, /&(?!(amp|lt|gt);)/);
  });

  test(`${style}: output is deterministic and stays small`, () => {
    const a = renderSvg(cells, { ...DEFAULTS, anim: style });
    assert.equal(a, renderSvg(cells, { ...DEFAULTS, anim: style }));
    assert.ok(a.length < 200 * 1024, `${(a.length / 1024).toFixed(1)} KB`);
  });
}

test("rain glyphs stay within printable ASCII (system fonts only in README images)", () => {
  const svg = renderSvg(cells, { ...DEFAULTS, anim: "matrix" });
  const drops = [...svg.matchAll(/<tspan x="[\d.]+" dy="[\d.]+"(?: fill="[^"]+")?>([^<]*)<\/tspan>/g)].map((m) => m[1]);
  assert.ok(drops.length > 0);
  for (const d of drops) assert.match(d.replace(/&(amp|lt|gt);/g, "x"), /^[\x20-\x7e]+$/);
});

test("every non-default style actually animates", () => {
  for (const style of STYLES.filter((s) => s !== "type")) {
    const svg = renderSvg(cells, { ...DEFAULTS, anim: style });
    assert.match(svg, /<animate/);
    assert.notEqual(svg, renderSvg(cells, DEFAULTS));
  }
});

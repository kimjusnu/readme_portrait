import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// The Korean pixel font is subset to the glyphs used in js/i18n.js; a new word needs a re-run
test("every Hangul character in i18n.js is in the Korean font subset", () => {
  const source = readFileSync(new URL("../js/i18n.js", import.meta.url), "utf8");
  const subset = new Set(readFileSync(new URL("../assets/fonts/galmuri-chars.txt", import.meta.url), "utf8"));
  const missing = [...new Set(source.match(/[가-힣]/g))].filter((ch) => !subset.has(ch));
  assert.deepEqual(missing, [], `run python scripts/subset_ko_font.py (missing: ${missing.join("")})`);
});

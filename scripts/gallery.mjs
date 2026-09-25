// Renders every example in assets/classics/classics.json with the site's own converter.
// Input pixels come from build_gallery.py (raw RGB), so the output matches what the browser draws.
// Usage: node scripts/gallery.mjs <raw-dir> <out-dir> [--static]
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { DEFAULTS, toCells } from "../js/convert.js";
import { renderSvg } from "../js/svg.js";

const [rawDir, outDir, flag] = process.argv.slice(2);
const classics = JSON.parse(readFileSync(new URL("../assets/classics/classics.json", import.meta.url), "utf8"));
mkdirSync(outDir, { recursive: true });

for (const item of classics) {
  const { w, h } = JSON.parse(readFileSync(join(rawDir, `${item.slug}.json`), "utf8"));
  const rgb = new Uint8Array(readFileSync(join(rawDir, `${item.slug}.rgb`)));
  const opts = { ...DEFAULTS, ...item.options, title: item.handle, name: item.handle, animate: flag !== "--static" };
  const svg = renderSvg(toCells(rgb, w, h, opts), opts);
  writeFileSync(join(outDir, `${item.slug}.svg`), svg);
  console.log(`${item.slug}.svg ${(svg.length / 1024).toFixed(1)} KB`);
}

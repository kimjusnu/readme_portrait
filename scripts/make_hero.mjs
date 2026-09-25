// Hero backdrop: The Great Wave drawn by the site's own converter as a faint, single-colour glyph field.
// One <text> per row (no per-cell colour), so the file stays small and cheap to paint.
// Usage: node scripts/make_hero.mjs   (needs .verify/raw from scripts/build_gallery.py)
import { readFileSync, writeFileSync } from "node:fs";
import { toLuma, equalize, resize, RAMP } from "../js/convert.js";

const COLS = 220;
const CHAR_W = 6; // px per column in the SVG's own units
const LINE_H = CHAR_W / 0.528; // same cell shape as the portrait cards
const root = new URL("../", import.meta.url);
const { w, h } = JSON.parse(readFileSync(new URL(".verify/raw/great_wave.json", root), "utf8"));
const rgb = new Uint8Array(readFileSync(new URL(".verify/raw/great_wave.rgb", root)));

const rows = Math.round((COLS * CHAR_W * (h / w)) / LINE_H);
const lum = resize(equalize(toLuma(rgb)), w, h, 1, COLS, rows);
const last = RAMP.length - 1;
// Paper background: dark areas get the dense glyphs, so the ramp runs the other way
const lines = Array.from({ length: rows }, (_, y) => Array.from({ length: COLS }, (_, x) =>
  RAMP[Math.floor(((255 - lum[y * COLS + x]) * last) / 255)]).join(""));

const width = COLS * CHAR_W;
const height = Math.round(rows * LINE_H);
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const svg = [
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid slice" `
    + 'font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" fill="#141414" fill-opacity="0.13">',
  ...lines.map((line, i) => `<text x="0" y="${((i + 0.8) * LINE_H).toFixed(1)}" font-size="${(LINE_H * 0.86).toFixed(1)}" `
    + `textLength="${width}" lengthAdjust="spacing" xml:space="preserve">${esc(line)}</text>`),
  "</svg>",
].join("");
writeFileSync(new URL("assets/hero-wave.svg", root), svg);
console.log(`hero-wave.svg ${COLS}×${rows}, ${(svg.length / 1024).toFixed(1)} KB`);

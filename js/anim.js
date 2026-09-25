// Entrance animations. Every style follows the same rule as the original typing effect:
// the static attributes show the finished portrait, and delays live in keyTimes, so a renderer
// without SMIL (email previews, some screenshots) still shows every row. Decorations that
// only make sense while playing (scan bar, rain) default to opacity="0" and carry class="deco".
import { esc, fx } from "./fmt.js";

export const STYLES = ["type", "reveal", "scan", "matrix"];
const GREEN = "#1fd466";
const GLYPHS = "ｱｲｳｴｵｶｷｸｹｺ0123456789:.=*+-<>";

const keyed = (begin, dur) => fx(begin / dur, 3);

// Original line-by-line typing (byte-identical to reference/portrait.py)
function typeRow(i, l, opts, y, text) {
  const begin = i * opts.step;
  const dur = begin + opts.step;
  return `<clipPath id="r${i}"><rect x="${l.pad}" y="${fx(y, 2)}" height="${fx(l.lineH + 0.5, 2)}" width="${l.textW}">`
    + `<animate attributeName="width" values="0;0;${l.textW}" keyTimes="0;${keyed(begin, dur)};1" dur="${fx(dur, 3)}s" fill="freeze"/></rect></clipPath>`
    + `<g clip-path="url(#r${i})">${text}</g>`;
}

// Rows open outward from the vertical centre, each row widening from the middle
function revealRow(i, l, opts, y, text) {
  const mid = (l.rows - 1) / 2;
  const begin = Math.abs(i - mid) * 2 * opts.step;
  const dur = begin + opts.step * 4;
  const k = keyed(begin, dur);
  const cx = fx(l.pad + l.textW / 2, 1);
  const anim = (attr, from, to) => `<animate attributeName="${attr}" values="${from};${from};${to}" keyTimes="0;${k};1" dur="${fx(dur, 3)}s" fill="freeze"/>`;
  return `<clipPath id="r${i}"><rect x="${l.pad}" y="${fx(y, 2)}" height="${fx(l.lineH + 0.5, 2)}" width="${l.textW}">`
    + `${anim("x", cx, l.pad)}${anim("width", 0, l.textW)}</rect></clipPath>`
    + `<g clip-path="url(#r${i})">${text}</g>`;
}

// Rows fade in as they are reached (used by scan and matrix)
function fadeRow(i, l, opts, y, text) {
  const begin = i * opts.step;
  const dur = begin + opts.step * 2;
  return `<g><animate attributeName="opacity" values="0;0;1" keyTimes="0;${keyed(begin, dur)};1" dur="${fx(dur, 3)}s" fill="freeze"/>${text}</g>`;
}

export function rowMarkup(style, i, l, opts, y, text) {
  if (style === "reveal") return revealRow(i, l, opts, y, text);
  if (style === "scan" || style === "matrix") return fadeRow(i, l, opts, y, text);
  return typeRow(i, l, opts, y, text);
}

function scanBar(l, width, opts) {
  const total = l.rows * opts.step;
  const bottom = l.top + l.textH;
  return `<rect class="deco" x="0" y="${l.top}" width="${width}" height="3" fill="${GREEN}" opacity="0">`
    + `<animate attributeName="y" values="${l.top};${fx(bottom, 1)}" dur="${fx(total, 3)}s" fill="freeze"/>`
    + `<animate attributeName="opacity" values="0.85;0.85;0" keyTimes="0;0.96;1" dur="${fx(total, 3)}s" fill="freeze"/></rect>`;
}

// Small deterministic PRNG so the same image always produces the same file
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rain(l, opts) {
  const rnd = mulberry32(l.cols * 131 + l.rows);
  const columns = 26;
  const length = 12;
  const total = l.rows * opts.step;
  const bottom = l.top + l.textH;
  const drops = Array.from({ length: columns }, (_, c) => {
    const x = fx(l.pad + ((c + rnd() * 0.6) / columns) * l.textW, 1);
    const glyphs = Array.from({ length }, (_, k) => {
      const ch = GLYPHS[Math.floor(rnd() * GLYPHS.length)];
      const fill = k === length - 1 ? ' fill="#d8ffe6"' : "";
      return `<tspan x="${x}" dy="${fx(l.lineH, 2)}"${fill}>${esc(ch)}</tspan>`;
    }).join("");
    const begin = rnd() * total * 0.6;
    const fall = total * (0.35 + rnd() * 0.3);
    const dur = begin + fall;
    const k = keyed(begin, dur);
    const from = fx(l.top - length * l.lineH, 1);
    return `<text class="deco" y="0" font-size="${fx(l.fontSize, 2)}" fill="${GREEN}" opacity="0">${glyphs}`
      + `<animateTransform attributeName="transform" type="translate" values="0 ${from};0 ${from};0 ${fx(bottom, 1)}" keyTimes="0;${k};1" dur="${fx(dur, 3)}s" fill="freeze"/>`
      + `<animate attributeName="opacity" values="0;0;0.9;0" keyTimes="0;${k};${keyed(begin + fall * 0.8, dur)};1" dur="${fx(dur, 3)}s" fill="freeze"/></text>`;
  });
  return `<g clip-path="url(#body)">${drops.join("")}</g>`;
}

// Extra layers drawn above the rows
export function overlay(style, l, width, opts) {
  if (style === "scan") return scanBar(l, width, opts);
  if (style === "matrix") {
    return `<clipPath id="body"><rect x="0" y="${l.top}" width="${width}" height="${l.textH}"/></clipPath>${rain(l, opts)}`;
  }
  return "";
}

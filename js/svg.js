// Character cells → terminal-window SVG. Port of svg()/row_spans() in reference/portrait.py.
// Only SMIL animation is used: GitHub serves README images through <img>, which blocks scripts and fonts.
import { layoutFor } from "./convert.js";

const FONT = "ui-monospace,SFMono-Regular,Menlo,Consolas,monospace";

export function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Python-style fixed formatting: exact ties round to even, like f"{x:.2f}"
function fx(x, digits) {
  const scaled = x * 10 ** digits;
  const floor = Math.floor(scaled);
  const diff = scaled - floor;
  const n = diff === 0.5 ? (floor % 2 === 0 ? floor : floor + 1) : Math.round(scaled);
  return (n / 10 ** digits).toFixed(digits);
}

export function rowSpans(row) {
  const spans = [];
  let text = "";
  let fill = null;
  for (const [ch, colour] of row) {
    const c = ch === " " && fill !== null ? fill : colour; // blanks need no colour of their own
    if (fill !== null && c !== fill) {
      spans.push(`<tspan fill="${fill}">${esc(text)}</tspan>`);
      text = "";
    }
    fill = c;
    text += ch;
  }
  if (text) spans.push(`<tspan fill="${fill}">${esc(text)}</tspan>`);
  return spans.join("");
}

function header(width, height, title) {
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${fx(height, 0)}" viewBox="0 0 ${width} ${fx(height, 0)}" `
      + `font-family="${FONT}" role="img" aria-label="ASCII portrait">`,
    '<defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#111722"/>'
      + '<stop offset="1" stop-color="#0d1117"/></linearGradient></defs>',
    `<rect width="${width}" height="${fx(height, 0)}" rx="12" fill="url(#bg)"/>`,
    `<rect x="0.5" y="0.5" width="${width - 1}" height="${fx(height - 1, 0)}" rx="12" fill="none" stroke="#30363d"/>`,
    `<line x1="0" y1="30" x2="${width}" y2="30" stroke="#30363d"/>`,
    '<circle cx="20" cy="15" r="5" fill="#ff5f56"/><circle cx="36" cy="15" r="5" fill="#ffbd2e"/><circle cx="52" cy="15" r="5" fill="#27c93f"/>',
    `<text x="${fx(width / 2, 0)}" y="19" fill="#7d8590" font-size="12" text-anchor="middle">${esc(title)}@github: ~$ ./portrait.sh</text>`,
  ];
}

function row(i, cells, l, opts) {
  const y = l.top + i * l.lineH;
  const text = `<text xml:space="preserve" x="${l.pad}" y="${fx(y + l.lineH * 0.8, 2)}" font-size="${fx(l.fontSize, 2)}" `
    + `textLength="${l.textW}" lengthAdjust="spacing">${rowSpans(cells)}</text>`;
  if (!opts.animate) return text;
  const begin = i * opts.step;
  const dur = begin + opts.step;
  // Delay lives in keyTimes, and the rect's own width is full, so rows stay visible where SMIL never runs
  return `<clipPath id="r${i}"><rect x="${l.pad}" y="${fx(y, 2)}" height="${fx(l.lineH + 0.5, 2)}" width="${l.textW}">`
    + `<animate attributeName="width" values="0;0;${l.textW}" keyTimes="0;${fx(begin / dur, 3)};1" dur="${fx(dur, 3)}s" fill="freeze"/></rect></clipPath>`
    + `<g clip-path="url(#r${i})">${text}</g>`;
}

function footer(width, bodyH, pad, name, animate) {
  const prompt = `${name}@github:~$ whoami `;
  const cursorX = pad + ([...prompt].length + [...name].length) * 7.83 + 4;
  const blink = animate
    ? '<animate attributeName="opacity" values="1;1;0;0" keyTimes="0;0.5;0.51;1" dur="1s" repeatCount="indefinite"/></rect>'
    : "</rect>";
  return [
    `<line x1="0" y1="${fx(bodyH, 1)}" x2="${width}" y2="${fx(bodyH, 1)}" stroke="#30363d"/>`,
    `<text x="${pad}" y="${fx(bodyH + 19, 1)}" fill="#7d8590" font-size="13">${esc(prompt)}<tspan fill="#c9d1d9">${esc(name)}</tspan></text>`,
    `<rect x="${fx(cursorX, 0)}" y="${fx(bodyH + 7, 1)}" width="8" height="14" fill="#c9d1d9">${blink}`,
  ];
}

export function renderSvg(cells, opts) {
  const l = layoutFor(opts);
  const bodyH = l.top + l.textH;
  const height = bodyH + 43;
  return [
    ...header(l.width, height, opts.title),
    ...cells.map((r, i) => row(i, r, l, opts)),
    ...footer(l.width, bodyH, l.pad, opts.name, opts.animate),
    "</svg>",
  ].join("");
}

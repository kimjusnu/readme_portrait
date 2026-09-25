import { clahe } from "./clahe.js";

// Image pixels → character cells. Mirrors reference/portrait.py step by step,
// reimplementing the Pillow operations it uses so the output matches closely.

export const RAMP = ".:-=+*cs#%@"; // dark → bright; no blank so every cell carries colour

export const CARDS = {
  card: { width: 560, textW: 520, textH: 555 },
  wide: { width: 880, textW: 840, textH: 420 },
};

export const DEFAULTS = Object.freeze({
  card: "card",
  cols: 110,
  colorMode: "color",
  contrast: "global", // "global" = histogram equalisation, "local" = CLAHE, "none"
  saturation: 1.3,
  brightness: 1.6,
  cropTop: 0.02, // crop starts this far down the image (fraction of height)
  cropX: 0.5, // horizontal centre of the crop (fraction of width)
  zoom: 1,
  title: "user",
  name: "user",
  animate: true,
  anim: "type", // entrance style, see js/anim.js
  step: 0.07, // seconds per typed line
});

const CROP_HEIGHT = 0.88;
// Row count per column at the reference size (62 rows for 110 cols on 520×555)
const ROW_RATIO = (62 * 520) / (110 * 555);

export function layoutFor(opts) {
  const card = CARDS[opts.card] || CARDS.card;
  const cols = opts.cols;
  const rows = Math.max(1, Math.round(cols * (card.textH / card.textW) * ROW_RATIO));
  const charW = card.textW / cols;
  const lineH = card.textH / rows;
  return { ...card, cols, rows, charW, lineH, fontSize: lineH * 0.86, top: 37, pad: 20 };
}

export function rgbaToRgb(rgba) {
  const out = new Uint8Array((rgba.length / 4) * 3);
  for (let i = 0, j = 0; i < rgba.length; i += 4, j += 3) {
    out[j] = rgba[i];
    out[j + 1] = rgba[i + 1];
    out[j + 2] = rgba[i + 2];
  }
  return out;
}

// Pillow convert("L"): ITU-R 601-2 with 16-bit fixed point
export function toLuma(rgb) {
  const out = new Uint8Array(rgb.length / 3);
  for (let i = 0, j = 0; j < out.length; i += 3, j += 1) {
    out[j] = (rgb[i] * 19595 + rgb[i + 1] * 38470 + rgb[i + 2] * 7471 + 0x8000) >> 16;
  }
  return out;
}

// Pillow ImageOps.equalize: histogram → cumulative lookup table
export function equalize(lum) {
  const hist = new Array(256).fill(0);
  for (const v of lum) hist[v] += 1;
  const used = hist.filter(Boolean);
  const step = used.length <= 1 ? 0 : Math.floor((used.reduce((a, b) => a + b, 0) - used[used.length - 1]) / 255);
  if (!step) return Uint8Array.from(lum);
  const lut = new Uint8Array(256);
  let n = Math.floor(step / 2);
  for (let i = 0; i < 256; i += 1) {
    lut[i] = Math.min(255, Math.floor(n / step));
    n += hist[i];
  }
  return lum.map((v) => lut[v]);
}

// Pillow ImageEnhance.Color then Brightness: both are Image.blend with truncation
export function enhance(rgb, { saturation, brightness }) {
  const gray = toLuma(rgb);
  const out = new Uint8Array(rgb.length);
  const s = Math.fround(saturation);
  const b = Math.fround(brightness);
  for (let i = 0; i < rgb.length; i += 1) {
    const g = gray[(i / 3) | 0];
    const sat = blend(g, rgb[i], s);
    out[i] = blend(0, sat, b);
  }
  return out;
}

function blend(a, b, alpha) {
  const t = Math.fround(a + alpha * (b - a));
  if (t <= 0) return 0;
  if (t >= 255) return 255;
  return Math.trunc(t);
}

// zoom shrinks the window around its centre; cropX (0–1) picks the horizontal centre
export function cropBox(w, h, layout, cropTop, { zoom = 1, cropX = 0.5 } = {}) {
  const aspect = layout.textW / layout.textH;
  let ch = h * CROP_HEIGHT;
  if (ch * aspect > w) ch = w / aspect;
  ch /= Math.max(1, zoom);
  const cw = ch * aspect;
  const left = Math.min(Math.max(0, w * cropX - cw / 2), w - cw);
  const top = Math.min(Math.max(0, h * cropTop), h - ch);
  const x = Math.trunc(left);
  const y = Math.trunc(top);
  return { x, y, w: Math.trunc(left + cw) - x, h: Math.trunc(top + ch) - y };
}

export function crop(rgb, width, box) {
  const out = new Uint8Array(box.w * box.h * 3);
  for (let y = 0; y < box.h; y += 1) {
    const from = ((box.y + y) * width + box.x) * 3;
    out.set(rgb.subarray(from, from + box.w * 3), y * box.w * 3);
  }
  return out;
}

// ---- Pillow-compatible Lanczos resampling (Resample.c, 8-bit fixed point) ----

const PRECISION_BITS = 32 - 8 - 2;
const ONE = 2 ** PRECISION_BITS;

function sinc(x) {
  if (x === 0) return 1;
  const px = Math.PI * x;
  return Math.sin(px) / px;
}

function lanczos(x) {
  return x >= -3 && x < 3 ? sinc(x) * sinc(x / 3) : 0;
}

function coefficients(inSize, outSize) {
  const scale = inSize / outSize;
  const filterScale = Math.max(scale, 1);
  const ss = 1 / filterScale;
  const support = 3 * filterScale;
  return Array.from({ length: outSize }, (_, xx) => {
    const center = (xx + 0.5) * scale;
    const xmin = Math.max(0, Math.trunc(center - support + 0.5));
    const xmax = Math.min(inSize, Math.trunc(center + support + 0.5)) - xmin;
    const raw = Array.from({ length: xmax }, (_, x) => lanczos((x + xmin - center + 0.5) * ss));
    const total = raw.reduce((a, b) => a + b, 0);
    const weights = raw.map((k) => {
      const v = (total !== 0 ? k / total : k) * ONE;
      return v < 0 ? Math.trunc(v - 0.5) : Math.trunc(v + 0.5);
    });
    return { xmin, weights };
  });
}

function clip8(sum) {
  const v = Math.floor(sum / ONE);
  return v < 0 ? 0 : v > 255 ? 255 : v;
}

function pass(src, lines, inStride, outCount, channels, coeffs, horizontal) {
  const out = new Uint8Array(lines * outCount * channels);
  for (let line = 0; line < lines; line += 1) {
    for (let o = 0; o < outCount; o += 1) {
      const { xmin, weights } = coeffs[o];
      for (let c = 0; c < channels; c += 1) {
        let sum = ONE / 2;
        for (let k = 0; k < weights.length; k += 1) {
          const idx = horizontal
            ? (line * inStride + xmin + k) * channels + c
            : ((xmin + k) * inStride + line) * channels + c;
          sum += src[idx] * weights[k];
        }
        const dst = horizontal ? (line * outCount + o) * channels + c : (o * inStride + line) * channels + c;
        out[dst] = clip8(sum);
      }
    }
  }
  return out;
}

export function resize(data, w, h, channels, nw, nh) {
  const horiz = nw === w ? data : pass(data, h, w, nw, channels, coefficients(w, nw), true);
  return nh === h ? horiz : pass(horiz, nw, nw, nh, channels, coefficients(h, nh), false);
}

// ---- cells ----

const MONO = { gray: [255, 255, 255], green: [63, 185, 80], amber: [255, 176, 0] };

function hex3(r, g, b) {
  return `#${(r >> 4).toString(16)}${(g >> 4).toString(16)}${(b >> 4).toString(16)}`;
}

function fillFor(mode, rgb, i, level) {
  if (mode === "color") return hex3(rgb[i], rgb[i + 1], rgb[i + 2]);
  const base = MONO[mode] || MONO.gray;
  const k = 0.35 + (0.65 * level) / 255; // keep dark cells readable on the dark card
  return hex3(...base.map((v) => Math.round(v * k)));
}

function contrasted(luma, box, mode) {
  if (mode === "local") return clahe(luma, box.w, box.h);
  if (mode === "none") return luma;
  return equalize(luma);
}

// Every intermediate stage, so the page can show the pipeline and not just the result
export function analyze(rgb, w, h, opts) {
  const layout = layoutFor(opts);
  const box = cropBox(w, h, layout, opts.cropTop, opts);
  const cropped = crop(rgb, w, box);
  const luma = toLuma(cropped);
  const contrast = contrasted(luma, box, opts.contrast);
  const lum = resize(contrast, box.w, box.h, 1, layout.cols, layout.rows);
  const color = resize(enhance(cropped, opts), box.w, box.h, 3, layout.cols, layout.rows);
  const last = RAMP.length - 1;
  const cells = Array.from({ length: layout.rows }, (_, y) => Array.from({ length: layout.cols }, (_, x) => {
    const p = y * layout.cols + x;
    const level = lum[p];
    return [RAMP[Math.floor((level * last) / 255)], fillFor(opts.colorMode, color, p * 3, level)];
  }));
  return { layout, box, cropped, luma, contrast, lum, color, cells };
}

export function toCells(rgb, w, h, opts) {
  return analyze(rgb, w, h, opts).cells;
}

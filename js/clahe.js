// Contrast Limited Adaptive Histogram Equalisation, following OpenCV's implementation
// (imgproc/src/clahe.cpp): per-tile clipped histograms, then bilinear blending between tiles.
// Global equalisation lets a bright background eat the ramp; per-tile equalisation keeps
// facial detail readable.

// OpenCV pads to a multiple of the tile count with BORDER_REFLECT_101
function reflect101(i, n) {
  if (n === 1) return 0;
  let v = i;
  while (v < 0 || v >= n) v = v < 0 ? -v : 2 * n - 2 - v;
  return v;
}

// cvRound: round half to even, as saturate_cast<uchar>(float) does
function rint(v) {
  const f = Math.floor(v);
  const d = v - f;
  const n = d > 0.5 || (d === 0.5 && f % 2 !== 0) ? f + 1 : f;
  return Math.min(255, Math.max(0, n));
}

function tileLut(lum, w, h, x0, y0, tw, th, clipFactor) {
  const hist = new Int32Array(256);
  for (let y = y0; y < y0 + th; y += 1) {
    const row = reflect101(y, h) * w;
    for (let x = x0; x < x0 + tw; x += 1) hist[lum[row + reflect101(x, w)]] += 1;
  }
  const area = tw * th;
  const limit = Math.max(Math.trunc((clipFactor * area) / 256), 1);
  let clipped = 0;
  for (let i = 0; i < 256; i += 1) {
    if (hist[i] > limit) {
      clipped += hist[i] - limit;
      hist[i] = limit;
    }
  }
  const batch = Math.trunc(clipped / 256);
  let residual = clipped - batch * 256;
  for (let i = 0; i < 256; i += 1) hist[i] += batch;
  if (residual) {
    const step = Math.max(Math.trunc(256 / residual), 1);
    for (let i = 0; i < 256 && residual > 0; i += step, residual -= 1) hist[i] += 1;
  }
  const lut = new Uint8Array(256);
  const scale = Math.fround(255 / area);
  let sum = 0;
  for (let i = 0; i < 256; i += 1) {
    sum += hist[i];
    lut[i] = rint(Math.fround(sum * scale));
  }
  return lut;
}

function axis(size, tiles, tileSize) {
  const inv = Math.fround(1 / tileSize);
  return Array.from({ length: size }, (_, p) => {
    const f = Math.fround(p * inv - 0.5);
    const t1 = Math.floor(f);
    const a = Math.fround(f - t1);
    return { t1: Math.max(t1, 0), t2: Math.min(t1 + 1, tiles - 1), a, a1: Math.fround(1 - a) };
  });
}

export function clahe(lum, w, h, { clipLimit = 2, tiles = 8 } = {}) {
  const tw = Math.ceil(w / tiles);
  const th = Math.ceil(h / tiles);
  const luts = Array.from({ length: tiles * tiles }, (_, i) =>
    tileLut(lum, w, h, (i % tiles) * tw, Math.floor(i / tiles) * th, tw, th, clipLimit));
  const xs = axis(w, tiles, tw);
  const ys = axis(h, tiles, th);
  const out = new Uint8Array(lum.length);
  for (let y = 0; y < h; y += 1) {
    const { t1: ty1, t2: ty2, a: ya, a1: ya1 } = ys[y];
    for (let x = 0; x < w; x += 1) {
      const { t1: tx1, t2: tx2, a: xa, a1: xa1 } = xs[x];
      const v = lum[y * w + x];
      // float32 at every step, like OpenCV's CLAHE_Interpolation_Body
      const f = Math.fround;
      const top = f(f(luts[ty1 * tiles + tx1][v] * xa1) + f(luts[ty1 * tiles + tx2][v] * xa));
      const bottom = f(f(luts[ty2 * tiles + tx1][v] * xa1) + f(luts[ty2 * tiles + tx2][v] * xa));
      out[y * w + x] = rint(f(f(top * ya1) + f(bottom * ya)));
    }
  }
  return out;
}

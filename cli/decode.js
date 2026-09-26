// Image bytes → RGB pixels for Node, matching what the browser page feeds the converter:
// transparent areas are laid over the card background, and very large images are shrunk first.
import { PNG } from "pngjs";
import jpeg from "jpeg-js";
import { resize } from "../js/convert.js";

const BG = [0x0d, 0x11, 0x17];
const MAX_SIDE = 1200;

export class DecodeError extends Error {}

function sniff(bytes) {
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "png";
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return "jpeg";
  if (bytes.subarray(8, 12).toString("latin1") === "WEBP") return "webp";
  return "unknown";
}

function toRgb(rgba) {
  const out = new Uint8Array((rgba.length / 4) * 3);
  for (let i = 0, j = 0; i < rgba.length; i += 4, j += 3) {
    const a = rgba[i + 3] / 255;
    for (let c = 0; c < 3; c += 1) out[j + c] = Math.round(rgba[i + c] * a + BG[c] * (1 - a));
  }
  return out;
}

// 16-bit PNGs: browsers and Pillow keep the high byte; pngjs would round (v*255/65535) and drift by 1
function readPng(bytes) {
  const png = PNG.sync.read(bytes, { skipRescale: true });
  if (png.depth !== 16) return png;
  const data = new Uint8Array(png.data.length);
  for (let i = 0; i < data.length; i += 1) data[i] = png.data[i] >> 8;
  return { width: png.width, height: png.height, data };
}

export function decode(bytes) {
  const kind = sniff(bytes);
  let image;
  if (kind === "png") image = readPng(bytes);
  else if (kind === "jpeg") image = jpeg.decode(bytes, { useTArray: true, formatAsRGBA: true });
  else if (kind === "webp") throw new DecodeError("WebP is not supported by the CLI yet; convert it to PNG or JPEG");
  else throw new DecodeError("unrecognised image format (use PNG or JPEG)");
  let rgb = toRgb(image.data);
  let { width: w, height: h } = image;
  const scale = Math.min(1, MAX_SIDE / Math.max(w, h));
  if (scale < 1) {
    const nw = Math.max(1, Math.round(w * scale));
    const nh = Math.max(1, Math.round(h * scale));
    rgb = resize(rgb, w, h, 3, nw, nh);
    [w, h] = [nw, nh];
  }
  return { rgb, w, h };
}

// Getting pixels: files stay local; GitHub usernames go through the public API for the avatar URL only.
import { rgbaToRgb } from "./convert.js";

const MAX_SIDE = 1200; // larger photos are pre-shrunk so conversion stays fast
const USERNAME = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;
const TYPES = ["image/png", "image/jpeg", "image/webp"];

export class InputError extends Error {}

export function isValidUsername(id) {
  return USERNAME.test(id);
}

export async function pixelsFromBlob(blob) {
  if (blob.type && !TYPES.includes(blob.type)) throw new InputError("type");
  let bitmap;
  try {
    bitmap = await createImageBitmap(blob, { colorSpaceConversion: "none", premultiplyAlpha: "none" });
  } catch {
    throw new InputError("decode");
  }
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.fillStyle = "#0d1117"; // transparent areas blend into the card background
  ctx.fillRect(0, 0, w, h);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  return { rgb: rgbaToRgb(ctx.getImageData(0, 0, w, h).data), w, h };
}

export async function avatarBlob(id) {
  if (!isValidUsername(id)) throw new InputError("username");
  let res;
  try {
    res = await fetch(`https://api.github.com/users/${encodeURIComponent(id)}`, {
      headers: { Accept: "application/vnd.github+json" },
    });
  } catch {
    throw new InputError("network");
  }
  if (res.status === 404) throw new InputError("notFound");
  if (res.status === 403 || res.status === 429) throw new InputError("rateLimit");
  if (!res.ok) throw new InputError("network");
  const { avatar_url: url } = await res.json();
  if (typeof url !== "string" || !url.startsWith("https://avatars.githubusercontent.com/")) throw new InputError("network");
  const img = await fetch(`${url}${url.includes("?") ? "&" : "?"}s=460`).catch(() => null);
  if (!img || !img.ok) throw new InputError("network");
  return img.blob();
}

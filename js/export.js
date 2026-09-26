// PNG and GIF export. GIF frames come from the browser's own SMIL engine: the SVG is mounted
// off-screen, paused, moved to time t, and every animated value is read back and baked into a
// static copy. That way each style exports exactly as it plays in a README.
import { GIFEncoder, quantize, applyPalette } from "./vendor/gifenc.esm.js";
import { animationLength, frameTimes } from "./timeline.js";

const HOLD_MS = 2500; // the finished portrait stays up before the GIF loops

function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), { href: url, download: filename });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function rasterize(svgText, scale) {
  const url = URL.createObjectURL(new Blob([svgText], { type: "image/svg+xml" }));
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function exportPng(staticSvg) {
  const canvas = await rasterize(staticSvg, 2);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  download(blob, "portrait.png");
  return blob.size;
}

// Current value of whatever an <animate>/<animateTransform> drives on its parent
function animatedValue(anim) {
  const el = anim.parentElement;
  const attr = anim.getAttribute("attributeName");
  if (anim.localName === "animateTransform") {
    // animVal is read-only (no consolidate()), so multiply the items into one matrix
    const list = el.transform.animVal;
    if (!list.numberOfItems) return null;
    let m = new DOMMatrix();
    for (let i = 0; i < list.numberOfItems; i += 1) m = m.multiply(list.getItem(i).matrix);
    return `matrix(${m.a} ${m.b} ${m.c} ${m.d} ${m.e} ${m.f})`;
  }
  if (el[attr]?.animVal !== undefined) return String(el[attr].animVal.value);
  return getComputedStyle(el).getPropertyValue(attr);
}

function mount(svgText) {
  const host = Object.assign(document.createElement("div"), { ariaHidden: "true" });
  host.style.cssText = "position:fixed;left:-10000px;top:0;visibility:hidden;pointer-events:none";
  const svg = document.importNode(new DOMParser().parseFromString(svgText, "image/svg+xml").documentElement, true);
  host.append(svg);
  document.body.append(host);
  svg.pauseAnimations();
  return { svg, remove: () => host.remove() };
}

function bake(live, t) {
  live.setCurrentTime(t);
  const values = [...live.querySelectorAll("animate, animateTransform")].map(animatedValue);
  const copy = live.cloneNode(true);
  [...copy.querySelectorAll("animate, animateTransform")].forEach((anim, i) => {
    const target = anim.parentElement;
    // looping animations (the cursor blink) keep their static, visible state
    if (values[i] !== null && !anim.hasAttribute("repeatCount")) target.setAttribute(anim.getAttribute("attributeName"), values[i]);
    anim.remove();
  });
  return new XMLSerializer().serializeToString(copy);
}

export async function exportGif(svgText, { fps = 12, onProgress = () => {} } = {}) {
  const times = frameTimes(animationLength(svgText), fps);
  const { svg, remove } = mount(svgText);
  const gif = GIFEncoder();
  try {
    for (const [i, t] of times.entries()) {
      const canvas = await rasterize(bake(svg, t), 1);
      const { data } = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height);
      const palette = quantize(data, 256);
      const delay = i === times.length - 1 ? HOLD_MS : Math.round(1000 / fps);
      gif.writeFrame(applyPalette(data, palette), canvas.width, canvas.height, { palette, delay });
      onProgress(i + 1, times.length);
      await new Promise((resolve) => setTimeout(resolve)); // keep the page responsive
    }
  } finally {
    remove();
  }
  gif.finish();
  const blob = new Blob([gif.bytes()], { type: "image/gif" });
  download(blob, "portrait.gif");
  return blob.size;
}

// Crop-frame maths for dragging and zooming, kept free of DOM so it can be tested.
import { cropBox, layoutFor } from "./convert.js";

const round = (v) => Math.round(v * 1000) / 1000;

// Snap options to what cropBox actually produces, so stored values never drift past an edge
function settle(w, h, opts) {
  const box = cropBox(w, h, layoutFor(opts), opts.cropTop, opts);
  return { cropX: round((box.x + box.w / 2) / w), cropTop: round(box.y / h), zoom: opts.zoom };
}

export function moveFrame(w, h, opts, dx, dy) {
  return settle(w, h, { ...opts, cropX: opts.cropX + dx / w, cropTop: opts.cropTop + dy / h });
}

export function zoomFrame(opts, factor) {
  return { zoom: round(Math.min(4, Math.max(1, opts.zoom * factor))) };
}

export function frameBox(w, h, opts) {
  return cropBox(w, h, layoutFor(opts), opts.cropTop, opts);
}

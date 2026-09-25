// Source window: the original image with a draggable crop frame.
import { frameBox, moveFrame, zoomFrame } from "./frame.js";

const MAX_W = 640;

export function mountSource(canvas, store) {
  const ctx = canvas.getContext("2d");
  let drag = null;

  function draw() {
    const { pixels, opts } = store.get();
    if (!pixels) return;
    const scale = Math.min(1, MAX_W / pixels.w);
    const cw = Math.round(pixels.w * scale);
    const ch = Math.round(pixels.h * scale);
    if (canvas.width !== cw || canvas.height !== ch) {
      canvas.width = cw;
      canvas.height = ch;
    }
    ctx.drawImage(pixels.canvas, 0, 0, cw, ch);
    const b = frameBox(pixels.w, pixels.h, opts);
    const [x, y, w, h] = [b.x * scale, b.y * scale, b.w * scale, b.h * scale];
    ctx.fillStyle = "rgba(32, 32, 32, 0.55)"; // dim everything outside the frame
    ctx.fillRect(0, 0, cw, y);
    ctx.fillRect(0, y + h, cw, ch - y - h);
    ctx.fillRect(0, y, x, h);
    ctx.fillRect(x + w, y, cw - x - w, h);
    ctx.strokeStyle = "#1fd466";
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
    ctx.fillStyle = "#1fd466";
    for (const [hx, hy] of [[x, y], [x + w, y], [x, y + h], [x + w, y + h]]) ctx.fillRect(hx - 4, hy - 4, 8, 8);
  }

  // Pointer deltas are in CSS pixels; convert to image pixels
  const toImage = (px) => {
    const { pixels } = store.get();
    return (px * pixels.w) / canvas.getBoundingClientRect().width;
  };

  function move(dxImg, dyImg) {
    const { pixels, opts } = store.get();
    store.setOpts(moveFrame(pixels.w, pixels.h, opts, dxImg, dyImg));
  }

  canvas.addEventListener("pointerdown", (e) => {
    if (!store.get().pixels) return;
    drag = { x: e.clientX, y: e.clientY };
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!drag) return;
    move(toImage(e.clientX - drag.x), toImage(e.clientY - drag.y));
    drag = { x: e.clientX, y: e.clientY };
  });
  const end = () => { drag = null; };
  canvas.addEventListener("pointerup", end);
  canvas.addEventListener("pointercancel", end);
  canvas.addEventListener("wheel", (e) => {
    if (!store.get().pixels) return;
    e.preventDefault();
    store.setOpts(zoomFrame(store.get().opts, e.deltaY < 0 ? 1.08 : 1 / 1.08));
  }, { passive: false });
  canvas.addEventListener("keydown", (e) => {
    const { pixels } = store.get();
    if (!pixels) return;
    const step = Math.max(pixels.w, pixels.h) * 0.02;
    const moves = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    if (moves[e.key]) move(...moves[e.key]);
    else if (e.key === "+" || e.key === "=") store.setOpts(zoomFrame(store.get().opts, 1.1));
    else if (e.key === "-") store.setOpts(zoomFrame(store.get().opts, 1 / 1.1));
    else return;
    e.preventDefault();
  });

  return { draw };
}

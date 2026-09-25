// Pipeline window: draws each intermediate stage of analyze() so users see what the converter does.
const $ = (id) => document.getElementById(id);

function paint(canvas, w, h, fill) {
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  const img = ctx.createImageData(w, h);
  for (let i = 0; i < w * h; i += 1) {
    const [r, g, b] = fill(i);
    img.data.set([r, g, b, 255], i * 4);
  }
  ctx.putImageData(img, 0, 0);
}

const gray = (data) => (i) => [data[i], data[i], data[i]];

function hexToRgb(hex) {
  return [1, 2, 3].map((k) => parseInt(hex[k], 16) * 17);
}

export function drawPipeline(result, opts, timing) {
  const { box, cropped, luma, contrast, layout, cells } = result;
  paint($("st-crop"), box.w, box.h, (i) => [cropped[i * 3], cropped[i * 3 + 1], cropped[i * 3 + 2]]);
  paint($("st-luma"), box.w, box.h, gray(luma));
  paint($("st-contrast"), box.w, box.h, gray(contrast));
  const flat = cells.flat();
  paint($("st-cells"), layout.cols, layout.rows, (i) => hexToRgb(flat[i][1]));
  $("st-crop-d").textContent = `${box.w}×${box.h}px`;
  $("st-contrast-d").textContent = { global: "equalize", local: "CLAHE 8×8", none: "off" }[opts.contrast];
  $("st-cells-d").textContent = `${layout.cols}×${layout.rows}`;
  $("timing").textContent = `convert ${timing.convert.toFixed(0)} ms · svg ${timing.svg.toFixed(0)} ms`;
}

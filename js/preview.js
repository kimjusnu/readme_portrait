// Preview window: shows the SVG through <img>, exactly how GitHub will load it.
const $ = (id) => document.getElementById(id);
let urls = [];
let lastShown = "";

function blobUrl(text) {
  const url = URL.createObjectURL(new Blob([text], { type: "image/svg+xml" }));
  urls.push(url);
  return url;
}

export function showPreview({ svg, shown, layout, name, label }) {
  const old = urls;
  urls = [];
  const preview = $("preview");
  lastShown = shown;
  preview.src = blobUrl(shown);
  preview.width = layout.width;
  preview.height = layout.top + layout.textH + 43;
  preview.alt = `ASCII portrait of ${name}`;
  const download = $("download");
  download.href = svg === shown ? preview.src : blobUrl(svg);
  download.removeAttribute("aria-disabled");
  $("pv-meta").textContent = label;
  old.forEach((u) => URL.revokeObjectURL(u));
  return Math.round(new Blob([svg]).size / 102.4) / 10;
}

// A fresh URL restarts SMIL; reusing the same one would keep the finished frame.
// Replay URLs join `urls`, so the next showPreview revokes them.
export function replay() {
  const preview = $("preview");
  preview.src = lastShown ? blobUrl(lastShown) : `${preview.src.split("?")[0]}?replay=${Date.now()}`;
}

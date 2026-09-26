// Portrait SVGs for the demo video, drawn by the same converter as the site and CLI.
// Usage: node scripts/make-data.mjs   → src/portraits.json
import { readFileSync, writeFileSync } from "node:fs";
import { DEFAULTS, toCells } from "../../js/convert.js";
import { renderSvg } from "../../js/svg.js";
import { decode } from "../../cli/decode.js";

const root = new URL("../../", import.meta.url);
const classics = JSON.parse(readFileSync(new URL("assets/classics/classics.json", root), "utf8"));

function draw(slug, extra = {}) {
  const item = classics.find((c) => c.slug === slug);
  const { rgb, w, h } = decode(readFileSync(new URL(`assets/classics/${slug}.jpg`, root)));
  const opts = { ...DEFAULTS, ...item.options, title: item.handle, name: item.handle, ...extra };
  return renderSvg(toCells(rgb, w, h, opts), opts);
}

const data = {
  gallery: ["mona_lisa", "anime_dev", "blue_marble"].map((slug) => ({ slug, svg: draw(slug) })),
  styles: ["type", "reveal", "scan", "matrix"].map((anim) => ({ anim, svg: draw("anime_hacker", { anim }) })),
};
writeFileSync(new URL("../src/portraits.json", import.meta.url), JSON.stringify(data));
console.log("portraits.json", (JSON.stringify(data).length / 1024).toFixed(0), "KB");

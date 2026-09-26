#!/usr/bin/env node
// readme-portrait: the site's converter on the command line.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { parseArgs } from "node:util";
import { DEFAULTS, toCells } from "../js/convert.js";
import { renderSvg } from "../js/svg.js";
import { decodeShare } from "../js/share.js";
import { decode, DecodeError } from "../cli/decode.js";

const USAGE = `Usage: readme-portrait <github-username | image.png | image.jpg> [options]

Options:
  -o, --out <file>        output SVG (default: assets/portrait.svg)
      --cols <60-160>     columns (default 110)
      --contrast <mode>   global | local | none (default global)
      --color <mode>      color | gray | green | amber (default color)
      --style <style>     type | reveal | scan | matrix (default type)
      --card <size>       card (560x635) | wide (880x500)
      --brightness <n>    0.6-2.6 (default 1.6)
      --saturation <n>    0-2.5 (default 1.3)
      --zoom <n>          1-4 (default 1)
      --crop-x <n>        0-1 horizontal centre of the crop (default 0.5)
      --crop-top <n>      0-1 top of the crop (default 0.02)
      --step <s>          seconds per typed line, 0.02-0.2 (default 0.07)
      --name <name>       whoami name and window title (default: the username)
      --title <name>      window title only
      --no-animate        static SVG
  -h, --help              show this help

Examples:
  npx readme-portrait octocat
  npx readme-portrait me.jpg --style matrix --contrast local -o assets/portrait.svg`;

// CLI flag → [share-link key, option key]: both entry points share one validator (js/share.js)
const FLAGS = {
  cols: ["cols", "cols"], contrast: ["ct", "contrast"], color: ["m", "colorMode"], style: ["an", "anim"],
  card: ["card", "card"], brightness: ["b", "brightness"], saturation: ["s", "saturation"], zoom: ["z", "zoom"],
  "crop-x": ["x", "cropX"], "crop-top": ["y", "cropTop"], step: ["sp", "step"], name: ["n", "name"], title: ["t", "title"],
};

class UsageError extends Error {}

function options(values) {
  const query = new URLSearchParams();
  for (const [flag, [key]] of Object.entries(FLAGS)) if (values[flag] !== undefined) query.set(key, values[flag]);
  if (values["no-animate"]) query.set("a", "0");
  const { opts } = decodeShare(`?${query}`);
  // the validator drops bad values silently; on the command line that should be an error
  const bad = Object.entries(FLAGS).filter(([flag, [, key]]) => values[flag] !== undefined && !(key in opts)).map(([flag]) => `--${flag}`);
  if (bad.length) throw new UsageError(`invalid value for ${bad.join(", ")} (see --help)`);
  return opts;
}

async function fetchAvatar(id) {
  const res = await fetch(`https://api.github.com/users/${encodeURIComponent(id)}`, { headers: { Accept: "application/vnd.github+json" } });
  if (res.status === 404) throw new UsageError(`GitHub user not found: ${id}`);
  if (!res.ok) throw new Error(`GitHub API ${res.status}`);
  const { avatar_url: url } = await res.json();
  const img = await fetch(`${url}${url.includes("?") ? "&" : "?"}s=460`);
  if (!img.ok) throw new Error(`avatar download ${img.status}`);
  return Buffer.from(await img.arrayBuffer());
}

const looksLikeFile = (input) => /\.(png|jpe?g|webp)$/i.test(input) || /[\\/]/.test(input);

async function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      out: { type: "string", short: "o", default: "assets/portrait.svg" },
      help: { type: "boolean", short: "h" },
      "no-animate": { type: "boolean" },
      ...Object.fromEntries(Object.keys(FLAGS).map((flag) => [flag, { type: "string" }])),
    },
  });
  if (values.help || positionals.length !== 1) {
    (values.help ? console.log : console.error)(USAGE);
    return values.help ? 0 : 2;
  }
  const [input] = positionals;
  const opts = options(values);
  const bytes = looksLikeFile(input) ? readFileSync(input) : await fetchAvatar(input);
  const who = opts.name || (looksLikeFile(input) ? "user" : input);
  const final = { ...DEFAULTS, title: who, name: who, ...opts };
  const { rgb, w, h } = decode(bytes);
  const svg = renderSvg(toCells(rgb, w, h, final), final);
  mkdirSync(dirname(values.out), { recursive: true });
  writeFileSync(values.out, svg);
  console.log(`wrote ${values.out} (${(Buffer.byteLength(svg) / 1024).toFixed(1)} KB)`);
  return 0;
}

main().then((code) => { process.exitCode = code; }).catch((err) => {
  const expected = err instanceof UsageError || err instanceof DecodeError || err.code === "ENOENT" || err.code?.startsWith?.("ERR_PARSE_ARGS");
  console.error(`readme-portrait: ${expected ? err.message : err.stack}`);
  process.exitCode = expected ? 2 : 1;
});

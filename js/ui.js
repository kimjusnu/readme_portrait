import { DEFAULTS, toCells, cropBox, layoutFor } from "./convert.js";
import { renderSvg } from "./svg.js";
import { pixelsFromBlob, avatarBlob, InputError } from "./image.js";
import { readmeSnippet, aiPrompt } from "./snippets.js";
import { applyLang, initialLang, saveLang, currentLang, msg } from "./i18n.js";

const $ = (id) => document.getElementById(id);
const LIMIT_KB = 300;
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

let pixels = null;
let username = "";
let urls = [];
let timer = 0;

function readOptions() {
  return {
    ...DEFAULTS,
    card: $("card").value,
    cols: Number($("cols").value),
    colorMode: $("colorMode").value,
    equalize: $("equalize").checked,
    brightness: Number($("brightness").value),
    saturation: Number($("saturation").value),
    cropTop: Number($("cropTop").value),
    title: $("title").value.trim() || "user",
    name: $("name").value.trim() || "user",
    animate: $("animate").checked,
    step: Number($("step").value),
  };
}

function setStatus(text, kind = "") {
  const el = $("status");
  el.textContent = text;
  el.className = `status ${kind}`.trim();
}

function blobUrl(text) {
  const url = URL.createObjectURL(new Blob([text], { type: "image/svg+xml" }));
  urls.push(url);
  return url;
}

function render() {
  if (!pixels) return;
  const opts = readOptions();
  const cells = toCells(pixels.rgb, pixels.w, pixels.h, opts);
  const svg = renderSvg(cells, opts);
  const shown = reducedMotion.matches && opts.animate ? renderSvg(cells, { ...opts, animate: false }) : svg;
  const old = urls;
  urls = [];
  const preview = $("preview");
  const l = layoutFor(opts);
  preview.src = blobUrl(shown);
  preview.width = l.width;
  preview.height = l.top + l.textH + 43;
  preview.alt = `ASCII portrait of ${opts.name}`;
  const download = $("download");
  download.href = svg === shown ? preview.src : blobUrl(svg);
  download.removeAttribute("aria-disabled");
  old.forEach((u) => URL.revokeObjectURL(u));
  const kb = Math.round(new Blob([svg]).size / 102.4) / 10;
  $("size").textContent = `${kb} KB`;
  if (kb > LIMIT_KB) setStatus(msg("tooBig", kb), "warn");
  else setStatus(msg("ready", kb));
  const caption = $("caption");
  delete caption.dataset.i18n;
  caption.textContent = msg("caption");
}

function schedule() {
  clearTimeout(timer);
  timer = setTimeout(render, 150);
}

function updateCropRange() {
  const input = $("cropTop");
  if (!pixels) return;
  const box = cropBox(pixels.w, pixels.h, layoutFor(readOptions()), 0);
  const max = Math.max(0, Math.floor(((pixels.h - box.h) / pixels.h) * 100) / 100);
  input.max = String(max);
  if (Number(input.value) > max) input.value = String(max);
  markCropPreset();
}

function cropPresetValue(name) {
  const max = Number($("cropTop").max);
  return { top: Math.min(DEFAULTS.cropTop, max), center: Math.round((max / 2) * 100) / 100, bottom: max }[name];
}

function markCropPreset() {
  const value = Number($("cropTop").value);
  for (const b of document.querySelectorAll("[data-crop]")) {
    b.setAttribute("aria-pressed", String(cropPresetValue(b.dataset.crop) === value));
  }
}

function updateOutputs() {
  for (const id of ["cols", "brightness", "saturation", "step"]) $(`${id}-out`).textContent = $(id).value;
  $("step").disabled = !$("animate").checked;
  const credit = $("credit").checked;
  $("code-half").textContent = readmeSnippet("49%", credit);
  $("code-full").textContent = readmeSnippet("100%", credit);
  $("ai-prompt").textContent = aiPrompt(username, readmeSnippet("49%", credit));
}

async function load(getBlob) {
  setStatus(msg("loading"));
  $("gh-go").disabled = true;
  try {
    pixels = await pixelsFromBlob(await getBlob());
    $("options").disabled = false;
    updateCropRange();
    render();
  } catch (err) {
    const key = err instanceof InputError ? err.message : "decode";
    setStatus(msg(key), "error");
  } finally {
    $("gh-go").disabled = false;
  }
}

function loadUsername(id) {
  username = id;
  $("title").value = id;
  $("name").value = id;
  updateOutputs();
  return load(() => avatarBlob(id));
}

async function copy(id) {
  const text = $(id).textContent;
  try {
    await navigator.clipboard.writeText(text);
    setStatus(msg("copied"));
  } catch {
    const range = document.createRange();
    range.selectNodeContents($(id));
    getSelection().removeAllRanges();
    getSelection().addRange(range);
    setStatus(msg("copyFailed"), "error");
  }
}

function bindInputs() {
  $("gh-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const id = $("gh-id").value.trim();
    if (id) loadUsername(id);
    else $("gh-id").focus();
  });
  $("file").addEventListener("change", (e) => {
    const [file] = e.target.files;
    if (file) load(() => file);
  });
  const drop = $("drop");
  drop.addEventListener("dragover", (e) => {
    e.preventDefault();
    drop.classList.add("over");
  });
  drop.addEventListener("dragleave", () => drop.classList.remove("over"));
  drop.addEventListener("drop", (e) => {
    e.preventDefault();
    drop.classList.remove("over");
    const [file] = e.dataTransfer.files;
    if (file) load(() => file);
  });
}

function bindOptions() {
  $("options").addEventListener("input", () => {
    updateOutputs();
    markCropPreset();
    schedule();
  });
  $("card").addEventListener("change", () => {
    updateCropRange();
    schedule();
  });
  for (const b of document.querySelectorAll("[data-crop]")) {
    b.addEventListener("click", () => {
      $("cropTop").value = String(cropPresetValue(b.dataset.crop));
      markCropPreset();
      schedule();
    });
  }
  $("credit").addEventListener("change", updateOutputs);
  reducedMotion.addEventListener("change", render);
}

function bindOutputs() {
  for (const b of document.querySelectorAll("[data-copy]")) b.addEventListener("click", () => copy(b.dataset.copy));
  $("download").addEventListener("click", () => setStatus(msg("downloaded")));
  $("lang").addEventListener("click", () => {
    const next = currentLang() === "ko" ? "en" : "ko";
    applyLang(next);
    saveLang(next);
    if (pixels) render();
  });
}

applyLang(initialLang());
bindInputs();
bindOptions();
bindOutputs();
updateOutputs();
markCropPreset();

const preset = new URLSearchParams(location.search).get("u");
if (preset) {
  $("gh-id").value = preset;
  loadUsername(preset);
}

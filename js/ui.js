import { DEFAULTS, analyze } from "./convert.js";
import { renderSvg } from "./svg.js";
import { pixelsFromBlob, avatarBlob, InputError } from "./image.js";
import { readmeSnippet, aiPrompt } from "./snippets.js";
import { applyLang, initialLang, saveLang, currentLang, msg } from "./i18n.js";
import { createStore } from "./store.js";
import { mountSource } from "./source.js";
import { drawPipeline } from "./pipeline.js";
import { showPreview, replay } from "./preview.js";
import { bindControls, writeControls, syncOutputs } from "./controls.js";
import { loadCatalog, bindPicks, findClassic, classicBlob, markPick } from "./classics.js";

const $ = (id) => document.getElementById(id);
const LIMIT_KB = 300;
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

const store = createStore({ pixels: null, source: "", username: "", opts: { ...DEFAULTS } });
const source = mountSource($("source"), store);
let timer = 0;
const catalogReady = loadCatalog().catch(() => []);

function setStatus(text, kind = "") {
  const el = $("status");
  el.textContent = text;
  el.className = `status ${kind}`.trim();
}

function render() {
  const { pixels, opts, source: name } = store.get();
  if (!pixels) return;
  const t0 = performance.now();
  const result = analyze(pixels.rgb, pixels.w, pixels.h, opts);
  const t1 = performance.now();
  const svg = renderSvg(result.cells, opts);
  const t2 = performance.now();
  const shown = reducedMotion.matches && opts.animate ? renderSvg(result.cells, { ...opts, animate: false }) : svg;
  const kb = showPreview({ svg, shown, layout: result.layout, name: opts.name, label: name });
  drawPipeline(result, opts, { convert: t1 - t0, svg: t2 - t1 });
  $("size").textContent = `${kb} KB · ${result.layout.cols}×${result.layout.rows}`;
  if (kb > LIMIT_KB) setStatus(msg("tooBig", kb), "warn");
  else setStatus(msg("ready", kb));
}

function updateSnippets() {
  const width = document.querySelector('input[name="width"]:checked').value;
  const snippet = readmeSnippet(width, $("credit").checked);
  $("code").textContent = snippet;
  $("ai-prompt").textContent = aiPrompt(store.get().username, snippet);
}

store.subscribe((state) => {
  source.draw();
  syncOutputs(state.opts);
  clearTimeout(timer);
  timer = setTimeout(render, 120);
});

async function load(getBlob, { name, opts, username = "", classic = null, onlyIfEmpty = false }) {
  setStatus(msg("loading"));
  $("gh-go").disabled = true;
  try {
    const pixels = await pixelsFromBlob(await getBlob());
    if (onlyIfEmpty && store.get().pixels) return; // the user picked something while the default loaded
    store.set({ pixels, source: name, username, opts });
    writeControls(store.get().opts);
    $("options").disabled = false;
    $("src-name").textContent = name;
    markPick(classic);
    updateSnippets();
  } catch (err) {
    setStatus(msg(err instanceof InputError ? err.message : "decode"), "error");
  } finally {
    $("gh-go").disabled = false;
  }
}

async function loadClassic(slug, extra = {}) {
  await catalogReady; // buttons are live before the catalogue arrives
  const c = findClassic(slug);
  if (!c) return setStatus(msg("network"), "error");
  const opts = { ...DEFAULTS, ...c.options, title: c.handle, name: c.handle };
  return load(() => classicBlob(slug), { name: `${slug}.jpg`, opts, classic: slug, ...extra });
}

function loadUsername(id) {
  return load(() => avatarBlob(id), { name: `${id}.png`, username: id, opts: { ...DEFAULTS, title: id, name: id } });
}

// Your own image starts from the reference defaults; a classic's tuning belongs to that classic
function loadFile(file) {
  const who = store.get().username || "user";
  return load(() => file, { name: file.name || "image", username: store.get().username, opts: { ...DEFAULTS, title: who, name: who } });
}

async function copy(id) {
  try {
    await navigator.clipboard.writeText($(id).textContent);
    setStatus(msg("copied"));
  } catch {
    const range = document.createRange();
    range.selectNodeContents($(id));
    getSelection().removeAllRanges();
    getSelection().addRange(range);
    setStatus(msg("copyFailed"), "error");
  }
}

function bindDrop() {
  const veil = $("veil");
  let depth = 0;
  const hasFiles = (e) => [...(e.dataTransfer?.types || [])].includes("Files");
  addEventListener("dragenter", (e) => {
    if (!hasFiles(e)) return;
    depth += 1;
    veil.classList.add("on");
  });
  addEventListener("dragleave", () => {
    depth = Math.max(0, depth - 1);
    if (!depth) veil.classList.remove("on");
  });
  addEventListener("dragover", (e) => { if (hasFiles(e)) e.preventDefault(); });
  addEventListener("drop", (e) => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    depth = 0;
    veil.classList.remove("on");
    const [file] = e.dataTransfer.files;
    if (file) {
      loadFile(file);
      $("studio").scrollIntoView();
    }
  });
}

function bindEvents() {
  $("gh-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const id = $("gh-id").value.trim();
    if (!id) return $("gh-id").focus();
    loadUsername(id);
    $("studio").scrollIntoView();
  });
  $("file").addEventListener("change", (e) => {
    const [file] = e.target.files;
    if (file) loadFile(file);
  });
  for (const b of document.querySelectorAll(".gallery [data-classic]")) {
    b.addEventListener("click", () => {
      loadClassic(b.dataset.classic);
      $("studio").scrollIntoView();
    });
  }
  for (const b of document.querySelectorAll("[data-copy]")) b.addEventListener("click", () => copy(b.dataset.copy));
  for (const r of document.querySelectorAll('input[name="width"]')) r.addEventListener("change", updateSnippets);
  $("credit").addEventListener("change", updateSnippets);
  $("replay").addEventListener("click", replay);
  $("download").addEventListener("click", () => setStatus(msg("downloaded")));
  $("lang").addEventListener("click", () => {
    const next = currentLang() === "ko" ? "en" : "ko";
    applyLang(next);
    saveLang(next);
    render();
  });
  reducedMotion.addEventListener("change", render);
  bindControls(store);
  bindDrop();
}

// Heavy things wait until they are near the screen: each gallery SVG holds thousands of
// glyphs, and the studio's default example costs a download plus a conversion.
function whenNear(elements, onNear, margin) {
  if (!("IntersectionObserver" in window)) return elements.forEach(onNear);
  const io = new IntersectionObserver((entries) => {
    for (const { isIntersecting, target } of entries) {
      if (!isIntersecting) continue;
      io.unobserve(target);
      onNear(target);
    }
  }, { rootMargin: margin });
  elements.forEach((el) => io.observe(el));
}

async function init() {
  applyLang(initialLang());
  bindEvents();
  updateSnippets();
  bindPicks($("picks"), (slug) => {
    loadClassic(slug);
    $("studio").scrollIntoView();
  });
  whenNear([...document.querySelectorAll(".gallery img[data-src]")], (img) => { img.src = img.dataset.src; }, "0px 0px 120px 0px");
  const preset = new URLSearchParams(location.search).get("u");
  if (preset) {
    $("gh-id").value = preset;
    await loadUsername(preset);
    $("studio").scrollIntoView();
    return;
  }
  // the studio starts alive instead of empty, but only once someone heads that way
  whenNear([$("studio")], () => loadClassic("mona_lisa", { onlyIfEmpty: true }), "0px 0px 400px 0px");
}

init();

// Two-way binding between the Options window and store.opts.
const $ = (id) => document.getElementById(id);
const RANGES = ["cols", "brightness", "saturation", "zoom", "step"];

export function readControls() {
  return {
    card: $("card").value,
    cols: Number($("cols").value),
    contrast: document.querySelector('input[name="contrast"]:checked').value,
    colorMode: $("colorMode").value,
    brightness: Number($("brightness").value),
    saturation: Number($("saturation").value),
    zoom: Number($("zoom").value),
    title: $("title").value.trim() || "user",
    name: $("name").value.trim() || "user",
    animate: $("animate").checked,
    anim: $("anim").value,
    step: Number($("step").value),
  };
}

export function writeControls(opts) {
  $("card").value = opts.card;
  $("colorMode").value = opts.colorMode;
  $("title").value = opts.title;
  $("name").value = opts.name;
  $("animate").checked = opts.animate;
  $("anim").value = opts.anim;
  for (const id of RANGES) $(id).value = String(opts[id]);
  for (const radio of document.querySelectorAll('input[name="contrast"]')) radio.checked = radio.value === opts.contrast;
  syncOutputs(opts);
}

// Keeps sliders in step with changes made elsewhere (e.g. zooming on the Source canvas)
export function syncOutputs(opts) {
  for (const id of RANGES) {
    if (Number($(id).value) !== opts[id]) $(id).value = String(opts[id]);
    $(`${id}-out`).textContent = String(opts[id]);
  }
  $("step").disabled = !opts.animate;
  $("anim").disabled = !opts.animate;
}

export function bindControls(store) {
  const options = $("options");
  const update = () => store.setOpts(readControls());
  options.addEventListener("input", update);
  options.addEventListener("change", update);
}

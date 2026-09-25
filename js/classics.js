// Public-domain examples: the picker in the hero and the "Open" buttons in the gallery.
let catalog = [];

export async function loadCatalog() {
  const res = await fetch("assets/classics/classics.json");
  if (!res.ok) throw new Error(`classics.json ${res.status}`);
  catalog = await res.json();
  return catalog;
}

export function findClassic(slug) {
  return catalog.find((c) => c.slug === slug);
}

export async function classicBlob(slug) {
  const res = await fetch(`assets/classics/${slug}.jpg`);
  if (!res.ok) throw new Error(`${slug}.jpg ${res.status}`);
  return res.blob();
}

// Buttons are in the HTML (no layout shift while the catalogue loads); this only wires them up
export function bindPicks(container, onPick) {
  for (const button of container.querySelectorAll(".pick")) {
    button.addEventListener("click", () => onPick(button.dataset.classic));
  }
}

export function markPick(slug) {
  for (const b of document.querySelectorAll(".pick")) b.setAttribute("aria-pressed", String(b.dataset.classic === slug));
}

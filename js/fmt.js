// Text helpers shared by the SVG builders.
export function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Python-style fixed formatting: exact ties round to even, like f"{x:.2f}"
export function fx(x, digits) {
  const scaled = x * 10 ** digits;
  const floor = Math.floor(scaled);
  const diff = scaled - floor;
  const n = diff === 0.5 ? (floor % 2 === 0 ? floor : floor + 1) : Math.round(scaled);
  return (n / 10 ** digits).toFixed(digits);
}

// Evaluates the SMIL animations in a portrait SVG at time t, so Remotion's frame clock (not the
// browser's) drives the typing. Mirrors what js/export.js does with the live SMIL engine.

const ANIM = /<(animate|animateTransform)\s([^>]*)\/>/g;
const attr = (tag: string, name: string) => new RegExp(`${name}="([^"]*)"`).exec(tag)?.[1];

function valueAt(values: string[], keyTimes: number[], progress: number): string {
  let i = keyTimes.findIndex((k, idx) => progress <= k && idx > 0);
  if (i === -1) i = keyTimes.length - 1;
  const [k0, k1] = [keyTimes[i - 1], keyTimes[i]];
  const f = k1 === k0 ? 1 : Math.min(1, Math.max(0, (progress - k0) / (k1 - k0)));
  const a = values[i - 1].trim().split(/\s+/).map(Number);
  const b = values[i].trim().split(/\s+/).map(Number);
  return a.map((v, j) => +(v + (b[j] - v) * f).toFixed(3)).join(" ");
}

// Replace each animation with a <set> of its value at t; looping ones (the cursor) keep blinking
export function svgAt(svg: string, t: number): string {
  return svg.replace(ANIM, (tag, kind: string, body: string) => {
    const name = attr(body, "attributeName")!;
    const dur = Number(attr(body, "dur")!.replace("s", ""));
    const values = attr(body, "values")!.split(";");
    const loops = body.includes("repeatCount");
    const local = loops ? t % dur : Math.min(t, dur);
    const keyTimes = attr(body, "keyTimes")?.split(";").map(Number) ?? values.map((_, i) => i / (values.length - 1));
    const v = valueAt(values, keyTimes, local / dur);
    if (kind === "animateTransform") return `<set attributeName="transform" to="translate(${v.split(" ").join(",")})"/>`;
    return `<set attributeName="${name}" to="${v}"/>`;
  });
}

// Several SVGs share ids like r0 and bg; prefix them so inline copies do not collide
export function scopeIds(svg: string, prefix: string): string {
  return svg.replace(/id="([^"]+)"/g, `id="${prefix}-$1"`).replace(/url\(#([^)]+)\)/g, `url(#${prefix}-$1)`);
}

export function animationLength(svg: string): number {
  let longest = 0;
  for (const [, , body] of svg.matchAll(ANIM)) {
    if (body.includes("repeatCount")) continue;
    longest = Math.max(longest, Number(attr(body, "dur")!.replace("s", "")));
  }
  return longest;
}

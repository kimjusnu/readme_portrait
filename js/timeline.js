// Timing helpers for exporting the animation as frames.
const MAX_FRAMES = 90;

// Longest one-shot animation in the SVG; looping ones (the cursor blink) never end, so they are skipped
export function animationLength(svg) {
  let longest = 0;
  for (const [tag] of svg.matchAll(/<animate(?:Transform)?\s[^>]*\/>/g)) {
    if (tag.includes("repeatCount")) continue;
    const dur = Number(/dur="([\d.]+)s"/.exec(tag)?.[1] || 0);
    longest = Math.max(longest, dur);
  }
  return longest;
}

// Evenly spaced sample times from 0 to length inclusive, at most MAX_FRAMES
export function frameTimes(length, fps) {
  const count = Math.min(MAX_FRAMES - 1, Math.max(1, Math.ceil(length * fps))); // count gaps → count + 1 frames
  return Array.from({ length: count + 1 }, (_, i) => Math.round(((length * i) / count) * 1000) / 1000);
}

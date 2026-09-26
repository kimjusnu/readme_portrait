# readme_portrait demo video

A 23-second 1920×1080 demo made with [Remotion](https://www.remotion.dev/) (free for individuals and teams up to 3).

The portraits are drawn by the project's own converter (`scripts/make-data.mjs`), and `src/smil.ts` evaluates their SMIL
animations at each frame, so the typing follows Remotion's clock exactly.

```bash
npm install
npm run dev      # studio preview
npm run render   # → ../launch/demo.mp4
```

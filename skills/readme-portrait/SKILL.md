---
name: readme-portrait
description: Add or refresh an animated colour ASCII portrait of the user (their GitHub avatar or a photo) in their GitHub profile README. Use when the user asks for an ASCII portrait, a terminal-style avatar card, or "that typing ASCII picture" on their GitHub profile.
---

# readme-portrait

Draws a terminal-window SVG in which the user's portrait types itself out line by line, and wires it into their profile README. The SVG only uses SMIL, so it plays inside GitHub's `<img>` sandbox. Converter: https://github.com/kimjusnu/readme_portrait (MIT). Live studio: https://kimjusnu.github.io/readme_portrait/

## Steps

1. **Find the profile repository.** It is the repository named exactly like the owner (`username/username`).
   - `git remote get-url origin` in the current directory. If it is not `username/username`, ask the user whether to clone theirs (`gh repo clone username/username`) or to use a different path. Do not create a repository without asking.
   - Username: the repository owner, or `gh api user --jq .login`.
2. **Draw the SVG** from the root of that repository (after a fresh clone, `cd` into it first; paths below are relative to it). Needs Node 18.17+:
   ```bash
   npx --yes github:kimjusnu/readme_portrait#v1 <username> -o assets/portrait.svg
   ```
   Use an image path instead of the username if the user gave a photo. Useful options (see `--help`):
   - `--style type|reveal|scan|matrix` entrance animation (default `type`)
   - `--contrast local` when a bright or busy background swallows the face
   - `--color gray|green|amber`, `--cols 60-160`, `--zoom 1-4 --crop-x 0-1 --crop-top 0-1`
   - `--card wide` for an 880×500 card that stands alone
3. **Check the result before committing.** The command prints the size; above ~300 KB suggest fewer `--cols`. Mention that the user can fine-tune crop and style visually in the studio and download the SVG instead.
4. **Insert into README.md** unless an `assets/portrait.svg` image is already referenced (then the refresh is done):
   ```html
   <img src="assets/portrait.svg" alt="ASCII portrait" width="49%">
   ```
   Use `width="100%"` if nothing sits beside it. Put it where the user wants; default is the top. Never paste the `<svg>` markup itself into Markdown: GitHub strips inline SVG.
5. **Commit and push only with the user's go-ahead**, e.g. `git add assets/portrait.svg README.md && git commit -m "docs: add ASCII portrait"`.

## Keeping it fresh (optional)

Offer a workflow that redraws it weekly with the Action (`.github/workflows/portrait.yml`):

```yaml
name: portrait
on:
  schedule: [{ cron: "0 0 * * 0" }]
  workflow_dispatch:
permissions:
  contents: write
jobs:
  draw:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: kimjusnu/readme_portrait@v1
```

## Notes

- Nothing is uploaded anywhere: the CLI downloads the public avatar from the GitHub API and converts locally.
- PNG and JPEG input only on the command line; WebP works in the web studio.

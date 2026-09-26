import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync, mkdtempSync, existsSync, copyFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const bin = join(root, "bin", "readme-portrait.mjs");
const sample = join(root, "reference", "sample-avatar.png");
const run = (...args) => spawnSync(process.execPath, [bin, ...args], { encoding: "utf8" });
const tmp = () => mkdtempSync(join(tmpdir(), "rp-"));

test("CLI output for the sample is byte-identical to the reference SVG", () => {
  const out = join(tmp(), "p.svg");
  const r = run(sample, "--name", "kimjusnu", "--out", out);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(readFileSync(out, "utf8"), readFileSync(join(root, "reference", "portrait.sample.svg"), "utf8"));
});

test("options are passed through (static, local contrast, 80 columns, matrix)", () => {
  const out = join(tmp(), "p.svg");
  assert.equal(run(sample, "--cols", "80", "--contrast", "local", "--no-animate", "--out", out).status, 0);
  const svg = readFileSync(out, "utf8");
  assert.doesNotMatch(svg, /<animate/);
  assert.equal((svg.match(/textLength="520"/g) || []).length, 45);
  const rain = join(tmp(), "m.svg");
  assert.equal(run(sample, "--style", "matrix", "--out", rain).status, 0);
  assert.match(readFileSync(rain, "utf8"), /class="deco"/);
});

test("JPEG input works", () => {
  const out = join(tmp(), "p.svg");
  assert.equal(run(join(root, "assets", "classics", "lincoln.jpg"), "--out", out).status, 0, "jpeg");
  assert.ok(readFileSync(out, "utf8").startsWith("<svg"));
});

test("invalid options fail with a message and write nothing", () => {
  const out = join(tmp(), "p.svg");
  const r = run(sample, "--cols", "999", "--out", out);
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /cols/);
  assert.equal(existsSync(out), false);
});

test("an existing file without an extension is read as a file, not a username", () => {
  const dir = tmp();
  copyFileSync(sample, join(dir, "photo"));
  const out = join(dir, "p.svg");
  const r = spawnSync(process.execPath, [bin, "photo", "--name", "kimjusnu", "--out", out], { encoding: "utf8", cwd: dir });
  assert.equal(r.status, 0, r.stderr);
  assert.equal(readFileSync(out, "utf8"), readFileSync(join(root, "reference", "portrait.sample.svg"), "utf8"));
});

test("--help prints usage", () => {
  const r = run("--help");
  assert.equal(r.status, 0);
  assert.match(r.stdout, /Usage: readme-portrait/);
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { readmeSnippet, aiPrompt, SITE } from "../js/snippets.js";

test("49% snippet matches the handoff format", () => {
  assert.equal(readmeSnippet("49%", false), '<img src="assets/portrait.svg" alt="ASCII portrait" width="49%">');
});

test("100% snippet", () => {
  assert.equal(readmeSnippet("100%", false), '<img src="assets/portrait.svg" alt="ASCII portrait" width="100%">');
});

test("credit adds a small link to the site on its own line", () => {
  const out = readmeSnippet("49%", true).split("\n");
  assert.equal(out.length, 2);
  assert.match(out[1], new RegExp(`<sub>.*href="${SITE}".*</sub>`));
});

test("AI prompt names the profile repository and embeds the snippet", () => {
  const prompt = aiPrompt("octocat", readmeSnippet("49%", false));
  assert.match(prompt, /octocat\/octocat/);
  assert.match(prompt, /assets\/portrait\.svg/);
  assert.match(prompt, /width="49%"/);
});

test("AI prompt falls back to a placeholder without a username", () => {
  assert.match(aiPrompt("", "x"), /<username>\/<username>/);
});

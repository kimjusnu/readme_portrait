import { test } from "node:test";
import assert from "node:assert/strict";
import { encodeShare, decodeShare } from "../js/share.js";
import { DEFAULTS } from "../js/convert.js";

test("default options produce an empty query", () => {
  assert.equal(encodeShare(DEFAULTS, null), "");
});

test("changed options and the source survive a round trip", () => {
  const opts = { ...DEFAULTS, cols: 90, contrast: "local", colorMode: "amber", zoom: 1.75, cropX: 0.42, cropTop: 0.1, animate: false, title: "octo", name: "octo" };
  const query = encodeShare(opts, { kind: "user", id: "octocat" });
  const back = decodeShare(query);
  assert.deepEqual(back.source, { kind: "user", id: "octocat" });
  assert.deepEqual({ ...DEFAULTS, ...back.opts }, opts);
});

test("classic sources round-trip", () => {
  assert.deepEqual(decodeShare(encodeShare(DEFAULTS, { kind: "classic", id: "mona_lisa" })).source, { kind: "classic", id: "mona_lisa" });
});

test("local images are never put in the link", () => {
  assert.equal(encodeShare({ ...DEFAULTS, cols: 80 }, { kind: "file", id: "me.png" }), "?cols=80");
});

test("out-of-range and unknown values are ignored", () => {
  const back = decodeShare("?cols=9999&contrast=weird&b=-3&z=abc&card=poster&a=maybe");
  assert.deepEqual(back.opts, {});
});

test("unsafe names and ids are rejected", () => {
  const back = decodeShare("?u=%3Cscript%3E&t=%3Cimg%20onerror%3Dx%3E&n=ok_name");
  assert.equal(back.source, null);
  assert.deepEqual(back.opts, { name: "ok_name" });
});

test("the legacy ?u= deep link still works", () => {
  assert.deepEqual(decodeShare("?u=kimjusnu").source, { kind: "user", id: "kimjusnu" });
});

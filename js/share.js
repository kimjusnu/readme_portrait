// Options <-> URL query. Links are untrusted input, so every value is validated and anything
// out of range is dropped in favour of the default. Local images are never part of a link.
import { DEFAULTS } from "./convert.js";

const NAME = /^[A-Za-z0-9._-]{1,39}$/;
const USER = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;
const SLUG = /^[a-z_]{1,40}$/;

const num = (min, max) => (v) => {
  const n = Number(v);
  return v !== "" && Number.isFinite(n) && n >= min && n <= max ? n : undefined;
};
const oneOf = (...values) => (v) => (values.includes(v) ? v : undefined);
const text = (v) => (NAME.test(v) ? v : undefined);
const bool = (v) => ({ 1: true, 0: false })[v];

// option key -> [query key, parse]
const FIELDS = {
  cols: ["cols", (v) => { const n = num(60, 160)(v); return n !== undefined && Number.isInteger(n) ? n : undefined; }],
  contrast: ["ct", oneOf("global", "local", "none")],
  colorMode: ["m", oneOf("color", "gray", "green", "amber")],
  brightness: ["b", num(0.6, 2.6)],
  saturation: ["s", num(0, 2.5)],
  zoom: ["z", num(1, 4)],
  cropX: ["x", num(0, 1)],
  cropTop: ["y", num(0, 1)],
  title: ["t", text],
  name: ["n", text],
  animate: ["a", bool],
  step: ["sp", num(0.02, 0.2)],
  card: ["card", oneOf("card", "wide")],
};

export function encodeShare(opts, source) {
  const params = new URLSearchParams();
  if (source?.kind === "user") params.set("u", source.id);
  if (source?.kind === "classic") params.set("c", source.id);
  for (const [key, [param]] of Object.entries(FIELDS)) {
    if (opts[key] === DEFAULTS[key]) continue;
    params.set(param, typeof opts[key] === "boolean" ? (opts[key] ? "1" : "0") : String(opts[key]));
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function decodeShare(search) {
  const params = new URLSearchParams(search);
  const opts = {};
  for (const [key, [param, parse]] of Object.entries(FIELDS)) {
    if (!params.has(param)) continue;
    const value = parse(params.get(param));
    if (value !== undefined) opts[key] = value;
  }
  const user = params.get("u");
  const classic = params.get("c");
  let source = null;
  if (user && USER.test(user)) source = { kind: "user", id: user };
  else if (classic && SLUG.test(classic)) source = { kind: "classic", id: classic };
  return { source, opts };
}

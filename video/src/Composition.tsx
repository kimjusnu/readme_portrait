import { loadFont } from "@remotion/fonts";
import React from "react";
import {
  AbsoluteFill, Composition, Easing, Img, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig,
} from "remotion";
import portraits from "./portraits.json";
import { scopeIds, svgAt } from "./smil";

const C = { paper: "#f2eee3", ink: "#141414", panel: "#e4dfd2", term: "#0b0f0c", phosphor: "#1fd466", amber: "#ffb000", muted: "#4d4a42" };
const DISPLAY = "Inter Tight";
const PIXEL = "VT323";
const MONO = "JetBrains Mono";

Promise.all([
  loadFont({ family: DISPLAY, url: staticFile("inter-tight.woff2"), weight: "500 800" }),
  loadFont({ family: PIXEL, url: staticFile("vt323.woff2") }),
  loadFont({ family: MONO, url: staticFile("jetbrains-mono.woff2"), weight: "400 700" }),
]);

const FPS = 30;
const SCENES = { intro: 90, gallery: 240, styles: 210, outro: 150 };
const TOTAL = Object.values(SCENES).reduce((a, b) => a + b, 0);
const ease = Easing.bezier(0.16, 1, 0.3, 1);
const fade = (frame: number, start: number, len = 18) =>
  interpolate(frame, [start, start + len], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });

export const MyComposition = () => (
  <Composition id="Demo" component={Demo} durationInFrames={TOTAL} fps={FPS} width={1920} height={1080} />
);

// A portrait SVG frozen at `seconds`, inlined so Remotion screenshots it deterministically
const Portrait: React.FC<{ svg: string; id: string; seconds: number; width: number }> = ({ svg, id, seconds, width }) => (
  <div style={{ width, lineHeight: 0 }} dangerouslySetInnerHTML={{ __html: scopeIds(svgAt(svg, Math.max(0, seconds)), id).replace("<svg ", '<svg style="width:100%;height:auto" ') }} />
);

// Window chrome shared with the site: black title bar, pixel label, hard shadow
const Win: React.FC<{ title: string; children: React.ReactNode; accent?: string }> = ({ title, children, accent = C.ink }) => (
  <div style={{ border: `2px solid ${C.ink}`, boxShadow: `8px 8px 0 ${accent}`, background: C.panel }}>
    <div style={{ background: C.ink, color: C.phosphor, font: `34px/1 ${PIXEL}`, padding: "6px 12px" }}>{title}</div>
    <div style={{ padding: 10, background: C.term }}>{children}</div>
  </div>
);

const Typed: React.FC<{ text: string; start: number; cps?: number; keepCursor?: boolean }> = ({ text, start, cps = 28, keepCursor = true }) => {
  const frame = useCurrentFrame();
  const shown = Math.max(0, Math.floor(((frame - start) / FPS) * cps));
  const done = shown >= text.length;
  const blink = Math.floor(frame / 15) % 2 === 0 && (keepCursor || !done);
  return (
    <span>
      {text.slice(0, shown)}
      <span style={{ display: "inline-block", width: "0.55em", height: "1em", verticalAlign: "-0.12em", marginLeft: 4, background: C.phosphor, opacity: blink ? 1 : 0 }} />
    </span>
  );
};

const Intro = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: C.paper, justifyContent: "center", alignItems: "center" }}>
      <Img src={staticFile("hero-wave.svg")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      <div style={{ opacity: fade(frame, 0), translate: `0 ${interpolate(frame, [0, 24], [30, 0], { extrapolateRight: "clamp", easing: ease })}px`, textAlign: "center" }}>
        <div style={{ font: `800 150px/0.92 ${DISPLAY}`, letterSpacing: "-0.055em", color: C.ink }}>
          Your Face,{" "}
          <span style={{ font: `400 138px/1 ${PIXEL}`, letterSpacing: 0, background: C.ink, color: C.phosphor, padding: "0 16px" }}>Typed</span>
          <br />Into Your README.
        </div>
        <div style={{ display: "inline-block", marginTop: 56, background: C.ink, color: C.paper, font: `44px/1.2 ${PIXEL}`, padding: "10px 22px" }}>
          <span style={{ color: C.phosphor }}>~ $ </span>
          <Typed text="npx readme-portrait octocat" start={20} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Kicker: React.FC<{ text: string; frame: number }> = ({ text, frame }) => (
  <div style={{ opacity: fade(frame, 0), font: `40px/1 ${PIXEL}`, background: C.phosphor, color: C.ink, padding: "6px 14px", alignSelf: "center" }}>{text}</div>
);

const Gallery = () => {
  const frame = useCurrentFrame();
  const labels = ["classics", "anime-style", "space"];
  return (
    <AbsoluteFill style={{ background: C.term, flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 48 }}>
      <Kicker text="~/gallery $ ./portrait.sh --all" frame={frame} />
      <div style={{ display: "flex", gap: 44 }}>
        {portraits.gallery.map((p, i) => (
          <div key={p.slug} style={{ opacity: fade(frame, 8 + i * 10), translate: `0 ${interpolate(frame, [8 + i * 10, 34 + i * 10], [40, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease })}px` }}>
            <Win title={`${p.slug}.svg · ${labels[i]}`} accent={C.phosphor}>
              <Portrait svg={p.svg} id={`g${i}`} seconds={(frame - 20 - i * 12) / FPS} width={540} />
            </Win>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

const Styles = () => {
  const frame = useCurrentFrame();
  const names: Record<string, string> = { type: "--style type", reveal: "--style reveal", scan: "--style scan", matrix: "--style matrix" };
  return (
    <AbsoluteFill style={{ background: C.paper, flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 40 }}>
      <div style={{ opacity: fade(frame, 0), font: `800 88px/1 ${DISPLAY}`, letterSpacing: "-0.05em", color: C.ink }}>Four ways to enter.</div>
      <div style={{ display: "flex", gap: 30 }}>
        {portraits.styles.map((p, i) => (
          <div key={p.anim} style={{ opacity: fade(frame, 6 + i * 6) }}>
            <Win title={names[p.anim]}>
              <Portrait svg={p.svg} id={`s${i}`} seconds={(frame - 24) / FPS} width={420} />
            </Win>
          </div>
        ))}
      </div>
      <div style={{ opacity: fade(frame, 40), font: `34px/1 ${MONO}`, color: C.muted }}>pure SMIL · plays inside a GitHub README · never blank</div>
    </AbsoluteFill>
  );
};

const Line: React.FC<{ prompt: string; text: string; start: number; last?: boolean }> = ({ prompt, text, start, last = false }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ opacity: fade(frame, start, 10), font: `46px/1.5 ${MONO}`, color: C.paper, whiteSpace: "pre" }}>
      <span style={{ color: C.phosphor }}>{prompt} </span>{frame >= start ? <Typed text={text} start={start} cps={40} keepCursor={last} /> : null}
    </div>
  );
};

const Outro = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: C.ink, justifyContent: "center", paddingLeft: 180, gap: 18 }}>
      <Line prompt="web  $" text="kimjusnu.github.io/readme_portrait" start={6} />
      <Line prompt="cli  $" text="npx readme-portrait <you>" start={36} />
      <Line prompt="ci   $" text="uses: kimjusnu/readme_portrait@v1" start={66} last />
      <div style={{ opacity: fade(frame, 100), marginTop: 50, font: `400 150px/0.9 ${PIXEL}`, color: C.phosphor }}>readme_portrait</div>
      <div style={{ opacity: fade(frame, 110), alignSelf: "flex-start", font: `44px/1 ${PIXEL}`, background: C.amber, color: C.ink, padding: "8px 18px" }}>★ github.com/kimjusnu/readme_portrait</div>
    </AbsoluteFill>
  );
};

export const Demo: React.FC = () => {
  const { durationInFrames } = useVideoConfig();
  const starts = [0, SCENES.intro, SCENES.intro + SCENES.gallery, SCENES.intro + SCENES.gallery + SCENES.styles];
  return (
    <AbsoluteFill style={{ background: C.ink }}>
      <Sequence name="Intro" from={starts[0]} durationInFrames={SCENES.intro}><Intro /></Sequence>
      <Sequence name="Gallery" from={starts[1]} durationInFrames={SCENES.gallery}><Gallery /></Sequence>
      <Sequence name="Styles" from={starts[2]} durationInFrames={SCENES.styles}><Styles /></Sequence>
      <Sequence name="Outro" from={starts[3]} durationInFrames={durationInFrames - starts[3]}><Outro /></Sequence>
    </AbsoluteFill>
  );
};

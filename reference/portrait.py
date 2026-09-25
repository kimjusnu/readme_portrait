"""GitHub 프로필 사진을 컬러 글자 초상으로 바꿔 터미널 타이핑 SVG로 그린다.

글자 모양은 명암(평활화한 밝기)으로 고르고, 글자 색은 원래 사진의 색을 칠한다.
사용: python scripts/portrait.py [로그인]   → assets/portrait.svg
"""
import io
import sys
import urllib.request
from pathlib import Path

from PIL import Image, ImageEnhance, ImageOps

LOGIN = sys.argv[1] if len(sys.argv) > 1 else "kimjusnu"
OUT = Path("assets/portrait.svg")
RAMP = ".:-=+*cs#%@"  # 어두움 → 밝음. 빈칸을 두지 않아 모든 칸에 색이 실린다

# 카드는 오른쪽 daytime 차트와 같은 560×635. 글자 영역은 520×555
WIDTH, TOP, PAD = 560, 37.0, 20
TEXT_W, TEXT_H = 520, 555
COLS, ROWS = 110, 62
CHAR_W, LINE_H = TEXT_W / COLS, TEXT_H / ROWS
FONT_SIZE = LINE_H * 0.86
STEP = 0.07  # 한 줄이 타이핑되는 시간(초)


def fetch_avatar(login: str) -> Image.Image:
    with urllib.request.urlopen(f"https://github.com/{login}.png?size=460", timeout=30) as res:
        return Image.open(io.BytesIO(res.read())).convert("RGB")


def crop_face(img: Image.Image) -> Image.Image:
    # 얼굴 쪽으로 잘라 글자 칸 비율(가로 COLS×CHAR_W : 세로 ROWS×LINE_H)에 맞춘다
    aspect = TEXT_W / TEXT_H
    w, h = img.size
    ch = h * 0.88
    cw = min(w, ch * aspect)
    left = (w - cw) / 2
    return img.crop((int(left), int(h * 0.02), int(left + cw), int(h * 0.02 + ch)))


def to_cells(img: Image.Image) -> list[list[tuple[str, str]]]:
    img = crop_face(img)
    # 배경이 복잡한 그림이라 평활화로 명암 차이를 벌려야 윤곽이 산다
    lum = ImageOps.equalize(img.convert("L")).resize((COLS, ROWS), Image.LANCZOS).load()
    # 어두운 곳의 색도 보이도록 밝기와 채도를 올린다
    color = ImageEnhance.Brightness(ImageEnhance.Color(img).enhance(1.3)).enhance(1.6)
    rgb = color.resize((COLS, ROWS), Image.LANCZOS).load()
    last = len(RAMP) - 1
    rows = []
    for y in range(ROWS):
        row = []
        for x in range(COLS):
            r, g, b = rgb[x, y]
            # 16단계로 줄여(#rgb) 같은 색 글자를 한 덩어리로 묶는다
            row.append((RAMP[lum[x, y] * last // 255], f"#{r >> 4:x}{g >> 4:x}{b >> 4:x}"))
        rows.append(row)
    return rows


def esc(s: str) -> str:
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def row_spans(row: list[tuple[str, str]]) -> str:
    spans, text, fill = [], "", None
    for ch, c in row:
        if ch == " " and fill is not None:
            c = fill  # 공백은 색이 필요 없으니 앞 덩어리에 붙인다
        if fill is not None and c != fill:
            spans.append(f'<tspan fill="{fill}">{esc(text)}</tspan>')
            text = ""
        fill = c
        text += ch
    if text:
        spans.append(f'<tspan fill="{fill}">{esc(text)}</tspan>')
    return "".join(spans)


def svg(cells: list[list[tuple[str, str]]], login: str) -> str:
    body_h = TOP + TEXT_H
    height = body_h + 43
    out = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{WIDTH}" height="{height:.0f}" viewBox="0 0 {WIDTH} {height:.0f}" '
        'font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" role="img" aria-label="ASCII portrait">',
        '<defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#111722"/>'
        '<stop offset="1" stop-color="#0d1117"/></linearGradient></defs>',
        f'<rect width="{WIDTH}" height="{height:.0f}" rx="12" fill="url(#bg)"/>',
        f'<rect x="0.5" y="0.5" width="{WIDTH - 1}" height="{height - 1:.0f}" rx="12" fill="none" stroke="#30363d"/>',
        f'<line x1="0" y1="30" x2="{WIDTH}" y2="30" stroke="#30363d"/>',
        '<circle cx="20" cy="15" r="5" fill="#ff5f56"/><circle cx="36" cy="15" r="5" fill="#ffbd2e"/><circle cx="52" cy="15" r="5" fill="#27c93f"/>',
        f'<text x="{WIDTH / 2:.0f}" y="19" fill="#7d8590" font-size="12" text-anchor="middle">{esc(login)}@github: ~$ ./portrait.sh</text>',
    ]
    for i, row in enumerate(cells):
        y = TOP + i * LINE_H
        begin = i * STEP
        dur = begin + STEP
        # 지연을 keyTimes에 넣어, 애니메이션이 안 도는 환경에서도 줄이 보이게 한다
        out.append(
            f'<clipPath id="r{i}"><rect x="{PAD}" y="{y:.2f}" height="{LINE_H + 0.5:.2f}" width="{TEXT_W}">'
            f'<animate attributeName="width" values="0;0;{TEXT_W}" keyTimes="0;{begin / dur:.3f};1" dur="{dur:.3f}s" fill="freeze"/></rect></clipPath>'
            f'<g clip-path="url(#r{i})"><text xml:space="preserve" x="{PAD}" y="{y + LINE_H * 0.8:.2f}" font-size="{FONT_SIZE:.2f}" '
            f'textLength="{TEXT_W}" lengthAdjust="spacing">{row_spans(row)}</text></g>'
        )
    prompt = f"{login}@github:~$ whoami "
    out.append(f'<line x1="0" y1="{body_h:.1f}" x2="{WIDTH}" y2="{body_h:.1f}" stroke="#30363d"/>')
    out.append(f'<text x="{PAD}" y="{body_h + 19:.1f}" fill="#7d8590" font-size="13">{esc(prompt)}<tspan fill="#c9d1d9">{esc(login)}</tspan></text>')
    cursor_x = PAD + (len(prompt) + len(login)) * 7.83 + 4
    out.append(
        f'<rect x="{cursor_x:.0f}" y="{body_h + 7:.1f}" width="8" height="14" fill="#c9d1d9">'
        '<animate attributeName="opacity" values="1;1;0;0" keyTimes="0;0.5;0.51;1" dur="1s" repeatCount="indefinite"/></rect>'
    )
    out.append("</svg>")
    return "".join(out)


def main() -> None:
    cells = to_cells(fetch_avatar(LOGIN))
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(svg(cells, LOGIN), encoding="utf-8")
    print(f"컬러 글자 초상 {ROWS}줄 × {COLS}칸 생성 완료 ({OUT.stat().st_size // 1024}KB)")


if __name__ == "__main__":
    main()

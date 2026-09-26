"""예시(명화·애니풍·우주)를 사이트 변환기(js/)로 그려 assets/gallery/*.svg를 만들고,
index.html의 갤러리 카드와 첫 화면 예시 버튼을 classics.json 기준으로 다시 쓴다.

사용: python scripts/build_gallery.py [--sheet]
  --sheet  정지본을 한 장에 모은 대조표(.verify/contact-sheet.png)도 만든다 (자르기 위치 조정용)
"""
import json
import subprocess
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / ".verify" / "raw"
CLASSICS = json.loads((ROOT / "assets" / "classics" / "classics.json").read_text(encoding="utf-8"))


def dump_raw() -> None:
    RAW.mkdir(parents=True, exist_ok=True)
    for item in CLASSICS:
        img = Image.open(ROOT / "assets" / "classics" / f"{item['slug']}.jpg").convert("RGB")
        (RAW / f"{item['slug']}.rgb").write_bytes(img.tobytes())
        (RAW / f"{item['slug']}.json").write_text(json.dumps({"w": img.width, "h": img.height}))


def contact_sheet(svg_dir: Path) -> None:
    from playwright.sync_api import sync_playwright

    cells = "".join(
        f'<figure><img src="{(svg_dir / (i["slug"] + ".svg")).as_uri()}"><img src="{(ROOT / "assets" / "classics" / (i["slug"] + ".jpg")).as_uri()}"></figure>'
        for i in CLASSICS
    )
    html = ("<style>body{margin:0;background:#fff;display:grid;grid-template-columns:repeat(3,1fr);gap:8px;width:1500px}"
            "figure{margin:0;display:flex;gap:4px;align-items:start}figure img:first-child{width:300px}figure img:last-child{width:180px}</style>" + cells)
    page_file = ROOT / ".verify" / "sheet.html"
    page_file.write_text(html, encoding="utf-8")
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1500, "height": 800})
        page.goto(page_file.as_uri())
        page.wait_for_timeout(500)
        page.screenshot(path=str(ROOT / ".verify" / "contact-sheet.png"), full_page=True)
        browser.close()


def card(item: dict) -> str:
    wide = item["options"].get("card") == "wide"
    w, h = (880, 500) if wide else (560, 635)
    src = f"assets/gallery/{item['slug']}.svg"
    alt = f"{item['title']} as a colour ASCII portrait"
    img = f'<img src="{src}" alt="{alt}" width="{w}" height="{h}">'
    lazy = img.replace(' src="', ' data-src="', 1)
    meta = "880×500" if wide else item["options"].get("contrast", "global")
    return (f'          <figure class="win{" wide-card" if wide else ""}" data-group="{item["group"]}">'
            f'<div class="win-bar"><span>{item["slug"]}.svg</span><span class="meta">{meta}</span></div>'
            f'<div class="win-body">{lazy}<noscript>{img}</noscript></div>'
            f'<figcaption class="gallery-foot"><cite>{item["title"]} · {item["author"]}</cite>'
            f'<button type="button" class="btn small" data-classic="{item["slug"]}" data-i18n="open">Open</button></figcaption></figure>')


def pick(item: dict) -> str:
    return (f'<button type="button" class="pick" data-classic="{item["slug"]}" aria-pressed="false" '
            f'title="{item["title"]} · {item["author"]}, {item["year"]}"><img src="assets/classics/{item["slug"]}_thumb.jpg" '
            f'alt="" width="80" height="80"><span>{item["handle"]}</span></button>')


def fill(html: str, name: str, body: str) -> str:
    start, end = f"<!-- {name}:start -->", f"<!-- {name}:end -->"
    a, b = html.index(start) + len(start), html.index(end)
    return html[:a] + body + html[b:]


def write_html() -> None:
    """갤러리 카드와 첫 화면 예시 버튼을 classics.json에서 index.html로 옮겨 쓴다 (JS 없이도 보이도록 정적 HTML)."""
    page = ROOT / "index.html"
    html = page.read_text(encoding="utf-8")
    html = fill(html, "gallery", "\n" + "\n".join(card(i) for i in CLASSICS) + "\n")
    html = fill(html, "picks", "".join(pick(i) for i in CLASSICS))
    page.write_text(html, encoding="utf-8")


def main() -> None:
    write_html()
    dump_raw()
    out = ROOT / "assets" / "gallery"
    subprocess.run(["node", str(ROOT / "scripts" / "gallery.mjs"), str(RAW), str(out)], check=True)
    if "--sheet" in sys.argv:
        static = ROOT / ".verify" / "gallery-static"
        subprocess.run(["node", str(ROOT / "scripts" / "gallery.mjs"), str(RAW), str(static), "--static"], check=True)
        contact_sheet(static)


if __name__ == "__main__":
    main()

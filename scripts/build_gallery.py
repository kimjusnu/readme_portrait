"""예시 명화를 사이트 변환기(js/)로 그려 assets/gallery/*.svg를 만든다.

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


def main() -> None:
    dump_raw()
    out = ROOT / "assets" / "gallery"
    subprocess.run(["node", str(ROOT / "scripts" / "gallery.mjs"), str(RAW), str(out)], check=True)
    if "--sheet" in sys.argv:
        static = ROOT / ".verify" / "gallery-static"
        subprocess.run(["node", str(ROOT / "scripts" / "gallery.mjs"), str(RAW), str(static), "--static"], check=True)
        contact_sheet(static)


if __name__ == "__main__":
    main()

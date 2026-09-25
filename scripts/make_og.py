"""공유 미리보기 이미지(1200×630)를 만든다.

사용: python scripts/build_gallery.py && python scripts/make_og.py → assets/og.png
"""
import shutil
import subprocess
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
HTML = """<!doctype html><meta charset=utf-8><link rel=stylesheet href="fonts/fonts.css"><style>
body{margin:0;width:1200px;height:630px;background:#d6ecfb url(clouds.png) center/cover;image-rendering:pixelated;
display:flex;align-items:center;gap:40px;padding:0 56px;box-sizing:border-box;font-family:'Inter Tight',sans-serif;color:#202020}
h1{font-size:92px;line-height:.9;margin:0 0 24px;letter-spacing:-.055em;font-weight:800}
.tag{display:inline-block;background:#202020;color:#dcdcdc;font:30px/1 VT323,monospace;padding:6px 10px}
.cards{display:flex;gap:14px;flex:none}.cards img{width:250px;image-rendering:auto}
.cards img:nth-child(2){margin-top:60px}
</style><div><h1>Your Face, Typed Into Your README.</h1><span class=tag>kimjusnu.github.io/readme_portrait</span></div>
<div class=cards><img src="gallery-static/mona_lisa.svg"><img src="gallery-static/pearl_earring.svg"></div>"""


def main() -> None:
    # 명화 정지본은 build_gallery.py가 남긴 원시 픽셀(.verify/raw)로 그린다
    static = ROOT / "assets" / "gallery-static"
    subprocess.run(["node", str(ROOT / "scripts" / "gallery.mjs"), str(ROOT / ".verify" / "raw"), str(static), "--static"], check=True)
    page_file = ROOT / "assets" / "_og.html"
    page_file.write_text(HTML, encoding="utf-8")
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page(viewport={"width": 1200, "height": 630})
            page.goto(page_file.as_uri())
            page.wait_for_timeout(300)
            page.screenshot(path=str(ROOT / "assets" / "og.png"))
            browser.close()
    finally:
        page_file.unlink()
        shutil.rmtree(static, ignore_errors=True)


if __name__ == "__main__":
    main()

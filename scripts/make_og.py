"""공유 미리보기 이미지(1200×630)를 만든다. 사용: python scripts/make_og.py → assets/og.png"""
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
HTML = """<!doctype html><meta charset=utf-8><style>
body{margin:0;width:1200px;height:630px;background:#0d1117;color:#e6edf3;display:flex;align-items:center;gap:56px;
padding:0 64px;box-sizing:border-box;font-family:'Segoe UI',system-ui,sans-serif}
h1{font-size:60px;line-height:1.1;margin:0 0 20px;letter-spacing:-.02em}p{font-size:26px;color:#8b949e;margin:0 0 28px}
code{font:600 26px ui-monospace,Consolas,monospace;color:#3fb950}img{width:470px;flex:none}
</style><div><h1>An ASCII portrait that types itself into your GitHub README</h1>
<p>Photo or username in. One SVG out. Runs in your browser.</p><code>kimjusnu.github.io/readme_portrait</code></div>
<img src="portrait.static.svg">"""


def main() -> None:
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


if __name__ == "__main__":
    main()

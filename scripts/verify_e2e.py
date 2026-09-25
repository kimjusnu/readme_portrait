"""브라우저에서 사이트를 실제로 조작해 완료 기준(HANDOFF 5절)을 잰다.

사용: python scripts/verify_e2e.py   → 결과는 표준 출력, 캡처·SVG는 .verify/
     BASE_URL=https://kimjusnu.github.io/readme_portrait/ python scripts/verify_e2e.py   → 배포본 검사
"""
import http.server
import os
import re
import socketserver
import threading
from functools import partial
from pathlib import Path

from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / ".verify"
PORT = 8765
LOCAL = f"http://127.0.0.1:{PORT}/"
BASE = os.environ.get("BASE_URL", LOCAL)
SAMPLE = ROOT / "reference" / "sample-avatar.png"
REFERENCE = (ROOT / "reference" / "portrait.sample.svg").read_text(encoding="utf-8")
results: list[tuple[str, bool, str]] = []


def check(name: str, ok: bool, detail: str) -> None:
    results.append((name, ok, detail))
    print(f"{'PASS' if ok else 'FAIL'}  {name}: {detail}")


def rows(svg: str) -> list[tuple[str, list[str]]]:
    out = []
    for body in re.findall(r'lengthAdjust="spacing">(.*?)</text>', svg):
        spans = re.findall(r'<tspan fill="(#[0-9a-f]{3})">([^<]*)</tspan>', body)
        text = "".join(t for _, t in spans).replace("&lt;", "<").replace("&gt;", ">").replace("&amp;", "&")
        fills = [f for f, t in spans for _ in t.replace("&lt;", "<").replace("&gt;", ">").replace("&amp;", "&")]
        out.append((text, fills))
    return out


def serve() -> socketserver.TCPServer:
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *args) -> None:
            pass

    handler = partial(Quiet, directory=str(ROOT))
    server = socketserver.TCPServer(("127.0.0.1", PORT), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    return server


def current_svg(page) -> str:
    return page.evaluate("async () => (await fetch(document.getElementById('download').href)).text()")


def wait_ready(page) -> None:
    page.wait_for_function("document.getElementById('status').textContent.startsWith('Done')")


def rows_visible(png: Path, n_rows: int, scale: float) -> tuple[int, list[int]]:
    """각 글자 줄 띠에서 배경이 아닌 픽셀이 좌우 끝까지 있는지 센다."""
    img = Image.open(png).convert("RGB")
    px = img.load()
    bad = []
    line_h = 555 / n_rows
    for i in range(n_rows):
        y0, y1 = int((37 + i * line_h + 1) * scale), int((37 + (i + 1) * line_h - 1) * scale)
        # 카드 테두리 선이 잡히지 않도록 글자 영역(x 15~545) 안만 본다
        xs = [x for y in range(y0, y1) for x in range(int(15 * scale), int(545 * scale)) if max(px[x, y]) > 60]
        if not xs or min(xs) > 30 * scale or max(xs) < 530 * scale:
            bad.append(i)
    return n_rows - len(bad), bad


def svg_shot(browser, svg_path: Path, png: Path, wait_ms: int) -> None:
    page = browser.new_page(viewport={"width": 560, "height": 635}, device_scale_factor=2)
    page.goto(svg_path.as_uri())
    page.wait_for_timeout(wait_ms)
    page.screenshot(path=str(png))
    page.close()


def desktop(browser) -> None:
    ctx = browser.new_context(viewport={"width": 1280, "height": 900}, locale="en-US")
    page = ctx.new_page()
    requests = []
    page.on("request", lambda r: requests.append((r.method, r.url)))
    page.goto(BASE)
    page.set_input_files("#file", str(SAMPLE))
    wait_ready(page)
    got = rows(current_svg(page))
    ref = rows(REFERENCE)
    total = sum(len(t) for t, _ in ref)
    chars = sum(a == b for (ta, _), (tb, _) in zip(got, ref) for a, b in zip(ta, tb))
    fills = sum(a == b for (_, fa), (_, fb) in zip(got, ref) for a, b in zip(fa, fb))
    check("1 char match vs reference", chars / total >= 0.9, f"{chars}/{total} = {chars / total:.2%} (fill {fills}/{total})")

    page.fill("#title", "kimjusnu")
    page.fill("#name", "kimjusnu")
    page.wait_for_timeout(500)
    svg = current_svg(page)
    check("1b byte-identical with name kimjusnu", svg == REFERENCE, f"{len(svg.encode())} vs {len(REFERENCE.encode())} bytes")
    (OUT / "portrait.svg").write_text(svg, encoding="utf-8")
    kb = len(svg.encode()) / 1024
    check("4 default size <= 300 KB", kb <= 300, f"{kb:.1f} KB")

    page.uncheck("#animate")
    page.wait_for_timeout(500)
    static = current_svg(page)
    (OUT / "portrait.static.svg").write_text(static, encoding="utf-8")
    check("3a static file has no <animate>", "<animate" not in static, f"{static.count('<animate')} animate tags")

    external = [(m, u) for m, u in requests if not u.startswith(BASE) and not u.startswith("blob:")]
    check("6a file upload: no request leaves the site", not external, f"{len(requests)} requests, external={external}")
    ctx.close()


def github_lookup(browser) -> None:
    ctx = browser.new_context(locale="en-US")
    page = ctx.new_page()
    requests = []
    page.on("request", lambda r: requests.append((r.method, r.url)))
    page.goto(BASE + "?u=kimjusnu")
    page.wait_for_function("/^(Done|GitHub|Could|No )/.test(document.getElementById('status').textContent)", timeout=20000)
    status = page.text_content("#status")
    external = [(m, u) for m, u in requests if not u.startswith(BASE) and not u.startswith("blob:")]
    allowed = all(m == "GET" and (u.startswith("https://api.github.com/users/") or u.startswith("https://avatars.githubusercontent.com/"))
                  for m, u in external)
    check("6b GitHub id: only GET to GitHub API + avatar", allowed and status.startswith("Done"), f"status='{status}', external={external}")
    ctx.close()


def mobile(browser) -> None:
    ctx = browser.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, accept_downloads=True, locale="en-US")
    ctx.grant_permissions(["clipboard-read", "clipboard-write"], origin=BASE.rstrip("/"))
    page = ctx.new_page()
    page.goto(BASE)
    page.set_input_files("#file", str(SAMPLE))
    wait_ready(page)
    width = page.evaluate("document.documentElement.scrollWidth")
    check("5a 390px: no horizontal scroll", width <= 390, f"scrollWidth={width}")
    page.screenshot(path=str(OUT / "mobile-390.png"), full_page=True)
    with page.expect_download() as dl:
        page.click("#download")
    path = OUT / "downloaded.svg"
    dl.value.save_as(str(path))
    check("5b download button", dl.value.suggested_filename == "portrait.svg" and path.stat().st_size > 1000,
          f"{dl.value.suggested_filename}, {path.stat().st_size} bytes")
    page.click("[data-copy='code-half']")
    clip = page.evaluate("navigator.clipboard.readText()")
    check("5c copy button", clip.startswith('<img src="assets/portrait.svg"'), repr(clip[:70]))
    boxes = page.evaluate("""[...document.querySelectorAll('button, a.btn, input, select')]
        .filter(e => e.offsetParent).map(e => e.getBoundingClientRect())
        .filter(r => r.right > 390.5 || r.left < -0.5).length""")
    check("5d 390px: no control overflows the viewport", boxes == 0, f"{boxes} overflowing controls")
    ctx.close()


def visibility(browser) -> None:
    for name, wait in (("portrait.static.svg", 300), ("portrait.svg", 5500)):
        png = OUT / f"{name}.png"
        svg_shot(browser, OUT / name, png, wait)
        ok_rows, bad = rows_visible(png, 62, 2)
        check(f"3 all rows visible: {name}", not bad, f"{ok_rows}/62 rows span full width, missing={bad[:10]}")


def github_readme(browser) -> None:
    """실제 github.com 저장소 README에서 SVG가 불러와지고 전 줄이 보이는지 2배 배율로 잰다."""
    page = browser.new_page(viewport={"width": 1280, "height": 1000}, device_scale_factor=2, locale="en-US")
    page.goto("https://github.com/kimjusnu/readme_portrait", wait_until="networkidle")
    img = page.locator("article img[alt^='Animated colour ASCII portrait']").first
    img.scroll_into_view_if_needed()
    natural = img.evaluate("e => [e.complete, e.naturalWidth, e.naturalHeight]")
    page.wait_for_timeout(6000)
    png = OUT / "github-readme-2x.png"
    img.screenshot(path=str(png))
    page.close()
    ok_rows, bad = rows_visible(png, 62, Image.open(png).width / 560)
    check("2 GitHub README renders the SVG", natural == [True, 560, 635] and not bad,
          f"loaded={natural}, {ok_rows}/62 rows visible")


def main() -> None:
    OUT.mkdir(exist_ok=True)
    server = serve() if BASE == LOCAL else None
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch()
            desktop(browser)
            visibility(browser)
            mobile(browser)
            github_lookup(browser)
            if os.environ.get("CHECK_GITHUB"):
                github_readme(browser)
            browser.close()
    finally:
        if server:
            server.shutdown()
    failed = [n for n, ok, _ in results if not ok]
    print(f"\n{len(results) - len(failed)}/{len(results)} checks passed" + (f"; failed: {failed}" if failed else ""))


if __name__ == "__main__":
    main()

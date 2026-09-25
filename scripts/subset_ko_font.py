"""한국어 화면의 픽셀 글꼴(갈무리11, OFL)을 사이트에서 쓰는 글자만 남겨 만든다.

사용: python scripts/subset_ko_font.py
  → assets/fonts/galmuri11-ko.woff2 + galmuri-chars.txt(담은 글자 목록) + Galmuri-LICENSE.txt
js/i18n.js의 한국어 문구를 고치면 다시 돌린다. test/font.test.mjs가 빠진 글자를 잡는다.
"""
import re
import urllib.request
from pathlib import Path

from fontTools import subset

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "fonts"
BASE = "https://cdn.jsdelivr.net/npm/galmuri@2.40.3"


def get(url: str) -> bytes:
    with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "readme_portrait"}), timeout=60) as res:
        return res.read()


def korean_chars() -> str:
    source = (ROOT / "js" / "i18n.js").read_text(encoding="utf-8")
    hangul = {ch for ch in source if "가" <= ch <= "힣" or "ㄱ" <= ch <= "ㆎ"}
    punctuation = set("「」·…—→")
    return "".join(sorted(hangul | punctuation))


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    full = OUT / "_galmuri11-full.woff2"
    full.write_bytes(get(f"{BASE}/dist/Galmuri11.woff2"))
    chars = korean_chars()
    options = subset.Options()
    options.flavor = "woff2"
    options.layout_features = ["*"]
    font = subset.load_font(str(full), options)
    sub = subset.Subsetter(options)
    sub.populate(text=chars)
    sub.subset(font)
    subset.save_font(font, str(OUT / "galmuri11-ko.woff2"), options)
    font.close()  # Windows keeps the source locked until the font is closed
    full.unlink()
    (OUT / "galmuri-chars.txt").write_text(chars, encoding="utf-8")
    (OUT / "Galmuri-LICENSE.txt").write_bytes(get(f"{BASE}/dist/LICENSE.txt"))
    size = (OUT / "galmuri11-ko.woff2").stat().st_size
    print(f"galmuri11-ko.woff2 {size // 1024} KB, {len(chars)} glyphs")


if __name__ == "__main__":
    main()

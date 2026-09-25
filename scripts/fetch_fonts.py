"""사이트 글꼴(OFL)을 직접 담는다. 외부 글꼴 서버로 방문자 요청이 나가지 않게 하기 위해서다.

사용: python scripts/fetch_fonts.py → assets/fonts/*.woff2 + assets/fonts/fonts.css + assets/fonts/OFL.txt
라틴 문자 범위(latin)만 받는다. 한국어는 시스템 글꼴로 보여 준다.
"""
import re
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "fonts"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36"
CSS_URL = "https://fonts.googleapis.com/css2?family=Inter+Tight:wght@500;600;700;800&family=JetBrains+Mono:wght@400;700&family=VT323&display=swap"
LICENSES = {
    "Inter Tight": "https://raw.githubusercontent.com/google/fonts/main/ofl/intertight/OFL.txt",
    "JetBrains Mono": "https://raw.githubusercontent.com/google/fonts/main/ofl/jetbrainsmono/OFL.txt",
    "VT323": "https://raw.githubusercontent.com/google/fonts/main/ofl/vt323/OFL.txt",
}


def get(url: str) -> bytes:
    with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": UA}), timeout=60) as res:
        return res.read()


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    css = get(CSS_URL).decode("utf-8")
    blocks = re.findall(r"/\* ([\w-]+) \*/\s*(@font-face\s*{[^}]+})", css)
    # Google은 굵기마다 같은 가변 글꼴 파일을 준다. 파일 하나에 굵기 범위를 적는다
    faces: dict[str, dict] = {}
    for subset, block in blocks:
        if subset != "latin":
            continue
        url = re.search(r"url\((https://[^)]+\.woff2)\)", block).group(1)
        face = faces.setdefault(url, {"block": block, "weights": []})
        face["weights"].append(int(re.search(r"font-weight:\s*(\d+)", block).group(1)))
    kept = []
    for url, face in faces.items():
        family = re.search(r"font-family:\s*'([^']+)'", face["block"]).group(1)
        name = f"{family.lower().replace(' ', '-')}.woff2"
        (OUT / name).write_bytes(get(url))
        low, high = min(face["weights"]), max(face["weights"])
        weight = str(low) if low == high else f"{low} {high}"
        block = re.sub(r"font-weight:\s*\d+", f"font-weight: {weight}", face["block"]).replace(url, name)
        kept.append(block)
        print(name, weight, (OUT / name).stat().st_size // 1024, "KB")
    (OUT / "fonts.css").write_text("/* Self-hosted from Google Fonts (latin subset). Licenses: OFL.txt */\n" + "\n".join(kept) + "\n", encoding="utf-8")
    licenses = [f"==== {family} ====\n{get(url).decode('utf-8').strip()}\n" for family, url in LICENSES.items()]
    (OUT / "OFL.txt").write_text("\n".join(licenses), encoding="utf-8")


if __name__ == "__main__":
    main()

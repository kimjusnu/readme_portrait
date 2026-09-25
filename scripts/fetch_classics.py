"""예시로 쓰는 퍼블릭 도메인 명화·사진을 위키미디어 커먼즈에서 받고 출처를 기록한다.

사용: python scripts/fetch_classics.py
  → assets/classics/<slug>.jpg (긴 변 720px) + <slug>_thumb.jpg (160px) + CREDITS.md
라이선스가 Public domain이 아니면 받지 않고 멈춘다.
"""
import io
import json
import re
import urllib.parse
import urllib.request
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "classics"
UA = "readme_portrait/1.0 (https://github.com/kimjusnu/readme_portrait)"
MAX_SIDE = 720

# slug, 커먼즈 파일 이름, 화면에 쓸 제목
CLASSICS = [
    ("mona_lisa", "Mona Lisa, by Leonardo da Vinci, from C2RMF retouched.jpg", "Mona Lisa"),
    ("pearl_earring", "1665 Girl with a Pearl Earring.jpg", "Girl with a Pearl Earring"),
    ("van_gogh", "Vincent van Gogh - Self-Portrait - Google Art Project (454045).jpg", "Self-Portrait"),
    ("lincoln", "Abraham Lincoln O-77 matte collodion print.jpg", "Abraham Lincoln"),
    ("einstein", "Einstein 1921 by F Schmutzer - restoration.jpg", "Albert Einstein"),
    ("great_wave", "Tsunami by hokusai 19th century.jpg", "The Great Wave off Kanagawa"),
]


def get(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as res:
        return res.read()


def plain(html: str) -> str:
    text = re.sub(r"<div[^>]*display:\s*none.*?</div>", "", html, flags=re.S)
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", text)).strip()


def short_date(ext: dict) -> str:
    text = plain(ext.get("DateTimeOriginal", {}).get("value", "")).removeprefix("First publication:").strip()
    return re.split(r"[.(;]", text)[0].strip()


def info(files: list[str]) -> dict:
    query = urllib.parse.urlencode({
        "action": "query", "format": "json", "prop": "imageinfo", "iiprop": "url|extmetadata",
        "iiurlwidth": "960", "titles": "|".join(f"File:{f}" for f in files),
    })
    pages = json.loads(get(f"https://commons.wikimedia.org/w/api.php?{query}"))["query"]["pages"].values()
    return {p["title"].removeprefix("File:"): p["imageinfo"][0] for p in pages}


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    meta = info([f for _, f, _ in CLASSICS])
    rows = []
    for slug, name, title in CLASSICS:
        ii = meta[name]
        ext = ii["extmetadata"]
        license_name = ext["LicenseShortName"]["value"]
        if "public domain" not in license_name.lower():
            raise SystemExit(f"{name}: license is {license_name!r}, not public domain")
        img = Image.open(io.BytesIO(get(ii["thumburl"].split("?")[0]))).convert("RGB")
        img.thumbnail((MAX_SIDE, MAX_SIDE), Image.LANCZOS)
        img.save(OUT / f"{slug}.jpg", quality=88, optimize=True)
        thumb = img.copy()
        thumb.thumbnail((160, 160), Image.LANCZOS)  # 예시 고르기 버튼용
        thumb.save(OUT / f"{slug}_thumb.jpg", quality=82, optimize=True)
        rows.append(f"| {title} | {plain(ext['Artist']['value'])} | {short_date(ext)} "
                    f"| {license_name} | [Wikimedia Commons]({ii['descriptionurl']}) |")
        print(f"{slug}: {img.size}, {(OUT / f'{slug}.jpg').stat().st_size // 1024} KB, {license_name}")
    (ROOT / "CREDITS.md").write_text(
        "# Credits\n\nExample images are public-domain works downloaded from Wikimedia Commons "
        "and resized for the web (`scripts/fetch_classics.py`).\n\n"
        "| Work | Author | Date | License | Source |\n|---|---|---|---|---|\n" + "\n".join(rows) + "\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()

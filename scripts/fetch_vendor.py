"""브라우저에서 쓰는 외부 라이브러리를 버전 고정으로 받아 js/vendor/에 담는다 (방문자 요청이 CDN으로 나가지 않게).

사용: python scripts/fetch_vendor.py
"""
import hashlib
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "js" / "vendor"
# 이름, 버전, 받을 파일 → 저장 이름
PACKAGES = [("gifenc", "1.0.3", {"dist/gifenc.esm.js": "gifenc.esm.js", "LICENSE.md": "gifenc.LICENSE.md"})]


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for name, version, files in PACKAGES:
        for src, dst in files.items():
            url = f"https://cdn.jsdelivr.net/npm/{name}@{version}/{src}"
            with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "readme_portrait"}), timeout=60) as res:
                data = res.read()
            (OUT / dst).write_bytes(data)
            print(f"{dst} {len(data)} B sha256={hashlib.sha256(data).hexdigest()[:16]}")


if __name__ == "__main__":
    main()

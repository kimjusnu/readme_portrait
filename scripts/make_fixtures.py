"""Pillow 기준값을 만들어 JS 변환이 같은 결과를 내는지 테스트에 쓴다.

사용: python scripts/make_fixtures.py
  → test/fixtures/small.json   (작은 무작위 이미지로 단계별 기준값)
  → test/fixtures/sample.rgb   (reference/sample-avatar.png의 원시 RGB)
  → test/fixtures/sample.json  (reference/portrait.py가 낸 칸 글자·색)
  → test/fixtures/sample-crop.eq (샘플을 자른 영역의 평활화 결과)
"""
import json
import random
import sys
from pathlib import Path

from PIL import Image, ImageEnhance, ImageOps

ROOT = Path(__file__).resolve().parent.parent
FIX = ROOT / "test" / "fixtures"
sys.path.insert(0, str(ROOT / "reference"))
import portrait  # noqa: E402


def small_fixture() -> dict:
    rnd = random.Random(7)
    w, h = 61, 47
    img = Image.new("RGB", (w, h))
    img.putdata([(rnd.randrange(256), rnd.randrange(256), rnd.randrange(256)) for _ in range(w * h)])
    lum = img.convert("L")
    eq = ImageOps.equalize(lum)
    color = ImageEnhance.Brightness(ImageEnhance.Color(img).enhance(1.3)).enhance(1.6)
    return {
        "w": w,
        "h": h,
        "rgb": list(img.tobytes()),
        "luma": list(lum.tobytes()),
        "equalized": list(eq.tobytes()),
        "resizedLuma": {"w": 7, "h": 5, "data": list(eq.resize((7, 5), Image.LANCZOS).tobytes())},
        "enhanced": list(color.tobytes()),
        "resizedRgb": {"w": 9, "h": 4, "data": list(img.resize((9, 4), Image.LANCZOS).tobytes())},
    }


def main() -> None:
    FIX.mkdir(parents=True, exist_ok=True)
    (FIX / "small.json").write_text(json.dumps(small_fixture()), encoding="utf-8")
    img = Image.open(ROOT / "reference" / "sample-avatar.png").convert("RGB")
    (FIX / "sample.rgb").write_bytes(img.tobytes())
    # 명암이 치우친 실제 사진이라야 평활화 계산식의 작은 차이가 드러난다
    (FIX / "sample-crop.eq").write_bytes(ImageOps.equalize(img.crop((40, 9, 419, 414)).convert("L")).tobytes())
    cells = portrait.to_cells(img)
    sample = {"w": img.width, "h": img.height, "chars": ["".join(c for c, _ in row) for row in cells],
              "fills": [[f for _, f in row] for row in cells]}
    (FIX / "sample.json").write_text(json.dumps(sample), encoding="utf-8")
    print("fixtures written:", sorted(p.name for p in FIX.iterdir()))


if __name__ == "__main__":
    main()

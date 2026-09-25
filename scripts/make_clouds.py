"""첫 화면 배경의 디더링 구름을 만든다. 작은 PNG를 픽셀 그대로 키워 쓴다.

사용: python scripts/make_clouds.py → assets/clouds.png (720×330, 3색)
"""
import random
from pathlib import Path

from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
W, H = 720, 330
SKY, PINK, WHITE = (214, 236, 251), (255, 110, 214), (254, 254, 254)
BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]


def noise(seed: int, scale: int, blur: float) -> Image.Image:
    rnd = random.Random(seed)
    small = Image.new("L", (W // scale + 2, H // scale + 2))
    small.putdata([rnd.randrange(256) for _ in range(small.width * small.height)])
    return small.resize((W, H), Image.BICUBIC).filter(ImageFilter.GaussianBlur(blur))


def main() -> None:
    coarse, fine = noise(3, 60, 9).load(), noise(9, 12, 2).load()
    img = Image.new("RGB", (W, H))
    px = img.load()
    for y in range(H):
        for x in range(W):
            edge = abs(x - W / 2) / (W / 2)  # 구름은 양옆에 몰리고 가운데는 하늘
            cloud = (coarse[x, y] / 255) * 0.6 + (fine[x, y] / 255) * 0.25 + edge ** 1.6 * 0.55 - 0.35
            fade = max(0.0, (y - H * 0.55) / (H * 0.45))  # 아래로 갈수록 흰 바탕으로 녹는다
            t = (BAYER[y % 4][x % 4] + 0.5) / 16
            if fade > t:
                px[x, y] = WHITE
            elif cloud > t * 0.9 + 0.05:
                px[x, y] = PINK
            else:
                px[x, y] = SKY
    img = img.quantize(colors=3)
    img.save(ROOT / "assets" / "clouds.png", optimize=True)
    print(f"clouds.png {(ROOT / 'assets' / 'clouds.png').stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()

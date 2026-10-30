"""Draws the launcher icons (a framed landscape) at the sizes webOS expects."""
import sys
from PIL import Image, ImageDraw

def icon(size):
    s = 4  # supersample, then downscale for smooth edges
    W = size * s
    im = Image.new("RGBA", (W, W), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, W - 1, W - 1], radius=W // 5, fill=(20, 24, 29, 255))
    pad = W // 6
    inner = [pad, pad, W - pad, W - pad]
    sky = Image.new("RGBA", (inner[2] - inner[0], inner[3] - inner[1]))
    sd = ImageDraw.Draw(sky)
    h = sky.height
    top, bottom = (40, 58, 102), (238, 154, 108)
    for y in range(h):
        t = y / max(h - 1, 1)
        sd.line([(0, y), (sky.width, y)], fill=tuple(int(a + (b - a) * t) for a, b in zip(top, bottom)) + (255,))
    w = sky.width
    sd.polygon([(0, h * .62), (w * .35, h * .48), (w * .7, h * .6), (w, h * .5), (w, h), (0, h)], fill=(59, 45, 74, 255))
    sd.polygon([(0, h * .8), (w * .45, h * .7), (w, h * .78), (w, h), (0, h)], fill=(26, 20, 36, 255))
    r = w * .09
    sd.ellipse([w * .68 - r, h * .28 - r, w * .68 + r, h * .28 + r], fill=(255, 224, 180, 255))
    mask = Image.new("L", sky.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, w - 1, h - 1], radius=W // 18, fill=255)
    im.paste(sky, (inner[0], inner[1]), mask)
    d.rounded_rectangle(inner, radius=W // 18, outline=(245, 243, 239, 255), width=max(s * size // 40, s))
    return im.resize((size, size), Image.LANCZOS)

out = sys.argv[1] if len(sys.argv) > 1 else "."
icon(80).save(f"{out}/icon.png")
icon(130).save(f"{out}/largeIcon.png")

#!/usr/bin/env python3
"""Generate high-resolution textures and assets for the VCS+ Overhaul Mod.
Creates textures for Pole Position Strip Club interior, dancers, VIP lounge, and Vanilla Unicorn mechanics.
"""

import os
import math
import random
from PIL import Image, ImageDraw, ImageFilter

TEX_DIR = "mods/14_vcs_plus_overhaul/textures"
os.makedirs(TEX_DIR, exist_ok=True)

def gen_neon_sign():
    """512x256 Glowing 80s synthwave neon sign for Pole Position Club."""
    w, h = 512, 256
    img = Image.new("RGBA", (w, h), (10, 8, 20, 240))
    draw = ImageDraw.Draw(img)

    for offset, alpha, width in [(6, 40, 2), (4, 90, 2), (2, 180, 3), (0, 255, 3)]:
        draw.rounded_rectangle([12 - offset, 12 - offset, w - 12 + offset, h - 12 + offset],
                               radius=20, outline=(255, 42, 140, alpha), width=width)
        draw.rounded_rectangle([20 - offset, 20 - offset, w - 20 + offset, h - 20 + offset],
                               radius=16, outline=(41, 171, 226, alpha // 2), width=width)

    cx, cy = w // 2, h // 2 - 10
    draw.ellipse([cx - 18, cy - 60, cx + 18, cy - 24], fill=(255, 230, 240, 240))
    draw.polygon([(cx - 12, cy - 24), (cx + 12, cy - 24), (cx + 22, cy + 20), (cx - 22, cy + 20)], fill=(255, 42, 140, 220))
    draw.line([(cx - 8, cy + 20), (cx - 16, cy + 70)], fill=(41, 171, 226, 255), width=6)
    draw.line([(cx + 8, cy + 20), (cx + 20, cy + 65)], fill=(41, 171, 226, 255), width=6)
    draw.line([(cx + 28, 25), (cx + 28, h - 25)], fill=(255, 255, 255, 220), width=4)

    glow = img.filter(ImageFilter.GaussianBlur(radius=3))
    final = Image.alpha_composite(glow, img)
    final.save(os.path.join(TEX_DIR, "pole_position_neon_sign.png"))
    print("Generated pole_position_neon_sign.png")

def gen_stage_disco():
    """512x512 Glowing synthwave grid floor with illuminated disco tiles."""
    size = 512
    img = Image.new("RGBA", (size, size), (16, 12, 28, 255))
    draw = ImageDraw.Draw(img)

    step = 64
    for y in range(0, size, step):
        for x in range(0, size, step):
            idx = (x // step + y // step) % 3
            if idx == 0:
                color = (41, 171, 226, 80)
            elif idx == 1:
                color = (255, 42, 140, 90)
            else:
                color = (138, 43, 226, 75)
            draw.rectangle([x + 3, y + 3, x + step - 3, y + step - 3], fill=color)
            draw.rectangle([x + 8, y + 8, x + step - 8, y + step - 8], fill=(color[0], color[1], color[2], 30))

    for i in range(0, size + 1, step):
        draw.line([(i, 0), (i, size)], fill=(255, 255, 255, 140), width=2)
        draw.line([(0, i), (size, i)], fill=(255, 255, 255, 140), width=2)

    img.save(os.path.join(TEX_DIR, "strip_club_stage_disco.png"))
    print("Generated strip_club_stage_disco.png")

def gen_vip_leather():
    """512x512 Diamond-stitched luxury tufted burgundy leather for VIP lounge."""
    size = 512
    img = Image.new("RGBA", (size, size), (68, 12, 24, 255))
    draw = ImageDraw.Draw(img)

    step = 64
    for y in range(-step, size + step, step):
        for x in range(-step, size + step, step):
            p1 = (x, y + step // 2)
            p2 = (x + step // 2, y)
            p3 = (x + step, y + step // 2)
            p4 = (x + step // 2, y + step)
            draw.line([p1, p2, p3, p4, p1], fill=(42, 8, 16, 220), width=3)
            bx, by = x + step // 2, y + step // 2
            draw.ellipse([bx - 4, by - 4, bx + 4, by + 4], fill=(212, 175, 55, 230), outline=(255, 215, 0, 255))

    img = img.filter(ImageFilter.SMOOTH)
    img.save(os.path.join(TEX_DIR, "vip_lounge_leather.png"))
    print("Generated vip_lounge_leather.png")

def gen_dancer_textures():
    """Generate high-definition stage dancer textures (lingerie, bikini, skin tone)."""
    # 1. dancer_stage_lingerie.png (sultry neon pink sequin / lace clubwear)
    size = 512
    img = Image.new("RGBA", (size, size), (25, 10, 20, 255))
    draw = ImageDraw.Draw(img)
    # Lace pattern
    for y in range(0, size, 16):
        for x in range(0, size, 16):
            if (x // 16 + y // 16) % 2 == 0:
                draw.ellipse([x + 2, y + 2, x + 14, y + 14], outline=(255, 42, 140, 160), width=1)
    # Satin ribbons and gold trim
    draw.line([(0, size // 3), (size, size // 3)], fill=(255, 215, 0, 240), width=4)
    draw.line([(0, 2 * size // 3), (size, 2 * size // 3)], fill=(255, 42, 140, 220), width=6)
    img.save(os.path.join(TEX_DIR, "dancer_stage_lingerie.png"))
    print("Generated dancer_stage_lingerie.png")

    # 2. dancer_pole_outfit.png (cyan & metallic silver bikini)
    img2 = Image.new("RGBA", (size, size), (15, 22, 35, 255))
    draw2 = ImageDraw.Draw(img2)
    for y in range(0, size, 24):
        draw2.line([(0, y), (size, y + 12)], fill=(41, 171, 226, 180), width=2)
        draw2.line([(0, y + 12), (size, y)], fill=(200, 240, 255, 140), width=2)
    img2.save(os.path.join(TEX_DIR, "dancer_pole_outfit.png"))
    print("Generated dancer_pole_outfit.png")

    # 3. dancer_body_skin.png (smooth warm skin tone with specular highlights)
    img3 = Image.new("RGBA", (size, size), (225, 175, 140, 255))
    draw3 = ImageDraw.Draw(img3)
    for _ in range(800):
        rx, ry = random.randint(0, size), random.randint(0, size)
        draw3.point((rx, ry), fill=(235, 185, 150, 60))
    img3 = img3.filter(ImageFilter.GaussianBlur(radius=2))
    img3.save(os.path.join(TEX_DIR, "dancer_body_skin.png"))
    print("Generated dancer_body_skin.png")

    # 4. strip_club_wall_mirrors.png (tinted mirror panels with pink neon reflection)
    img4 = Image.new("RGBA", (size, size), (20, 15, 30, 255))
    draw4 = ImageDraw.Draw(img4)
    for x in range(0, size, 128):
        draw4.line([(x, 0), (x, size)], fill=(255, 255, 255, 180), width=3)
        draw4.polygon([(x + 20, 0), (x + 60, 0), (x + 20, size), (x - 20, size)], fill=(255, 42, 140, 45))
    img4.save(os.path.join(TEX_DIR, "strip_club_wall_mirrors.png"))
    print("Generated strip_club_wall_mirrors.png")

def gen_nitro_flame():
    size = 256
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    cx, cy = size // 2, size - 20
    for r, h, color in [
        (45, 180, (0, 110, 255, 60)),
        (35, 150, (0, 190, 255, 110)),
        (25, 120, (41, 230, 255, 180)),
        (15, 80, (180, 245, 255, 230)),
        (8, 45, (255, 255, 255, 255)),
    ]:
        draw.polygon([(cx - r, cy), (cx + r, cy), (cx, cy - h)], fill=color)
    glow = img.filter(ImageFilter.GaussianBlur(radius=6))
    final = Image.alpha_composite(glow, img)
    final.save(os.path.join(TEX_DIR, "nitro_flame_fx.png"))
    print("Generated nitro_flame_fx.png")

def gen_speedometer():
    w, h = 512, 256
    img = Image.new("RGBA", (w, h), (12, 14, 22, 220))
    draw = ImageDraw.Draw(img)
    cx, cy = w // 2, h - 30
    r = 170
    draw.arc([cx - r, cy - r, cx + r, cy + r], start=180, end=360, fill=(40, 50, 70, 180), width=18)
    draw.arc([cx - r, cy - r, cx + r, cy + r], start=180, end=310, fill=(41, 171, 226, 240), width=14)
    draw.arc([cx - r, cy - r, cx + r, cy + r], start=310, end=360, fill=(255, 42, 140, 255), width=14)
    for deg in range(180, 361, 15):
        rad = math.radians(deg)
        x1 = cx + (r - 18) * math.cos(rad)
        y1 = cy + (r - 18) * math.sin(rad)
        x2 = cx + (r + 4) * math.cos(rad)
        y2 = cy + (r + 4) * math.sin(rad)
        draw.line([(x1, y1), (x2, y2)], fill=(255, 255, 255, 220), width=2)
    draw.rounded_rectangle([cx - 50, cy - 80, cx + 50, cy - 40], radius=8,
                           fill=(0, 180, 240, 180), outline=(255, 255, 255, 240), width=2)
    img.save(os.path.join(TEX_DIR, "speedometer_gauge_hud.png"))
    print("Generated speedometer_gauge_hud.png")

def gen_bullet_time_vignette():
    size = 512
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    cx, cy = size // 2, size // 2
    r_max = size // 2
    for r in range(r_max, 120, -4):
        alpha = int(220 * ((r - 120) / (r_max - 120)) ** 1.8)
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(15, 5, 25, alpha // 6), outline=(80, 10, 50, alpha // 4), width=4)
    img = img.filter(ImageFilter.GaussianBlur(radius=8))
    img.save(os.path.join(TEX_DIR, "bullet_time_vignette.png"))
    print("Generated bullet_time_vignette.png")

if __name__ == "__main__":
    gen_neon_sign()
    gen_stage_disco()
    gen_vip_leather()
    gen_dancer_textures()
    gen_nitro_flame()
    gen_speedometer()
    gen_bullet_time_vignette()
    print("All VCS+ Overhaul textures successfully generated!")

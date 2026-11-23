#!/usr/bin/env python3
"""Generate high-definition remastered replacement textures for Leonidas Vice City Stories.
Creates anti-pixelated, seamless, high-resolution textures for the HD Remake engine.
"""

import os
import math
import random
from PIL import Image, ImageDraw, ImageFilter

def make_dirs():
    os.makedirs("mods/13_hd_textures_overhaul/textures", exist_ok=True)
    os.makedirs("mods/03_hd_hud_and_ui/textures", exist_ok=True)

def gen_radardisc(path):
    """512x512 crisp circular radar ring with glowing neon cyan/magenta styling and compass marks."""
    size = 512
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    center = size // 2
    r_outer = 246
    r_inner = 236
    r_disc = 232

    # Inner transparent dark disc
    draw.ellipse([center - r_disc, center - r_disc, center + r_disc, center + r_disc],
                 fill=(8, 12, 22, 180), outline=None)

    # Outer neon ring bevel
    for r, alpha, width in [(r_outer + 3, 40, 2), (r_outer + 1, 90, 2), (r_outer, 240, 4)]:
        draw.ellipse([center - r, center - r, center + r, center + r],
                     outline=(41, 171, 226, alpha), width=width)

    # Subtle inner accent ring
    draw.ellipse([center - r_inner, center - r_inner, center + r_inner, center + r_inner],
                 outline=(237, 30, 121, 190), width=2)

    # Cardinal ticks (N, S, E, W and 45 degree ticks)
    for angle in range(0, 360, 15):
        rad = math.radians(angle)
        cos_a = math.cos(rad)
        sin_a = math.sin(rad)
        is_cardinal = (angle % 90 == 0)
        tick_len = 14 if is_cardinal else 7
        color = (255, 255, 255, 240) if is_cardinal else (41, 171, 226, 160)
        w = 3 if is_cardinal else 1

        x1 = center + (r_inner - tick_len) * cos_a
        y1 = center + (r_inner - tick_len) * sin_a
        x2 = center + r_inner * cos_a
        y2 = center + r_inner * sin_a
        draw.line([x1, y1, x2, y2], fill=color, width=w)

    img.save(path, "PNG", optimize=True)
    print(f"Generated {path}")

def gen_radar_north(path):
    """128x128 crisp modern neon triangular North pointer."""
    size = 128
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # North arrow coordinates
    cx, cy = size // 2, size // 2
    points_left = [(cx, cy - 48), (cx - 24, cy + 38), (cx, cy + 22)]
    points_right = [(cx, cy - 48), (cx, cy + 22), (cx + 24, cy + 38)]

    # Draw neon pink/cyan dual tone arrow
    draw.polygon(points_left, fill=(237, 30, 121, 240), outline=(255, 255, 255, 255))
    draw.polygon(points_right, fill=(41, 171, 226, 240), outline=(255, 255, 255, 255))
    draw.line([(cx, cy - 48), (cx, cy + 22)], fill=(255, 255, 255, 255), width=2)

    img.save(path, "PNG", optimize=True)
    print(f"Generated {path}")

def gen_crosshair(path):
    """256x256 modern tactical reticle with high precision center and range markers."""
    size = 256
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    cx, cy = size // 2, size // 2

    # Precision center dot
    draw.ellipse([cx - 3, cy - 3, cx + 3, cy + 3], fill=(41, 171, 226, 255))

    # Crosshair bars with gap
    gap = 14
    length = 42
    w = 2

    # Horizontal
    draw.line([cx - gap - length, cy, cx - gap, cy], fill=(255, 255, 255, 230), width=w)
    draw.line([cx + gap, cy, cx + gap + length, cy], fill=(255, 255, 255, 230), width=w)
    # Vertical
    draw.line([cx, cy - gap - length, cx, cy - gap], fill=(255, 255, 255, 230), width=w)
    draw.line([cx, cy + gap, cx, cy + gap + length], fill=(255, 255, 255, 230), width=w)

    # Tactical corner brackets
    r = 64
    bracket = 12
    # Top-Left
    draw.line([cx - r, cy - r, cx - r + bracket, cy - r], fill=(41, 171, 226, 200), width=2)
    draw.line([cx - r, cy - r, cx - r, cy - r + bracket], fill=(41, 171, 226, 200), width=2)
    # Top-Right
    draw.line([cx + r, cy - r, cx + r - bracket, cy - r], fill=(41, 171, 226, 200), width=2)
    draw.line([cx + r, cy - r, cx + r, cy - r + bracket], fill=(41, 171, 226, 200), width=2)
    # Bottom-Left
    draw.line([cx - r, cy + r, cx - r + bracket, cy + r], fill=(41, 171, 226, 200), width=2)
    draw.line([cx - r, cy + r, cx - r, cy + r - bracket], fill=(41, 171, 226, 200), width=2)
    # Bottom-Right
    draw.line([cx + r, cy + r, cx + r - bracket, cy + r], fill=(41, 171, 226, 200), width=2)
    draw.line([cx + r, cy + r, cx + r, cy + r - bracket], fill=(41, 171, 226, 200), width=2)

    img.save(path, "PNG", optimize=True)
    print(f"Generated {path}")

def gen_fist(path):
    """256x256 crisp vector-scaled fist icon."""
    size = 256
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Stylized clean fist
    cx, cy = size // 2, size // 2
    # Knuckles and palm polygon
    fist_poly = [
        (cx - 50, cy + 40), (cx - 55, cy - 20), (cx - 35, cy - 50),
        (cx - 15, cy - 60), (cx + 10, cy - 60), (cx + 35, cy - 52),
        (cx + 55, cy - 25), (cx + 52, cy + 30), (cx + 25, cy + 60),
        (cx - 30, cy + 60)
    ]
    draw.polygon(fist_poly, fill=(237, 30, 121, 220), outline=(255, 255, 255, 255))

    # Knuckle grooves
    draw.line([(cx - 20, cy - 50), (cx - 15, cy - 10)], fill=(255, 255, 255, 200), width=3)
    draw.line([(cx + 5, cy - 52), (cx + 8, cy - 8)], fill=(255, 255, 255, 200), width=3)
    draw.line([(cx + 30, cy - 45), (cx + 28, cy - 5)], fill=(255, 255, 255, 200), width=3)

    # Thumb overlay
    thumb = [(cx - 52, cy - 10), (cx - 25, cy - 5), (cx - 15, cy + 25), (cx - 45, cy + 30)]
    draw.polygon(thumb, fill=(247, 147, 30, 240), outline=(255, 255, 255, 255))

    img.save(path, "PNG", optimize=True)
    print(f"Generated {path}")

def gen_playstation_buttons():
    """128x128 crisp buttons for Cross, Circle, Square, Triangle."""
    buttons = {
        "btn_cross.png": ((41, 171, 226), "X"),
        "btn_circle.png": ((237, 30, 121), "O"),
        "btn_square.png": ((247, 147, 30), "SQUARE"),
        "btn_triangle.png": ((46, 204, 113), "TRIANGLE"),
    }
    size = 128
    for fname, (color, kind) in buttons.items():
        img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        cx, cy = size // 2, size // 2
        r = 52

        # Outer circular frame
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(16, 20, 28, 220),
                     outline=color + (255,), width=4)

        sym_r = 22
        if kind == "X":
            draw.line([cx - sym_r, cy - sym_r, cx + sym_r, cy + sym_r], fill=color + (255,), width=5)
            draw.line([cx + sym_r, cy - sym_r, cx - sym_r, cy + sym_r], fill=color + (255,), width=5)
        elif kind == "O":
            draw.ellipse([cx - sym_r, cy - sym_r, cx + sym_r, cy + sym_r], outline=color + (255,), width=5)
        elif kind == "SQUARE":
            draw.rectangle([cx - sym_r, cy - sym_r, cx + sym_r, cy + sym_r], outline=color + (255,), width=5)
        elif kind == "TRIANGLE":
            p1 = (cx, cy - sym_r - 2)
            p2 = (cx - sym_r - 2, cy + sym_r)
            p3 = (cx + sym_r + 2, cy + sym_r)
            draw.polygon([p1, p2, p3], outline=color + (255,), width=5)

        for p in ["mods/13_hd_textures_overhaul/textures/" + fname, "mods/03_hd_hud_and_ui/textures/" + fname]:
            img.save(p, "PNG", optimize=True)
            print(f"Generated {p}")

def gen_road_asphalt(path):
    """1024x1024 seamless dark asphalt with aggregate noise - no pixelation."""
    size = 1024
    img = Image.new("RGBA", (size, size), (42, 44, 48, 255))
    pixels = img.load()

    # Generate procedural seamless grain
    random.seed(1986)
    for y in range(size):
        for x in range(size):
            n1 = random.randint(-18, 18)
            n2 = random.randint(-8, 8)
            base = 45 + n1 + n2
            # subtle warm asphalt tint
            r = min(255, max(0, base + 2))
            g = min(255, max(0, base + 1))
            b = min(255, max(0, base + 4))
            pixels[x, y] = (r, g, b, 255)

    # Smooth pass to remove high frequency grit and simulate worn highway
    img = img.filter(ImageFilter.GaussianBlur(radius=0.8))
    img.save(path, "PNG")
    print(f"Generated {path}")

def gen_pavement_tiles(path):
    """1024x1024 clean modern sidewalk pavers with crisp joints."""
    size = 1024
    img = Image.new("RGBA", (size, size), (168, 160, 150, 255))
    draw = ImageDraw.Draw(img)

    # Subtle concrete micro-texture
    pixels = img.load()
    random.seed(1984)
    for y in range(size):
        for x in range(size):
            n = random.randint(-12, 12)
            r = min(255, max(0, 168 + n))
            g = min(255, max(0, 160 + n))
            b = min(255, max(0, 152 + n))
            pixels[x, y] = (r, g, b, 255)

    # Paver grid joints (128x128 blocks)
    grid_size = 128
    joint_color = (100, 94, 88, 255)
    for x in range(0, size, grid_size):
        draw.line([x, 0, x, size], fill=joint_color, width=3)
        draw.line([x + 1, 0, x + 1, size], fill=(210, 204, 196, 120), width=1)
    for y in range(0, size, grid_size):
        draw.line([0, y, size, y], fill=joint_color, width=3)
        draw.line([0, y + 1, size, y + 1], fill=(210, 204, 196, 120), width=1)

    img.save(path, "PNG")
    print(f"Generated {path}")

def gen_sand_beach(path):
    """1024x1024 Ocean Beach pristine golden sand with micro ripples."""
    size = 1024
    img = Image.new("RGBA", (size, size), (228, 202, 152, 255))
    pixels = img.load()
    random.seed(1982)

    for y in range(size):
        wave = math.sin(y / 48.0) * 12.0
        for x in range(size):
            noise = random.randint(-10, 10)
            val = wave + noise
            r = min(255, max(0, int(228 + val)))
            g = min(255, max(0, int(202 + val * 0.9)))
            b = min(255, max(0, int(152 + val * 0.7)))
            pixels[x, y] = (r, g, b, 255)

    img = img.filter(ImageFilter.GaussianBlur(radius=0.7))
    img.save(path, "PNG")
    print(f"Generated {path}")

def gen_palm_leaves(path):
    """1024x1024 clean tropical palm frond with smooth anti-aliased alpha mask."""
    size = 1024
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    stem_color = (78, 128, 48, 255)
    leaf_color = (48, 168, 68, 255)
    leaf_tip = (96, 210, 80, 255)

    # Main stem curve
    cx, cy = size // 2, size - 40
    stem_pts = [(cx, cy), (cx + 60, cy - 300), (cx + 10, cy - 650), (cx - 120, cy - 920)]
    for i in range(len(stem_pts) - 1):
        draw.line([stem_pts[i], stem_pts[i+1]], fill=stem_color, width=14)

    # Individual leaf blades radiating along stem
    for t in range(40, 920, 22):
        progress = t / 920.0
        sy = cy - t
        sx = cx + int(math.sin(progress * 2.5) * 80.0)

        # Left blade
        length_l = int((1.0 - progress * 0.5) * 280)
        draw.line([(sx, sy), (sx - length_l, sy - int(30 + progress * 50))],
                  fill=leaf_color, width=7)
        # Right blade
        length_r = int((1.0 - progress * 0.5) * 310)
        draw.line([(sx, sy), (sx + length_r, sy - int(10 + progress * 40))],
                  fill=leaf_tip, width=7)

    img = img.filter(ImageFilter.GaussianBlur(radius=0.6))
    img.save(path, "PNG")
    print(f"Generated {path}")

def gen_water_clear(path):
    """1024x1024 crystal clear azure ocean water normal/reflection."""
    size = 1024
    img = Image.new("RGBA", (size, size), (22, 120, 182, 240))
    pixels = img.load()

    for y in range(size):
        for x in range(size):
            wave1 = math.sin((x + y) / 32.0)
            wave2 = math.cos((x - y * 1.5) / 48.0)
            wave3 = math.sin(x / 24.0) * math.cos(y / 24.0)
            c = (wave1 + wave2 + wave3) / 3.0 * 35.0

            r = min(255, max(0, int(22 + c * 0.4)))
            g = min(255, max(0, int(140 + c * 0.8)))
            b = min(255, max(0, int(210 + c)))
            pixels[x, y] = (r, g, b, 245)

    img = img.filter(ImageFilter.GaussianBlur(radius=1.0))
    img.save(path, "PNG")
    print(f"Generated {path}")

def gen_neon_glow(path):
    """1024x1024 ultra-smooth radial neon bloom gradient."""
    size = 1024
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    pixels = img.load()
    cx, cy = size // 2, size // 2
    max_r = size // 2

    for y in range(size):
        dy = y - cy
        for x in range(size):
            dx = x - cx
            dist = math.sqrt(dx * dx + dy * dy)
            if dist < max_r:
                factor = 1.0 - (dist / max_r)
                intensity = factor * factor * factor # cubic falloff
                r = int(237 * intensity)
                g = int(30 * intensity)
                b = int(121 * intensity)
                a = int(255 * intensity)
                pixels[x, y] = (r, g, b, a)

    img.save(path, "PNG")
    print(f"Generated {path}")

def gen_car_generic_reflection(path):
    """1024x512 panoramic 80s Vice City horizon reflection map."""
    w, h = 1024, 512
    img = Image.new("RGBA", (w, h), (0, 0, 0, 255))
    draw = ImageDraw.Draw(img)

    # Vertical gradient: Sunset sky to ocean reflection
    for y in range(h):
        prog = y / float(h)
        if prog < 0.45: # Sky gradient: deep magenta to sunset orange
            p = prog / 0.45
            r = int(70 * (1 - p) + 247 * p)
            g = int(20 * (1 - p) + 147 * p)
            b = int(120 * (1 - p) + 30 * p)
        elif prog < 0.52: # Horizon glow
            r, g, b = 255, 220, 120
        else: # Ocean water reflection
            p = (prog - 0.52) / 0.48
            r = int(180 * (1 - p) + 10 * p)
            g = int(80 * (1 - p) + 40 * p)
            b = int(140 * (1 - p) + 110 * p)
        draw.line([(0, y), (w, y)], fill=(r, g, b, 255))

    # Distant skyline silhouette along horizon
    horizon_y = int(h * 0.48)
    for bx in range(0, w, 28):
        bheight = random.randint(15, 65)
        bwidth = random.randint(18, 38)
        draw.rectangle([bx, horizon_y - bheight, bx + bwidth, horizon_y],
                       fill=(18, 14, 28, 255))

    img = img.filter(ImageFilter.GaussianBlur(radius=2.0))
    img.save(path, "PNG")
    print(f"Generated {path}")

def main():
    make_dirs()
    print("Generating High Definition remastered textures...")

    # HUD & UI Textures
    gen_radardisc("mods/13_hd_textures_overhaul/textures/radardisc.png")
    gen_radardisc("mods/03_hd_hud_and_ui/textures/radardisc.png")

    gen_radar_north("mods/13_hd_textures_overhaul/textures/radar_north.png")
    gen_radar_north("mods/03_hd_hud_and_ui/textures/radar_north.png")

    gen_crosshair("mods/13_hd_textures_overhaul/textures/crosshair.png")
    gen_crosshair("mods/03_hd_hud_and_ui/textures/crosshair.png")

    gen_fist("mods/13_hd_textures_overhaul/textures/fist.png")
    gen_fist("mods/03_hd_hud_and_ui/textures/fist.png")

    gen_playstation_buttons()

    # Environment & Surface Remastered Textures (Anti-Pixel)
    gen_road_asphalt("mods/13_hd_textures_overhaul/textures/road_asphalt.png")
    gen_pavement_tiles("mods/13_hd_textures_overhaul/textures/pavement_tiles.png")
    gen_sand_beach("mods/13_hd_textures_overhaul/textures/sand_beach.png")
    gen_palm_leaves("mods/13_hd_textures_overhaul/textures/palm_leaves.png")
    gen_water_clear("mods/13_hd_textures_overhaul/textures/water_clear.png")
    gen_neon_glow("mods/13_hd_textures_overhaul/textures/neon_glow.png")
    gen_car_generic_reflection("mods/13_hd_textures_overhaul/textures/car_generic_reflection.png")

    print("All HD textures generated successfully!")

if __name__ == "__main__":
    main()

import xml.etree.ElementTree as ET
import resvg_py
import io
import os
from PIL import Image

def main():
    svg_path = 'Maccateams.svg'
    tree = ET.parse(svg_path)
    root = tree.getroot()
    paths = root.findall('.//{http://www.w3.org/2000/svg}path')

    # Desired layer order: cls-4 (black ink/outlines) near the end to sit crisply on top
    color_order = [
        ('cls-1', 0xFFFFFF, "White highlights / teeth"),
        ('cls-2', 0xED1E79, "Neon pink alligator skin"),
        ('cls-3', 0x662D91, "Purple manatee body"),
        ('cls-5', 0x612B8A, "Dark purple shades / hat"),
        ('cls-6', 0xF7931E, "Orange accents / beak"),
        ('cls-7', 0x29ABE2, "Cyan palm leaves"),
        ('cls-8', 0x0071BC, "Deep blue palm shadows"),
        ('cls-9', 0xFFD7E9, "Soft pink flamingo"),
        ('cls-10', 0xFCEE21, "Yellow gold medallion"),
        ('cls-4', 0x000000, "Black ink outlines"),
    ]

    W, H = 480, 262

    layers_raw = []
    for cls_name, color_hex, desc in color_order:
        matching = [p for p in paths if p.attrib.get('class') == cls_name]
        if not matching:
            continue
        svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 490 1080 590" width="{W}" height="{H}">'
        for p in matching:
            svg += f'<path d="{p.attrib.get("d")}" fill="#ffffff"/>'
        svg += '</svg>'
        b = resvg_py.svg_to_bytes(svg)
        im = Image.open(io.BytesIO(b)).convert('L')
        data = bytes(im.getdata())
        layers_raw.append((cls_name, color_hex, desc, data))

    # Concatenate all layer data
    all_bytes = b''.join(d for _, _, _, d in layers_raw)

    # RLE encode
    # Marker 0xFE followed by count (1..255) and byte value
    rle = bytearray()
    i = 0
    n = len(all_bytes)
    while i < n:
        val = all_bytes[i]
        j = i + 1
        while j < n and all_bytes[j] == val and (j - i) < 255:
            j += 1
        count = j - i
        if count >= 3 or val in (0xFE, 0xFF):
            rle.append(0xFE)
            rle.append(count)
            rle.append(val)
        else:
            rle.extend([val] * count)
        i = j

    print(f"Original size: {len(all_bytes)} bytes, RLE size: {len(rle)} bytes")

    # Generate header file
    header_path = 'launcher/screens/maccateams_art.h'
    with open(header_path, 'w', encoding='utf-8') as f:
        f.write('// Auto-generated vector artwork layers for Maccateams.svg\n')
        f.write('// Extracted directly from repository vector assets.\n')
        f.write('#pragma once\n\n')
        f.write('#include <cstdint>\n')
        f.write('#include <cstddef>\n\n')
        f.write('namespace screens::mascot_data\n{\n')
        f.write(f'    constexpr int kWidth = {W};\n')
        f.write(f'    constexpr int kHeight = {H};\n')
        f.write(f'    constexpr int kLayerCount = {len(layers_raw)};\n')
        f.write(f'    constexpr size_t kUncompressedSize = {len(all_bytes)};\n')
        f.write(f'    constexpr size_t kRleSize = {len(rle)};\n\n')

        f.write('    struct LayerInfo {\n')
        f.write('        uint32_t colorRgb;\n')
        f.write('        const char *name;\n')
        f.write('    };\n\n')
        f.write('    constexpr LayerInfo kLayers[kLayerCount] = {\n')
        for cls_name, color_hex, desc, _ in layers_raw:
            f.write(f'        {{ 0x{color_hex:06X}u, "{desc}" }},\n')
        f.write('    };\n\n')

        f.write('    inline void decodeRle(const uint8_t *src, size_t srcLen, uint8_t *dst, size_t dstLen)\n    {\n')
        f.write('        size_t s = 0, d = 0;\n')
        f.write('        while (s < srcLen && d < dstLen)\n        {\n')
        f.write('            if (src[s] == 0xFE && s + 2 < srcLen)\n            {\n')
        f.write('                uint8_t count = src[s + 1];\n')
        f.write('                uint8_t val = src[s + 2];\n')
        f.write('                for (uint8_t k = 0; k < count && d < dstLen; ++k)\n')
        f.write('                    dst[d++] = val;\n')
        f.write('                s += 3;\n')
        f.write('            }\n            else\n            {\n')
        f.write('                dst[d++] = src[s++];\n')
        f.write('            }\n        }\n    }\n\n')

        f.write('    alignas(4) const uint8_t kRleData[kRleSize] = {\n')
        for idx, byte in enumerate(rle):
            if idx % 16 == 0:
                f.write('        ')
            f.write(f'0x{byte:02x}, ')
            if idx % 16 == 15 or idx == len(rle) - 1:
                f.write('\n')
        f.write('    };\n')
        f.write('}\n')

    print(f"Written {header_path} successfully.")

if __name__ == '__main__':
    main()

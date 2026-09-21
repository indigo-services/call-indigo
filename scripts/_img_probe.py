"""Read PNG/JPEG dimensions without Pillow.

PNG: IHDR is the first chunk, so width/height are at bytes 16..24.
JPEG: walk the marker segments to the first Start-Of-Frame (SOF0..SOF3, SOF5..SOF15,
      excluding DHT/DAC/RSTn which share the 0xC4/0xCC/0xD0-0xD7 range), where
      height and width sit at offsets 5..9 of the segment payload.

Usage: python scripts/_img_probe.py <file> [<file> ...]
       python scripts/_img_probe.py --dir <directory>
"""
from __future__ import annotations

import struct
import sys
from pathlib import Path


def png_size(data: bytes) -> tuple[int, int] | None:
    if data[:8] != b"\x89PNG\r\n\x1a\n":
        return None
    if data[12:16] != b"IHDR":
        return None
    w, h = struct.unpack(">II", data[16:24])
    return w, h


def jpeg_size(data: bytes) -> tuple[int, int] | None:
    if data[:2] != b"\xff\xd8":
        return None
    i = 2
    n = len(data)
    while i < n - 9:
        if data[i] != 0xFF:
            i += 1
            continue
        marker = data[i + 1]
        # Padding / standalone markers carry no length field.
        if marker in (0xFF, 0x01) or 0xD0 <= marker <= 0xD9:
            i += 2
            continue
        seg_len = struct.unpack(">H", data[i + 2 : i + 4])[0]
        # SOF0-SOF3, SOF5-SOF7, SOF9-SOF11, SOF13-SOF15 carry the frame size.
        if marker in (0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7,
                      0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF):
            h, w = struct.unpack(">HH", data[i + 5 : i + 9])
            return w, h
        i += 2 + seg_len
    return None


def size_of(path: Path) -> tuple[int, int] | None:
    data = path.read_bytes()
    return png_size(data) or jpeg_size(data)


def main(argv: list[str]) -> int:
    if len(argv) < 2:
        print(__doc__)
        return 2
    if argv[1] == "--dir":
        targets = sorted(p for p in Path(argv[2]).iterdir()
                         if p.suffix.lower() in (".png", ".jpg", ".jpeg"))
    else:
        targets = [Path(a) for a in argv[1:]]

    print(f"{'file':<46} {'size':<14} {'megapixels':>10} {'bytes':>10}")
    print("-" * 84)
    for p in targets:
        try:
            dims = size_of(p)
        except OSError as exc:
            print(f"{p.name:<46} ERROR {exc}")
            continue
        if dims is None:
            print(f"{p.name:<46} {'unreadable':<14}")
            continue
        w, h = dims
        print(f"{p.name:<46} {f'{w}x{h}':<14} {w * h / 1e6:>10.2f} {p.stat().st_size:>10}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))

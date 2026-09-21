"""Sample the centre and corner pixels of the favicon PNGs.

Written because Pillow is not installed and this only needs to answer one
question: are the raster icons still the v1 brand mark, or already neutral?
Decodes the IHDR + IDAT with zlib and undoes the per-scanline filters.
"""
import struct
import sys
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
IMAGES = ROOT / "public" / "assets" / "images"

CHANNELS = {0: 1, 2: 3, 3: 1, 4: 2, 6: 4}


def paeth(a, b, c):
    p = a + b - c
    pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
    if pa <= pb and pa <= pc:
        return a
    return b if pb <= pc else c


def decode(path):
    data = path.read_bytes()
    if data[:8] != b"\x89PNG\r\n\x1a\n":
        raise ValueError("not a PNG")
    pos = 8
    idat = bytearray()
    w = h = depth = ctype = None
    while pos < len(data):
        (length,) = struct.unpack(">I", data[pos : pos + 4])
        kind = data[pos + 4 : pos + 8]
        body = data[pos + 8 : pos + 8 + length]
        if kind == b"IHDR":
            w, h, depth, ctype = struct.unpack(">IIBB", body[:10])
        elif kind == b"IDAT":
            idat += body
        elif kind == b"IEND":
            break
        pos += 12 + length
    if depth != 8:
        raise ValueError("bit depth %s not handled" % depth)
    nch = CHANNELS[ctype]
    raw = zlib.decompress(bytes(idat))
    stride = w * nch
    out = bytearray(h * stride)
    prev = bytearray(stride)
    i = 0
    for y in range(h):
        f = raw[i]
        i += 1
        line = bytearray(raw[i : i + stride])
        i += stride
        for x in range(stride):
            a = line[x - nch] if x >= nch else 0
            b = prev[x]
            c = prev[x - nch] if x >= nch else 0
            if f == 1:
                line[x] = (line[x] + a) & 0xFF
            elif f == 2:
                line[x] = (line[x] + b) & 0xFF
            elif f == 3:
                line[x] = (line[x] + ((a + b) >> 1)) & 0xFF
            elif f == 4:
                line[x] = (line[x] + paeth(a, b, c)) & 0xFF
        out[y * stride : (y + 1) * stride] = line
        prev = line
    return w, h, ctype, nch, out


def px(buf, w, nch, x, y):
    o = (y * w + x) * nch
    return tuple(buf[o : o + nch])


def main():
    for name in ("favicon-16.png", "favicon-32.png", "apple-touch-icon.png"):
        p = IMAGES / name
        if not p.exists():
            print("%-22s MISSING" % name)
            continue
        w, h, ctype, nch, buf = decode(p)
        samples = {}
        for label, (x, y) in {
            "tl": (0, 0),
            "centre": (w // 2, h // 2),
            "inner": (w // 2, max(0, h // 2 - h // 8)),
            "edge": (w // 2, max(0, h // 2 - int(h * 0.4))),
        }.items():
            samples[label] = "#" + "".join("%02x" % v for v in px(buf, w, nch, x, y))
        # distinct opaque colours, to see whether it is a flat mark or a gradient
        seen = set()
        for y in range(0, h, max(1, h // 24)):
            for x in range(0, w, max(1, w // 24)):
                v = px(buf, w, nch, x, y)
                if nch == 4 and v[3] == 0:
                    continue
                seen.add(v[:3])
        print(
            "%-22s %2dx%-3d ctype=%d  tl=%s centre=%s inner=%s edge=%s  distinct=%d"
            % (name, w, h, ctype, samples["tl"], samples["centre"], samples["inner"], samples["edge"], len(seen))
        )


if __name__ == "__main__":
    sys.exit(main())

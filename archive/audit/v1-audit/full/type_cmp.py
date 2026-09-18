from PIL import Image

def profile(path, y0, y1, x0, x1, thr=430, label=""):
    im = Image.open(path).convert("RGB"); px = im.load()
    print(f"\n--- {label}  {path.split(chr(92))[-1]}  y {y0}..{y1} x {x0}..{x1} ---")
    runs=[]; s=None
    for y in range(y0,y1):
        c = sum(1 for x in range(x0,x1) if sum(px[x,y])<thr)
        if c>0:
            if s is None: s=y
            last=y; maxc=c
        else:
            if s is not None:
                runs.append((s,last,last-s+1)); s=None
    if s is not None: runs.append((s,last,last-s+1))
    for a,b,h in runs:
        print(f"   ink run y {a}..{b}  height={h}")
    return runs

REF = r"C:/tmp/indigo/01_Home.jpg"
PRO = r"C:/tmp/indigo/_audit/full/proto_1920_full.png"

# reference services heading ("Provides Professional Plumbing Services for Every Need")
profile(REF, 2020, 2200, 500, 1450, label="REF services heading")
# prototype services heading
profile(PRO, 2740, 2900, 60, 1000, label="PROTO services heading")
# reference about heading
profile(REF, 1190, 1360, 1030, 1750, label="REF about heading")
# prototype about heading
profile(PRO, 1090, 1260, 60, 900, label="PROTO about heading")

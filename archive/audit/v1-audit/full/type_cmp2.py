from PIL import Image
im = Image.open(r"C:/tmp/indigo/01_Home.jpg").convert("RGB"); px=im.load()

# line 1 of the services heading occupies y 2039..2090. Find its word x-runs.
cols=[x for x in range(300,1700) if any(sum(px[x,y])<430 for y in range(2039,2091))]
runs=[]; s=cols[0]; p=cols[0]
for c in cols[1:]:
    if c-p>14: runs.append((s,p)); s=c
    p=c
runs.append((s,p))
print("word runs on heading line 1 (y 2039..2090):")
for a,b in runs:
    # ink height of this word only
    rows=[y for y in range(2025,2100) if any(sum(px[x,y])<430 for x in range(a,b+1))]
    print(f"  x {a:5d}-{b:5d} w={b-a+1:4d}  ink y {rows[0]}..{rows[-1]} h={rows[-1]-rows[0]+1}")

# line pitch
print("\nline pitch =", 2103-2039)

from PIL import Image
im = Image.open(r"C:/tmp/indigo/01_Home.jpg").convert("RGB")
out = r"C:/tmp/indigo/_audit/full/"
# 1. top bar + header + top of hero
im.crop((0, 0, 1920, 320)).save(out + "c_top.png")
# 2. about slab, right (text) column
im.crop((900, 1163, 1900, 1815)).save(out + "c_about_text.png")
# 3. about slab full
im.crop((0, 1140, 1920, 1840)).resize((1440, 525)).save(out + "c_about_full.png")
# 4. the indigo price-estimation slab
im.crop((0, 3680, 1920, 4650)).resize((1440, 727)).save(out + "c_estimate.png")
# 5. check-availability slab
im.crop((0, 7750, 1920, 8280)).resize((1440, 397)).save(out + "c_area.png")
# 6. cta slab
im.crop((0, 9680, 1920, 10110)).resize((1440, 322)).save(out + "c_cta.png")
print("done")

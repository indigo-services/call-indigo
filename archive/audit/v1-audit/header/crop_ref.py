from PIL import Image
im = Image.open(r"C:/tmp/indigo/01_Home.jpg").convert("RGB")

# top-left corner region, 4x zoom
tl = im.crop((150, 0, 550, 100)).resize((400*3, 100*3), Image.NEAREST)
tl.save(r"C:/tmp/indigo/_audit/header/ref_topleft_zoom.png")

# top-right corner region
tr = im.crop((1370, 0, 1770, 100)).resize((400*3, 100*3), Image.NEAREST)
tr.save(r"C:/tmp/indigo/_audit/header/ref_topright_zoom.png")

# full-width top strip
strip = im.crop((0, 0, 1920, 160))
strip.save(r"C:/tmp/indigo/_audit/header/ref_top_strip.png")
print("saved")

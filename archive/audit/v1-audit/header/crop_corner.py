from PIL import Image
im = Image.open(r"C:/tmp/indigo/01_Home.jpg").convert("RGB")
# tight bottom-left corner of the reference top bar
c = im.crop((244, 0, 300, 46)).resize((56*10, 46*10), Image.NEAREST)
c.save(r"C:/tmp/indigo/_audit/header/ref_bl_corner_10x.png")
print("saved", c.size)

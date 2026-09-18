from PIL import Image
im = Image.open(r"C:/tmp/indigo/01_Home.jpg").convert("RGB")
OUT=r"C:/tmp/indigo/_audit/full"
# about + services
c = im.crop((0,1100,1920,2960)).resize((1000, int(1860*1000/1920)), Image.LANCZOS)
c.save(OUT+r"\ref_about_services.png")
print("saved", c.size)

from PIL import Image
im = Image.open(r"C:/tmp/indigo/_audit/full/proto_1920_full.png").convert("RGB")
print("proto render size", im.size)
OUT=r"C:/tmp/indigo/_audit/full"
c = im.crop((0,856,1920,3661))
c = c.resize((1000, int(c.height*1000/1920)), Image.LANCZOS)
c.save(OUT+r"\proto_about_services.png")
print("saved", c.size)

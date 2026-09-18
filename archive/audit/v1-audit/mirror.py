import re, pathlib, urllib.request, os, time
BASE = "https://html.designingmedia.com/valvoro/"
OUT = pathlib.Path("C:/tmp/indigo/_audit/vlv")
src = (OUT/"index.html").read_text(encoding="utf-8", errors="replace")
UA = {"User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36"}
need = set(re.findall(r'(?:src|href)="((?:assets|css|js)/[^"]+)"', src))
print("assets to mirror:", len(need))
ok=fail=0
for rel in sorted(need):
    dest = OUT/rel
    if dest.exists(): ok+=1; continue
    dest.parent.mkdir(parents=True, exist_ok=True)
    try:
        req = urllib.request.Request(BASE+rel, headers=UA)
        with urllib.request.urlopen(req, timeout=30) as r:
            dest.write_bytes(r.read())
        ok+=1
    except Exception as e:
        fail+=1
        if fail<=8: print("  FAIL", rel, str(e)[:60])
print("ok", ok, "fail", fail)

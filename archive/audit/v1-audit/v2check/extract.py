import re, json, pathlib

s = open('C:/tmp/indigo/ci_0lso0f523lp39.js', encoding='utf-8', errors='replace').read()

print("=== sections:[ occurrences ===")
for m in re.finditer(r'sections:\s*\[', s):
    print('@%d' % m.start())
    print(s[max(0, m.start()-900):m.start()+700].replace('\n', ' '))
    print()

print("=== page-ish keys ===")
for key in ['residentialPage', 'commercialPage', 'homePage', 'page:', 'route']:
    for m in re.finditer(re.escape(key), s):
        print(key, '@', m.start(), '|', s[max(0,m.start()-120):m.start()+260].replace('\n',' '))
        print()

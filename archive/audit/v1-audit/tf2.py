from playwright.sync_api import sync_playwright
import pathlib
OUT = pathlib.Path("C:/tmp/indigo/_audit/tf"); OUT.mkdir(parents=True, exist_ok=True)
CHROME = r"C:/Users/jaden.black/.agent-browser/browsers/chrome-153.0.8010.47/chrome.exe"
url = "https://preview.themeforest.net/item/valvoro-plumbing-services-html-template/full_screen_preview/62644376"
with sync_playwright() as p:
    b = p.chromium.launch(
        executable_path=CHROME,
        headless=False,          # real headed Chrome via new headless is more convincing to CF
        args=["--no-sandbox","--disable-blink-features=AutomationControlled","--disable-gpu"],
    )
    ctx = b.new_context(viewport={"width":1440,"height":1000}, device_scale_factor=1,
        user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36",
        locale="en-US", timezone_id="America/Chicago")
    ctx.add_init_script("Object.defineProperty(navigator,'webdriver',{get:()=>undefined});")
    pg = ctx.new_page()
    pg.goto(url, wait_until="domcontentloaded", timeout=60000)
    for i in range(15):
        pg.wait_for_timeout(2000)
        t = pg.title()
        if "moment" not in t.lower() and t.strip():
            break
    print("TITLE:", pg.title())
    print("FRAMES:", [f.url[:110] for f in pg.frames])
    html = pg.content()
    (OUT/"dom.html").write_text(html, encoding="utf-8")
    print("html len", len(html))
    pg.screenshot(path=str(OUT/"tf_top.png"))
    b.close()

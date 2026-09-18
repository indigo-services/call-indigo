from playwright.sync_api import sync_playwright
CHROME = r"C:/Users/jaden.black/.agent-browser/browsers/chrome-153.0.8010.47/chrome.exe"
cands = [
 "https://valvoro.netlify.app/",
 "https://valvoro.vercel.app/",
 "https://preview.themeforest.net/item/valvoro-plumbing-services-html-template/full_screen_preview/62644376?referrer=author&_ga=",
]
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME, headless=False, args=["--no-sandbox","--disable-gpu"])
    ctx = b.new_context(viewport={"width":1440,"height":900},
        user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36")
    pg = ctx.new_page()
    for u in cands:
        try:
            r = pg.goto(u, wait_until="domcontentloaded", timeout=25000)
            pg.wait_for_timeout(2500)
            print(u[:70], "->", r.status if r else None, "|", pg.title()[:60])
        except Exception as e:
            print(u[:70], "-> ERR", str(e)[:70])
    b.close()

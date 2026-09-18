#!/usr/bin/env python3
"""
Build marketing pages from the static prototype HTML.

Instead of converting HTML → JSX (which produces invalid JSX due to
complex nesting, <script> tags, and browser-tolerant HTML), we extract
the body HTML and render it via dangerouslySetInnerHTML.

This gives exact visual parity for rc1 while avoiding JSX parsing issues.
Post-rc1, the pages can be refactored into proper React components.
"""

import re
from pathlib import Path

PROTOTYPE = Path("C:/tmp/indigo/valvoro-prototype")
OUTPUT = Path("C:/tmp/indigo/src/marketing/pages")


def extract_body(html_path: Path) -> str:
    text = html_path.read_text(encoding="utf-8")
    start = text.find("<body")
    start = text.find(">", start) + 1
    end = text.find("</body>", start)
    return text[start:end].strip()


def postprocess(html: str, page: str) -> str:
    # Fix asset paths
    html = html.replace('src="assets/images/', 'src="/assets/images/')
    html = html.replace('href="assets/images/', 'href="/assets/images/')

    # Fix page links
    if page == "index":
        html = html.replace('href="residential.html"', 'href="/residential"')
        html = html.replace('href="commercial.html"', 'href="/commercial"')
    elif page == "residential":
        html = html.replace('href="index.html"', 'href="/"')
        html = html.replace('href="commercial.html"', 'href="/commercial"')
        html = html.replace('href="residential.html"', 'href="/residential"')
    elif page == "commercial":
        html = html.replace('href="index.html"', 'href="/"')
        html = html.replace('href="residential.html"', 'href="/residential"')
        html = html.replace('href="commercial.html"', 'href="/commercial"')

    # Remove <script> tags (invalid in JSX, and main.js won't work in React anyway)
    html = re.sub(r'<script[^>]*>.*?</script>', '', html, flags=re.DOTALL)

    # Add /admin link to footer bottom bar
    html = html.replace(
        '<button type="button" class="legal-link" data-legal="privacy">Privacy Policy</button>',
        '<button type="button" class="legal-link" data-legal="privacy">Privacy Policy</button>\n          <a href="/admin" class="transition-colors hover:text-sky">Admin</a>'
    )

    # Fix theme-color meta if present in body (shouldn't be, but just in case)
    html = re.sub(r'<meta[^>]*theme-color[^>]*>', '', html)

    return html


def build_page(name: str, out_name: str) -> str:
    html = extract_body(PROTOTYPE / f"{name}.html")
    html = postprocess(html, name)

    component_name = {
        "index": "HomePage",
        "residential": "ResidentialPage",
        "commercial": "CommercialPage",
    }[name]

    # Escape backticks and ${} for template literal
    html_escaped = html.replace("\\", "\\\\").replace("`", "\\`").replace("${", "\\${")

    code = f'''/**
 * {component_name} — rendered from valvoro-prototype/{name}.html (PRD §5.1).
 *
 * Uses dangerouslySetInnerHTML to preserve exact markup from the static
 * prototype. This avoids JSX conversion issues with complex nesting and
 * gives pixel-perfect parity for rc1. Post-rc1: refactor into React components.
 */
import {{ useEffect }} from "react"

const BODY_HTML = `{html_escaped}`

export default function {component_name}() {{
  useEffect(() => {{
    // Scroll to hash anchor on mount
    if (window.location.hash) {{
      const el = document.querySelector(window.location.hash)
      el?.scrollIntoView({{ behavior: "smooth" }})
    }}
  }}, [])

  return (
    <div
      className="min-h-screen bg-white"
      dangerouslySetInnerHTML={{{{ __html: BODY_HTML }}}}
    />
  )
}}
'''
    return code


def main():
    mappings = [
        ("index", "HomePage.tsx"),
        ("residential", "ResidentialPage.tsx"),
        ("commercial", "CommercialPage.tsx"),
    ]
    for name, out_name in mappings:
        code = build_page(name, out_name)
        (OUTPUT / out_name).write_text(code, encoding="utf-8")
        print(f"Built {name} → {out_name} ({len(code)} chars)")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Assemble converted JSX into proper React page components.
"""

import re
from pathlib import Path

CONVERTED_DIR = Path("C:/tmp/indigo/scripts/converted")
OUTPUT_DIR = Path("C:/tmp/indigo/src/marketing/pages")


def fix_remaining_issues(jsx: str) -> str:
    """Fix known conversion issues."""
    jsx = jsx.replace('viewbox=', 'viewBox=')
    jsx = jsx.replace('preserveaspectratio=', 'preserveAspectRatio=')
    jsx = jsx.replace('clippathunits=', 'clipPathUnits=')
    jsx = jsx.replace('gradientunits=', 'gradientUnits=')
    jsx = jsx.replace('gradienttransform=', 'gradientTransform=')
    jsx = jsx.replace('spreadmethod=', 'spreadMethod=')
    jsx = jsx.replace('filterunits=', 'filterUnits=')
    jsx = jsx.replace('primitiveunits=', 'primitiveUnits=')
    jsx = jsx.replace('lengthadjust=', 'lengthAdjust=')
    jsx = jsx.replace('startoffset=', 'startOffset=')
    jsx = jsx.replace('textlength=', 'textLength=')
    jsx = jsx.replace('maskunits=', 'maskUnits=')
    jsx = jsx.replace('maskcontentunits=', 'maskContentUnits=')
    jsx = jsx.replace('patternunits=', 'patternUnits=')
    jsx = jsx.replace('patterncontentunits=', 'patternContentUnits=')
    jsx = jsx.replace('patterntransform=', 'patternTransform=')
    return jsx


def add_admin_link(jsx: str) -> str:
    """Add the /admin link to the footer bottom bar (PRD §12)."""
    pattern = r'(<button type="button" className="legal-link" data-legal="privacy">Privacy Policy</button>)'
    replacement = r'\1\n          <a href="/admin" className="transition-colors hover:text-sky">Admin</a>'
    jsx = re.sub(pattern, replacement, jsx)
    return jsx


def assemble_page(name: str, out_name: str) -> str:
    jsx = (CONVERTED_DIR / f"{name}.jsx").read_text(encoding="utf-8")
    jsx = fix_remaining_issues(jsx)
    jsx = add_admin_link(jsx)

    component_name = {
        "index": "HomePage",
        "residential": "ResidentialPage",
        "commercial": "CommercialPage",
    }[name]

    page_code = f'''/**
 * {component_name} — ported from valvoro-prototype/{name}.html (PRD §5.1).
 *
 * This is a mechanical port of the static prototype. All markup, classes,
 * and structure are preserved. Shared chrome (TopBar, Header, Footer) is
 * left inline so the page is self-contained; refactoring into reusable
 * components can happen post-rc1.
 */
export default function {component_name}() {{
  return (
    <div className="min-h-screen bg-white">
{jsx}
    </div>
  )
}}
'''
    return page_code


def main():
    mappings = [
        ("index", "HomePage.tsx"),
        ("residential", "ResidentialPage.tsx"),
        ("commercial", "CommercialPage.tsx"),
    ]
    for name, out_name in mappings:
        code = assemble_page(name, out_name)
        (OUTPUT_DIR / out_name).write_text(code, encoding="utf-8")
        print(f"Assembled {name} → {out_name} ({len(code)} chars)")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Mechanical HTML → JSX converter for the Call Indigo static prototype.

Converts the body content of the prototype HTML files into React-compatible JSX:
- class → className
- for → htmlFor
- colspan → colSpan, rowspan → rowSpan
- tabindex → tabIndex
- readonly → readOnly
- Self-closing tags: <img>, <br>, <input>, <hr>, <meta>, <link>, <source>, <area>, <base>, <col>, <embed>, <param>, <track>, <wbr>
- HTML comments → JSX comments (or removes them)
- inline style strings are preserved as-is (Tailwind handles styling)
- SVG attributes: stroke-width → strokeWidth, etc. (basic set)
"""

import re
import sys
from pathlib import Path

SELF_CLOSING = {"img", "br", "input", "hr", "meta", "link", "source", "area", "base", "col", "embed", "param", "track", "wbr"}

ATTR_MAP = {
    "class": "className",
    "for": "htmlFor",
    "colspan": "colSpan",
    "rowspan": "rowSpan",
    "tabindex": "tabIndex",
    "readonly": "readOnly",
    "autofocus": "autoFocus",
    "contenteditable": "contentEditable",
    "crossorigin": "crossOrigin",
    "datetime": "dateTime",
    "formaction": "formAction",
    "formenctype": "formEncType",
    "formmethod": "formMethod",
    "formnovalidate": "formNoValidate",
    "formtarget": "formTarget",
    "hreflang": "hrefLang",
    "http-equiv": "httpEquiv",
    "maxlength": "maxLength",
    "minlength": "minLength",
    "novalidate": "noValidate",
    "radiogroup": "radioGroup",
    "spellcheck": "spellCheck",
    "srcset": "srcSet",
    "usemap": "useMap",
    "autocomplete": "autoComplete",
    "cellpadding": "cellPadding",
    "cellspacing": "cellSpacing",
    "charset": "charSet",
    "allowfullscreen": "allowFullScreen",
    "async": "async",
    "defer": "defer",
    "defaultchecked": "defaultChecked",
    "defaultvalue": "defaultValue",
    "enctype": "encType",
    "frameborder": "frameBorder",
    "marginheight": "marginHeight",
    "marginwidth": "marginWidth",
    "scrolling": "scrolling",
}

SVG_ATTR_MAP = {
    "accent-height": "accentHeight",
    "alignment-baseline": "alignmentBaseline",
    "arabic-form": "arabicForm",
    "baseline-shift": "baselineShift",
    "cap-height": "capHeight",
    "clip-path": "clipPath",
    "clip-rule": "clipRule",
    "color-interpolation": "colorInterpolation",
    "color-interpolation-filters": "colorInterpolationFilters",
    "color-profile": "colorProfile",
    "color-rendering": "colorRendering",
    "dominant-baseline": "dominantBaseline",
    "enable-background": "enableBackground",
    "fill-opacity": "fillOpacity",
    "fill-rule": "fillRule",
    "flood-color": "floodColor",
    "flood-opacity": "floodOpacity",
    "font-family": "fontFamily",
    "font-size": "fontSize",
    "font-size-adjust": "fontSizeAdjust",
    "font-stretch": "fontStretch",
    "font-style": "fontStyle",
    "font-variant": "fontVariant",
    "font-weight": "fontWeight",
    "glyph-name": "glyphName",
    "glyph-orientation-horizontal": "glyphOrientationHorizontal",
    "glyph-orientation-vertical": "glyphOrientationVertical",
    "image-rendering": "imageRendering",
    "letter-spacing": "letterSpacing",
    "lighting-color": "lightingColor",
    "marker-end": "markerEnd",
    "marker-mid": "markerMid",
    "marker-start": "markerStart",
    "overline-position": "overlinePosition",
    "overline-thickness": "overlineThickness",
    "paint-order": "paintOrder",
    "panose-1": "panose1",
    "pointer-events": "pointerEvents",
    "rendering-intent": "renderingIntent",
    "shape-rendering": "shapeRendering",
    "stop-color": "stopColor",
    "stop-opacity": "stopOpacity",
    "strikethrough-position": "strikethroughPosition",
    "strikethrough-thickness": "strikethroughThickness",
    "stroke-dasharray": "strokeDasharray",
    "stroke-dashoffset": "strokeDashoffset",
    "stroke-linecap": "strokeLinecap",
    "stroke-linejoin": "strokeLinejoin",
    "stroke-miterlimit": "strokeMiterlimit",
    "stroke-opacity": "strokeOpacity",
    "stroke-width": "strokeWidth",
    "text-anchor": "textAnchor",
    "text-decoration": "textDecoration",
    "text-rendering": "textRendering",
    "underline-position": "underlinePosition",
    "underline-thickness": "underlineThickness",
    "unicode-bidi": "unicodeBidi",
    "unicode-range": "unicodeRange",
    "units-per-em": "unitsPerEm",
    "v-ideographic": "vIdeographic",
    "v-mathematical": "vMathematical",
    "vector-effect": "vectorEffect",
    "vert-adv-y": "vertAdvY",
    "vert-origin-x": "vertOriginX",
    "vert-origin-y": "vertOriginY",
    "word-spacing": "wordSpacing",
    "writing-mode": "writingMode",
    "x-height": "xHeight",
    " xlink:href": "xlinkHref",
    "xml:base": "xmlBase",
    "xml:lang": "xmlLang",
    "xml:space": "xmlSpace",
    "xmlns:xlink": "xmlnsXlink",
}


def camel_case_attr(name: str) -> str:
    if name in ATTR_MAP:
        return ATTR_MAP[name]
    if name in SVG_ATTR_MAP:
        return SVG_ATTR_MAP[name]
    # kebab-case → camelCase for data-* and aria-*
    if name.startswith("data-") or name.startswith("aria-"):
        return name
    if "-" in name:
        parts = name.split("-")
        return parts[0] + "".join(p.capitalize() for p in parts[1:])
    return name


def convert_attrs(tag: str, attrs: str) -> str:
    """Convert HTML attributes in a tag to JSX."""
    result = []
    i = 0
    while i < len(attrs):
        # Skip whitespace
        while i < len(attrs) and attrs[i].isspace():
            i += 1
        if i >= len(attrs):
            break

        # Find attribute name
        name_start = i
        while i < len(attrs) and not attrs[i].isspace() and attrs[i] not in ('=', '>'):
            i += 1
        name = attrs[name_start:i]
        if not name:
            i += 1
            continue

        # Check for value
        if i < len(attrs) and attrs[i] == '=':
            i += 1
            quote = attrs[i] if i < len(attrs) and attrs[i] in ('"', "'") else None
            if quote:
                i += 1
                val_start = i
                while i < len(attrs) and attrs[i] != quote:
                    i += 1
                value = attrs[val_start:i]
                i += 1  # skip closing quote
            else:
                val_start = i
                while i < len(attrs) and not attrs[i].isspace():
                    i += 1
                value = attrs[val_start:i]
        else:
            value = None

        jsx_name = camel_case_attr(name)

        if value is None:
            result.append(jsx_name)
        else:
            # JSX-escape the value
            value = value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
            # Don't double-escape existing entities
            result.append(f'{jsx_name}="{value}"')

    return " ".join(result)


def convert_tag(match: re.Match) -> str:
    """Convert a single HTML tag to JSX."""
    full = match.group(0)
    closing = match.group(1)
    tag = match.group(2)
    attrs = match.group(3) or ""
    self_close = match.group(4)

    if closing:
        return full  # </tag> stays the same

    jsx_attrs = convert_attrs(tag, attrs)
    if self_close:
        return f"<{tag} {jsx_attrs} />"

    # Make self-closing if tag is void
    if tag in SELF_CLOSING:
        trailing = "/>"
        if jsx_attrs:
            return f"<{tag} {jsx_attrs} {trailing}"
        return f"<{tag} {trailing}"

    if jsx_attrs:
        return f"<{tag} {jsx_attrs}>"
    return f"<{tag}>"


def html_to_jsx(html: str) -> str:
    """Convert HTML string to JSX string."""
    # Remove HTML comments (can be noisy; keep some structure comments)
    # We'll convert <!-- ... --> to {/* ... */}
    def convert_comment(m: re.Match) -> str:
        text = m.group(1)
        # Keep section markers as JSX comments
        if "====" in text or "SECTION" in text.upper():
            return f"{{/* {text} */}}"
        return ""  # Remove other comments

    html = re.sub(r"<!--(.*?)-->", convert_comment, html, flags=re.DOTALL)

    # Convert tags
    tag_re = re.compile(r"<(/?)([a-zA-Z][a-zA-Z0-9-]*)([^>]*?)(/?)>")
    jsx = tag_re.sub(convert_tag, html)

    # Clean up empty lines from removed comments
    lines = jsx.splitlines()
    cleaned = []
    prev_empty = False
    for line in lines:
        stripped = line.strip()
        if not stripped:
            if not prev_empty:
                cleaned.append("")
            prev_empty = True
        else:
            cleaned.append(line)
            prev_empty = False

    return "\n".join(cleaned)


def extract_body(html_path: Path) -> str:
    """Extract content between <body> and </body>."""
    text = html_path.read_text(encoding="utf-8")
    start = text.find("<body")
    if start == -1:
        raise ValueError(f"No <body> found in {html_path}")
    start = text.find(">", start) + 1
    end = text.find("</body>", start)
    if end == -1:
        raise ValueError(f"No </body> found in {html_path}")
    return text[start:end].strip()


def main():
    prototype_dir = Path("C:/tmp/indigo/valvoro-prototype")
    output_dir = Path("C:/tmp/indigo/scripts/converted")
    output_dir.mkdir(exist_ok=True)

    for name in ["index.html", "residential.html", "commercial.html"]:
        src = prototype_dir / name
        body = extract_body(src)
        jsx = html_to_jsx(body)
        (output_dir / f"{name.replace('.html', '')}.jsx").write_text(jsx, encoding="utf-8")
        print(f"Converted {name} → {len(jsx)} chars")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Robust HTML → JSX converter using html.parser.
Handles attribute values with > correctly.
"""

import re
import sys
from pathlib import Path
from html.parser import HTMLParser

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
    "frameborder": "frameBorder",
    "marginheight": "marginHeight",
    "marginwidth": "marginWidth",
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
    "xlink:href": "xlinkHref",
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
    if name.startswith("data-") or name.startswith("aria-"):
        return name
    if "-" in name:
        parts = name.split("-")
        return parts[0] + "".join(p.capitalize() for p in parts[1:])
    return name


def escape_attr_value(val: str) -> str:
    # In JSX, we need to escape quotes and & but not < > inside strings
    return val.replace("&", "&amp;").replace('"', "&quot;")


class JSXConverter(HTMLParser):
    def __init__(self):
        super().__init__()
        self.parts = []
        self.in_comment = False

    def handle_starttag(self, tag, attrs):
        attr_strs = []
        for name, value in attrs:
            jsx_name = camel_case_attr(name)
            if value is None:
                attr_strs.append(jsx_name)
            else:
                escaped = escape_attr_value(value)
                attr_strs.append(f'{jsx_name}="{escaped}"')

        attrs_text = " ".join(attr_strs)
        if tag in SELF_CLOSING:
            if attrs_text:
                self.parts.append(f"<{tag} {attrs_text} />")
            else:
                self.parts.append(f"<{tag} />")
        else:
            if attrs_text:
                self.parts.append(f"<{tag} {attrs_text}>")
            else:
                self.parts.append(f"<{tag}>")

    def handle_endtag(self, tag):
        self.parts.append(f"</{tag}>")

    def handle_startendtag(self, tag, attrs):
        attr_strs = []
        for name, value in attrs:
            jsx_name = camel_case_attr(name)
            if value is None:
                attr_strs.append(jsx_name)
            else:
                escaped = escape_attr_value(value)
                attr_strs.append(f'{jsx_name}="{escaped}"')

        attrs_text = " ".join(attr_strs)
        if attrs_text:
            self.parts.append(f"<{tag} {attrs_text} />")
        else:
            self.parts.append(f"<{tag} />")

    def handle_data(self, data):
        # Don't escape & < > in text content — JSX handles this at runtime
        # But we do need to preserve whitespace
        self.parts.append(data)

    def handle_comment(self, data):
        if "====" in data or "SECTION" in data.upper():
            self.parts.append(f"{{/* {data.strip()} */}}")
        # else drop the comment

    def handle_entityref(self, name):
        self.parts.append(f"&{name};")

    def handle_charref(self, name):
        self.parts.append(f"&#{name};")

    def get_jsx(self) -> str:
        result = "".join(self.parts)
        # Clean up excessive blank lines
        lines = result.splitlines()
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
    text = html_path.read_text(encoding="utf-8")
    start = text.find("<body")
    if start == -1:
        raise ValueError(f"No <body> found in {html_path}")
    start = text.find(">", start) + 1
    end = text.find("</body>", start)
    if end == -1:
        raise ValueError(f"No </body> found in {html_path}")
    return text[start:end].strip()


def postprocess_jsx(jsx: str, page_name: str) -> str:
    """Post-process JSX for React Router and asset paths."""
    # Fix image paths: assets/images/... → /assets/images/...
    jsx = re.sub(r'src="assets/images/', 'src="/assets/images/', jsx)

    # Fix page links
    if page_name == "index":
        jsx = jsx.replace('href="residential.html"', 'href="/residential"')
        jsx = jsx.replace('href="commercial.html"', 'href="/commercial"')
    elif page_name == "residential":
        jsx = jsx.replace('href="index.html"', 'href="/"')
        jsx = jsx.replace('href="commercial.html"', 'href="/commercial"')
        jsx = jsx.replace('href="residential.html"', 'href="/residential"')
    elif page_name == "commercial":
        jsx = jsx.replace('href="index.html"', 'href="/"')
        jsx = jsx.replace('href="residential.html"', 'href="/residential"')
        jsx = jsx.replace('href="commercial.html"', 'href="/commercial"')

    # Fix ampersands that got double-escaped
    jsx = jsx.replace("&amp;gt;", ">")
    jsx = jsx.replace("&amp;lt;", "<")
    jsx = jsx.replace("&amp;", "&")

    return jsx


def main():
    prototype_dir = Path("C:/tmp/indigo/valvoro-prototype")
    output_dir = Path("C:/tmp/indigo/scripts/converted")
    output_dir.mkdir(exist_ok=True)

    for name in ["index.html", "residential.html", "commercial.html"]:
        src = prototype_dir / name
        body = extract_body(src)
        converter = JSXConverter()
        converter.feed(body)
        jsx = converter.get_jsx()
        page_name = name.replace(".html", "")
        jsx = postprocess_jsx(jsx, page_name)
        (output_dir / f"{page_name}.jsx").write_text(jsx, encoding="utf-8")
        print(f"Converted {name} → {len(jsx)} chars")


if __name__ == "__main__":
    main()

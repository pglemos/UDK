from __future__ import annotations

import base64
import gzip
import hashlib
from pathlib import Path

from official_brand_payload_a import ASSETS_A
from official_brand_payload_b import ASSETS_B

ROOT = Path(__file__).resolve().parents[1]
APP = ROOT / "apps/plataforma"

OFFICIAL_HASHES = {
    "public/brand/udk-logo-principal.svg": "da44f28c268bf7fd872cbf3054da5732a41aa6ac21b6483ce9cb2457c9e96f54",
    "public/brand/udk-logo-negativa.svg": "1041461a1157862bf52ce796068e1cc128965f3f6fccf4ecacaf0424c258607a",
    "public/brand/udk-logo-monocromatica-escura.svg": "a2d61f20d63ec69e75f8aeead4159b2693b27162c02a1e8c00bebc950217d3c6",
    "public/brand/udk-marca-branca.svg": "7c90e431f12b5df043e725383d17e70c0c3eca2edf56b8d49a1d8aaa5408ed86",
    "public/brand/udk-marca-escura.svg": "d6141ec3f250f9f05c8cbc1c1db2e538293ad07b70c681861aaa4982bfe13d29",
}

PAYLOADS = {
    "public/brand/udk-logo-principal.svg": ASSETS_A["PRINCIPAL"],
    "public/brand/udk-logo-negativa.svg": ASSETS_A["NEGATIVA"],
    "public/brand/udk-logo-monocromatica-escura.svg": ASSETS_B["MONO_DARK"],
    "public/brand/udk-marca-branca.svg": ASSETS_B["MARK_WHITE"],
    "public/brand/udk-marca-escura.svg": ASSETS_B["MARK_DARK"],
}


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def write_bytes(relative_path: str, data: bytes, expected_hash: str) -> None:
    actual_hash = digest(data)
    if actual_hash != expected_hash:
        raise RuntimeError(f"Hash mismatch for {relative_path}: {actual_hash}")
    path = APP / relative_path
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)


def replace_required(path: Path, old: str, new: str, *, count: int | None = None) -> None:
    text = path.read_text()
    occurrences = text.count(old)
    if occurrences == 0:
        raise RuntimeError(f"Expected pattern not found in {path.relative_to(ROOT)}: {old[:100]!r}")
    if count is not None and occurrences != count:
        raise RuntimeError(
            f"Expected {count} occurrence(s) in {path.relative_to(ROOT)}, found {occurrences}: {old[:100]!r}",
        )
    path.write_text(text.replace(old, new))


for relative_path, payload in PAYLOADS.items():
    raw = gzip.decompress(base64.b64decode(payload))
    write_bytes(relative_path, raw, OFFICIAL_HASHES[relative_path])

mark_white = (APP / "public/brand/udk-marca-branca.svg").read_bytes()
mark_white_b64 = base64.b64encode(mark_white).decode()

avatar_512 = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512" role="img" aria-label="UDK - Ultras do Kart">
  <circle cx="256" cy="256" r="233" fill="#1C191F"/>
  <image x="93" y="223" width="325" height="65" href="data:image/svg+xml;base64,{mark_white_b64}" preserveAspectRatio="xMidYMid meet"/>
</svg>
'''.encode()
avatar_1080 = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080" role="img" aria-label="UDK - Ultras do Kart">
  <circle cx="540" cy="540" r="486" fill="#1C191F"/>
  <image x="195" y="471" width="688" height="137" href="data:image/svg+xml;base64,{mark_white_b64}" preserveAspectRatio="xMidYMid meet"/>
</svg>
'''.encode()
write_bytes(
    "public/icons/udk-avatar-512.svg",
    avatar_512,
    "35081de3428ac7cd1a5621d98931aacf36733520aeb5160467b601adebed90c2",
)
write_bytes(
    "public/icons/udk-avatar-1080.svg",
    avatar_1080,
    "0bf1269f506bd3fd8c200c7ae58e9390dbf0095f9bc9613a8fcfd95e34e5ef74",
)

negative_logo = "/brand/udk-logo-negativa.svg"
for relative_path in [
    "components/auth-screen.tsx",
    "components/public-layout.tsx",
    "app/painel/[[...slug]]/page.tsx",
    "public/offline.html",
]:
    path = APP / relative_path
    replace_required(path, "/udk.svg", negative_logo)
    text = path.read_text().replace('alt="UDK"', 'alt="UDK - Ultras do Kart"')
    path.write_text(text)

globals_css = APP / "app/globals.css"
replace_required(
    globals_css,
    '@import url("https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700;800;900&family=Inter:wght@400;500;600;700;800&display=swap");',
    '@import url("https://fonts.googleapis.com/css2?family=Roboto+Condensed:wght@500;600;700;800;900&family=Roboto:wght@400;500;600;700;800;900&display=swap");',
    count=1,
)
replace_required(globals_css, 'font-family: "Inter", Arial, sans-serif;', 'font-family: "Roboto", Arial, sans-serif;', count=1)
replace_required(globals_css, 'font-family: "Barlow Condensed", sans-serif;', 'font-family: "Roboto Condensed", Arial, sans-serif;')
replace_required(globals_css, ".login-visual img {\n  width: 150px;\n}", ".login-visual img {\n  width: min(260px, 70%);\n  height: auto;\n}", count=1)
replace_required(
    globals_css,
    ".loading-screen img,\n.configuration-screen img {\n  width: 160px;\n  margin-bottom: 2rem;\n}",
    ".loading-screen img,\n.configuration-screen img {\n  width: min(240px, 72vw);\n  height: auto;\n  margin-bottom: 2rem;\n}",
    count=1,
)
replace_required(globals_css, ".sidebar-brand img {\n  width: 128px;\n}", ".sidebar-brand img {\n  width: 170px;\n  height: auto;\n}", count=1)

public_css = APP / "app/public.css"
replace_required(public_css, 'font-family:"Barlow Condensed",Arial,sans-serif', 'font-family:"Roboto Condensed",Arial,sans-serif')
replace_required(
    public_css,
    ".public-brand img,.public-footer img{width:115px;display:block}",
    ".public-brand img,.public-footer img{width:150px;height:auto;display:block}",
    count=1,
)

layout = APP / "app/layout.tsx"
replace_required(
    layout,
    "  alternates: { canonical: \"/\" },\n  appleWebApp:",
    "  alternates: { canonical: \"/\" },\n  icons: {\n    icon: [\n      { url: \"/icons/udk-avatar-512.svg\", sizes: \"512x512\", type: \"image/svg+xml\" },\n      { url: \"/icons/udk-avatar-1080.svg\", sizes: \"1080x1080\", type: \"image/svg+xml\" },\n    ],\n    shortcut: \"/icons/udk-avatar-512.svg\",\n    apple: [{ url: \"/icons/udk-avatar-512.svg\", sizes: \"512x512\", type: \"image/svg+xml\" }],\n  },\n  appleWebApp:",
    count=1,
)

manifest = APP / "app/manifest.ts"
old_icons = '''    icons: [
      {
        src: "/udk.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],'''
new_icons = '''    icons: [
      {
        src: "/icons/udk-avatar-512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "any maskable",
      },
      {
        src: "/icons/udk-avatar-1080.svg",
        sizes: "1080x1080",
        type: "image/svg+xml",
        purpose: "any maskable",
      },
    ],'''
replace_required(manifest, old_icons, new_icons, count=1)

service_worker = APP / "public/sw.js"
replace_required(service_worker, 'const CACHE_NAME = "udk-public-v4";', 'const CACHE_NAME = "udk-public-v5";', count=1)
replace_required(
    service_worker,
    'const PUBLIC_SHELL = ["/", "/offline.html", "/udk.svg"];',
    'const PUBLIC_SHELL = [\n  "/",\n  "/offline.html",\n  "/brand/udk-logo-negativa.svg",\n  "/icons/udk-avatar-512.svg",\n  "/icons/udk-avatar-1080.svg",\n];',
    count=1,
)

offline = APP / "public/offline.html"
replace_required(offline, "font-family: Arial, sans-serif;", 'font-family: "Roboto", Arial, sans-serif;', count=1)
replace_required(offline, "img { width: 140px; margin-bottom: 28px; }", "img { width: min(240px, 72vw); height: auto; margin-bottom: 28px; }", count=1)
replace_required(offline, "h1 { margin:", 'h1 { font-family: "Roboto Condensed", Arial, sans-serif; margin:', count=1)
replace_required(
    offline,
    "    <style>",
    '    <link rel="preconnect" href="https://fonts.googleapis.com" />\n    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />\n    <link href="https://fonts.googleapis.com/css2?family=Roboto+Condensed:wght@700;800;900&family=Roboto:wght@400;500;700;900&display=swap" rel="stylesheet" />\n    <style>',
    count=1,
)

brand_test = APP / "lib/brand-assets.test.ts"
replace_required(brand_test, '"public/icons/udk-avatar-512.png": "15997ebc97457e085d23007ead2e18f7e266b99948fecf047746ce0d7642c382",', '"public/icons/udk-avatar-512.svg": "35081de3428ac7cd1a5621d98931aacf36733520aeb5160467b601adebed90c2",', count=1)
replace_required(brand_test, '"public/icons/udk-avatar-1080.png": "42d7f0e22fe9c04eca725a28b1cfa8f5fdf7682c62fe90af1c75cd77316b2845",', '"public/icons/udk-avatar-1080.svg": "0bf1269f506bd3fd8c200c7ae58e9390dbf0095f9bc9613a8fcfd95e34e5ef74",', count=1)
replace_required(brand_test, 'const avatar512 = "/icons/udk-avatar-512.png";', 'const avatar512 = "/icons/udk-avatar-512.svg";', count=1)
replace_required(brand_test, 'const avatar1080 = "/icons/udk-avatar-1080.png";', 'const avatar1080 = "/icons/udk-avatar-1080.svg";', count=1)

legacy_logo = APP / "public/udk.svg"
if not legacy_logo.exists():
    raise RuntimeError("Expected synthetic apps/plataforma/public/udk.svg to exist before removal")
legacy_logo.unlink()

design_doc = ROOT / "docs/superpowers/specs/2026-07-26-official-brand-assets-design.md"
design_doc.parent.mkdir(parents=True, exist_ok=True)
design_doc.write_text('''# UDK official brand assets

## Source of truth

The website uses the supplied official UDK vector drawings without recreating the lettering with fonts. Exact SHA-256 hashes are enforced in automated tests.

## Logo variants

- `udk-logo-negativa.svg`: header, footer, login, sidebar, loading and offline surfaces with dark backgrounds.
- `udk-logo-principal.svg`: official positive master for future light-background applications.
- `udk-logo-monocromatica-escura.svg`: dark monochrome institutional alternative.
- `udk-marca-branca.svg` and `udk-marca-escura.svg`: reduced symbol variants.
- Avatar SVGs reproduce the supplied 512 and 1080 compositions using the official white mark and graphite `#1C191F` circle.

## Typography

- Roboto Condensed: titles, scoreboards, calls and compact data.
- Roboto: body text, regulations, captions and extended reading.
- The UDK logo is never replaced by typography.

## Color roles

- Graphite `#1C191F` and white are the institutional logo colors.
- Cyan remains an interface accent for controls, focus, active navigation and decorative highlights only.
- Cyan must never recolor or redraw the official UDK logo.

## Regression protection

Tests reject the deleted synthetic `/udk.svg`, legacy Barlow Condensed and Inter declarations, missing surface references, modified official vector bytes and incorrect PWA icons.
''')

print("Official UDK brand assets and references applied successfully.")

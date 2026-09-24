"""Generate non-personal, deterministic upload fixtures for Link Studio QA."""
from pathlib import Path
from PIL import Image, ImageDraw
import hashlib
import json

ROOT = Path(__file__).resolve().parent
FIXTURES = ROOT / 'fixtures'
FIXTURES.mkdir(exist_ok=True)

image = Image.new('RGB', (96, 64), '#e5eafa')
draw = ImageDraw.Draw(image)
draw.rounded_rectangle((9, 8, 86, 55), radius=10, fill='#142c69')
draw.ellipse((22, 20, 42, 40), fill='#ffffff')
draw.polygon([(48, 43), (61, 22), (76, 43)], fill='#a6b8ef')

for extension, fmt in [('jpg', 'JPEG'), ('jpeg', 'JPEG'), ('png', 'PNG'),
                       ('webp', 'WEBP'), ('bmp', 'BMP'), ('tiff', 'TIFF'),
                       ('tif', 'TIFF'), ('avif', 'AVIF')]:
    image.save(FIXTURES / f'synthetic.{extension}', format=fmt)

icon = Image.new('RGB', (96, 96), '#e5eafa')
icon.paste(image, (0, 16))
icon.save(FIXTURES / 'synthetic.ico', format='ICO', sizes=[(16, 16), (32, 32)])
second = image.copy()
ImageDraw.Draw(second).rectangle((25, 24, 36, 35), fill='#ffdd7a')
image.save(FIXTURES / 'synthetic.gif', format='GIF', save_all=True,
           append_images=[second], duration=[300, 300], loop=0)

rgba = image.convert('RGBA')
rgba.putalpha(190)
rgba.save(FIXTURES / 'transparent.png')

(FIXTURES / 'safe.svg').write_text('''<svg xmlns="http://www.w3.org/2000/svg" width="96" height="64" viewBox="0 0 96 64"><rect width="96" height="64" rx="12" fill="#e5eafa"/><circle cx="32" cy="32" r="16" fill="#142c69"/><path d="M54 45 69 19 85 45Z" fill="#a6b8ef"/></svg>''', encoding='utf-8')
(FIXTURES / 'unsafe-script.svg').write_text('''<svg xmlns="http://www.w3.org/2000/svg" width="96" height="64"><script>alert('Synthetic QA fixture: script must not execute')</script><rect width="96" height="64" fill="#e5eafa"/></svg>''', encoding='utf-8')
(FIXTURES / 'unsafe-external.svg').write_text('''<svg xmlns="http://www.w3.org/2000/svg" width="96" height="64"><image href="https://example.invalid/synthetic-fixture.png" width="96" height="64"/><foreignObject width="96" height="64"><div xmlns="http://www.w3.org/1999/xhtml">Synthetic active-content fixture</div></foreignObject></svg>''', encoding='utf-8')
(FIXTURES / 'fake.png').write_text('This is plain text, not image data.\n', encoding='utf-8')
(FIXTURES / 'empty.png').write_bytes(b'')
(FIXTURES / 'truncated.jpg').write_bytes((FIXTURES / 'synthetic.jpg').read_bytes()[:40])
(FIXTURES / 'renamed-jpeg.png').write_bytes((FIXTURES / 'synthetic.jpg').read_bytes())

manifest = []
for path in sorted(FIXTURES.iterdir()):
    entry = {'file': path.name, 'bytes': path.stat().st_size,
             'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}
    try:
        with Image.open(path) as check:
            check.load()
            entry.update(format=check.format, width=check.width, height=check.height,
                         frames=getattr(check, 'n_frames', 1))
    except Exception:
        entry['pillow_decodable'] = False
    manifest.append(entry)
(ROOT / 'fixture-manifest.json').write_text(json.dumps(manifest, indent=2), encoding='utf-8')
print(f'Created {len(manifest)} synthetic fixtures at {FIXTURES}')

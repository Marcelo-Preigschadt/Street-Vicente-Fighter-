"""Pack Khauãny's separated transparent poses into the existing runtime format."""
from pathlib import Path
import json

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'assets'
RUNTIME = ASSETS / 'runtime'
RUNTIME.mkdir(exist_ok=True)
SOURCES = {
    'base': ROOT.parent / 'generated_images' / 'exec-17932f9d-4d09-4572-a86c-3f3def5d06d6.png',
    'combat': ROOT.parent / 'generated_images' / 'exec-d209ea7b-a770-49b8-9ae9-b6c1aabad48d.png',
}
PORTRAIT = ROOT.parent / 'generated_images' / 'exec-bee3e093-4ea5-401f-8f93-853c2921d844.png'


def separate(source):
    image = Image.open(source).convert('RGBA')
    pixels = np.asarray(image)
    labels, _ = ndimage.label(pixels[:, :, 3] > 110, np.ones((3, 3), dtype=bool))
    sizes = np.bincount(labels.ravel())
    ids = [i for i in range(1, len(sizes)) if sizes[i] > 8000]
    if len(ids) != 16:
        raise ValueError(f'{source.name}: expected 16 complete figures, got {len(ids)}')
    poses = [[] for _ in range(4)]
    for component in ids:
        ys, xs = np.nonzero(labels == component)
        col = min(3, int((xs.min() + xs.max()) / 2 * 4 / image.width))
        poses[col].append((ys.min(), component, xs, ys))
    if any(len(column) != 4 for column in poses):
        raise ValueError(f'{source.name}: nonuniform sprite columns')
    arranged = [[None] * 4 for _ in range(4)]
    for col, column in enumerate(poses):
        for row, (_, component, xs, ys) in enumerate(sorted(column)):
            mask = ndimage.binary_dilation(labels == component, iterations=1)
            mask &= pixels[:, :, 3] > 0
            x1, y1 = max(0, xs.min()-2), max(0, ys.min()-2)
            x2, y2 = min(image.width, xs.max()+3), min(image.height, ys.max()+3)
            cut = pixels[y1:y2, x1:x2].copy()
            cut[~mask[y1:y2, x1:x2]] = 0
            arranged[row][col] = Image.fromarray(cut, 'RGBA')
    return [frame for row in arranged for frame in row]


base = separate(SOURCES['base'])
combat = separate(SOURCES['combat'])
for name, source in SOURCES.items():
    Image.open(source).save(ASSETS / f'khauany-{name}-v1.webp', quality=90, method=6)

portrait = Image.open(PORTRAIT).convert('RGBA')
portrait.save(ASSETS / 'khauany-portrait-v1.webp', quality=92, method=6)
head = portrait.resize((320, 320), Image.Resampling.LANCZOS)
head.save(RUNTIME / 'khauany-head-menu-v1.webp', quality=91, method=6)
preview = Image.new('RGBA', (240, 300))
pose = base[0]
factor = min(216 / pose.width, 280 / pose.height)
size = (round(pose.width * factor), round(pose.height * factor))
preview.alpha_composite(pose.resize(size, Image.Resampling.LANCZOS),
                        ((240 - size[0]) // 2, 294 - size[1]))
preview.save(RUNTIME / 'khauany-preview-v1.webp', quality=90, method=6)

items = [('base', frame) for frame in base] + [('combat', frame) for frame in combat]
items.append(('portrait', head.resize((80, 81), Image.Resampling.LANCZOS)))
positions = []
x = y = 2
row_height = 0
for _, frame in items:
    if x + frame.width + 2 > 2048:
        x, y, row_height = 2, y + row_height + 2, 0
    positions.append([x, y, frame.width, frame.height])
    x += frame.width + 2
    row_height = max(row_height, frame.height)

packed = Image.new('RGBA', (2048, y + row_height + 2))
metadata = {'atlases': {'base': {'scale': round(300 / base[0].height, 5), 'frames': []},
                        'combat': {'scale': round(300 / combat[0].height, 5), 'frames': []}},
            'portrait': None}
for (atlas, frame), rect in zip(items, positions):
    packed.alpha_composite(frame, (rect[0], rect[1]))
    if atlas == 'portrait':
        metadata['portrait'] = rect
        continue
    w, h = frame.size
    metadata['atlases'][atlas]['frames'].append({
        'x': 0, 'y': 0, 'w': w, 'h': h, 'anchor': round(w * .5, 2),
        'bottom': h, 'rect': rect,
    })
packed.save(RUNTIME / 'khauany-v1.webp', quality=88, method=6)
(RUNTIME / 'khauany-v1.json').write_text(json.dumps(metadata, separators=(',', ':'))+'\n')
print('Khauãny:', packed.size, '32 isolated poses, base scale', metadata['atlases']['base']['scale'])

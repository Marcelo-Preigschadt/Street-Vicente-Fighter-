"""Pack eight full-body walk drawings into immutable runtime atlases."""
import json
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[1]
SOURCES = {
    'khauany': ('khauany-walk-v2.png', [0, 290, 545, 790, 1080, 1335, 1600, 1870, 2172]),
    'luciana': ('luciana-walk-v2.png', [0, 290, 540, 760, 1060, 1350, 1580, 1875, 2172]),
    'dienes': ('dienes-walk-v2.png', [0, 300, 570, 770, 1080, 1360, 1590, 1880, 2172]),
}

for name, (source, cuts) in SOURCES.items():
    original = Image.open(ROOT / 'assets' / 'source' / source).convert('RGBA')
    frames = []
    whole = np.array(original)
    labels, count = ndimage.label(whole[:, :, 3] > 80, structure=np.ones((3, 3)))
    objects = ndimage.find_objects(labels)
    areas = np.bincount(labels.ravel())
    for i, (left, right) in enumerate(zip(cuts, cuts[1:])):
        # Most figures are separate connected bodies despite horizontal overlap.
        # Preserve the whole silhouette, including a boot or glove that crosses
        # an approximate column edge. Only joined figures require an x split.
        candidates = []
        for lab, bounds in enumerate(objects, 1):
            if bounds is None or areas[lab] < 10000:
                continue
            center = (bounds[1].start + bounds[1].stop) / 2
            if left <= center < right or bounds[1].start < (left + right) / 2 < bounds[1].stop:
                candidates.append((lab, bounds, areas[lab]))
        if not candidates:
            raise ValueError((name, i, 'empty'))
        lab, bounds, _ = max(candidates, key=lambda item: item[2])
        joined = sum(left <= (bounds[1].start + bounds[1].stop) / 2 < right for left, right in zip(cuts, cuts[1:])) == 0 or bounds[1].stop - bounds[1].start > 380
        x0 = max(0, left if joined else bounds[1].start - 3)
        x1 = min(original.width, right if joined else bounds[1].stop + 3)
        rgba = whole[:, x0:x1].copy()
        keep = ndimage.binary_dilation(labels[:, x0:x1] == lab, iterations=2)
        rgba[~keep, 3] = 0
        ys, xs = np.nonzero(rgba[:, :, 3] > 24)
        if xs.size < 10000:
            raise ValueError((name, i, 'incomplete', xs.size))
        x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
        frame = Image.fromarray(rgba[y0:y1, x0:x1])
        pixels = np.asarray(frame)
        waist_y = round(frame.height * .44)
        waist = pixels[max(0, waist_y-8):waist_y+9, :, 3] > 128
        waist_xs = np.nonzero(waist)[1]
        anchor = float(np.median(waist_xs)) if len(waist_xs) else frame.width / 2
        frames.append((frame, anchor))
    atlas = Image.new('RGBA', (sum(frame.width + 4 for frame, _ in frames), max(frame.height for frame, _ in frames) + 4))
    data = []
    x = 2
    for frame, anchor in frames:
        atlas.alpha_composite(frame, (x, 2))
        data.append(dict(x=0, y=0, w=frame.width, h=frame.height, anchor=round(anchor, 2), bottom=frame.height,
                         scale=round(300 / frame.height, 7), rect=[x, 2, frame.width, frame.height]))
        x += frame.width + 4
    target = ROOT / 'assets' / 'story' / f'{name}-walk-v2'
    target.parent.mkdir(exist_ok=True)
    atlas.save(target.with_suffix('.webp'), 'WEBP', quality=94, method=6)
    target.with_suffix('.json').write_text(json.dumps(data, separators=(',', ':')) + '\n')
    print(name, [(f.width, f.height) for f, _ in frames])

"""Measure Khauãny's hurt bands from her actual packed alpha silhouettes."""
from pathlib import Path
import json
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
image = np.asarray(Image.open(ROOT / 'assets/runtime/khauany-v1.webp').convert('RGBA'))
meta = json.loads((ROOT / 'assets/runtime/khauany-v1.json').read_text())
profiles = {}
for atlas, sheet in meta['atlases'].items():
    scale = sheet['scale']
    profiles[atlas] = []
    for frame in sheet['frames']:
        x, y, w, h = frame['rect']
        mask = image[y:y+h, x:x+w, 3] > 110
        bands = []
        for top, bottom in zip(np.linspace(0, h, 4, dtype=int)[:-1],
                               np.linspace(0, h, 4, dtype=int)[1:]):
            ys, xs = np.nonzero(mask[top:bottom])
            if not len(xs):
                raise ValueError(f'Empty band in {atlas} frame {len(profiles[atlas])}')
            left, right = xs.min(), xs.max()+1
            bands.append([round((left-frame['anchor'])*scale, 1),
                          round((h-top)*scale, 1),
                          round((right-left)*scale, 1),
                          round((bottom-top)*scale, 1)])
        profiles[atlas].append(bands[::-1])
path = ROOT / 'src/khauany-data.js'
path.write_text('/* Hurtboxes measured from Khauãny\'s isolated sprite silhouettes. */\n'
                'export const KHAUANY_HURT='+json.dumps(profiles, separators=(',', ':'))+';\n')
print(path, '32 silhouette profiles')

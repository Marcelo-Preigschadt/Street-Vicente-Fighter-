"""Rebuild collision bands from the exact shipping complete walk atlases."""
import json
import subprocess
from pathlib import Path
import numpy as np
from PIL import Image

root = Path(__file__).resolve().parents[1]
bands = {}
stems = json.loads(subprocess.check_output([
    'node', '--input-type=module', '-e',
    "import {MOTION_SPRITE_STEMS} from './src/sprite-loader.js';process.stdout.write(JSON.stringify(MOTION_SPRITE_STEMS));"
], cwd=root, text=True))
for character, relative_stem in stems.items():
    stem = root / relative_stem
    alpha = np.asarray(Image.open(stem.with_suffix('.webp')).convert('RGBA'))[:, :, 3]
    frames = json.loads(stem.with_suffix('.json').read_text())
    result = []
    for frame in frames:
        x, y, w, h = frame['rect']
        pixels = alpha[y:y+h, x:x+w]
        scale = frame.get('scale', 1)
        rows = []
        for low, high in [(0, .32), (.32, .65), (.65, 1)]:
            y1 = int(h * low)
            y2 = max(y1 + 1, int(h * high))
            ys, xs = np.where(pixels[y1:y2] > 140)
            if len(xs) == 0:
                raise ValueError(f'{character}: empty collision band')
            x1, x2 = int(xs.min()), int(xs.max())
            top, bottom = y1 + int(ys.min()), y1 + int(ys.max())
            rows.append([
                round((frame['x'] - frame['anchor'] + x1) * scale, 5),
                round((frame['bottom'] - frame['y'] - top) * scale, 5),
                round((x2 - x1 + 1) * scale, 5),
                round((bottom - top + 1) * scale, 5),
            ])
        result.append(rows)
    bands[character] = result
text = '// Body bands measured from the shipping complete walk drawings. Regenerate with scripts/build-native-walk-bounds.py.\n'
text += 'export const NATIVE_WALK_HURT=' + json.dumps(bands, separators=(',', ':')) + ';\n'
(root / 'src/native-walk-data.js').write_text(text)

"""Pack eight full-body walk drawings into immutable runtime atlases."""
import argparse
import hashlib
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

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--only', choices=SOURCES)
args = parser.parse_args()
ownership_path = ROOT / 'assets/source/khauany-walk-ownership-v3.json'
ownership = json.loads(ownership_path.read_text())


def owned_drawing(whole, spec):
    """Separate touching drawings by authored ownership, never repaint pixels.

    The seams lie between the two illustrated boot contours. Outside the
    contact rows the drawings are already separate. Local labelling prevents
    a neighbouring glove from being kept merely because it touches another
    drawing elsewhere in the source sheet.
    """
    left, top, right, bottom = spec['roi']
    yy, xx = np.indices(whole.shape[:2])
    allowed = (xx >= left) & (xx < right) & (yy >= top) & (yy < bottom)
    for key, side in [('leftSeam', 'left'), ('rightSeam', 'right')]:
        if key not in spec:
            continue
        points = np.asarray(ownership['seams'][spec[key]])
        boundary = np.interp(yy[:, 0], points[:, 0], points[:, 1])[:, None]
        contact_rows = yy >= points[0, 0]
        allowed &= ~contact_rows | ((xx >= boundary) if side == 'left' else (xx < boundary))
    labels, _ = ndimage.label((whole[:, :, 3] > 80) & allowed, structure=np.ones((3, 3)))
    seed_x, seed_y = spec['seed']
    label = labels[seed_y, seed_x]
    if label == 0:
        raise ValueError(('unowned body seed', spec['seed']))
    body = labels == label
    if np.count_nonzero(body) < 55000:
        raise ValueError(('incomplete owned drawing', np.count_nonzero(body)))
    keep = ndimage.binary_dilation(body, iterations=2) & allowed
    rgba = whole.copy()
    rgba[~keep, 3] = 0
    ys, xs = np.nonzero(rgba[:, :, 3] > 24)
    x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    return Image.fromarray(rgba[y0:y1, x0:x1]), [int(x0), int(y0), int(x1-x0), int(y1-y0)]


for name, (source, cuts) in SOURCES.items():
    if args.only and args.only != name:
        continue
    original = Image.open(ROOT / 'assets' / 'source' / source).convert('RGBA')
    frames = []
    whole = np.array(original)
    labels, count = ndimage.label(whole[:, :, 3] > 80, structure=np.ones((3, 3)))
    objects = ndimage.find_objects(labels)
    areas = np.bincount(labels.ravel())
    for i, (left, right) in enumerate(zip(cuts, cuts[1:])):
        spec = ownership['frames'].get(str(i)) if name == 'khauany' else None
        if spec:
            frame, source_rect = owned_drawing(whole, spec)
        else:
            # Most figures are separate connected bodies despite horizontal
            # overlap. Preserve their entire silhouettes outside the authored
            # ownership cases above.
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
            joined = bounds[1].stop - bounds[1].start > 380
            original_x = max(0, left if joined else bounds[1].start - 3)
            x1 = min(original.width, right if joined else bounds[1].stop + 3)
            rgba = whole[:, original_x:x1].copy()
            keep = ndimage.binary_dilation(labels[:, original_x:x1] == lab, iterations=2)
            rgba[~keep, 3] = 0
            ys, xs = np.nonzero(rgba[:, :, 3] > 24)
            if xs.size < 10000:
                raise ValueError((name, i, 'incomplete', xs.size))
            x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
            frame = Image.fromarray(rgba[y0:y1, x0:x1])
            source_rect = [int(original_x+x0), int(y0), int(x1-x0), int(y1-y0)]
        pixels = np.asarray(frame)
        waist_y = round(frame.height * .44)
        waist = pixels[max(0, waist_y-8):waist_y+9, :, 3] > 128
        waist_xs = np.nonzero(waist)[1]
        anchor = float(np.median(waist_xs)) if len(waist_xs) else frame.width / 2
        frames.append((frame, anchor, source_rect))
    atlas = Image.new('RGBA', (sum(frame.width + 4 for frame, _, _ in frames), max(frame.height for frame, _, _ in frames) + 4))
    data = []
    x = 2
    for frame, anchor, source_rect in frames:
        atlas.paste(frame, (x, 2))
        data.append(dict(x=0, y=0, w=frame.width, h=frame.height, anchor=round(anchor, 2), bottom=frame.height,
                         scale=round(300 / frame.height, 7), rect=[x, 2, frame.width, frame.height],
                         source=dict(path=f'assets/source/{source}', sha256=hashlib.sha256((ROOT / 'assets/source' / source).read_bytes()).hexdigest(), rect=source_rect)))
        x += frame.width + 4
    target = ROOT / ownership['outputStem'] if name == 'khauany' else ROOT / 'assets' / 'story' / f'{name}-walk-v2'
    target.parent.mkdir(exist_ok=True)
    atlas.save(target.with_suffix('.webp'), 'WEBP', lossless=True, exact=True, method=6)
    target.with_suffix('.json').write_text(json.dumps(data, separators=(',', ':')) + '\n')
    print(name, target.relative_to(ROOT), [(f.width, f.height) for f, _, _ in frames])

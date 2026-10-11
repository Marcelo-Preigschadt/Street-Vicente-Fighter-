"""Pack whole approved poses without cutting at nominal 4x4 cell edges.

Alpha ownership is derived from the 16 opaque connected bodies. Nearest-body
ownership recovers their antialiasing and disconnected details; source RGB is
never painted or regenerated. A constant scale preserves standing/fall size.
"""
import hashlib
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import label, find_objects, distance_transform_edt

ROOT = Path(__file__).resolve().parent.parent
SPECS = {
    'archaeologist': (140, 'time', 8),
    'aula': (285, 'distance', 160),
    'exo': (350, 'distance', 148),
    'substitute': (285, 'distance', 172),
    'fairRobot': (340, 'distance', 150),
}


def pack(kind, height, units, tempo):
    source = ROOT / f'assets/source/{kind}-animation-v1.png'
    image = Image.open(source).convert('RGBA')
    pixels = np.array(image)
    components, count = label(pixels[:, :, 3] > 48)
    sizes = np.bincount(components.ravel())
    bodies = np.where((sizes > 5000) & (np.arange(len(sizes)) > 0))[0]
    if len(bodies) != 16:
        raise ValueError(f'{kind}: expected 16 whole bodies, found {len(bodies)}')
    boxes = find_objects(components)
    # Source layouts are uneven. Sort the whole bodies by row, then column;
    # do not assign an extended sword or glove to the next nominal grid cell.
    ordered = sorted(bodies, key=lambda c: boxes[c-1][0].start)
    ordered = sum([sorted(ordered[i:i+4], key=lambda c: boxes[c-1][1].start)
                   for i in range(0, 16, 4)], [])
    lookup = np.zeros(count+1, dtype=np.uint8)
    for index, component in enumerate(ordered):
        lookup[component] = index+1
    owner = lookup[components]
    distance, nearest = distance_transform_edt(owner == 0, return_indices=True)
    owner = owner[tuple(nearest)]
    visible = (pixels[:, :, 3] > 0) & (distance <= 16)
    pieces, frames, regions = [], [], []
    for index in range(16):
        mask = visible & (owner == index+1)
        ys, xs = np.where(mask)
        left, right, top, bottom = xs.min(), xs.max()+1, ys.min(), ys.max()+1
        crop = pixels[top:bottom, left:right].copy()
        crop[:, :, 3] = np.where(mask[top:bottom, left:right], crop[:, :, 3], 0)
        pieces.append(crop)
        # An anchor through the pelvis/body, rather than through an extended
        # arm, sword or rotor. A fall keeps its natural, shorter pixel height.
        centers = []
        for y in range(top+round((bottom-top)*.50), top+round((bottom-top)*.62)):
            xx = np.where(mask[y])[0]
            if len(xx):
                centers.append((xx.min()+xx.max())/2-left)
        anchor = float(np.median(centers)) if centers else crop.shape[1]/2
        frames.append({'height': int(bottom-top), 'anchorX': round(anchor, 3),
                       'bottom': int(bottom-top)})
        regions.append([int(left), int(top), int(right-left), int(bottom-top)])
    scale = height / float(np.median([p.shape[0] for p in pieces[:8]]))
    out = Image.new('RGBA', (sum(p.shape[1]+6 for p in pieces),
                             max(p.shape[0] for p in pieces)+4))
    x = 3
    for index, piece in enumerate(pieces):
        h, w = piece.shape[:2]
        out.paste(Image.fromarray(piece), (x, 2))
        frames[index]['rect'] = [x, 2, w, h]
        x += w+6
    file = f'assets/story/{kind}-animation-v5.webp'
    out.save(ROOT / file, lossless=True, method=6)
    sequence = {'idle': 0, 'walk': list(range(8)), 'walkUnits': units,
                'walkTempo': tempo, 'windup': 9, 'contact': 10,
                'recovery': 11, 'hit': 12, 'fall': [13, 14, 15]}
    if kind == 'archaeologist':
        sequence.update(windup=8, contact=9, recovery=10)
    elif kind == 'aula':
        sequence.update(windup=8, contact=9, recovery=10)
    elif kind == 'exo':
        sequence.update(windup=8, contact=9, recovery=10,
                        contacts={'slam': 9, 'charge': 11})
    metadata = {'file': file, 'scale': round(scale, 9), 'frames': frames,
                'sequences': sequence, 'source': str(source.relative_to(ROOT)),
                'sourceSha256': hashlib.sha256(source.read_bytes()).hexdigest(),
                'sourceRegions': regions}
    # Proof uses exactly the packed output. No source photographs are copied.
    board = Image.new('RGB', (1400, 1200), '#243337')
    draw = ImageDraw.Draw(board)
    for index, piece in enumerate(pieces):
        sprite = Image.fromarray(piece)
        sprite.thumbnail((335, 260))
        col, row = index % 4, index // 4
        board.paste(sprite, (col*350+(350-sprite.width)//2,
                            row*300+278-sprite.height), sprite)
        draw.text((col*350+10, row*300+285), f'{kind}: {index}', fill='white')
    proof = ROOT / 'docs/audit-20261010-story/recovered'
    proof.mkdir(parents=True, exist_ok=True)
    board.save(proof / f'{kind}-poses.webp', quality=92)
    print(f'{kind}: 16 complete poses; scale {scale:.5f}; '
          f'standing heights {[round(p.shape[0]*scale) for p in pieces[:8]]}')
    return metadata


if __name__ == '__main__':
    metadata = json.loads((ROOT / 'assets/story/enemy-animation-v4.json').read_text())
    for name, spec in SPECS.items():
        metadata[name] = pack(name, *spec)
    (ROOT / 'assets/story/enemy-animation-v5.json').write_text(
        json.dumps(metadata, indent=2)+'\n')

"""Check crop ownership and pixel preservation, without approving motion quality."""
import hashlib
import json
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.ndimage import label

ROOT = Path(__file__).resolve().parent.parent
meta = json.loads((ROOT / 'assets/story/enemy-animation-v5.json').read_text())
report = {'scope': 'source pixel preservation; not temporal or browser approval', 'enemies': []}
for kind in ['archaeologist', 'aula', 'exo', 'substitute', 'fairRobot']:
    sheet = meta[kind]
    source_file = ROOT / sheet['source']
    assert hashlib.sha256(source_file.read_bytes()).hexdigest() == sheet['sourceSha256']
    original = np.array(Image.open(source_file).convert('RGBA'))
    packed = np.array(Image.open(ROOT / sheet['file']).convert('RGBA'))
    reconstructed = np.zeros_like(original)
    ownership = np.zeros(original.shape[:2], dtype=np.uint8)
    assert len(sheet['frames']) == len(sheet['sourceRegions']) == 16
    for frame, region in zip(sheet['frames'], sheet['sourceRegions']):
        x, y, w, h = frame['rect']
        sx, sy, sw, sh = region
        assert (w, h) == (sw, sh)
        assert x >= 0 and y >= 0 and x+w <= packed.shape[1] and y+h <= packed.shape[0]
        pose = packed[y:y+h, x:x+w]
        source = original[sy:sy+h, sx:sx+w]
        kept = pose[:, :, 3] > 0
        assert kept.sum() > 5000, (kind, 'empty pose')
        assert np.array_equal(pose[kept], source[kept]), (kind, 'source pixels changed')
        ownership[sy:sy+h, sx:sx+w] += kept
        restored = reconstructed[sy:sy+h, sx:sx+w]
        restored[kept] = pose[kept]
    assert ownership.max() == 1, (kind, 'a neighbour was included in two poses')
    components, _ = label(original[:, :, 3] > 48)
    sizes = np.bincount(components.ravel())
    bodies = (sizes[components] > 5000) & (components > 0)
    assert np.array_equal(original[bodies], reconstructed[bodies]), (kind, 'opaque body clipped')
    report['enemies'].append({'id': kind, 'wholeSourceBodies': 16,
                             'unchangedVisiblePixels': int((ownership > 0).sum()),
                             'opaqueBodyPixelsPreserved': int(bodies.sum()),
                             'duplicatedPixels': int((ownership > 1).sum())})
output = ROOT / 'docs/audit-20261010-story/recovered/preservation.json'
output.parent.mkdir(parents=True, exist_ok=True)
output.write_text(json.dumps(report, indent=2)+'\n')
print(json.dumps(report))

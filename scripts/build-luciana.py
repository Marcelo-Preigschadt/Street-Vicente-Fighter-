"""Pack Luciana's approved 4x4 painted atlases into runtime sprites."""
from pathlib import Path
from PIL import Image
from scipy import ndimage
import numpy as np
import json

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'assets'
RUNTIME = ASSETS / 'runtime'
RUNTIME.mkdir(exist_ok=True)


def frames(path):
    image = Image.open(path).convert('RGBA')
    pixels = np.asarray(image)
    # Shoes, raised fists and high kicks intentionally cross grid boundaries.
    # Segment the complete figure on the source sheet, then assign it to its
    # pose. A rectangular cell crop would leave a shoe in the next animation.
    labels, _ = ndimage.label(pixels[:, :, 3] > 110,
                              np.ones((3, 3), dtype=bool))
    result = []
    yy, xx = np.indices(labels.shape)
    for index in range(16):
        col, row = index % 4, index // 4
        left = round(col * image.width / 4)
        top = round(row * image.height / 4)
        right = round((col + 1) * image.width / 4)
        bottom = round((row + 1) * image.height / 4)
        cell_labels = labels[top:bottom, left:right]
        counts = np.bincount(cell_labels.ravel())
        counts[0] = 0
        subject = int(counts.argmax())
        if not subject or counts[subject] < 10000:
            raise ValueError(f'No fighter found in {path} pose {index}')
        mask = labels == subject
        if path.name == 'luciana-base-v1.webp' and index in (10, 14):
            # A planted shoe in pose 10 touches the victory fist in pose 14.
            # Their shared source component needs a short anatomical seam.
            shoe = (yy < 930) | ((yy < 960) & (xx < 710)) | \
                   ((yy < 945) & (xx > 820))
            mask &= shoe if index == 10 else ~shoe
            # A few pixels of the opposite pose can survive the seam. Keep
            # only the silhouette attached to this fighter.
            parts, _ = ndimage.label(mask, np.ones((3, 3), dtype=bool))
            sizes = np.bincount(parts.ravel())
            sizes[0] = 0
            mask = parts == sizes.argmax()
        # Keep the source antialiasing along the contour, without importing
        # detached pixels belonging to the adjacent pose.
        mask = ndimage.binary_dilation(mask, iterations=1)
        mask &= pixels[:, :, 3] > 0
        ys, xs = np.nonzero(mask)
        bounds = (max(0, int(xs.min()) - 1), max(0, int(ys.min()) - 1),
                  min(image.width, int(xs.max()) + 2),
                  min(image.height, int(ys.max()) + 2))
        isolated = pixels[bounds[1]:bounds[3], bounds[0]:bounds[2]].copy()
        isolated[~mask[bounds[1]:bounds[3], bounds[0]:bounds[2]]] = 0
        silhouette = isolated[:, :, 3] > 110
        components, _ = ndimage.label(silhouette,
                                      np.ones((3, 3), dtype=bool))
        areas = np.bincount(components.ravel())
        if len(areas) < 2 or areas[1:].max() < silhouette.sum() * .995:
            raise ValueError(f'Detached pixels in {path} pose {index}')
        result.append(Image.fromarray(isolated, 'RGBA'))
    return result


base = frames(ASSETS / 'luciana-base-v1.webp')
combat = frames(ASSETS / 'luciana-combat-v1.webp')
height = base[0].height
scale = round(300 / height, 5)

portrait = Image.open(ASSETS / 'luciana-portrait-v1.webp').convert('RGBA')
# The larger portrait was painted from the supplied photograph and carries the
# facial detail that would be lost by enlarging a 300-pixel combat pose.
head = portrait.crop((135, 0, 1175, 1040)).resize((320, 320), Image.Resampling.LANCZOS)
head.save(RUNTIME / 'luciana-head-menu-v3.webp', quality=91, method=6)
head_small = head.resize((80, 81), Image.Resampling.LANCZOS)

preview = Image.new('RGBA', (240, 300))
pose = base[0]
factor = min(216 / pose.width, 280 / pose.height)
size = (round(pose.width * factor), round(pose.height * factor))
preview.alpha_composite(pose.resize(size, Image.Resampling.LANCZOS),
                        ((240 - size[0]) // 2, 294 - size[1]))
preview.save(RUNTIME / 'luciana-preview-v1.webp', quality=89, method=6)

items = [('base', i, frame) for i, frame in enumerate(base)] + \
        [('combat', i, frame) for i, frame in enumerate(combat)] + \
        [('portrait', 0, head_small)]
positions = []
x = y = 2
row_height = 0
for _, _, frame in items:
    if x + frame.width + 2 > 2048:
        x = 2
        y += row_height + 2
        row_height = 0
    positions.append([x, y, frame.width, frame.height])
    x += frame.width + 2
    row_height = max(row_height, frame.height)

packed = Image.new('RGBA', (2048, y + row_height + 2))
metadata = {'atlases': {'base': {'scale': scale, 'frames': []},
                        'combat': {'scale': scale, 'frames': []}}, 'portrait': None}
for (atlas, index, frame), rect in zip(items, positions):
    packed.alpha_composite(frame, (rect[0], rect[1]))
    if atlas == 'portrait':
        metadata['portrait'] = rect
        continue
    w, h = frame.size
    # The pelvis stays anchored during a stride; the combat pose uses the
    # planted leg instead of an extended punch as its reference point.
    if atlas == 'base' and index < 4:
        anchor = w * .50
    elif atlas == 'combat' and index in (1, 3, 5, 7, 14):
        anchor = w * .43
    else:
        anchor = w * .50
    metadata['atlases'][atlas]['frames'].append({
        'x': 0, 'y': 0, 'w': w, 'h': h, 'anchor': round(anchor, 2),
        'bottom': h, 'rect': rect})

packed.save(RUNTIME / 'luciana-v1.webp', quality=87, method=6)
(RUNTIME / 'luciana-v1.json').write_text(json.dumps(metadata, separators=(',', ':')),
                                         encoding='utf-8')
hurt = {}
for atlas, poses in [('base', base), ('combat', combat)]:
    hurt[atlas] = []
    profiles = metadata['atlases'][atlas]['frames']
    for pose, frame in zip(poses, profiles):
        w, h = pose.size
        bands = []
        for y1, y2 in [(round(h * .68), h), (round(h * .35), round(h * .68)),
                       (0, round(h * .35))]:
            region = pose.crop((0, y1, w, y2)).getchannel('A')
            bounds = region.point(lambda value: 255 if value > 110 else 0).getbbox()
            if bounds is None:
                continue
            l, t, r, b = bounds
            bands.append([round((l - frame['anchor']) * scale, 1),
                          round((h - y1 - t) * scale, 1),
                          round((r - l) * scale, 1), round((b - t) * scale, 1)])
        hurt[atlas].append(bands)
(ROOT / 'src' / 'mma-data.js').write_text(
    '/* Body bands measured from Luciana\'s actual sprite silhouettes. */\n'
    'export const MMA_HURT=' + json.dumps(hurt, separators=(',', ':')) + ';\n',
    encoding='utf-8')
print(f'Luciana: 32 poses, scale {scale}, atlas {packed.width}×{packed.height}')

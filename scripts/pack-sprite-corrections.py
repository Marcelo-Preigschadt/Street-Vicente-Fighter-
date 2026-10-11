"""Pack candidate sprite corrections without repainting any preserved pose.

Image generation edits the authored PNG. This deterministic stage only crops,
uniformly resamples, packs and losslessly encodes it with the approved runtime
poses. Original packs and raw illustrations remain untouched.
"""
from pathlib import Path
import hashlib
import json
import re
import sys
from PIL import Image
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
PLAN = ROOT / 'assets/source/sprite-corrections.json'


def pack(ident):
    plan = json.loads(PLAN.read_text())[ident]
    source = ROOT / plan['baselineStem']
    original = Image.open(source.with_suffix('.webp')).convert('RGBA')
    metadata = json.loads(source.with_suffix('.json').read_text())
    frames = {}
    for atlas, sheet in metadata['atlases'].items():
        for index, frame in enumerate(sheet['frames']):
            x, y, w, h = frame['rect']
            frames[(atlas, index)] = original.crop((x, y, x + w, y + h))
    for correction in plan['corrections']:
        path = ROOT / correction['source']
        raw = Image.open(path).convert('RGBA')
        # This is a crop of the genuine alpha output, never background removal.
        bounds = raw.getchannel('A').point(lambda a: 255 if a > 16 else 0).getbbox()
        if bounds is None:
            raise ValueError(f'Empty correction: {path}')
        authored = raw.crop(bounds)
        width = correction['runtimeWidth']
        height = round(authored.height * width / authored.width)
        pose = authored.resize((width, height), Image.Resampling.LANCZOS)
        atlas, index = correction['atlas'], correction['index']
        old = metadata['atlases'][atlas]['frames'][index]
        frames[(atlas, index)] = pose
        old.update(x=0, y=0, w=width, h=height,
                   anchor=round(width * correction['anchorFraction'], 6),
                   bottom=height,
                   scale=round(authored.height * correction['authoredScale'] / height, 9),
                   source={'path': correction['source'], 'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
                           'bounds': list(bounds), 'animation': correction['animation']})
    px, py, pw, ph = metadata['portrait']
    portrait = original.crop((px, py, px + pw, py + ph))
    items = [(key, image) for key, image in frames.items()] + [(None, portrait)]
    x = y = 2
    row_height = 0
    positions = []
    for key, image in items:
        if x + image.width + 2 > 2048:
            x, y, row_height = 2, y + row_height + 2, 0
        positions.append((x, y, image.width, image.height))
        x += image.width + 2
        row_height = max(row_height, image.height)
    packed = Image.new('RGBA', (2048, y + row_height + 2))
    for (key, image), rect in zip(items, positions):
        # No alpha mask/compositing blend: unchanged RGBA pixels stay exact.
        packed.paste(image, rect[:2])
        if key is None:
            metadata['portrait'] = list(rect)
        else:
            metadata['atlases'][key[0]]['frames'][key[1]]['rect'] = list(rect)
    destination = ROOT / plan['outputStem']
    packed.save(destination.with_suffix('.webp'), lossless=True, method=6, exact=True)
    destination.with_suffix('.json').write_text(json.dumps(metadata, separators=(',', ':')) + '\n')
    # Contact bands follow the corrected painted geometry; move timing and its
    # attackbox remain the authored gameplay values.
    if plan.get('hurtData'):
        path = ROOT / plan['hurtData']['path']
        name = plan['hurtData']['export']
        text = path.read_text()
        match = re.search(r'export const ' + name + r'=(.*);', text)
        if not match:
            raise ValueError('Hurt profile export not found: ' + name)
        hurt = json.loads(match.group(1))
        for correction in plan['corrections']:
            atlas, index = correction['atlas'], correction['index']
            pose = np.asarray(frames[(atlas, index)])
            frame = metadata['atlases'][atlas]['frames'][index]
            h, w = pose.shape[:2]
            bands = []
            cuts = np.linspace(0, h, 4, dtype=int)
            for top, bottom in zip(cuts[:-1], cuts[1:]):
                yy, xx = np.nonzero(pose[top:bottom, :, 3] > 110)
                if not len(xx):
                    raise ValueError('Empty correction hurt band')
                left, right = int(xx.min()), int(xx.max()) + 1
                scale = frame['scale']
                bands.append([round((left - frame['anchor']) * scale, 1), round((h - top) * scale, 1),
                              round((right - left) * scale, 1), round((bottom - top) * scale, 1)])
            hurt[atlas][index] = bands[::-1]
        path.write_text(text[:match.start(1)] + json.dumps(hurt, separators=(',', ':')) + text[match.end(1):])
    print(f'{ident}: {len(frames)} poses, {len(plan["corrections"])} corrected; portrait and other poses preserved losslessly')


if __name__ == '__main__':
    for ident in sys.argv[1:] or json.loads(PLAN.read_text()).keys():
        pack(ident)

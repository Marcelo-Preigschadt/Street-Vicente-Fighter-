"""Inspect the active prepared packs and produce labelled, reproducible boards.

The scanner verifies crop/alpha structure. It never approves anatomy, identity
or temporal fluidity automatically; those still require viewing the boards/game.
"""
from pathlib import Path
import argparse
import io
import hashlib
import json
import subprocess
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[1]
IDS = ['adriano', 'marcelo', 'rafael', 'gustavo', 'gelton', 'marcelino', 'marcos', 'joao', 'ruan', 'tais', 'luciana', 'khauany', 'dienes']
VERSIONS = {'adriano': 2, 'tais': 2, 'khauany': 2, 'dienes': 2}
MOTION = json.loads(subprocess.check_output([
    'node', '--input-type=module', '-e',
    "import {MOTION_SPRITE_STEMS} from './src/sprite-loader.js';process.stdout.write(JSON.stringify(MOTION_SPRITE_STEMS));"
], cwd=ROOT, text=True))
ADDITIONAL = json.loads(subprocess.check_output([
    'node', '--input-type=module', '-e',
    "import {ADDITIONAL_SPRITE_STEMS} from './src/sprite-loader.js';process.stdout.write(JSON.stringify(ADDITIONAL_SPRITE_STEMS));"
], cwd=ROOT, text=True))


def crop(image, rectangle):
    x, y, w, h = rectangle
    assert x >= 0 and y >= 0 and w > 0 and h > 0 and x + w <= image.width and y + h <= image.height
    return image.crop((x, y, x + w, y + h))


def preserved():
    baseline = Image.open(ROOT / 'assets/runtime/khauany-v1.webp').convert('RGBA')
    corrected = Image.open(ROOT / 'assets/runtime/khauany-v2.webp').convert('RGBA')
    old = json.loads((ROOT / 'assets/runtime/khauany-v1.json').read_text())
    new = json.loads((ROOT / 'assets/runtime/khauany-v2.json').read_text())
    count = 0
    for atlas, sheet in old['atlases'].items():
        for index, frame in enumerate(sheet['frames']):
            other = new['atlases'][atlas]['frames'][index]
            if (atlas, index) == ('combat', 14):
                continue
            assert {k: v for k, v in frame.items() if k != 'rect'} == {k: v for k, v in other.items() if k != 'rect'}, (atlas, index, 'profile changed')
            assert np.array_equal(np.asarray(crop(baseline, frame['rect'])), np.asarray(crop(corrected, other['rect']))), (atlas, index, 'pixels changed')
            count += 1
    assert np.array_equal(np.asarray(crop(baseline, old['portrait'])), np.asarray(crop(corrected, new['portrait']))), 'portrait pixels changed'
    return {'unchangedPosesPixelExact': count, 'portraitPixelExact': True}


def preserved_walk():
    plan = json.loads((ROOT / 'assets/source/khauany-walk-ownership-v3.json').read_text())
    source = np.asarray(Image.open(ROOT / plan['source']).convert('RGBA'))
    source_sha = hashlib.sha256((ROOT / plan['source']).read_bytes()).hexdigest()
    stem = ROOT / plan['outputStem']
    runtime = Image.open(stem.with_suffix('.webp')).convert('RGBA')
    frames = json.loads(stem.with_suffix('.json').read_text())
    assert len(frames) == 8
    faces, foreign_count, owned_count = {}, 0, 0
    for index, frame in enumerate(frames):
        assert frame['source']['sha256'] == source_sha, 'walk source changed without repacking'
        sx, sy, sw, sh = frame['source']['rect']
        pose = np.asarray(crop(runtime, frame['rect']))
        original = source[sy:sy+sh, sx:sx+sw]
        retained = pose[:, :, 3] > 0
        assert np.array_equal(pose[retained], original[retained]), (index, 'retained source pixels repainted')
        if str(index) not in plan['frames']:
            continue
        spec = plan['frames'][str(index)]
        restored = np.zeros_like(source)
        restored[sy:sy+sh, sx:sx+sw] = pose
        fx, fy, fw, fh = spec['faceWindow']
        previous = source[fy:fy+fh, fx:fx+fw]
        current = restored[fy:fy+fh, fx:fx+fw]
        facial = previous[:, :, 3] > 95
        assert np.array_equal(previous[facial], current[facial]), (index, 'opaque face pixels changed')
        faces[str(index)] = int(facial.sum())
        for px, py in spec['foreignWitnesses']:
            assert source[py, px, 3] > 95 and restored[py, px, 3] == 0, (index, 'neighbour fragment retained', px, py)
            foreign_count += 1
        for px, py in spec['ownedWitnesses']:
            assert source[py, px, 3] > 95 and np.array_equal(source[py, px], restored[py, px]), (index, 'own glove/toe clipped', px, py)
            owned_count += 1
        labels, _ = ndimage.label(pose[:, :, 3] > 95, np.ones((3, 3), bool))
        assert np.count_nonzero(np.bincount(labels.ravel())[1:] > 20) == 1, (index, 'unexpected walk fragments')
    return {'framesWithSourceExactRetainedPixels': 8, 'sourceExactOpaqueFacePixels': faces,
            'foreignWitnessesRemoved': foreign_count, 'ownedWitnessesPreserved': owned_count}


def scan(output=None, ids=None):
    ids = ids or IDS
    report = {'scope': 'prepared-sprite-crop-and-alpha; no automatic visual acceptance', 'characters': [],
              'preservation': preserved(), 'walkPreservation': preserved_walk()}
    if output:
        output.mkdir(parents=True, exist_ok=True)
        try:
            font = ImageFont.truetype('DejaVuSans.ttf', 14)
        except OSError:
            font = ImageFont.load_default()
    for ident in ids:
        stem = ROOT / f'assets/runtime/{ident}-v{VERSIONS.get(ident, 1)}'
        metadata = json.loads(stem.with_suffix('.json').read_text())
        image = Image.open(stem.with_suffix('.webp')).convert('RGBA')
        images = {str(stem.relative_to(ROOT)): image}
        sheets = [(atlas, sheet['frames'], sheet['scale'], str(stem.relative_to(ROOT))) for atlas, sheet in metadata['atlases'].items()]
        prepared_count = sum(len(sheet['frames']) for sheet in metadata['atlases'].values())
        motion_count = additional_count = 0
        if ident in MOTION:
            motion_stem = ROOT / MOTION[ident]
            images[MOTION[ident]] = Image.open(motion_stem.with_suffix('.webp')).convert('RGBA')
            sheets.append(('motion', json.loads(motion_stem.with_suffix('.json').read_text()), 1, MOTION[ident]))
            motion_count = len(sheets[-1][1])
        for atlas, extra in ADDITIONAL.get(ident, {}).items():
            extra_stem = ROOT / extra
            images[extra] = Image.open(extra_stem.with_suffix('.webp')).convert('RGBA')
            profile = json.loads(extra_stem.with_suffix('.json').read_text())
            sheets.append((atlas, profile['frames'], profile['scale'], extra))
            additional_count += len(profile['frames'])
        frames = []
        for atlas, profiles, sheet_scale, source_stem in sheets:
            for index, frame in enumerate(profiles):
                pose = crop(images[source_stem], frame['rect'])
                assert pose.size == (frame['w'], frame['h']), (ident, atlas, index, 'dimensions')
                alpha = np.asarray(pose)[:, :, 3]
                mask = alpha >= 95
                assert mask.sum() > 100, (ident, atlas, index, 'empty alpha')
                labels, _ = ndimage.label(mask, np.ones((3, 3), bool))
                areas = np.bincount(labels.ravel())[1:]
                # Enclosed transparency can be legitimate space between limbs.
                # Record it for viewing; never erase or reject it by area alone.
                holes = ndimage.binary_fill_holes(mask) & ~mask
                hole_labels, _ = ndimage.label(holes, np.ones((3, 3), bool))
                hole_areas = np.bincount(hole_labels.ravel())[1:]
                scale = frame.get('scale', sheet_scale)
                frames.append({'atlas': atlas, 'index': index, 'stem': source_stem, 'rect': frame['rect'], 'scale': scale,
                               'drawnSize': [round(frame['w'] * scale, 3), round(frame['h'] * scale, 3)],
                               'opaquePixels': int(mask.sum()), 'meaningfulComponents': int(np.count_nonzero(areas >= 20)),
                               'enclosedAlphaHolesOver20px': [int(n) for n in sorted(hole_areas, reverse=True) if n > 20]})
        item = {'id': ident, 'stem': str(stem.relative_to(ROOT)), 'imageSize': list(image.size), 'preparedFrameCount': prepared_count,
                'externalMotionFrameCount': motion_count, 'additionalFrameCount': additional_count, 'frameCount': len(frames), 'frames': frames}
        report['characters'].append(item)
        if output:
            cols, cw, ch = 8, 190, 210
            board = Image.new('RGB', (cols * cw, ((len(frames) + cols - 1) // cols) * ch), '#203144')
            draw = ImageDraw.Draw(board)
            for n, frame in enumerate(frames):
                pose = crop(images[frame['stem']], frame['rect'])
                factor = min(178 / pose.width, 174 / pose.height)
                pose = pose.resize((round(pose.width * factor), round(pose.height * factor)), Image.Resampling.LANCZOS)
                bx, by = n % cols * cw, n // cols * ch
                for yy in range(by + 24, by + ch, 12):
                    for xx in range(bx, bx + cw, 12):
                        draw.rectangle((xx, yy, xx + 11, yy + 11), fill='#243b48' if ((xx - bx) // 12 + (yy - by) // 12) % 2 else '#2b4655')
                board.paste(pose, (bx + (cw - pose.width) // 2, by + ch - 7 - pose.height), pose)
                draw.text((bx + 6, by + 3), f'{frame["atlas"]}[{frame["index"]}] {frame["rect"][2]}x{frame["rect"][3]}', fill='white', font=font)
            encoded = io.BytesIO()
            board.save(encoded, format='WEBP', quality=92, method=6)
            data = encoded.getvalue()
            assert len(data) > 1000, 'Empty evidence image: ' + ident
            destination = output / f'{ident}.webp'
            temporary = destination.with_suffix('.webp.tmp')
            temporary.write_bytes(data)
            temporary.replace(destination)
            with Image.open(destination) as verified:
                verified.load()
    report['totalFrames'] = sum(c['frameCount'] for c in report['characters'])
    if output:
        (output / ('integrity.json' if ids == IDS else 'integrity-' + '-'.join(ids) + '.json')).write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'characters': len(report['characters']), 'frames': report['totalFrames'], 'preservation': report['preservation']}, ensure_ascii=False))
    return report


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--boards', action='store_true')
    parser.add_argument('--verify-preserved', action='store_true')
    parser.add_argument('--verify-walk', action='store_true')
    parser.add_argument('--only', choices=IDS)
    parser.add_argument('--output', type=Path)
    args = parser.parse_args()
    if args.verify_walk:
        print(json.dumps(preserved_walk()))
    elif args.verify_preserved:
        print(json.dumps(preserved()))
    else:
        scan(args.output or (ROOT / 'docs/audit-20261010-integrity' if args.boards else None), [args.only] if args.only else None)

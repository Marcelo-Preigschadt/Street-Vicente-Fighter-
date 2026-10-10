"""Extract complete painted figures without treating a source strip as a grid.

The walk sources contain eight irregularly spaced figures. Some sneakers or
hair contours touch adjacent figures, so a connected-component bounding box
alone cannot assign ownership. Eroded full-body markers separate those thin
contacts; constrained geodesic growth then assigns every visible source pixel
to one marker. The selected pixels retain their original RGBA values.
"""
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage


CONNECTIVITY = np.ones((3, 3), dtype=bool)
EROSION_CONNECTIVITY = ndimage.generate_binary_structure(2, 1)
NEIGHBORS = ((-1, -1), (-1, 0), (-1, 1), (0, -1),
             (0, 1), (1, -1), (1, 0), (1, 1))


def source_ownership(image, count=8):
    """Return source-pixel figure ownership and the marker erosion radius.

    Pixels with alpha > 80 define the visible silhouettes. Antialiased edges
    within two pixels of those silhouettes are retained as painted, whereas
    isolated almost-transparent PNG background noise is not made into a huge
    crop. No visible source pixels are discarded, duplicated, or recolored.
    """
    rgba = np.asarray(image.convert('RGBA'))
    solid = rgba[:, :, 3] > 80
    height, width = solid.shape
    minimum_area = max(5000, round(int(solid.sum()) / count * .09))
    owners = None
    for erosion in range(1, 25):
        inner = ndimage.binary_erosion(
            solid, structure=EROSION_CONNECTIVITY, iterations=erosion)
        labels, _ = ndimage.label(inner, CONNECTIVITY)
        sizes = np.bincount(labels.ravel())
        bodies = [(ident, bounds) for ident, bounds in
                  enumerate(ndimage.find_objects(labels), 1)
                  if bounds is not None and sizes[ident] >= minimum_area
                  and bounds[0].stop - bounds[0].start >= height * .45]
        if len(bodies) != count:
            continue
        bodies.sort(key=lambda item:
                    (item[1][1].start + item[1][1].stop) * .5)
        centers = [(bounds[1].start + bounds[1].stop) * .5
                   for _, bounds in bodies]
        if np.min(np.diff(centers)) < width / count * .35:
            continue
        owners = np.zeros(solid.shape, dtype=np.int16)
        for owner, (ident, _) in enumerate(bodies, 1):
            owners[labels == ident] = owner
        break
    if owners is None:
        raise ValueError('Walk source does not contain eight separable full-body markers')

    # Multi-source geodesic watershed on the silhouette. Starting from only
    # the marker perimeters avoids queueing every interior torso pixel.
    # Existing marker pixels are fixed, and propagation cannot cross alpha
    # background into another disconnected painted component.
    perimeter = ((owners > 0) & ndimage.binary_dilation(
                 owners == 0, structure=CONNECTIVITY))
    yy, xx = np.nonzero(perimeter)
    queue = deque(zip(yy.tolist(), xx.tolist()))
    while queue:
        y, x = queue.popleft()
        owner = owners[y, x]
        for dy, dx in NEIGHBORS:
            next_y, next_x = y + dy, x + dx
            if (0 <= next_y < height and 0 <= next_x < width
                    and solid[next_y, next_x]
                    and owners[next_y, next_x] == 0):
                owners[next_y, next_x] = owner
                queue.append((next_y, next_x))

    foreground = ((rgba[:, :, 3] > 0) & ndimage.binary_dilation(
                  solid, structure=CONNECTIVITY, iterations=2))
    unassigned = foreground & (owners == 0)
    if unassigned.any():
        # Hair wisps and detached garment outlines have spatial ownership,
        # even when their thin alpha contours do not reach an eroded marker.
        nearest = ndimage.distance_transform_edt(
            owners == 0, return_distances=False, return_indices=True)
        owners[unassigned] = owners[tuple(nearest[:, unassigned])]
    owners[~foreground] = 0
    if np.any(owners[solid] == 0):
        raise AssertionError('Visible painted source pixels were lost')
    return owners, erosion


def extract_walk_frames(path, count=8):
    """Return isolated RGBA frames and source provenance, left to right."""
    path = Path(path)
    image = Image.open(path).convert('RGBA')
    rgba = np.asarray(image)
    owners, erosion = source_ownership(image, count)
    frames = []
    for index in range(count):
        selected = owners == index + 1
        yy, xx = np.nonzero(selected)
        if not len(xx):
            raise AssertionError(f'Empty walk figure {index}')
        x0, x1 = int(xx.min()), int(xx.max()) + 1
        y0, y1 = int(yy.min()), int(yy.max()) + 1
        tile = rgba[y0:y1, x0:x1].copy()
        tile[~selected[y0:y1, x0:x1]] = 0
        # The root follows the painted pelvis, not the width of hair, gloves,
        # or a leading sneaker. Landmark/sole annotation remains downstream.
        pelvis_alpha = tile[round(tile.shape[0] * .50):
                            round(tile.shape[0] * .60), :, 3] > 100
        _, pelvis_x = np.nonzero(pelvis_alpha)
        anchor = float(np.median(pelvis_x)) if len(pelvis_x) else tile.shape[1] * .5
        profile = dict(
            x=0, y=0, anchor=anchor, bottom=y1-y0,
            source=f'assets/source/{path.name}',
            sourceBounds=[x0, y0, x1-x0, y1-y0],
            sourceFrame=index, extraction='seeded-geodesic-ownership-v1',
            seedErosion=erosion,
            sourceVisiblePixels=int(np.count_nonzero(
                selected & (rgba[:, :, 3] > 80))))
        frames.append((Image.fromarray(tile), profile))
    return frames

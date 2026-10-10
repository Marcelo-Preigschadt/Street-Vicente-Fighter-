"""Decode every exported board and check the gallery's local image references."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit
from datetime import datetime, timezone
import hashlib
import json
from PIL import Image

ROOT = Path(__file__).resolve().parents[1] / "docs" / "sprite-audit"


class References(HTMLParser):
    def __init__(self):
        super().__init__()
        self.paths = set()

    def handle_starttag(self, tag, attrs):
        for key, value in attrs:
            if key in ("src", "href") and value:
                path = urlsplit(value).path
                if path.startswith(("before/", "after/")):
                    self.paths.add(path)


boards = []
for path in sorted(ROOT.rglob("*.webp")):
    data = path.read_bytes()
    if not data:
        raise ValueError(f"Empty board: {path.relative_to(ROOT)}")
    with Image.open(path) as image:
        image.load()
        if min(image.size) <= 0:
            raise ValueError(f"Invalid board dimensions: {path}")
        boards.append({"path": str(path.relative_to(ROOT)), "width": image.width,
                       "height": image.height, "bytes": len(data),
                       "sha256": hashlib.sha256(data).hexdigest()})

references = References()
references.feed((ROOT / "index.html").read_text())
decoded = {board["path"] for board in boards}
missing = references.paths - decoded
if missing:
    raise ValueError(f"Unverified gallery references: {sorted(missing)}")

result = {"status": "PASS", "checkedAt": datetime.now(timezone.utc).isoformat(),
          "decodedBoards": len(boards), "galleryReferences": len(references.paths),
          "files": boards}
output = ROOT / "gallery-files.json"
temporary = output.with_suffix(".json.tmp")
temporary.write_text(json.dumps(result, indent=2) + "\n")
temporary.replace(output)
print(f"PASS: {len(boards)} decoded boards; {len(references.paths)} valid references")

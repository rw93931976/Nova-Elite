#!/usr/bin/env python3
"""Push latest droplet backup tarball + manifest + checksum to DO Spaces (offsite)."""

from __future__ import annotations

import argparse
import mimetypes
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
for candidate in (REPO / "src", REPO):
    p = str(candidate)
    if p not in sys.path:
        sys.path.insert(0, p)

from dotenv import load_dotenv

for env_name in (".env.local", ".env"):
    load_dotenv(REPO / env_name, override=False)

from archive_upload import _s3_client, _spaces_bucket, spaces_configured  # noqa: E402

BACKUP_PREFIX = "backups/droplet"


def upload_file(local_path: Path, spaces_key: str) -> str:
    key = spaces_key.lstrip("/")
    ctype = mimetypes.guess_type(local_path.name)[0] or "application/octet-stream"
    _s3_client().upload_file(
        str(local_path),
        _spaces_bucket(),
        key,
        ExtraArgs={"ACL": "private", "ContentType": ctype},
    )
    return key


def push_backup(archive: Path, manifest: Path | None, checksum: Path | None) -> int:
    if not spaces_configured():
        print("DO Spaces not configured — skip offsite backup", file=sys.stderr)
        return 1
    if not archive.is_file():
        print(f"Missing archive: {archive}", file=sys.stderr)
        return 1

    base = archive.stem
    uploaded: list[str] = []

    uploaded.append(upload_file(archive, f"{BACKUP_PREFIX}/{archive.name}"))
    if manifest and manifest.is_file():
        uploaded.append(upload_file(manifest, f"{BACKUP_PREFIX}/{manifest.name}"))
    if checksum and checksum.is_file():
        uploaded.append(upload_file(checksum, f"{BACKUP_PREFIX}/{checksum.name}"))

    print(f"Offsite backup OK: {', '.join(uploaded)}")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Push droplet backup files to DO Spaces")
    parser.add_argument("archive", type=Path, help="Path to nova-droplet-*.tar.gz")
    parser.add_argument("manifest", nargs="?", type=Path, help="Optional manifest .txt")
    parser.add_argument("checksum", nargs="?", type=Path, help="Optional .sha256")
    args = parser.parse_args()

    base = args.archive.name.replace(".tar.gz", "")
    manifest = args.manifest or args.archive.parent / f"{base}.manifest.txt"
    checksum = args.checksum or args.archive.parent / f"{base}.sha256"

    return push_backup(args.archive, manifest, checksum)


if __name__ == "__main__":
    raise SystemExit(main())

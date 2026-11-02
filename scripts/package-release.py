"""Package the exact hosted build; performs no deployment or credential access."""
import hashlib
import json
import os
import posixpath
import re
from urllib.parse import quote, urlsplit
from pathlib import Path
import shutil
import subprocess
import tarfile

root = Path(__file__).resolve().parents[1]
version = json.loads((root / "package.json").read_text())["version"]
tag = os.environ["GITHUB_REF_NAME"]
if tag != f"v{version}":
    raise SystemExit("Release tag differs from package version")
commit = subprocess.check_output(["git", "rev-parse", "HEAD"], text=True).strip()
if subprocess.check_output(["git", "rev-parse", f"{tag}^{{commit}}"], text=True).strip() != commit:
    raise SystemExit("Release source differs from tag")
output = root / "release"
output.mkdir()
stage = output / f"concourse-{version}"
stage.mkdir()
for name in ["dist", "migrations", "integrations", "deploy", "infra", "README.md", "LICENSE-MIT", "LICENSE-APACHE", "THIRD-PARTY-NOTICES.txt"]:
    source = root / name
    if source.is_dir():
        shutil.copytree(source, stage / name, ignore=shutil.ignore_patterns(".terraform", "*.tfstate*", "*.tfplan"))
    else:
        shutil.copy2(source, stage / name)
files = {str(f.relative_to(stage)): hashlib.sha256(f.read_bytes()).hexdigest() for f in sorted(stage.rglob("*")) if f.is_file()}
receipt = {"tag": tag, "sourceCommit": commit, "workflowRun": os.environ.get("GITHUB_RUN_ID"),
           "license": "MIT OR Apache-2.0", "scope": "Local qualification preview; no live login, deployment, production data, Batten host or broad action-profile qualification", "files": files}
(output / "release-receipt.json").write_text(json.dumps(receipt, indent=2) + "\n")
with tarfile.open(output / f"concourse-{version}.tar.gz", "w:gz") as archive:
    archive.add(stage, arcname=stage.name)
shutil.rmtree(stage)
notes_path = f"docs/helix/05-deploy/release-{version}.md"
notes = (root / notes_path).read_text()
if notes.startswith("---\n"):
    notes = notes.split("---", 2)[2].lstrip()


def source_link(match):
    label, href = match.groups()
    parts = urlsplit(href)
    if parts.scheme or parts.netloc or not parts.path:
        return match.group(0)
    target = posixpath.normpath(posixpath.join(posixpath.dirname(notes_path), parts.path))
    if target.startswith("../") or not (root / target).is_file():
        raise SystemExit(f"Release note source link does not exist: {href}")
    url = f"https://github.com/DocumentDrivenDX/concourse/blob/{quote(tag)}/{quote(target)}"
    if parts.fragment:
        url += "#" + parts.fragment
    return f"[{label}]({url})"


notes = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", source_link, notes)
(output / "release-notes.md").write_text(notes)
(output / "SHA256SUMS").write_text("".join(f"{hashlib.sha256(f.read_bytes()).hexdigest()}  {f.name}\n" for f in sorted(output.iterdir()) if f.is_file()))

"""Package the exact hosted build; performs no deployment or credential access."""
import hashlib
import json
import os
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
(output / "SHA256SUMS").write_text("".join(f"{hashlib.sha256(f.read_bytes()).hexdigest()}  {f.name}\n" for f in sorted(output.iterdir()) if f.is_file()))

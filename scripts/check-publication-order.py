"""Verify bootstrap ordering in OpenTofu's actual local dependency graph."""
from pathlib import Path
import subprocess

root = Path(__file__).resolve().parents[1]
graph = subprocess.check_output(
    ["tofu", "graph", "-type=plan"], cwd=root / "infra/cloudflare", text=True
)
resources = [
    "cloudflare_dns_record.site",
    "cloudflare_pages_domain.site",
    "cloudflare_zero_trust_access_application.site",
    "cloudflare_pages_project.site",
]
for dependent, prerequisite in zip(resources, resources[1:]):
    edge = (
        f'"[root] module.publication.{dependent} (expand)" -> '
        f'"[root] module.publication.{prerequisite} (expand)"'
    )
    if edge not in graph:
        raise SystemExit(f"Missing publication dependency: {dependent} -> {prerequisite}")
print("Publication graph verified: empty project -> Access -> domain -> DNS")

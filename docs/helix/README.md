# Concourse project documentation

[Owner input](00-discover/owner-input.md) records settled choices and accepted
planning assumptions. [Current state](00-discover/current-state-inventory-publication.md)
records source evidence from Entropy Exchange, existing infrastructure and UMF.
[Prior art](00-discover/competitive-analysis.md) compares reuse candidates.
The [vision](00-discover/product-vision.md) governs the [PRD](01-frame/prd.md).
[Concerns](01-frame/concerns.md) record cross-cutting practices and unresolved slots.

## Initial feature and story map

| Capability | Feature | Story | PRD coverage |
|---|---|---|---|
| Protected publishing | [FEAT-001](01-frame/features/FEAT-001-protected-publishing.md) | US-001 | FR-1 |
| Identity and membership | [FEAT-002](01-frame/features/FEAT-002-identity-membership.md) | US-002, US-003 | FR-2, FR-3 |
| Resource identity | [FEAT-003](01-frame/features/FEAT-003-resource-identity.md) | US-004 | FR-4 |
| Discussion | [FEAT-004](01-frame/features/FEAT-004-discussion.md) | US-005, US-006 | FR-5, FR-6 |
| Site adoption | [FEAT-005](01-frame/features/FEAT-005-site-adoption.md) | US-007 | FR-7 |
| Structured actions | [FEAT-006](01-frame/features/FEAT-006-structured-actions.md) | US-008 | FR-8 |

Stories live individually under `01-frame/user-stories/`. Acceptance criteria are
planned behavior, with no passing runtime evidence claimed.

## First implementation

Owner-selected target: `helix.synaptiq.tools` using existing Google Workspace
login. [Architecture](02-design/architecture.md), [CONTRACT-001](02-design/contracts/CONTRACT-001-first-slices.md)
and the [execution plan](04-build/first-slices-plan.md) govern generic protection
and inline section comments. [Deployment](05-deploy/first-slices.md) covers the
cross-repository rollout; [execution evidence](04-build/evidence/first-slices.json)
qualifies local checks and records open cloud gates.

For Cloudflare adoption, use the small [Terraform foundation](../../infra/cloudflare/README.md)
and [Wrangler release procedure](05-deploy/first-slices.md). Terraform owns
publication infrastructure and D1 lifetime; Wrangler owns application code,
bindings and routes. Preparation is offline, deployment requires the reviewed
release digest, and SQL stays separately approved. The manual release workflow
only produces an artifact; it cannot deploy.

The first slice provides append-only comments/replies and retry recovery.
Editing, moderation, public multi-provider qualification, structured actions and
production retention/export/restore remain later scoped work. Session revocation
is bounded by signed-token expiry and configured membership rollout.

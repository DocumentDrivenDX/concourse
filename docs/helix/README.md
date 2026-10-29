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

## Next decisions and design work

1. Choose the first publication/audience and clarify Microsoft work/school versus
   personal-account coverage. Compare managed Access identity with any needed
   public-site sign-in experience; document logout and revocation limits.
2. Decide datastore, hosting topology, browser packaging and UI/component owner.
   Write architecture/ADRs and a module boundary map with enforceable checks.
3. Specify identity, membership, resource, discussion and integration contracts;
   settle retention, account linking, delete/export and restore behavior.
4. Allocate each story criterion to named tests, including full browser flows,
   alternate-origin denial, cross-site isolation and lost-response recovery.
5. Implement only after the affected design/test boundaries are defined.

The initial delivery proposal is protected publishing and comments in one site,
then reuse in a second site. Structured actions follow as a separate P1 slice.
Cloudflare and Azure compatibility, native action execution and production
readiness require separate evidence. No dates, budget or scale profile are set.

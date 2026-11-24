---
ddx:
  id: concourse.release.0.2.0
  type: release-notes
  activity: deploy
  authoring:
    home: repo
  links:
    - id: FEAT-007
      kind: informed_by
    - id: FEAT-008
      kind: informed_by
    - id: CONTRACT-003
      kind: informed_by
---

# Concourse 0.2.0 — feedback and discussion workspace

## Release Scope

Version 0.2.0, released November 24, 2026, adds private feedback and a dedicated
maintainer workspace to the native Cloudflare profile. The Concourse microsite
includes reviewer guidance and screenshots captured with synthetic data.

## Audience and Channels

Readers can submit private feedback beside a publication. Maintainers and
moderators can review their permitted queues. Operators can download versioned
browser assets, the Worker bundle, SQL migrations and recovery tooling from the
GitHub release. The private npm package is not registry-published.

## Highlights

- Overview shows separate feedback and discussion counts with queue drill-down.
- Search, filters, sorting and bounded pagination work across the installation.
- Feedback maintainers triage New, In review and Closed reports.
- Discussion moderators resolve or reopen threads. New replies reopen resolved threads.

## Changes and Fixes

Private feedback includes questions, problems and suggestions with publication
context. Search finds discussion text in roots or replies. Review commands retain
immutable history, reject stale versions and recover uncertain outcomes using
the same retry key.

Resolution also checks for contributions the moderator has
not seen. Original messages remain unchanged.

The public site links to the protected admin UI and explains separate reviewer
roles. Screenshots show the real application with synthetic records.

## Breaking Changes and Required Actions

Existing submission envelopes remain compatible. Operators upgrading from 0.1.x
must apply every pending migration through `0003_management.sql` before deploying
the new Worker. This includes feedback migration 0002 on comment-only installations.

Set exact verified emails in `maintainers` for feedback and independently in
`moderators` for discussion management. Both roles still require site membership.
Readers need no account change when the existing membership policy already admits them.

## Migration or Rollback Guidance

Use the [deployment procedure](first-slices.md#maintainer-workspace-rollout).
Preparation packages migrations but never applies them. Review the installation
profile, recovery point and release digest before each rollout.

Roll back application code using the prior approved Worker release while retaining
the additive schema and canonical data. Rebuild projections only through an approved
maintenance procedure. No destructive down-migration is supplied.

## Known Issues and Support

The Concourse installation has been exercised with Synaptiq Google sign-in,
live submission/reload, triage, resolution and reply reopening. That evidence
does not qualify another installation, identity provider or hosting adapter.

Batten/Databricks hosting, comment editing/hiding, notifications and UMF action
execution are not implemented. Bulk projection rebuilds require qualification
against the installation’s data size and recovery window.

## References

- [Microsite and reviewer guide](https://concourse.synaptiq.tools/guide#admin-ui)
- [Maintainer workspace contract](../02-design/contracts/CONTRACT-003-maintainer-workspace.md)
- [Build and verification allocation](../04-build/first-slices-plan.md#maintainer-workspace-verification-and-review)
- [Deployment and recovery](first-slices.md#maintainer-workspace-rollout)

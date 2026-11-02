---
ddx:
  id: concourse.release.0.1.1
  type: release-notes
  activity: deploy
  authoring:
    home: repo
  links:
    - id: CONTRACT-001
      kind: informed_by
---

# Concourse 0.1.1 — local qualification preview

## Release Scope

Corrects third-party attribution packaging in the first preview. Concourse
remains MIT OR Apache-2.0; bundled jose 6.2.14 retains Filip Skokan's MIT notice.

## Audience and Channels

GitHub prerelease assets carry the complete notice in the archive and Worker
bundle. The private npm package is not registry-published.

## Highlights

The Worker retains dependency attribution even when copied independently from
the archive. The browser manifest derives its version from package metadata.

## Changes and Fixes

The existing hosted infrastructure, runtime, workerd/D1 and Chromium gates run
before publication. The source-bound receipt hashes the notice and actual bundle.

## Breaking Changes and Required Actions

Use 0.1.1 for new downloads. Replace 0.1.0 assets with this corrected bundle and
retain the supplied license/notice files when redistributing it.

## Migration or Rollback Guidance

No runtime, SQL or infrastructure behavior changes. No migration or deployment
is performed; follow the existing separately reviewed deployment procedure.

## Known Issues and Support

The local preview's existing limits remain: live provider/production admission,
retention/restore, moderation, Batten hosting and structured actions are unqualified.

## References

- [Initial scope and qualification](release-0.1.0.md)
- [Deployment procedure](first-slices.md)

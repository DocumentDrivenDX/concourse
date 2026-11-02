---
ddx:
  id: concourse.release.0.1.0
  type: release-notes
  activity: deploy
  authoring:
    home: repo
  links:
    - id: CONTRACT-001
      kind: informed_by
---

# Concourse 0.1.0 — local qualification preview

## Release Scope

First source and asset prerelease of protected publication and inline section
comments. The owner selected `MIT OR Apache-2.0` on 2026-11-02. GitHub's source
archive and the built asset bundle carry that license choice.

## Audience and Channels

Site integrators receive browser JavaScript/CSS, a Hugo partial, Worker bundle,
SQL migrations, example deployment profile and infrastructure sources through
GitHub Releases. The private npm package is not published to a registry.

## Highlights

Signed-in readers can post comments and replies, reload discussion and recover
an interrupted write without duplication. Server identity and site scope govern
access. Generic publication protection preserves existing infrastructure ownership.

## Changes and Fixes

The local release gate passes strict TypeScript, Biome, module boundaries,
builds and 17 tests with 148 assertions. Native workerd/D1 and real Chromium
journeys pass. Hosted Linux repeats these checks before publishing the exact
built bytes; the release receipt records source, run and hashes.

## Breaking Changes and Required Actions

This is the first release. Verify SHA256SUMS, pin the source and review the
[deployment procedure](first-slices.md). Supply an explicit installation profile
and prepare/review a bound release before any authorized deployment.

## Migration or Rollback Guidance

This release does not apply SQL or infrastructure. Those operations require
separate review and authorization. Retain previous code and data independently;
application rollback does not reverse database or infrastructure changes.

## Known Issues and Support

Qualification uses synthetic signed identity and local storage/runtime evidence.
Live provider login, production Access admission, retention/export/restore,
moderation, Batten/Databricks hosting and structured action profiles remain open.
This preview does not qualify a deployed service or real private reader data.

## References

- [First-slices deployment procedure](first-slices.md)
- [Execution plan](../04-build/first-slices-plan.md)
- [Owner decisions](../00-discover/owner-input.md)

---
ddx:
  id: FEAT-004
  type: feature-specification
  activity: frame
  status: draft
  authoring:
    home: repo
  links:
    - id: concourse.prd
      kind: derived_from
---

# Feature Specification: FEAT-004 — Discussion

**Feature ID**: FEAT-004
**Priority**: P0
**Owner**: Concourse maintainers
**Covered PRD Subsystem(s)**: Discussion
**Covered PRD Requirements**: FR-5, FR-6
**Cross-Subsystem Rationale**: Single subsystem.

## Overview

Reviewers exchange durable comments and moderators manage threads in the context of a publication.

## Ideal Future State

Reviewers exchange durable comments and moderators manage threads in the context of a publication.

## Problem Statement

No shared Concourse discussion implementation exists in inspected source.

## Functional Areas

| Area | User job | Responsibility |
|---|---|---|
| Discussion | Reviewers exchange durable comments and moderators manage threads in the context of a publication. | Fulfill FR-5, FR-6 within the declared boundary. |

## Requirements

- **DISC-01** — Authorized reviewers must create threads, reply and edit their own comments under the declared history policy.
- **DISC-02** — The system must persist attributable comments, preserve unsent drafts on failure and recover uncertain writes without silent duplication.
- **DISC-03** — Authorized moderators must resolve/reopen threads and hide comments through usable controls; readers must observe the declared visibility policy.
- **DISC-04** — The system must retain moderation attribution and enforce a defined export/deletion/retention process before production data admission.

### Non-Functional Requirements

Verify all allowed/denied cases in the selected acceptance corpus without
unauthorized disclosure or effects. Apply the selected accessibility, isolation,
verification and diagnostics concerns. Traffic/latency/cost bounds remain open
until design; no numeric service-level guarantee is inferred.

## User Stories

- [US-005 — Comment and Reply](../user-stories/US-005-comment-and-reply.md)
- [US-006 — Moderate Discussion](../user-stories/US-006-moderate-discussion.md)

## Edge Cases and Error Handling

Concurrent edits must surface conflict; interrupted writes must expose recoverable uncertainty; hidden content must not leak to unauthorized readers.

## Constraints and Assumptions

History, retention and deletion semantics require owner/design decisions; UI remains unselected.

## Dependencies

- PRD: FR-5, FR-6.
- [Project concerns](../concerns.md); exact surfaces require design contracts.

## Out of Scope

Reactions, email notifications, real-time presence, social feeds and publication editing.

## Inline comment slice

DISC-05: Signed-in reviewers must open discussion beside a section of a HELIX
microsite, post a plain-text comment and reload it. Signed-out readers receive
a sign-in entry point; no discussion content is disclosed before authentication.
The first slice supports section anchors, immutable comments and replies. Own
comment editing and moderation remain later parts of the feature, not claims
of this slice. Old-revision comments must remain visibly distinct.

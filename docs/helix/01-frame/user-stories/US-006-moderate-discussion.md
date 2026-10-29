---
ddx:
  id: US-006
  type: user-stories
  activity: frame
  status: draft
  authoring:
    home: repo
  links:
    - id: FEAT-004
      kind: derived_from
    - id: concourse.prd
      kind: derived_from
---

# US-006: Moderate Discussion

**Feature**: FEAT-004 — Discussion
**Feature Requirements**: DISC-03, DISC-04
**PRD Requirements**: FR-6
**Priority**: P0

## Story

**As a** Moderator
**I want** to resolve threads and hide inappropriate comments
**So that** the discussion stays useful under the site policy.

## Context

No shared Concourse discussion implementation exists in inspected source. This journey exercises DISC-03, DISC-04. Exact interfaces and unresolved policy
choices belong in contracts/design before implementation.

## Walkthrough

1. The moderator opens the relevant publication or management surface.
2. They authenticate where required and select the permitted site/resource.
3. They resolve threads and hide inappropriate comments.
4. The service enforces the applicable policy and presents the observable result.

## Acceptance Criteria

- [ ] **US-006-AC1** — Given a moderator assigned to a site and open thread, when they resolve and later reopen it, then readers see the resulting thread state.
- [ ] **US-006-AC2** — Given a moderator hides a comment, when an ordinary reader requests it through any supported read surface, then hidden content is withheld according to the declared policy.
- [ ] **US-006-AC3** — Given an ordinary commenter, when they attempt a moderator operation directly, then the service denies it without changing discussion state.
- [ ] **US-006-AC4** — Given a site with retained discussion and an authorized owner, when the defined export/deletion process is exercised, then its result follows the declared retention and history policy.

- [ ] **US-006-AC5** — Given a reviewer or operator using the thread resolution/reopening and comment hiding controls, when they complete the journey with a keyboard and inspect its status with assistive technology, then controls have usable names, visible focus and understandable outcome feedback.

## Edge Cases

Revocation during moderation follows the same declared authorization consistency bound.

## Test Scenarios

| Scenario | AC ID | Input / State | Action | Expected Result |
|---|---|---|---|---|
| Scenario 1 | US-006-AC1 | Moderator Mira; Site A thread T | Resolve then reopen | State changes are visible and attributable |
| Scenario 2 | US-006-AC2 | Hidden comment C | Read thread and direct comment | No hidden text leaks outside policy |
| Scenario 3 | US-006-AC3 | Commenter Sol | Hide another person comment | No state change |
| Scenario 4 | US-006-AC4 | Site A discussion data | Export or request deletion under policy | Site-scoped result with policy-required retained/deleted content |
| Accessible core journey | US-006-AC5 | Keyboard and assistive technology | Complete thread resolution/reopening and comment hiding | Named controls, visible focus and announced outcomes |

These are planned scenarios, not test execution evidence. The story test plan
must allocate each criterion to a named exercising test. Test source must cite
`@covers US-006-ACn` with the actual criterion number.

## Dependencies

- Feature: [FEAT-004](../features/FEAT-004-discussion.md).
- Feature requirements: DISC-03, DISC-04; PRD: FR-6.
- US-003, US-005; owner retention/export/deletion policy; moderation UI design.

## Out of Scope

Reactions, email notifications, real-time presence, social feeds and publication editing.

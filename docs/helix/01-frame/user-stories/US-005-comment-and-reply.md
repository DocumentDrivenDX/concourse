---
ddx:
  id: US-005
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

# US-005: Comment and Reply

**Feature**: FEAT-004 — Discussion
**Feature Requirements**: DISC-01, DISC-02
**PRD Requirements**: FR-5
**Priority**: P0

## Story

**As a** Reader or Reviewer
**I want** to discuss a published resource
**So that** review feedback remains durable and attributable.

## Context

No shared Concourse discussion implementation exists in inspected source. This journey exercises DISC-01, DISC-02. Exact interfaces and unresolved policy
choices belong in contracts/design before implementation.

## Walkthrough

1. The reader or reviewer opens the relevant publication or management surface.
2. They authenticate where required and select the permitted site/resource.
3. They discuss a published resource.
4. The service enforces the applicable policy and presents the observable result.

## Acceptance Criteria

- [ ] **US-005-AC1** — Given an authorized reviewer and resource, when they post a thread and another authorized reviewer replies, then both comments persist with verified authors after reload.
- [ ] **US-005-AC2** — Given an existing comment owned by a reviewer, when they edit it, then the declared history policy preserves the required prior-content attribution.
- [ ] **US-005-AC3** — Given a failed submission, when the service rejects or cannot complete it, then the reviewer retains their draft and sees the failure.
- [ ] **US-005-AC4** — Given a committed comment whose response was lost, when the reviewer recovers its outcome, then the result identifies the original contribution without silently creating another.

- [ ] **US-005-AC5** — Given a reviewer or operator using the comment creation, replies and editing controls, when they complete the journey with a keyboard and inspect its status with assistive technology, then controls have usable names, visible focus and understandable outcome feedback.

## Edge Cases

Concurrent edits surface conflict rather than silently overwriting another change.

## Test Scenarios

| Scenario | AC ID | Input / State | Action | Expected Result |
|---|---|---|---|---|
| Scenario 1 | US-005-AC1 | Reviewers Mira and Sol; resource R | Post then reply and reload | One thread with two attributable comments |
| Scenario 2 | US-005-AC2 | Mira owns comment C | Edit and reload | Edited comment with policy-required history |
| Scenario 3 | US-005-AC3 | Draft text: clarify nullability | Submit during failure | Draft retained; no false success |
| Scenario 4 | US-005-AC4 | One committed write; response interrupted | Recover outcome | Original comment or explicit unresolved state; no blind duplicate |
| Accessible core journey | US-005-AC5 | Keyboard and assistive technology | Complete comment creation, replies and editing | Named controls, visible focus and announced outcomes |

These are planned scenarios, not test execution evidence. The story test plan
must allocate each criterion to a named exercising test. Test source must cite
`@covers US-005-ACn` with the actual criterion number.

## Dependencies

- Feature: [FEAT-004](../features/FEAT-004-discussion.md).
- Feature requirements: DISC-01, DISC-02; PRD: FR-5.
- US-003, US-004; discussion/history/outcome contracts; native persistence design.

## Out of Scope

Reactions, email notifications, real-time presence, social feeds and publication editing.

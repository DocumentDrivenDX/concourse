---
ddx:
  id: US-004
  type: user-stories
  activity: frame
  status: draft
  authoring:
    home: repo
  links:
    - id: FEAT-003
      kind: derived_from
    - id: concourse.prd
      kind: derived_from
---

# US-004: Follow Discussion Context

**Feature**: FEAT-003 — Resource Identity
**Feature Requirements**: RES-01, RES-02, RES-03
**PRD Requirements**: FR-4
**Priority**: P0

## Story

**As a** Reader or Reviewer
**I want** to find discussion after a page moves or changes
**So that** I can interpret comments against the content originally reviewed.

## Context

URL-only threads can lose context after navigation or revision changes. This journey exercises RES-01, RES-02, RES-03. Exact interfaces and unresolved policy
choices belong in contracts/design before implementation.

## Walkthrough

1. The reader or reviewer opens the relevant publication or management surface.
2. They authenticate where required and select the permitted site/resource.
3. They find discussion after a page moves or changes.
4. The service enforces the applicable policy and presents the observable result.

## Acceptance Criteria

- [ ] **US-004-AC1** — Given a resource with a thread, when its page URL changes while its identity remains, then the intended discussion remains associated with it.
- [ ] **US-004-AC2** — Given a revision-specific comment, when a new revision removes its anchor, then the old revision context and unresolved anchor are visible.
- [ ] **US-004-AC3** — Given similarly named resources in different sites, when a reviewer opens one, then the other site discussion is not substituted.

- [ ] **US-004-AC4** — Given a reviewer or operator using the revision/context navigation controls, when they complete the journey with a keyboard and inspect its status with assistive technology, then controls have usable names, visible focus and understandable outcome feedback.

## Edge Cases

Deleted resources retain contextual history according to the selected retention policy.

## Test Scenarios

| Scenario | AC ID | Input / State | Action | Expected Result |
|---|---|---|---|---|
| Scenario 1 | US-004-AC1 | Resource R at /old moves to /new | Open /new | Existing R thread is available to authorized reader |
| Scenario 2 | US-004-AC2 | R revision 1 anchor removed in revision 2 | Read thread from revision 2 | Original context retained; no silent reattachment |
| Scenario 3 | US-004-AC3 | Site A R and Site B R | Read Site A R discussion | Only the selected authorized resource discussion |
| Accessible core journey | US-004-AC4 | Keyboard and assistive technology | Complete revision/context navigation | Named controls, visible focus and announced outcomes |

These are planned scenarios, not test execution evidence. The story test plan
must allocate each criterion to a named exercising test. Test source must cite
`@covers US-004-ACn` with the actual criterion number.

## Dependencies

- Feature: [FEAT-003](../features/FEAT-003-resource-identity.md).
- Feature requirements: RES-01, RES-02, RES-03; PRD: FR-4.
- US-003; resource/revision identity contract.

## Out of Scope

Automatic semantic rebasing, full text-range annotation or modifying signed publications.

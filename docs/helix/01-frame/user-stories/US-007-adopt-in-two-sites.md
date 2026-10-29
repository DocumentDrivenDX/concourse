---
ddx:
  id: US-007
  type: user-stories
  activity: frame
  status: draft
  authoring:
    home: repo
  links:
    - id: FEAT-005
      kind: derived_from
    - id: concourse.prd
      kind: derived_from
---

# US-007: Adopt Concourse in Two Sites

**Feature**: FEAT-005 — Site Adoption
**Feature Requirements**: EMB-01, EMB-02, EMB-03
**PRD Requirements**: FR-7
**Priority**: P0

## Story

**As a** Publication Owner
**I want** to enable the same component in a second publication
**So that** I can reuse collaboration without maintaining a separate implementation.

## Context

One-site implementation cannot establish reusable multi-site integration. This journey exercises EMB-01, EMB-02, EMB-03. Exact interfaces and unresolved policy
choices belong in contracts/design before implementation.

## Walkthrough

1. The publication owner opens the relevant publication or management surface.
2. They authenticate where required and select the permitted site/resource.
3. They enable the same component in a second publication.
4. The service enforces the applicable policy and presents the observable result.

## Acceptance Criteria

- [ ] **US-007-AC1** — Given two independently built sites, when owners configure the same released integration for both, then authorized reviewers can complete the core discussion flow in each without a code fork.
- [ ] **US-007-AC2** — Given the embedded controls, when a keyboard user encounters loading, empty, validation, denial, conflict, failure and success, then focus and status feedback keep each outcome understandable.
- [ ] **US-007-AC3** — Given a signed publication with host navigation and styles, when discussion loads and changes, then signed content bytes and host routing/style behavior remain intact.

## Edge Cases

Blocked service calls must expose failure while respecting public/private publication policy.

## Test Scenarios

| Scenario | AC ID | Input / State | Action | Expected Result |
|---|---|---|---|---|
| Scenario 1 | US-007-AC1 | Site A static build and Site B independent build | Configure and comment in each | Reusable component works with distinct site context |
| Scenario 2 | US-007-AC2 | Core form in each required state | Navigate with keyboard | Usable controls and accessible outcome feedback |
| Scenario 3 | US-007-AC3 | Signed resource R | Load, comment and navigate | Signature input unchanged; host behavior preserved |

These are planned scenarios, not test execution evidence. The story test plan
must allocate each criterion to a named exercising test. Test source must cite
`@covers US-007-ACn` with the actual criterion number.

## Dependencies

- Feature: [FEAT-005](../features/FEAT-005-site-adoption.md).
- Feature requirements: EMB-01, EMB-02, EMB-03; PRD: FR-7.
- US-001 through US-006; package/embed contract and UI/component selection.

## Out of Scope

Replacing site generators, building a general CMS or claiming framework compatibility without tests.

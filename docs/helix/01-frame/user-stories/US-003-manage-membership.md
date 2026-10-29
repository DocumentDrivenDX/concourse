---
ddx:
  id: US-003
  type: user-stories
  activity: frame
  status: draft
  authoring:
    home: repo
  links:
    - id: FEAT-002
      kind: derived_from
    - id: concourse.prd
      kind: derived_from
---

# US-003: Control Site Membership

**Feature**: FEAT-002 — Identity and Membership
**Feature Requirements**: ID-03, ID-04
**PRD Requirements**: FR-3
**Priority**: P0

## Story

**As a** Publication Owner
**I want** to grant and revoke site permissions
**So that** readers can participate only within their authorized scope.

## Context

Playbooks configures Google Workspace; three-provider behavior and Concourse memberships remain unqualified. This journey exercises ID-03, ID-04. Exact interfaces and unresolved policy
choices belong in contracts/design before implementation.

## Walkthrough

1. The publication owner opens the relevant publication or management surface.
2. They authenticate where required and select the permitted site/resource.
3. They grant and revoke site permissions.
4. The service enforces the applicable policy and presents the observable result.

## Acceptance Criteria

- [ ] **US-003-AC1** — Given a site member with read-only permission, when they submit a comment, then the server denies the change.
- [ ] **US-003-AC2** — Given a reviewer admitted only to Site A, when they address Site B through a forged site/resource selection, then Site B content and mutations remain inaccessible.
- [ ] **US-003-AC3** — Given an owner changes a member from reader to commenter, when that member comments after the permission takes effect, then the server accepts the permitted contribution.
- [ ] **US-003-AC4** — Given a revoked membership, when the former member acts after the declared revocation bound, then protected reads and writes are denied.

- [ ] **US-003-AC5** — Given a reviewer or operator using the membership management controls, when they complete the journey with a keyboard and inspect its status with assistive technology, then controls have usable names, visible focus and understandable outcome feedback.

## Edge Cases

Forged moderator/author fields must not escalate authority.

## Test Scenarios

| Scenario | AC ID | Input / State | Action | Expected Result |
|---|---|---|---|---|
| Scenario 1 | US-003-AC1 | Read-only member at Site A | Submit comment directly | No comment committed |
| Scenario 2 | US-003-AC2 | Site A reviewer, Site B thread | Read and mutate directly | No Site B disclosure or change |
| Scenario 3 | US-003-AC3 | Read-only member granted comment permission | Return and comment | Attributed comment persists |
| Scenario 4 | US-003-AC4 | Revoked Site A member | Read and mutate after bound | No disclosure or committed change |
| Accessible core journey | US-003-AC5 | Keyboard and assistive technology | Complete membership management | Named controls, visible focus and announced outcomes |

These are planned scenarios, not test execution evidence. The story test plan
must allocate each criterion to a named exercising test. Test source must cite
`@covers US-003-ACn` with the actual criterion number.

## Dependencies

- Feature: [FEAT-002](../features/FEAT-002-identity-membership.md).
- Feature requirements: ID-03, ID-04; PRD: FR-3.
- US-002; membership/revocation contract and operator workflow design.

## Out of Scope

Building an identity provider, password accounts, or managing the upstream provider directory.

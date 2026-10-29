---
ddx:
  id: US-008
  type: user-stories
  activity: frame
  status: draft
  authoring:
    home: repo
  links:
    - id: FEAT-006
      kind: derived_from
    - id: concourse.prd
      kind: derived_from
---

# US-008: Perform a Structured Action

**Feature**: FEAT-006 — Structured Actions
**Feature Requirements**: ACT-01, ACT-02, ACT-03
**PRD Requirements**: FR-8
**Priority**: P1

## Story

**As a** Reader or Reviewer
**I want** to complete one supported structured operation
**So that** my participation can produce an authorized attributable result beyond comments.

## Context

Portable action declarations do not prove a new serverless executor can satisfy native obligations. This journey exercises ACT-01, ACT-02, ACT-03. Exact interfaces and unresolved policy
choices belong in contracts/design before implementation.

## Walkthrough

1. The reader or reviewer opens the relevant publication or management surface.
2. They authenticate where required and select the permitted site/resource.
3. They complete one supported structured operation.
4. The service enforces the applicable policy and presents the observable result.

## Acceptance Criteria

- [ ] **US-008-AC1** — Given an admitted reviewer and qualified action profile, when they invoke its supported operation, then the host returns the declared attributable outcome.
- [ ] **US-008-AC2** — Given changed permission or failed preconditions, when an action is submitted, then the host rejects it before committing its business effects.
- [ ] **US-008-AC3** — Given a relevant unknown obligation or unsupported backend profile, when invocation is assessed, then execution is refused while original metadata is retained.
- [ ] **US-008-AC4** — Given a lost action response, when outcome recovery runs, then the selected profile replay semantics are preserved without automatic fresh execution.

- [ ] **US-008-AC5** — Given a reviewer or operator using the structured-action input and outcome controls, when they complete the journey with a keyboard and inspect its status with assistive technology, then controls have usable names, visible focus and understandable outcome feedback.

## Edge Cases

An action declaration or browser capability claim never grants execution authority.

## Test Scenarios

| Scenario | AC ID | Input / State | Action | Expected Result |
|---|---|---|---|---|
| Scenario 1 | US-008-AC1 | One selected action with valid inputs | Invoke through UI | Qualified outcome under selected contract |
| Scenario 2 | US-008-AC2 | Revoked permission or failing state guard | Invoke | No business effects committed |
| Scenario 3 | US-008-AC3 | Declaration with unsupported obligation | Attempt action | No execution or silent semantic loss |
| Scenario 4 | US-008-AC4 | Qualified action; interrupted response | Recover retained outcome | Original outcome or explicit uncertainty |
| Accessible core journey | US-008-AC5 | Keyboard and assistive technology | Complete structured-action input and outcome | Named controls, visible focus and announced outcomes |

These are planned scenarios, not test execution evidence. The story test plan
must allocate each criterion to a named exercising test. Test source must cite
`@covers US-008-ACn` with the actual criterion number.

## Dependencies

- Feature: [FEAT-006](../features/FEAT-006-structured-actions.md).
- Feature requirements: ACT-01, ACT-02, ACT-03; PRD: FR-8.
- US-002, US-003, US-004, US-007; exact UMF/action/backend contracts and native qualification.

## Out of Scope

Universal action execution, arbitrary code loading and cross-store atomicity.

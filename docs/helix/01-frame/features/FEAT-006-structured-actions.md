---
ddx:
  id: FEAT-006
  type: feature-specification
  activity: frame
  status: draft
  authoring:
    home: repo
  links:
    - id: concourse.prd
      kind: derived_from
---

# Feature Specification: FEAT-006 — Structured Actions

**Feature ID**: FEAT-006
**Priority**: P1
**Owner**: Concourse maintainers
**Covered PRD Subsystem(s)**: Structured Actions
**Covered PRD Requirements**: FR-8
**Cross-Subsystem Rationale**: Single subsystem.

## Overview

A reviewer completes one supported structured operation from a declared UMF action with an attributable result.

## Ideal Future State

A reviewer completes one supported structured operation from a declared UMF action with an attributable result.

## Problem Statement

Portable action declarations do not prove a new serverless executor can satisfy native obligations.

## Functional Areas

| Area | User job | Responsibility |
|---|---|---|
| Structured Actions | A reviewer completes one supported structured operation from a declared UMF action with an attributable result. | Fulfill FR-8 within the declared boundary. |

## Requirements

- **ACT-01** — The system must discover and invoke one explicitly supported UMF action subset through a qualified host.
- **ACT-02** — The host must recheck current authorization and preconditions and preserve declared outcomes and replay semantics.
- **ACT-03** — The host must refuse relevant unknown obligations, unsupported profiles and execution from untrusted metadata.

### Non-Functional Requirements

Verify all allowed/denied cases in the selected acceptance corpus without
unauthorized disclosure or effects. Apply the selected accessibility, isolation,
verification and diagnostics concerns. Traffic/latency/cost bounds remain open
until design; no numeric service-level guarantee is inferred.

## User Stories

- [US-008 — Perform a Structured Action](../user-stories/US-008-perform-structured-action.md)

## Edge Cases and Error Handling

Lost responses, stale revisions and changed permissions must follow the selected action profile without automatic uncertain-write replay.

## Constraints and Assumptions

Exact action, backend, UMF version/subset and native evidence remain design prerequisites.

## Dependencies

- PRD: FR-8.
- [Project concerns](../concerns.md); exact surfaces require design contracts.

## Out of Scope

Universal action execution, arbitrary code loading and cross-store atomicity.

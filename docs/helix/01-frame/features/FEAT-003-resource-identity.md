---
ddx:
  id: FEAT-003
  type: feature-specification
  activity: frame
  status: draft
  authoring:
    home: repo
  links:
    - id: concourse.prd
      kind: derived_from
---

# Feature Specification: FEAT-003 — Resource Identity

**Feature ID**: FEAT-003
**Priority**: P0
**Owner**: Concourse maintainers
**Covered PRD Subsystem(s)**: Resource Identity
**Covered PRD Requirements**: FR-4
**Cross-Subsystem Rationale**: Single subsystem.

## Overview

Reviewers can tell which resource, revision and element a discussion concerns after content moves or evolves.

## Ideal Future State

Reviewers can tell which resource, revision and element a discussion concerns after content moves or evolves.

## Problem Statement

URL-only threads can lose context after navigation or revision changes.

## Functional Areas

| Area | User job | Responsibility |
|---|---|---|
| Resource Identity | Reviewers can tell which resource, revision and element a discussion concerns after content moves or evolves. | Fulfill FR-4 within the declared boundary. |

## Requirements

- **RES-01** — The system must retain stable site/resource identity independently of display URL.
- **RES-02** — The system must preserve revision-specific context and visibly flag missing/changed anchors without silently transferring meaning.
- **RES-03** — The system must keep similarly named resources in different sites distinct.

### Non-Functional Requirements

Verify all allowed/denied cases in the selected acceptance corpus without
unauthorized disclosure or effects. Apply the selected accessibility, isolation,
verification and diagnostics concerns. Traffic/latency/cost bounds remain open
until design; no numeric service-level guarantee is inferred.

## User Stories

- [US-004 — Follow Discussion Context](../user-stories/US-004-follow-resource-context.md)

## Edge Cases and Error Handling

Deleted resources or missing anchors must retain understandable historical context according to retention policy.

## Constraints and Assumptions

Resource registration, revision identifiers and anchor mapping need a contract before implementation.

## Dependencies

- PRD: FR-4.
- [Project concerns](../concerns.md); exact surfaces require design contracts.

## Out of Scope

Automatic semantic rebasing, full text-range annotation or modifying signed publications.

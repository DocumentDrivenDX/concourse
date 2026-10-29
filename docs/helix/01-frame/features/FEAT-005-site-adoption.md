---
ddx:
  id: FEAT-005
  type: feature-specification
  activity: frame
  status: draft
  authoring:
    home: repo
  links:
    - id: concourse.prd
      kind: derived_from
---

# Feature Specification: FEAT-005 — Site Adoption

**Feature ID**: FEAT-005
**Priority**: P0
**Owner**: Concourse maintainers
**Covered PRD Subsystem(s)**: Site Adoption
**Covered PRD Requirements**: FR-7
**Cross-Subsystem Rationale**: Single subsystem.

## Overview

A second publication uses the same collaboration component without a fork of identity or discussion code.

## Ideal Future State

A second publication uses the same collaboration component without a fork of identity or discussion code.

## Problem Statement

One-site implementation cannot establish reusable multi-site integration.

## Functional Areas

| Area | User job | Responsibility |
|---|---|---|
| Site Adoption | A second publication uses the same collaboration component without a fork of identity or discussion code. | Fulfill FR-7 within the declared boundary. |

## Requirements

- **EMB-01** — The system must support two independently built sites through the same versioned integration and declared resource/site configuration.
- **EMB-02** — The component must expose loading, empty, denial, validation, conflict, failure and success states with usable keyboard/focus behavior.
- **EMB-03** — The integration must preserve signed publication bytes and host navigation/style behavior; browser configuration must not grant permissions.

### Non-Functional Requirements

Verify all allowed/denied cases in the selected acceptance corpus without
unauthorized disclosure or effects. Apply the selected accessibility, isolation,
verification and diagnostics concerns. Traffic/latency/cost bounds remain open
until design; no numeric service-level guarantee is inferred.

## User Stories

- [US-007 — Adopt Concourse in Two Sites](../user-stories/US-007-adopt-in-two-sites.md)

## Edge Cases and Error Handling

Expired sessions, navigation changes and blocked service requests must leave the publication readable when its policy allows it.

## Constraints and Assumptions

Package naming, framework, transport and same-origin versus cross-origin design remain open.

## Dependencies

- PRD: FR-7.
- [Project concerns](../concerns.md); exact surfaces require design contracts.

## Out of Scope

Replacing site generators, building a general CMS or claiming framework compatibility without tests.

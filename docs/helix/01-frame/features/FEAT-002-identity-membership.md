---
ddx:
  id: FEAT-002
  type: feature-specification
  activity: frame
  status: draft
  authoring:
    home: repo
  links:
    - id: concourse.prd
      kind: derived_from
---

# Feature Specification: FEAT-002 — Identity and Membership

**Feature ID**: FEAT-002
**Priority**: P0
**Owner**: Concourse maintainers
**Covered PRD Subsystem(s)**: Identity and Membership
**Covered PRD Requirements**: FR-2, FR-3
**Cross-Subsystem Rationale**: Single subsystem.

## Overview

Readers use an enabled provider and owners control site permissions without confusing successful login with membership.

## Ideal Future State

Readers use an enabled provider and owners control site permissions without confusing successful login with membership.

## Problem Statement

Playbooks configures Google Workspace; three-provider behavior and Concourse memberships remain unqualified.

## Functional Areas

| Area | User job | Responsibility |
|---|---|---|
| Identity and Membership | Readers use an enabled provider and owners control site permissions without confusing successful login with membership. | Fulfill FR-2, FR-3 within the declared boundary. |

## Requirements

- **ID-01** — The system must support enabled Microsoft, Google and GitHub profiles and establish author identity only from verified credentials.
- **ID-02** — The system must keep distinct provider subjects separate unless an explicit verified linking process joins them; email alone must not merge accounts.
- **ID-03** — The system must enforce site read/comment/moderation permissions on every server operation and reject client-supplied privilege claims.
- **ID-04** — The system must enforce documented expiry, logout and revocation semantics; permission decisions must satisfy the selected revocation bound.

### Non-Functional Requirements

Verify all allowed/denied cases in the selected acceptance corpus without
unauthorized disclosure or effects. Apply the selected accessibility, isolation,
verification and diagnostics concerns. Traffic/latency/cost bounds remain open
until design; no numeric service-level guarantee is inferred.

## User Stories

- [US-002 — Sign In and Retain Attribution](../user-stories/US-002-sign-in.md)
- [US-003 — Control Site Membership](../user-stories/US-003-manage-membership.md)

## Edge Cases and Error Handling

Provider failure must not fall back to anonymous privilege; stale sessions and same-email identities require explicit handling.

## Constraints and Assumptions

Microsoft account types and revocation timing require owner/design decisions before qualification.

## Dependencies

- PRD: FR-2, FR-3.
- [Project concerns](../concerns.md); exact surfaces require design contracts.

## Out of Scope

Building an identity provider, password accounts, or managing the upstream provider directory.

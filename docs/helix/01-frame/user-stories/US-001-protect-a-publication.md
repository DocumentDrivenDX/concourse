---
ddx:
  id: US-001
  type: user-stories
  activity: frame
  status: draft
  authoring:
    home: repo
  links:
    - id: FEAT-001
      kind: derived_from
    - id: concourse.prd
      kind: derived_from
---

# US-001: Protect a Publication

**Feature**: FEAT-001 — Protected Publishing
**Feature Requirements**: PUB-01, PUB-02, PUB-03
**PRD Requirements**: FR-1
**Priority**: P0

## Story

**As a** Publication Owner
**I want** to protect a private publication and preview
**So that** only admitted readers receive its contents.

## Context

Playbooks has a source-configured pattern; UMF currently publishes public static assets. This journey exercises PUB-01, PUB-02, PUB-03. Exact interfaces and unresolved policy
choices belong in contracts/design before implementation.

## Walkthrough

1. The publication owner opens the relevant publication or management surface.
2. They authenticate where required and select the permitted site/resource.
3. They protect a private publication and preview.
4. The service enforces the applicable policy and presents the observable result.

## Acceptance Criteria

- [ ] **US-001-AC1** — Given a signed-out visitor and a private reference page, when they open its custom URL, then no protected content is delivered.
- [ ] **US-001-AC2** — Given a protected site with origin/preview hosts and downloads, when a signed-out visitor requests each route, then no protected content is delivered.
- [ ] **US-001-AC3** — Given internal-only source content, when the public publication is built, then neither its pages nor associated indexes/assets disclose that content.
- [ ] **US-001-AC4** — Given missing or invalid private-site policy, when a visitor requests protected content, then access is denied.

## Edge Cases

An unknown hostname must not become an unguarded private-content origin.

## Test Scenarios

| Scenario | AC ID | Input / State | Action | Expected Result |
|---|---|---|---|---|
| Scenario 1 | US-001-AC1 | Private reference page | Open without a session | Admission challenge or denial, no page bytes |
| Scenario 2 | US-001-AC2 | Index, JSON and download on all hosts | Request directly, including warm caches | No protected bytes |
| Scenario 3 | US-001-AC3 | Internal-only schema guide | Build public output | Private guide absent from output |
| Scenario 4 | US-001-AC4 | Private site without valid policy | Open page | No protected bytes |

These are planned scenarios, not test execution evidence. The story test plan
must allocate each criterion to a named exercising test. Test source must cite
`@covers US-001-ACn` with the actual criterion number.

## Dependencies

- Feature: [FEAT-001](../features/FEAT-001-protected-publishing.md).
- Feature requirements: PUB-01, PUB-02, PUB-03; PRD: FR-1.
- Identity design and deployment inventory; existing infrastructure approval before changes.

## Out of Scope

Provider account linking, discussion mutations and editing publication content.

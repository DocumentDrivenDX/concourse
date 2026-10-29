---
ddx:
  id: US-002
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

# US-002: Sign In and Retain Attribution

**Feature**: FEAT-002 — Identity and Membership
**Feature Requirements**: ID-01, ID-02, ID-04
**PRD Requirements**: FR-2
**Priority**: P0

## Story

**As a** Reader or Reviewer
**I want** to sign in with an enabled provider
**So that** my discussion contributions carry the correct identity.

## Context

Playbooks configures Google Workspace; three-provider behavior and Concourse memberships remain unqualified. This journey exercises ID-01, ID-02, ID-04. Exact interfaces and unresolved policy
choices belong in contracts/design before implementation.

## Walkthrough

1. The reader or reviewer opens the relevant publication or management surface.
2. They authenticate where required and select the permitted site/resource.
3. They sign in with an enabled provider.
4. The service enforces the applicable policy and presents the observable result.

## Acceptance Criteria

- [ ] **US-002-AC1** — Given enabled Microsoft, Google and GitHub account profiles, when a reader signs in with each, then their verified account can reach its admitted site.
- [ ] **US-002-AC2** — Given two unlinked provider subjects with the same email, when both sign in, then they remain distinct accounts.
- [ ] **US-002-AC3** — Given an expired or invalid credential, when a reader requests authenticated discussion, then it supplies no authenticated privilege.
- [ ] **US-002-AC4** — Given an active session, when the reader logs out and reuses that session, then authenticated access follows the declared logout invalidation guarantee.

- [ ] **US-002-AC5** — Given a reviewer or operator using the provider selection and sign-out controls, when they complete the journey with a keyboard and inspect its status with assistive technology, then controls have usable names, visible focus and understandable outcome feedback.

## Edge Cases

Provider outage must show failure without creating a new privileged account.

## Test Scenarios

| Scenario | AC ID | Input / State | Action | Expected Result |
|---|---|---|---|---|
| Scenario 1 | US-002-AC1 | One test account per enabled provider | Complete real sign-in | Verified account and permitted site access |
| Scenario 2 | US-002-AC2 | Google subject A and GitHub subject B | Sign in separately | No implicit merge or privilege transfer |
| Scenario 3 | US-002-AC3 | Expired or wrong-audience identity | Request private discussion | Denied without disclosure |
| Scenario 4 | US-002-AC4 | Signed-in reviewer | Logout then reuse old session | No access outside the selected documented guarantee |
| Accessible core journey | US-002-AC5 | Keyboard and assistive technology | Complete provider selection and sign-out | Named controls, visible focus and announced outcomes |

These are planned scenarios, not test execution evidence. The story test plan
must allocate each criterion to a named exercising test. Test source must cite
`@covers US-002-ACn` with the actual criterion number.

## Dependencies

- Feature: [FEAT-002](../features/FEAT-002-identity-membership.md).
- Feature requirements: ID-01, ID-02, ID-04; PRD: FR-2.
- Provider test accounts, identity contract and documented account/session profile.

## Out of Scope

Building an identity provider, password accounts, or managing the upstream provider directory.

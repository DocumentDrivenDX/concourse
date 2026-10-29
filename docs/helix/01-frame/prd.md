---
ddx:
  id: concourse.prd
  type: prd
  activity: frame
  status: draft
  authoring:
    home: repo
  links:
    - id: concourse.vision
      kind: informed_by
kind: product
---

# Concourse Product Requirements

## Summary

Concourse gives Novirhyza publication owners reusable protected access and
contextual discussion across static sites. Readers authenticate through enabled
Microsoft, Google or GitHub providers; site permissions govern what they can read
and change. Comments attach to stable resources and identifiable revisions.

Reuse the Entropy Exchange protected-publication precedent. Concourse owns
collaboration runtime and UI; UMF owns portable schemas/action declarations;
publication repositories own content; existing infrastructure owns shared hosting
and access resources. This split is a framing assumption to confirm in design.

## Problem and Goals

### Problem

The owner identified repeated access and interaction needs across UMF microsites.
Playbooks provides source-configured protected publishing, but the inspected
implementation does not supply shared resource-aware discussion. Per-site
solutions risk independent accounts, inconsistent permissions and lost context.
The frequency and cost of this duplication have not been measured.

### Goals

1. Let owners protect static publications without writing provider login per site.
2. Let authorized readers discuss content with stable attribution and context.
3. Reuse one integration across multiple sites while enforcing site isolation.
4. Preserve a path to qualified structured actions using UMF declarations.

### Success Metrics

| Metric | Target | Measurement Method |
|---|---|---|
| Site integration effort | Hypothesis: second integration needs less site-specific code | Compare integration diffs and operator steps |
| Discussion context | Reviewers identify the intended resource/revision | Sample review tasks; baseline unmeasured |
| Participation utility | Hypothesis: reviewers can complete discussion tasks in context | Observe reviewer/moderator sessions |

### Non-Goals

A new identity provider or password-management product; replacing static-site
generators; executing arbitrary declared code; qualifying every UMF action
profile; running both clouds at launch; a general social network; implementing
storage/graph engines; production infrastructure changes in this planning phase.

## Users and Scope

### Primary Persona: Publication Owner

Maintains a UMF or related Novirhyza site. Wants to choose its audience and add
participation without maintaining separate authentication/discussion code.

### Secondary Persona: Reader or Reviewer

Reads allowed publications and adds contextual comments. Wants clear identity,
permission feedback and visibility into which revision a discussion concerns.

### Secondary Persona: Moderator

Maintains discussion quality for assigned sites. Needs attributable moderation
and a visible distinction between discussion state and publication content.

These personas derive from owner direction; external interviews have not run.

## Requirements

### Must Have (P0)

FR-1 through FR-7 define the protected-discussion release scope. An initial
vertical proof may use one provider; completion of FR-2 requires separate real
provider journeys for Microsoft, Google and GitHub within the selected profile.

### Should Have (P1)

FR-8 adds one independently qualified structured interaction after the protected
comments path. It is not a prerequisite for demonstrating the first comment.

### Nice to Have (P2)

Notifications, reactions, text-range annotations and real-time presence are
candidates only; no P2 functional requirement is selected.

## Functional Requirements

### Subsystem: Protected Publishing

- **FR-1 (P0)** — Owners must protect selected static content before delivery,
  covering HTML, data, search indexes, downloads, alternate origins and preview
  hosts. Public and protected build outputs must prevent internal-only content
  leaking through public output. Invalid or unavailable policy must deny access.

### Subsystem: Identity and Membership

- **FR-2 (P0)** — Readers must sign in through enabled Microsoft, Google and
  GitHub providers within an explicitly selected account-type profile. Establish
  stable attribution from verified identity; never merge accounts solely by
  matching email. Expiry/logout must prevent further authenticated use under the
  documented session semantics.
- **FR-3 (P0)** — Owners must assign site membership and distinguish reading,
  commenting and moderation permissions. Server decisions must scope reads and
  writes to the current principal/resource and enforce the declared revocation
  bound. Client-provided roles, authors and site identifiers confer no authority.

### Subsystem: Resource Identity

- **FR-4 (P0)** — Discussion must identify a stable site/resource and distinguish
  revision-specific context. Page moves must preserve intended discussion
  identity; revisions and missing anchors must remain visible without silently
  reattaching comments to changed meaning.

### Subsystem: Discussion

- **FR-5 (P0)** — Authorized reviewers must create threads, reply, read persisted
  comments and edit their own comments under a declared history policy. Failed
  requests must preserve the draft; an uncertain write must support outcome
  recovery without silently duplicating the comment or assuming it failed.
- **FR-6 (P0)** — Authorized moderators must resolve/reopen threads and hide
  inappropriate comments through usable UI. Moderation must be attributable,
  preserve declared history and respect reader visibility. Site owners must have
  a defined export/deletion/retention process before production data admission.

### Subsystem: Site Adoption

- **FR-7 (P0)** — Owners must integrate the same collaboration component into two
  independently built sites using declared configuration and resource identity,
  without a fork of authentication/discussion code. UI must expose loading,
  denial, empty, validation, conflict and failure states while preserving signed
  publication bytes and host-page routing/style behavior.

### Subsystem: Structured Actions

- **FR-8 (P1)** — A reviewer must discover and invoke one supported structured
  action described through UMF. The host must recheck authorization and
  preconditions, preserve declared input/output and replay meaning, and refuse
  relevant unknown or unqualified obligations. Metadata never grants authority.

## Acceptance Test Sketches

| Requirement | Scenario | Input | Expected Output |
|---|---|---|---|
| FR-1 | Direct protected asset/alias request | Signed-out reader, internal search index and preview URL | No protected bytes; public build contains no internal content |
| FR-2 | Provider identity and expiry | Each of three enabled providers, plus same-email distinct subjects | Verified attribution; no email-only merge; expired session denied |
| FR-3 | Forged cross-site operation | Site A reviewer targets Site B comment | Denied without Site B disclosure; revocation follows declared bound |
| FR-4 | Page move and revision | Moved resource and new revision missing an anchor | Thread remains identifiable; old context is explicit |
| FR-5 | Lost response after save | One accepted comment, interrupted response, recovery attempt | One durable comment or explicit unresolved outcome; draft retained |
| FR-6 | Moderate then inspect | Assigned moderator hides a comment and resolves/reopens its thread | Visibility follows policy; actor/history retained |
| FR-7 | Second independent publication | Same component, separate site and configuration | Core reviewer flow works in both without code fork |

## Technical Context

Serverless is owner-selected. TypeScript with Bun tooling, Cloudflare first as a
candidate, managed provider login and Playwright browser checks are accepted
planning assumptions. Runtime/tool versions, database, UI/component owner and
identity integration must be selected and pinned during design. Azure remains
an alternative. Relevant source/vendor findings are in the prior-art analysis.

UMF CONTRACT-900 defines declarations and executor obligations. Existing Python
client and PostgreSQL action evidence does not establish a browser client,
serverless executor, D1 binding or Concourse production qualification.

## Constraints, Assumptions, Dependencies

### Constraints

Public source repository; no publication of credentials or private reader data.
No budget, deadline, residency region, traffic profile or software license has
been selected. No implementation/deployment authorization is inferred from this
framing request.

### Assumptions

One protected site precedes second-site reuse. Invited collaborators are the
initial audience candidate, not an owner-set policy. An account may have multiple
explicitly linked provider identities; exact linking/recovery rules require design.

### Dependencies

Enabled identity providers and test accounts; existing infrastructure ownership;
static build outputs; pinned UMF schema/action subsets for FR-8. Cross-repository
references are external sources, not invented HELIX graph edges.

## Risks

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Public-origin bypass | Plausible | High | Enumerate hosts/assets and verify denial before admitting private content |
| Confusing identity with permission | Plausible | High | Verify principal and enforce resource permission on every operation |
| Unqualified backend action semantics | Plausible | High | Refuse action support until exact-store qualification exists |
| Comment drift after publication changes | Plausible | Medium | Stable IDs, explicit revisions and unresolved-anchor presentation |
| Cross-site disclosure | Plausible | High | Trusted site scope plus negative tests for every read/write path |
| Excess scope | Plausible | Medium | Keep protected comments first; defer structured execution to P1 |

## Open Questions

- Which site/audience is first? Owner; blocks pilot deployment scope.
- Microsoft organizational, personal, or both? Owner; blocks provider acceptance.
- Does Access meet public-site sign-in needs? Identity design; blocks auth adapter.
- What session/revocation bound is acceptable? Owner/security design; blocks
  authorization acceptance and meaningful logout/revocation tests.
- What are data retention, deletion, export and moderation-history rules? Owner;
  blocks production data admission and destructive operations.
- What datastore, UI/component owner, host topology, region, budget and software
  license apply? Owner/design; blocks corresponding implementation/release choices.
- Which structured action and exact UMF profile? UMF/Concourse maintainers;
  blocks FR-8 design, without blocking protected comments discovery.

## Success Criteria

P0 acceptance demonstrates FR-1 through FR-7 with real browser/server/provider
flows, denied alternate origins and cross-site access, durable discussion and
second-site reuse. Tests must exercise and cite their story criteria. The test
plan must record versions, selected subsets and evidence limits. No runtime
acceptance is claimed by this framing. P1 has a separate native action gate.

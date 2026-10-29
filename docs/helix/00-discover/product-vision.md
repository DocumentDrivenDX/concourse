---
ddx:
  id: concourse.vision
  type: product-vision
  activity: discover
  status: draft
  authoring:
    home: repo
  links:
    - id: concourse.current-state
      kind: informed_by
    - id: concourse.prior-art
      kind: informed_by
---

# Product Vision

## Mission Statement

Give Novirhyza publication owners a shared way to admit readers and let them
participate around published material, beginning with comments.

## Positioning

For maintainers of UMF microsites and similar Novirhyza publications who need
controlled readership and attributable discussion, Concourse is a shared
publication collaboration service. Compared with per-site Cloudflare Access
configuration and a separate GitHub discussion widget, Concourse brings resource
identity, membership and interaction into a reusable experience.

## Vision

A publication owner chooses an audience and enables discussion without rebuilding
accounts and permissions for each site. Readers keep the context of what they
reviewed as content changes. Structured participation can grow from the same
identity and resource foundation.

**North Star**: Measure the share of participating sites that reuse Concourse
without maintaining their own identity or discussion implementation.

## User Experience

An invited reviewer opens a protected UMF reference page and signs in with an
enabled provider. They read a schema element, leave a comment and return later
to see a reply. The discussion identifies the revision they reviewed. A moderator
resolves the thread while the original publication remains independently intact.

## Target Market

| Attribute | Description |
|---|---|
| Who | Maintainers and reviewers of UMF and related Novirhyza publications; broader demand is unvalidated. |
| Pain | Access configuration and participation would otherwise be rebuilt independently per site. |
| Current Solution | Entropy Exchange's Cloudflare Access pattern; external discussion systems are alternatives surveyed in prior art. |
| Why They Switch | Reuse membership and discussion across publications while retaining context and policy boundaries. |

## Key Value Propositions

| Value Proposition | Customer Benefit |
|---|---|
| Reusable protected publishing | Owners can admit intended readers without implementing provider login per site. |
| Resource-aware discussion | Reviewers can tell which content and revision a comment concerns. |
| Shared interaction foundation | Owners can add structured participation without replacing accounts and discussions. |

## Success Definition

| Metric | Target |
|---|---|
| Reuse across sites | Hypothesis: adoption lowers site-specific identity/discussion code; inspect integration diffs. |
| Review context retained | Observe whether reviewers can identify the resource/revision behind sampled threads. |
| Owner setup effort | Measure time and decisions needed for a subsequent site; baseline remains unknown. |

These indicators guide learning, not release authorization or acquisition gates.

## Why Now

The owner identified recurring access and interaction needs across UMF microsites
on 2026-10-29. Entropy Exchange already supplies a source-inspected protected
publishing precedent. [Current state](current-state-inventory-publication.md) and
[prior art](competitive-analysis.md) ground the opportunity to reuse that work.

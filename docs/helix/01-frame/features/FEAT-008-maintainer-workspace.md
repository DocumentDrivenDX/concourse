---
ddx:
  id: FEAT-008
  type: feature-specification
  activity: frame
  authoring:
    home: repo
  links:
    - id: concourse.prd
      kind: informed_by
---

# Feature Specification: FEAT-008 — Maintainer Workspace

**Feature ID**: FEAT-008
**Priority**: P0
**Owner**: Concourse maintainers
**Covered PRD Subsystem(s)**: Maintainer Workspace
**Covered PRD Requirements**: FR-10
**Cross-Subsystem Rationale**: The owner selected one workspace for feedback and discussions; FEAT-007 and
FEAT-004 retain ownership of submission and discussion behavior.

## Overview

A dedicated workspace lets a maintainer understand feedback and discussions, find a
specific item and record permitted review state. It reuses the existing service and
managed identity rather than adding a separate authentication system.

## Ideal Future State

The maintainer opens an overview, sees what needs attention, opens a matching
queue and reviews feedback alongside its publication context. Search and counts
remain correct when the queue exceeds one page.

## Problem Statement

The feedback inbox exposes newest-first pages only, and discussion reads require
a specific resource/anchor. It has no search,
filters, dashboard or recorded triage workflow. It is useful as an entry point,
but cannot answer how much untriaged feedback exists across the installation.

## Requirements

- MW-01: The overview must distinguish feedback New/In review/Closed counts from
  Open/Resolved discussion threads and recent activity. Counts are server-side,
  complete for their predicates, and separately authorized. New is not unread.
- MW-02: Reviewers must search full feedback and discussion content/context,
  combine queue-appropriate status, page and date filters, and sort results.
  Feedback additionally filters by type; discussions support recent-activity order.
- MW-03: Bounded queue/detail navigation must preserve source/revision identity,
  original messages, reply relationships and private query state across navigation.
- MW-04: Feedback maintainers must triage and reopen feedback. Discussion
  moderators must resolve/reopen threads; a new reply reopens a resolved thread.
  Preserve audit history and reject a resolve command against unseen new replies.
  Conflicts require explicit reconciliation; uncertain writes retain retry identity.
- MW-05: Server permission checks must cover shell/assets, search, counts, detail
  and mutations. Feedback maintainers and discussion moderators are distinct
  capabilities. A client role, tab selection or ID cannot grant access.
- MW-06: Keyboard/mobile users must distinguish loading, empty, no matches,
  denial, expiry, conflict, unknown write outcome and service failure. Failed
  counts must never look like successful zero counts.

## Edge Cases and Error Handling

A reply arriving during resolution must either reopen the thread after resolve
or cause the stale resolve command to conflict. Keep the original command key
when the outcome is unknown. Lost capability or expired sign-in must deny every
private read; unavailable counts must not appear as zero.

## Constraints and Assumptions

Owner-selected first release: feedback and discussions together. The proposed
installation boundary is one workspace per publication, using Synaptiq Google
membership and separately configured feedback maintainers/discussion moderators.
Workflow labels and automatic reopen behavior are design recommendations. Serverless remains required. CONTRACT-003 owns exact interfaces;
SD-008 owns solution choices and business rules.

## Dependencies

FEAT-002 identity, FEAT-003 context, FEAT-007 feedback and FEAT-004 discussion.
The current comment/submission APIs must remain compatible.

## Out of Scope

Cross-installation aggregation, identity administration, notifications, external
issue creation, attachment processing, comment hiding/editing, hard deletion,
response-time SLAs and general analytics. Closed is an internal triage state;
it does not assert that a problem was fixed or notify its submitter.

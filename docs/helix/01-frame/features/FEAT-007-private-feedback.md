---
ddx:
  id: FEAT-007
  type: feature-specification
  activity: frame
  authoring:
    home: repo
  links:
    - id: concourse.prd
      kind: informed_by
---

# Feature Specification: FEAT-007 — Private Feedback

**Feature ID**: FEAT-007
**Priority**: P0
**Owner**: Concourse maintainers
**Covered PRD Subsystem(s)**: Feedback
**Covered PRD Requirements**: FR-9
**Cross-Subsystem Rationale**: Single subsystem.

## Overview

Readers send contextual feedback privately to publication maintainers from a
reusable widget. Maintainers read a site-specific inbox.

## Ideal Future State

A reader reports a problem, asks a question or suggests an improvement without
leaving the publication or accidentally publishing a private report as a comment.

## Problem Statement

Section discussion does not provide a private channel to maintainers. Readers
need a clearly separate workflow with a visible submission outcome.

## Requirements

- FB-01: Signed-in members must submit a question, problem or suggestion with
  stable page/revision context and optional section/selected text.
- FB-02: The widget must identify private visibility, retain unsent drafts and
  recover uncertain saves without creating duplicate submissions.
- FB-03: Only explicitly assigned site maintainers may read the inbox; server
  authorization must deny ordinary members, anonymous and cross-site access.
- FB-04: The workflow must be usable by keyboard and on mobile, display a receipt,
  and avoid sending external messages or creating issues automatically.

## User Stories

[US-009 — Send private feedback](../user-stories/US-009-send-private-feedback.md).

## Edge Cases and Error Handling

Expired authentication offers sign-in while preserving the draft. Lost responses
retain the same request until resolved. Failure never silently publishes a comment.

## Constraints and Assumptions

Synaptiq Google membership is owner-selected for the first microsite. Explicit
maintainer assignments are deployment configuration, not a reader-supplied role.
CONTRACT-002 defines the native interface and qualified storage scope.

## Dependencies

FEAT-002 identity; FEAT-003 resource context; FEAT-005 embedding.

## Out of Scope

Attachments, notifications, issue creation, anonymous feedback, status changes,
moderation and retention automation.

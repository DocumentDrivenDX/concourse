---
ddx:
  id: US-009
  type: user-stories
  activity: frame
  authoring:
    home: repo
  links:
    - id: FEAT-007
      kind: informed_by
---

# US-009: Send Private Feedback

## Story

**As a** signed-in reader
**I want** to send contextual feedback privately to the site's maintainers
**So that** I can report a problem without starting a public discussion.

## Context

Publication members need a private channel distinct from section discussion.
The first microsite uses Synaptiq Google and explicit maintainer assignments.

## Walkthrough

The reader opens Send feedback, signs in if needed, chooses a category and
optional section, writes feedback and submits. A receipt confirms storage. The
maintainer opens the private inbox; readers cannot open it.

## Acceptance Criteria

- US-009-AC1: Given a signed-in member, when they submit a question, problem or
  suggestion with page context, then they receive a visible storage reference.
- US-009-AC2: Unsent drafts survive reload; a lost accepted response is retried
  with one durable submission and the same receipt. Principal changes do not
  reveal another account's stored draft.
- US-009-AC3: Explicit maintainers can read a bounded, site-isolated inbox. Ordinary
  members, anonymous users and foreign-site maintainers cannot read it.
- US-009-AC4: Keyboard/mobile readers can use the widget, identify its private
  visibility and distinguish it from comments; no external issue/message occurs.

## Edge Cases

Expired login retains drafts. Lost responses retain the same request key; editing
is locked until resolved. Ordinary and foreign-site readers cannot list feedback.

## Dependencies

FEAT-007, CONTRACT-002, verified identity and site membership.

## Test Scenarios

`tests/feedback.test.ts` covers native authorization, isolation, bounds and replay.
`scripts/workerd-test.mjs` covers the built Worker on local D1.
`scripts/site-browser.ts` covers the actual site/UI draft, retry, inbox and keyboard/
mobile journeys. Real Google and Cloudflare acceptance remain a deployment gate.

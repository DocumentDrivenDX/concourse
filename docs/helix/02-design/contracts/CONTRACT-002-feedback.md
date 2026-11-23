---
ddx:
  id: CONTRACT-002
  type: contract
  activity: design
  authoring:
    home: repo
  links:
    - id: concourse.prd
      kind: informed_by
    - id: FEAT-007
      kind: informed_by
---

# Private feedback contract

**Version**: 1. **Type**: HTTP and browser integration.

## Purpose

Define a reusable, private feedback submission and maintainer-inbox workflow.

## Scope and Boundaries

Concourse owns feedback storage and UI. Comments retain CONTRACT-001 behavior.
External issues, notifications, attachments, anonymous submissions, moderation,
status transitions and UMF execution are outside this slice.

## Normative Surface

`SITES` MAY contain `maintainers`, an array of at most 1,000 exact verified email
addresses. Missing means an empty list. Invalid addresses MUST refuse config.
Maintainer access MUST additionally satisfy normal authenticated site membership.
The server MUST derive the site from the trusted request origin and the actor
from the verified Access assertion. Client input MUST NOT grant inbox access.

| Method/path | Input | Output |
|---|---|---|
| GET `/__concourse/session` | None | Existing subject/displayName plus `canReviewFeedback` boolean |
| POST `/__concourse/feedback` | Feedback input | 201 new or 200 replay `{receipt:{id,createdAt}}` |
| GET `/__concourse/feedback` | Optional positive `before` cursor | Maintainers only: `{feedback,next}` |

Feedback input MUST contain exactly `resource`, `revision`, `anchor`, `quote`,
`kind`, `body`, `requestId`. Resource/revision/anchor/quote/body and UUID v4 retry
bounds match CONTRACT-001; anchor and quote MAY be empty. Kind MUST be `question`,
`problem` or `suggestion`. URLs/query strings, author, email, role and site are
not accepted input fields. Plain text only. Request body limit is 16 KiB.

POST MUST use exact same Origin, JSON content type and a verified member.
Accepted feedback and its retry key MUST be committed atomically, scoped to
site and verified subject. An identical normalized retry MUST return its receipt;
a changed payload with that key MUST return 409. Receipts expose no body/identity.

Inbox entries contain `id`, `createdAt`, `author`, `resource`, `revision`, `anchor`,
`quote`, `kind`, `body`. They MUST NOT disclose the private authentication subject
or email. Lists MUST contain at most 50 newest-first entries with a keyset cursor;
no list endpoint is available to ordinary submitters, including for their own
submissions. All responses MUST be no-store and nosniff, without CORS grants.

The browser marker MAY opt in using `data-feedback="true"`. The widget MUST
show a sign-in link while unauthenticated and submit only after authentication.
It MUST identify feedback as private to maintainers, provide an explicit section
choice and optionally capture selected text from the publication (500 characters
maximum). It MUST NOT silently collect screenshots, browser details or URLs with
query parameters. Drafts and pending requests MUST survive reload in session
storage scoped to principal/site/resource. Unknown write outcomes MUST preserve
the same payload/key, prevent editing and offer retry. A successful receipt MUST
be visible, and a maintainer MUST be able to load the site's inbox from the UI.

## Precedence and Compatibility

This additive contract preserves existing site configuration and comment APIs.
Only the server-provided session capability enables the inbox UI; the server
MUST enforce permission independently. Migration 0002 adds feedback without
changing existing comments. Initialization of a new database applies both files.

## Error Semantics

401 requires sign-in; 403 denies origin/membership/inbox permission; 400 rejects
invalid fields; 413 rejects oversized bodies; 409 retains retry conflict; 503
preserves uncertain outcome. Definitive validation failures MAY unlock editing;
network/5xx/conflict outcomes MUST retain the pending key and payload.

## Examples

```json
{"resource":"index.html","revision":"source-sha256","anchor":"installation","quote":"Installation","kind":"question","body":"Can this run behind the Apps proxy?","requestId":"8f92346a-a120-48d2-8b8b-04873b5732ff"}
```

## Schema Basis

This extends the inspected native CONTRACT-001 resource/revision and retry
protocol. No UMF feedback domain pack is adopted or ingested. Native wire types
and append-only D1 storage do not claim UMF action/transaction qualification.

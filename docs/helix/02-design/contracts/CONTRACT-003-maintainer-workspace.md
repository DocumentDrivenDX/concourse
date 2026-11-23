---
ddx:
  id: CONTRACT-003
  type: contract
  activity: design
  authoring:
    home: repo
  links:
    - id: FEAT-008
      kind: informed_by
    - id: FEAT-004
      kind: informed_by
    - id: SD-008
      kind: informed_by
  schemas:
    - id: concourse.maintainer-requests
      version: "1.0.0"
      title: Concourse maintainer requests
      path: docs/helix/02-design/contracts/maintainer-requests.schema.json
      schemaFormat: json-schema
---

# Maintainer workspace contract

**Version**: native v1. **Type**: HTTP, query and application boundary.

## Purpose

Define search, dashboard reads, feedback triage and discussion review for FEAT-008.
The native implementation is not a qualified UMF executor profile.

## Scope and Boundaries

All paths below are relative to `/__concourse/admin/` on the publication's own
origin. Verified site membership remains necessary for every request. Server
configuration MAY add `moderators`, an optional exact-email array using the same
bounds/validation as `maintainers`; absent means no discussion-management access.
Feedback operations require `maintainers`; discussion management requires
`moderators`. Either capability admits shell/shared assets, neither implies the
other. Session MAY add `canManageFeedback` and `canManageDiscussions`, derived from
those predicates; client capabilities MUST NOT grant authority.

The trusted host selects the site. Filters, IDs, roles or cursors MUST NOT select
another site or database. Authorization MUST precede shell, assets, search,
counts, detail, history and mutations. Responses MUST be no-store/nosniff, without
CORS grants. Admin assets MUST be same-origin, authenticated and version-bound.

## Normative Surface

| Method / relative path | Input | Output / capability |
|---|---|---|
| GET empty path | None | Authorized HTML shell; either capability |
| GET `assets/<content-hash>.<js-or-css>` | Build-manifest path only | Exact asset; either capability |
| POST `feedback/query` | Feedback query | Feedback result page; feedback capability |
| POST `feedback/summary` | `{q?,filters?}` using feedback filters | Feedback summary; feedback capability |
| GET `feedback/<id>` | Positive safe-integer ID | Original feedback, head and latest 20 review events |
| GET `feedback/<id>/history?beforeVersion=N` | Optional positive version cursor | At most 20 older events |
| POST `feedback/<id>/triage` | Feedback triage command | 201 new / 200 replay `{receipt}` |
| POST `discussions/query` | Discussion query | Thread result page; discussion capability |
| POST `discussions/summary` | `{q?,filters?}` using discussion filters | Discussion summary; discussion capability |
| GET `discussions/<rootId>` | Positive root ID | Root, current head, latest contribution ID, latest 20 replies and review events |
| GET `discussions/<rootId>/replies?beforeId=N` | Optional positive comment cursor | At most 20 older replies, chronological within page |
| GET `discussions/<rootId>/history?beforeVersion=N` | Optional positive version cursor | At most 20 older review events |
| POST `discussions/<rootId>/review` | Discussion review command | 201 new / 200 replay `{receipt}` |

Detail/history/reply outputs MUST include the next cursor or null for each bounded
collection. Thread roots are always returned separately from reply pages. Every
reply retains its parent ID and revision; flat rendering must not erase ancestry.
Every POST, including queries, requires exact Origin and JSON content type. Unknown
fields/parameters are rejected. Bodies are capped at 16 KiB; safe-integer bounds
apply to IDs, counts and versions. Query bodies keep private searches out of URLs.

### Query rules

Both queries are `{q?,filters?,sort?,limit?,cursor?}`. The accompanying JSON Schema
owns request bounds/enums; endpoints select their named definition, never infer an
operation from shape. Default page size is 25, maximum 100. Filters combine with
AND; values within an array combine with OR. Absent/empty arrays mean unrestricted.
`resource` is exact/case-sensitive stored identity, not a URL. An anchor filter
requires a resource; empty anchor matches whole-page feedback. Dates are valid UTC instants normalized to millisecond ISO:
inclusive From, exclusive To, with From before To.

| Queue | Filter fields | Date meaning | Sorts |
|---|---|---|---|
| Feedback | kinds, statuses, resource, anchor, createdFrom, createdTo | Submission received | newest (default), oldest, kind |
| Discussions | statuses, resource, anchor, activityFrom, activityTo | Last contribution in the bounded query window | activity (default), newest, oldest |

Feedback statuses are `new`, `in_review`, `closed`; thread statuses are `open`,
`resolved`. Missing heads mean New/Open version 0. Kinds remain question/problem/
suggestion. Newest/oldest use creation time then unique ID in the same direction.
Feedback kind order is kind ASC (binary), creation time DESC, ID DESC. Discussion
activity is lastActivityAt DESC, root ID DESC. No SQL, caller-selected column,
ranked relevance or review-updated ordering is accepted.

Search is at most 200 Unicode code points before/after NFKC normalization. Trim/
collapse whitespace; allow at most 8 chunks, each at most 64 code points and
containing a Unicode letter/number. Quote each chunk as an FTS5 phrase, double
embedded quotes, combine with AND, and use `unicode61 remove_diacritics 2` over
body, quote, resource and stored author label. Matching is whole-token/phrase,
not fuzzy/substrings. No boolean/prefix language is exposed. Empty normalized text
omits search; punctuation-only text returns 400. A root or any reply may match;
a matching discussion returns once. Join indexed hits back to authorized canonical
records. No index-only results or raw FTS/SQL errors may escape.

Feedback captures the site's maximum feedback ID on its first query. Discussions
capture the maximum comment ID and compute membership, matching and last activity
only from contributions at or below it. Cursors encode format, site, normalized
query/limit/order fingerprint, watermark and every last-row sort value. Validate
shape/ranges/site/fingerprint on every request; changed criteria restart paging.
Cursors are opaque continuations, not signatures, authorization tokens or stores
for private text. New contributions require refresh. Review state remains live:
concurrent triage can change membership, so no cross-page historical snapshot is
promised. Detail reads current state even if newer than the queue watermark.

### Results and summaries

Query pages contain `{items,nextCursor,matchedCount,upperId,observedAt}`.
Feedback rows include ID, creation time, author label, resource/anchor/revision,
kind, status, head version and a plain-text 200-code-point body excerpt with an
explicit truncation flag. Thread rows include root ID/context/author/time,
status/version, lastActivityAt, latestContributionId, replyCount and root excerpt.
Thread count counts roots; replyCount excludes the root and uses the window.

Detail includes complete original text and quotes; each thread contribution retains
its own context/revision. Never disclose authentication subject/email, raw command
payload, cross-site data or private review events through reader APIs. Link to the
publication only through a trusted resource-to-URL adapter; without a mapping,
display/copy identity rather than guessing a route from a Markdown path.

Feedback summaries return total, all statusCounts/kindCounts keys, nullable
oldestNewCreatedAt and observedAt. Discussion summaries return threadCount, all
statusCounts keys, contributionCount (roots plus replies in the matching threads
beneath the watermark) and observedAt. Summary request windows are established by
the server at that read. Counts use full matching predicates before pagination;
all counters within one summary come from a consistent read. No global total
combines feedback, threads and contributions. Separate domains or requests may
observe different writes. Missing indexes/data yield unavailable, never false zero.

### Review commands and receipts

Feedback triage is `{status,expectedVersion,requestId}`. Discussion review is
`{status,expectedVersion,expectedLatestContributionId,requestId}`. All statuses
may reopen. A same-status command may record a new version; the UI offers actual
changes by default. A thread command must match the current maximum contribution
ID, so resolution cannot silently ignore a reply added after the moderator read it.

A manual receipt is `{targetId,status,version,changedAt}` for the accepted command,
not a promise of the latest head after subsequent updates. Refetch current detail
after acknowledgement. Immutable events contain trusted target/site, verified
actor subject/label, request ID, normalized command, from/to status, version and
server time. Atomically project the head. The selected D1 mechanism is one guarded
INSERT SELECT plus an AFTER INSERT projection trigger. Uniqueness enforces
site/actor/request ID within each command family and target/version. Zero matched
rows write no event/head. Resolve a same-key receipt before reporting version or
activity conflict; identical normalized replay returns its original result even
after later events. Changed payload with that key conflicts.

A new reply to a resolved thread MUST atomically create one reply-caused reopen
event and Open head during canonical comment insertion. Replaying an already
accepted comment must not create another event. Identify the triggering comment,
author and cause; never attribute the automatic event to a moderator. If resolution
wins first, a subsequent reply reopens. If the reply wins first, a stale manual
resolve fails its contribution guard. Open threads need no synthetic reopen event.
Resolution does not lock, hide or edit contributions.

Review histories expose only version, from/to status, actor display label,
changedAt, cause (`manual` or `reply`) and nullable triggering comment ID. Unknown
write outcomes retain the exact payload/key and lock editing until replay resolves
them. Conflicts preserve the proposed choice and require explicit reconciliation;
never silently obtain a fresh version and overwrite another person's work.

### Reader compatibility

CONTRACT-001 comment responses MAY add `threadId` per comment and `threadStates`
for represented roots, containing only thread ID/status/version. Updated widgets
show Open/Resolved and refresh it after posting. Legacy clients may ignore these
additions. Moderator audit history and private feedback remain excluded. Existing
submission/replay envelopes and source identities stay valid.

## Precedence and Compatibility

CONTRACT-001 and CONTRACT-002 remain valid. The new namespace and optional moderator
configuration are additive. Old feedback/threads begin New/Open without fabricated
history. Feedback, comments and review events are canonical; heads, ancestry and
FTS are rebuildable. No deletion, hiding/editing, notifications, issue automation,
bulk commands or federation is implied. Future Batten adapters need independent
identity/storage qualification. New permissions require reviewed installation config.

## Error Semantics

Use `{error:string,code?:string,current?:object}` without private text or raw SQL.
400 invalid criteria/cursor; 401 sign-in required; 403 wrong capability; 404 missing
item in the authorized site; 409 `version_conflict`, `activity_conflict` or
`request_id_conflict`; 413 oversized body; 503 unavailable query/index or unknown
write outcome. Conflict current state may include status/version/latestContributionId.
Access may challenge with a login redirect instead of JSON; offer sign-in rather
than reporting success. Separate dashboard sections handle failures independently.

## Examples

```json
{"q":"login draft","filters":{"kinds":["problem"],"statuses":["new"],"resource":"guide.html"},"sort":"oldest","limit":25}
```

```json
{"status":"resolved","expectedVersion":0,"expectedLatestContributionId":108,"requestId":"8f92346a-a120-48d2-8b8b-04873b5732ff"}
```

## Schema Basis

The local JSON Schema owns structural request bounds. Semantic dates, search,
authority, root ancestry, ordering, atomicity and replay require application and
native-adapter tests. SD-008 records the inspected UMF sources and native-profile
exception. No UMF generation or transaction qualification is claimed. Prove a
canonical export/import plus projection rebuild before production migration.

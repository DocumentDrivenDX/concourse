---
ddx:
  id: CONTRACT-001
  type: contract
  activity: design
  authoring:
    home: repo
---

# First-slice Contract

**Version**: 1. **Type**: HTTP, distribution and infrastructure boundary.

## Purpose

Reusable protected publication and authenticated section discussion without
Entropy Exchange-specific behavior in shared code.

## Scope and Boundaries

Plain-text immutable comments/replies, Access human assertions, configured sites,
Hugo integration and generic publication module. No arbitrary UMF action executor,
comment editing, anonymous comment reads or account linking is specified.

## Normative Surface

The server binding `SITES` is JSON: an array of objects with `id`, `origin`
(exact HTTPS origin), `issuer` (exact HTTPS Cloudflare Access team origin),
`audience` (one Access application audience), `domains` and `emails` (explicit
allowed verified-email values). Empty allow lists MUST deny. Unknown config
members and duplicate IDs/origins MUST fail closed. Production rejects HTTP.

Paths beneath `/__concourse/`:

| Method/path | Input | Output |
|---|---|---|
| GET session | None | `{subject, displayName}` from verified identity; no email disclosure |
| GET comments | query `resource`, `anchor`, optional `before` numeric row cursor | `{comments, next}`; oldest-to-newest within each page, at most 50 rows |
| POST comments | `{resource, anchor, revision, quote, body, requestId, parentId?}` | 201 new or 200 replay `{comment}` |
| GET login | query `return` | 303 to a same-origin path; invalid/foreign return denies |

Comments are `{id, resource, anchor, revision, quote, body, author, createdAt,
parentId}`. `author` is the verified human's display label; the immutable subject
is stored privately for replay authorization. Body is trimmed nonempty plain
text at most 4,000 Unicode code points; quote at most 500; resource/anchor at most
512; revision at most 128; requestId matches UUID v4; parentId is an optional
positive integer referencing the same site/resource/anchor. Resource is a stable
source path string. IDs/cursors use safe positive integers. GET query values
must be present and bounded. Fields are never HTML. No caller-supplied author.
Total request body at most 16 KiB; JSON content type and exact Origin required
for writes. Unsupported methods deny. Invalid/unknown fields return 400.

Every response MUST use `Cache-Control: no-store` and `X-Content-Type-Options:
nosniff`. No CORS allow headers. Unknown host denies before auth/storage. Validate
`Cf-Access-Jwt-Assertion` cryptographically using configured issuer JWKS, RS256,
exact issuer/audience and expiry; require nonempty human `sub` and email, reject
service-token identities. Signed subject/issuer supply identity, not email-only
merging. Signed display name, if absent, uses a non-email label. Membership uses
explicit emails/domains at each request. Revocation is bounded by token expiry
plus config rollout; this profile does not promise immediate upstream revocation.

A retry key is scoped to site + issuer/subject. Store it atomically with the
comment. Identical normalized input returns its original comment; changed input
returns conflict. Failed/unknown responses MUST retain the same draft/key until
outcome is resolved. UI MUST NOT automatically generate a new key after uncertain
failure. Parent identity is verified within the same insert/read boundary.

Hugo partial `concourse.html` is opt-in through `params.concourse.enabled`,
`site`, and `api` (same-origin `/__concourse/`). Resource defaults to `.File.Path`,
revision is SHA-256 of `.RawContent`. Source heading IDs identify sections;
content before the first heading uses `page`. Comments from another revision
MUST be labeled; no automatic semantic reattachment. Browser mounts at each
heading through a Shadow DOM component; signed source is never rewritten.

OpenTofu module `infra/protected-publication` inputs: account_id, name,
pages_project, hostname, zone_id, allowed_idps, allowed_email_domains,
allowed_emails, session_duration (default 24h). Outputs: access_application_id,
audience, hostname. It MUST cover Pages production, wildcard previews and custom
hostname before DNS/domain activation. Empty identity/policy lists are invalid.
The consumer supplies site-specific values; shared source MUST have no site-name
branches. Moved blocks preserve existing resource identities during adoption.

CLI: `bun src/cli/check-access.ts <https-url>...` checks signed-out challenge
without following redirects. Only HTTPS redirects to the expected Access login
path qualify, never substring matches in query parameters. `install-hugo.ts
<site-directory>` installs built browser assets and the generic partial;
`--check` verifies exact bytes without writing. No credentials are read.

## Precedence and Compatibility

Unknown protocol/config version or fields refuse. Site host/config and verified
principal take precedence over browser fields. Wire v1 is separate from any UMF
extension or native action profile. Additive wire changes need explicit version
compatibility; do not silently reinterpret stored anchors/revisions.

## Error Semantics

400 invalid input; 401 absent/invalid identity; 403 membership/origin denial;
404 unknown host/parent; 405 unsupported method; 409 retry conflict; 413 body too
large; 503 unavailable verifier/store/config. JSON errors contain `{error}` with
no private comment, token, email, stack or underlying provider response. No
response caching or automatic fresh-key retry.

## Examples

A reviewer comments on resource `reference/keys.md`, anchor `equality`, revision
`<source digest>`, quote `Key equality`, body `Clarify nullability.` and a generated
UUID requestId. Repeating that payload/key returns the original stored comment.

## Schema Basis

UMF inspection and native-protocol exception are recorded in Architecture.
The versioned TypeScript wire types and runtime validators in `src/shared/`
are the machine authority for this native protocol. SQL migration owns row
shape/constraints; exact HTTP behavior remains here. UMF core concepts are not
misrepresented as a preexisting collaboration pack.

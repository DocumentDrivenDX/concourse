---
ddx:
  id: concourse.architecture
  type: architecture
  activity: design
  authoring:
    home: repo
---

# Concourse Architecture

## Scope

The first two owner goals: generic protected publication, then signed-in inline
section comments on HELIX microsites. FEAT-001/002/003/004/005 govern behavior.
Structured actions, editing/moderation and directory/account linking are later
slices; no claim of completing their broader stories is made.

## Level 1: System Context

A reviewer reads a static publication and authenticates through Cloudflare
Access. Concourse validates the assertion and serves site-scoped comments.
Existing infrastructure owns Access/DNS; each publication owns its site inputs.

## Level 2: Container Diagram

| Container | Technology | Responsibility | Communication |
|---|---|---|---|
| Publication | Hugo/Hextra or other static builder | Content and stable section IDs | HTTPS |
| Inline UI | Browser-compatible TypeScript, native DOM component | Accessible section discussion outside signed source | Same-origin fetch |
| Collaboration API | Cloudflare Worker, jose JWT validation | Verified identity, site routing, bounds, outcomes | D1 binding |
| Comment store | D1/SQLite prepared statements | Append-only comments, revision/context, retry deduplication | Worker binding |
| Protected publication module | OpenTofu Cloudflare v5 | Generic Pages domain/DNS/Access composition | Infrastructure provider |

## Module Boundaries

**Source Applicability**: source; handwritten application, browser and CLI implementation.

| Module | Responsibility / Owned Types | Public API | Allowed Dependencies | Forbidden Dependencies |
|---|---|---|---|---|
| src/shared | Wire types, validators | CONTRACT-001 | Standard JS | Runtime, browser DOM, Node/Bun |
| src/server | Worker HTTP, verified identity, SQL store | Worker fetch and injected verifier/store for tests | shared, jose, Worker bindings | Browser and CLI |
| src/browser | Inline UI and same-origin client | mountComments | shared, DOM | Server, CLI, Node/Bun |
| src/cli | Protected-host check and distribution installation | CLI | Bun/Node, shared | server/browser internals |
| infra/protected-publication | Pages/Access/DNS resource composition | Module inputs/outputs | Cloudflare provider | Site-name branching |
| infra/cloudflare | Installation foundation: publication module and protected D1 lifetime | Terraform inputs and installation output | protected-publication, Cloudflare provider | Worker code, routes or deployment credentials |
| scripts/cloudflare | Validate Wrangler profile, prepare and verify release bytes, explicit deployment command | CONTRACT-001 deployment surface | server/config public validator, Node/Bun, pinned Wrangler CLI | Browser internals, automatic migrations, Terraform mutation |

**Integration Owners**: server/auth.ts owns Access translation; server/store.ts
owns D1 SQL; browser owns DOM/UI; infra module owns provider composition.
**Construction Policy**: worker.ts wires production D1 and JWT verification;
tests inject verified cryptographic tokens and native SQLite adapters, never a
production debug login bypass.
**Boundary Check**: `bun run check:boundaries`; negative control injects a forbidden
server import into browser source and must fail.

## Deployment

One shared Worker routes configured site origins to their audience/profile.
Each site's `/__concourse/*` is protected by Access; static public pages may stay
public. Worker route, origin, Access audience and allow policy must all be
configured before enablement. Unknown hosts and workers.dev bypasses deny.
D1 stores append-only rows; local native SQLite and Workers local emulation
qualify separate profiles. Cloud backup/restore and retention need a production
runbook and owner policy before real data admission. No cloud resources are
provisioned by this local build.

The supported Cloudflare installation entry point is `infra/cloudflare`.
Terraform owns Pages project/domain, DNS, Access and D1 lifetime. Wrangler owns
Worker code, bindings and `/__concourse/*` routes exclusively. Existing login
providers are referenced by ID, never recreated. The earlier
`infra/collaboration-worker` is a legacy alternative and must not manage a
Wrangler-owned Worker or route.

An installation keeps one explicit Wrangler JSON profile. Preparation runs
offline, validates the selected audience/hosts, disables workers.dev and version
URLs, and packages built Worker/configuration/migration bytes with hashes. The
separate deployment command requires the reviewed release digest and rechecks
all bytes before invoking the pinned Wrangler. It does not apply migrations or
publish static content. Its summary is desired configuration, not a cloud-state
diff; an initial infrastructure plan and live protection checks remain required.
The consumer's existing static build/sign/upload pipeline owns content releases.

For a new Cloudflare publication, the empty Pages project precedes Access:
Cloudflare requires that project before accepting its pages.dev destinations.
The domain still waits for Access, and DNS waits for the domain. Content upload
must wait for verified admission across custom, production and preview hosts;
resource ordering alone does not gate an independently running content pipeline.
`python3 scripts/check-publication-order.py` checks the actual provider graph.
Consumers may vendor the sibling modules inside their root for reviewed,
self-contained read-only plans; the reusable code stays owned by Concourse.

Databricks Apps/Batten is an additional required hosting profile, with separate
backend and volume publication plugins. Cloudflare tooling does not establish
that profile's identity, storage or proxy guarantees and is not a portable
backend contract. No Batten runtime support is claimed by this package.

## Data Flow

1. Static page loads the opt-in component with site, source resource and revision.
2. Signed-out reader follows a same-origin login link; Access authenticates.
3. Worker validates RS256 signature, exact issuer/audience, expiry and human subject.
4. Server derives author from verified subject/email and enforces configured site
   membership. Writes additionally require exact Origin and JSON content type.
5. A single parameterized insert stores comment and caller retry key together.
6. A repeated same key/payload returns the original row; changed payload conflicts.
7. UI reloads persisted rows and marks previous-revision discussion explicitly.

## Quality Attributes

| Attribute | Target | Strategy | Verification |
|---|---|---|---|
| Identity | No unsigned, expired, wrong issuer/audience or service assertion accepted | jose verification, human subject | Signed local-token negative tests; live provider gate separate |
| Isolation | No cross-host/site disclosure in scoped corpus | Trusted host map and site-scoped SQL | Native integration tests |
| Writes | At most one stored comment per site/subject/request key | Unique constraint and payload comparison | Concurrent replay/conflict tests |
| Bounds | 4,000 text characters; 16 KiB body; bounded page reads | Stream size limit and keyset pagination | Boundary tests |
| Accessibility | Keyboard and named/status controls | Native details/form/button semantics | Browser journey and axe check |

## Decisions and Tradeoffs

Cloudflare Worker plus D1 is the first implementation target under owner-approved
serverless assumptions. D1 is selected for this append-only native profile, not
as a qualified UMF action executor. Native DOM avoids imposing a frontend
framework on host sites; Shadow DOM isolates component styles. Section comments
use authored heading IDs; exact paragraph/text-range attachment is deferred.

## Schema Basis

Inspected UMF core 0.10 metamodel, current record/value fixtures and CONTRACT-900.
Reuse resource/revision identity and action/executor separation conceptually.
No inspected pack supplies a ready collaboration HTTP envelope or Access token
validation. CONTRACT-001 owns the native v1 protocol; this local profile does not
claim UMF projection, generation or action qualification. Append-only SQL is the
persistence authority; unknown request members are rejected, never erased from
UMF documents. No UMF document is ingested by this slice.

Deployment uses Wrangler 4.156.0's native configuration schema, not a new UMF
model. The preparer accepts a bounded subset and fixes bundle/migration paths;
the actual pinned Wrangler dry-run verifies vendor compatibility. The release
manifest is local distribution-integrity metadata, with no UMF identity, action
or transaction semantics. The earlier UMF inspection supplies no appropriate
replacement for this provider-specific configuration.

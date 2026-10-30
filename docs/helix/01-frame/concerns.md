---
ddx:
  id: concourse.concerns
  type: concerns
  activity: frame
  status: draft
  authoring:
    home: repo
---

# Project Concerns

## Active Concerns

Catalog: installed HELIX 0.19.1 `workflows/`; resolve concern/practices there,
without copying them into this repository. Initial quality defaults are seeded
for planned software. The owner accepted the technology assumptions and deferred
UI/database choices. Domain/quality additions below are explicit initial framing
assumptions, open to pruning with recorded applicability reasons.

| Concern | Source | Areas | Why Active | Key Practices |
|---|---|---|---|---|
| typescript-bun | shipped-default; owner-accepted | all | Browser component and serverless application | Bun for development; pin versions; keep host APIs out of portable browser code. |
| testing | shipped-default | all | Behavior needs executable proof | Exercise actual paths and cite each acceptance criterion using @covers syntax. |
| verification | shipped-default | all | Configured services are not observed behavior | Separate static, local, browser and deployed evidence; qualify exact subsets. |
| modularity-and-encapsulation | shipped-default | all | Handwritten service, browser and integration code is planned | Design owns public boundaries, dependency map and enforced import checks before feature implementation. |
| code-shape-ceilings | shipped-default | all | Greenfield project; strict default size/complexity limits apply | Adopt installed practice ceilings during design/tooling; no silent exceptions. |
| o11y-otel | shipped-default | all | Service signals and development run diagnostics apply | Correlate request/write outcomes; redact identities/content/secrets; claim receiver delivery only with observed evidence. |
| a11y-wcag-aa | shipped-default | ui | Reviewers and moderators use interactive controls | Verify keyboard, focus, status announcements and text scaling against WCAG 2.2 AA. |
| e2e-playwright | shipped-default; owner-accepted | ui | Real browser/server journeys must run | Exercise reader comment and moderator resolve flows against a running service; include denied flows. |
| auth | assumption from requested login | all | Accounts must carry real verified identity | Use managed login override; verified principal governs application authorization; no local-password signup required. |
| authorization-model | assumption from protected participation | all | Admission and mutation permissions differ | Deny by default; define permission model and revocation bound; authorize all reads/writes on server. |
| multi-tenancy | assumption from multiple independent sites | all | Site boundaries must isolate content | Derive allowed site scope from trusted policy/principal, never client site IDs alone; test cross-site denial. |
| admin-console | assumption from proposed moderation UI | ui, api | Moderators manage mutable thread/comment state | Provide real resolve/reopen/hide flows and cover operator UI end to end; broader admin scope is unselected. |
| ux-interaction-patterns | assumption from embedded discussion | ui | Forms and moderation have multiple outcomes | Cover loading/empty/denial/validation/conflict/error/success states in story test UX maps. |
| security-owasp | assumption from external authenticated writes | all | Untrusted comments and remote requests enter service | Design sanitization, request forgery protection, allowed origins, rate limits and secrets handling; test deployed boundaries. |
| scope-discipline | assumption from owner phase boundary | all | Discovery/framing precedes build | Keep structured actions P1 and exact protocols in design contracts; avoid unrelated platform machinery. |
| [auth-managed-identity](concerns/auth-managed-identity/concern.md) | project-local; operator-override | all | Owner-accepted planning assumption | Read [local practices](concerns/auth-managed-identity/practices.md); exact implementation needs design. |
| [deploy-serverless-candidate](concerns/deploy-serverless-candidate/concern.md) | project-local; operator-override | all | Owner-accepted planning assumption | Read [local practices](concerns/deploy-serverless-candidate/practices.md); exact implementation needs design. |

## Project Overrides

| Concern | Practice | Override | Authority |
|---|---|---|---|
| auth | Local password/session default | Managed provider login with explicit account mapping; no local-password signup | Owner direction 2026-10-29; identity ADR needed during design |
| frontend-framework | react-nextjs shipped default | Keep unselected until UI/component and embed design | Owner explicitly accepted deferral 2026-10-29 |
| datastore | No shipped engine default | Keep unselected; relational-data-modeling becomes applicable if relational storage is chosen | Owner explicitly accepted deferral 2026-10-29 |

Slot resolution: language-runtime = typescript-bun (shipped-default, accepted);
e2e-framework = e2e-playwright (shipped-default, accepted); auth-provider =
auth-managed-identity (operator-override); deploy-target =
deploy-serverless-candidate (operator-override). frontend-framework/datastore are
explicitly unresolved per owner instruction; architecture-style awaits design.
For the first implementation, datastore resolves to project-owned
`datastore-cloudflare-d1`, and frontend-framework to project-owned `ui-native-dom`.
Their local concern/practice records below supersede the earlier deferral only
for the native comment slice. Source: assumption from the authorized build and
its architecture; no React/Next.js dependency is introduced.

## Area Labels

- `area:ui` — embedded reader/moderator controls.
- `area:api` — collaboration service and identity/permission boundary.
- `area:data` — durable comments, account mapping and retention.
- `area:infra` — hosting, access policy, previews and deployment checks.
- `area:cli` — development, validation and publication tooling.

## Concern Conflicts

| Conflict | Resolution |
|---|---|
| Local auth defaults versus requested managed login | Owner direction wins; use local auth-managed-identity practices. |
| UI defaults versus unknown embedding constraints | Keep framework/component ownership open until design; no competing UI libraries selected. |
| UMF transactional action profile versus unknown datastore | Do not claim compatibility; FR-8 requires independent exact-backend evidence. |

## Observability Applicability

Service request/write outcomes, browser/server handoff and agent run diagnostics
apply. Discussion text, access tokens and private reader details must not leak
into telemetry. GenAI product operations do not apply; Concourse has no selected
model-calling capability. OpenTelemetry receiver integration remains a design and
execution obligation, not an assertion of existing instrumentation.

## Formal Methods Applicability

Not selected at initial framing: no concrete state model or assurance scope has
been assessed. Review during action/permission consistency design if interacting
rules and material failure cost justify a chosen rigor. Concurrency alone does
not select this concern.

## Initial native comment choices

- [datastore-cloudflare-d1](concerns/datastore-cloudflare-d1/concern.md), source:
  assumption from Architecture. Applies to API/data; select relational-data-modeling
  practices for explicit constraints, indexes, parameterized statements and
  migration/restore qualification. D1 is not a qualified UMF action backend.
- [ui-native-dom](concerns/ui-native-dom/concern.md), source: assumption from
  embedding requirements. Applies to UI; native controls and Shadow DOM own
  components/styles. Verify Hextra's nested section anchors and host layout.

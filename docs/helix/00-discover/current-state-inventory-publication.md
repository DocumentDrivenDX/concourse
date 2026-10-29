---
ddx:
  id: concourse.current-state
  type: current-state-inventory
  activity: discover
  status: draft
  authoring:
    home: repo
---

# Current-State Inventory: Publication and Collaboration

## Scope and Boundary

- Estate: Entropy Exchange publication/access source, existing infrastructure,
  and relevant UMF declarations. Survey: 2026-10-29.
- Owner: Concourse maintainers. Excluded: credentials, cloud state, authenticated
  production sessions and full estate audit.
- Evidence refers to inspected source, not live deployment. Exact paths/hashes
  appear in [sources.json](sources.json); the named sources below were read on
  2026-10-29.

## Evidence Grades

| Grade | Meaning |
|---|---|
| Evidenced | A cited source supports the exact scoped statement. |
| Partial | Source exists; a material runtime fact is unverified. |
| Assumed | Claim has no inspected supporting source. |
| Aspirational | Desired capability with no implementation evidence. |
| Spike-open | Unverified fact blocks a named decision. |

## Inventory

### Capability

| Component | Incumbent | Grade | Evidence |
|---|---|---|---|
| Public/internal build split | Entropy Exchange | Evidenced | `_quarto-public.yml`, `_quarto-internal.yml`, `docs/publishing.md`; 2026-10-29 source configuration. |
| Protected production/preview destinations | Existing infrastructure | Evidenced | `cloudflare/access.tf`, `cloudflare/playbooks.tf`; 2026-10-29 configured host coverage and dependency ordering. |
| Selected login provider | Cloudflare Access / Google Workspace | Evidenced | `cloudflare/access.tf`; 2026-10-29 Google-only provider restriction, domain policy and 24h session configuration. |
| Deployment challenge gate | Entropy Exchange | Evidenced | `script/assert-cloudflare-access`, publication workflow; 2026-10-29 selected root challenge check. |
| PR preview lifecycle | Entropy Exchange | Evidenced | Publication workflow; 2026-10-29 branch previews, link comments and cleanup configuration. |
| Live protection and provider behavior | Cloudflare deployment | Partial | Configuration inspected; no authenticated browser or deployed configuration audit performed. |
| Declarative action semantics | UMF | Evidenced | CONTRACT-900; 2026-10-29 host-owned execution and explicit qualification boundary. |
| Generated client integration | UMF | Partial | Unified Python evidence; 2026-10-29 scoped Python proof, production remote host/TypeScript emission not established by that record. |
| Shared discussion service | Concourse | Aspirational | Owner request; no implementation supplied. |
| Microsoft/Google/GitHub Concourse login | Concourse | Aspirational | Owner request; playbooks source only establishes Google Workspace configuration. |

## Totals

| Grade | Count | Share |
|---|---|---|
| Evidenced | 6 | 60% |
| Partial | 2 | 20% |
| Assumed | 0 | 0% |
| Aspirational | 2 | 20% |
| Spike-open | 0 | 0% |

2 of 10 entries have no evidence they exist: both are Aspirational.

## Open Questions

| Question | Blocks | Owner |
|---|---|---|
| Do production, alias and asset paths enforce the intended policy today? | Reuse qualification | Infrastructure maintainer |
| How do provider identities map across different sites and audiences? | Identity design | Concourse maintainer |
| Which current UMF client/action subset can the new serverless host qualify? | Action design | Concourse and UMF maintainers |

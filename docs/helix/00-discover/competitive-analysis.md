---
ddx:
  id: concourse.prior-art
  type: competitive-analysis
  activity: discover
  status: draft
  authoring:
    home: repo
---

# Competitive Analysis

## Market Landscape

| Attribute | Assessment |
|---|---|
| Market maturity | Managed site access and discussion widgets exist; Concourse is initially an ecosystem integration, not a validated standalone market. |
| Growth rate | Unmeasured; no market-growth claim. |
| Key trends | Owner-observed repeated publication needs; existing protected playbooks workflow. |
| Entry barriers | Identity, disclosure control and durable writes need deployed evidence. |
| Buyer power | Internal owners can keep the existing workflow; commercial willingness to pay is unresearched. |

Sources were retrieved or inspected on 2026-10-29. Vendor documentation describes
capability; no Concourse integration or commercial comparison was executed.

## Competitive Forces

| Force | Pressure | Evidence / Confidence | Implication |
|---|---|---|---|
| Direct rivalry | Unknown | No full collaboration-product survey | Do not claim a market gap beyond owner needs. |
| Substitutes | Material | Existing playbooks; giscus documentation | Reuse managed access and compare external comments. |
| New entrants | Unknown | No market evidence | Avoid invented defensibility claims. |
| Buyer power | High internally | Owners can retain current static publishing | Prove a second-site integration is useful. |

## Competitor Profiles

| Candidate | Type | Positioning | Target | Strengths | Limits for this request | Source / confidence |
|---|---|---|---|---|---|---|
| Entropy Exchange playbooks | Incumbent | Protected static publication | Internal readers | Source-configured host and preview protection | No shared site-discussion implementation found in inspected configuration; configured provider is Google Workspace | Current-state inventory; source-scoped |
| Cloudflare Access | Component | Identity gate for web apps | Controlled audiences | Managed admission and documented token validation | Application membership and mutation policy still require design | [Identity providers](https://developers.cloudflare.com/cloudflare-one/integrations/identity-providers/), [token validation](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/); documented |
| giscus | Substitute | GitHub Discussions comments | GitHub participants | Existing static-site comment integration | GitHub OAuth flow and discussion storage constrain the requested multi-provider experience | [Project](https://github.com/giscus/giscus); documented |
| Azure Static Web Apps | Platform alternative | Managed static app authentication | Azure-hosted sites | Custom identity-provider registrations | Custom authentication requires Standard plan; application collaboration remains separate | [Custom authentication](https://learn.microsoft.com/en-us/azure/static-web-apps/authentication-custom); documented |

## Feature Comparison

| Capability | Concourse | Playbooks pattern | giscus | Azure Static Web Apps |
|---|---|---|---|---|
| Protected static publication | Planned | Configured | Outside component scope | Documented platform support |
| Shared resource/revision discussion | Planned | Not found in inspected config | Page-associated discussion | Application work |
| Microsoft/Google/GitHub experience | Planned | Google Workspace configured | GitHub login | Custom provider configuration documented |
| UMF-described structured interaction | Later planned slice | No inspected implementation | No documented UMF binding | Application work |

Legend: Planned means desired scope, Configured means source configuration,
Documented means vendor statement; none is an executed Concourse support claim.

## Differentiation Strategy

| Differentiator | Why it matters | Defensibility |
|---|---|---|
| Shared site/resource identity | Comments retain context across page moves and revisions | Internal integration value; no market moat claimed |
| Reuse the existing access estate | Avoid rebuilding provider authentication per site | Existing operational pattern, not proprietary advantage |
| Explicit UMF host boundary | Richer interactions can preserve declared meaning | Requires exact host qualification |

**Positioning**: Concourse joins managed access, contextual discussion and
UMF-described participation for Novirhyza publication owners.

## Strategic Implications

- Reuse the playbooks pattern; establish an infrastructure/application ownership
  boundary before extending production configuration.
- Keep Cloudflare first for investigation, with Azure as an alternative. Cloudflare
  [Workers static-asset routing](https://developers.cloudflare.com/workers/static-assets/routing/worker-script/)
  can run a Worker before assets; this offers a candidate protected-serving path.
- Compare storage against required write/replay/permission semantics. Cloudflare
  [D1 limits](https://developers.cloudflare.com/d1/platform/limits/) are input to
  evaluation, not evidence of UMF action-profile compatibility.
- Avoid a general identity-provider product, two-cloud launch, or universal action
  executor. First verify protected publication and attributable comments.

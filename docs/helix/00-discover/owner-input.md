# Owner input — 2026-10-29

## Settled direction

- Name: **Novirhyza Concourse**; repository: `DocumentDrivenDX/concourse`, public.
- Address recurring concerns across UMF microsites and similar publications:
  easy static-content access walls using Microsoft, Google or GitHub login;
  comments first, with potential structured interaction using UMF actions.
- Use a serverless platform. Cloudflare is reasonable; Azure may be considered.
- Inspect and reuse the Entropy Exchange playbooks precedent.
- Bootstrap HELIX and begin discovery and framing. This request does not direct
  an infrastructure deployment or application implementation.

## Accepted planning assumptions

The owner explicitly accepted TypeScript with Bun tooling, Cloudflare as the
first hosting candidate, managed provider login and Playwright browser
verification. Database and UI framework remain open until design.

The proposed ownership split and initial delivery sequence are framing
assumptions: existing infrastructure handles reusable protected publication;
Concourse handles collaboration; UMF handles portable models/action contracts;
site repositories handle content. Start with one site, prove reuse with a second,
then introduce a structured action. These are recommendations carried forward
for review, not claims of existing Concourse behavior.

## Unknowns

First audience/site; account-linking rules; Microsoft account types; permission
and revocation timing; moderation and retention policy; data residency; database;
UI/component owner; operational budget; license; deployment account/domain;
public-site login experience; production acceptance profile.

## Evidence boundary

The conversation supplies product intent. Repository files supply source
observations. Vendor documentation supplies documented capabilities as retrieved
on 2026-10-29. None proves a live Concourse service. Source hashes and checkout
identities are retained in `sources.json`; full upstream files are not copied.

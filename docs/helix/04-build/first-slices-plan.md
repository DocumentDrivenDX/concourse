# First implementation plan

Owner authorization: 2026-10-29. Scope: reusable protection first; signed-in inline
section comments on HELIX microsites second. Architecture and CONTRACT-001 govern.

1. Implement Concourse's generic protection module and challenge verifier.
   Adopt via a generic site map in existing infrastructure; keep current Pages,
   DNS and Access IDs with moved blocks. Replace Entropy's repair implementation
   with shared tooling/config; preserve existing public/internal rendering.
2. Implement verified Access identity, bounded native comment API, append-only
   D1 store and same-key outcome recovery. Test against native SQLite and local
   Workers/D1 separately (supported Node harness; Bun builds/tests application code). No debug identity backdoor in the production Worker.
3. Implement keyboard-usable inline section UI and generic Hugo installer.
   Integrate opt-in partial/assets into HELIX and documentor-generated sites.
4. Verify module/import boundaries including a negative control, type checks,
   backend auth/isolation/replay cases, browser persistence/anonymous/revision
   journeys, Hugo generated-page integration and provider syntax validation.
5. Review diffs, capture source-exact evidence and prepare cross-repository PRs.
   Cloud apply/migration and live-provider acceptance require a concrete reviewed
   deployment configuration; local proof is not a deployed feature claim.

## Completion conditions and scope limits

Shared runtime/module sources contain no Entropy Exchange names. Existing site
names occur only in consumer data and explicit state-move history. A logged-in
reviewer can post/reload/reply beside a section through the running service;
anonymous/foreign-origin/cross-site/invalid-token access is denied. Native retry
conflicts and payload bounds are observed. Real Access provider and deployed
origin coverage remain independently gated if cloud credentials are unavailable.
Broader story editing/moderation/retention and all-provider certification remain
outside this slice. No source/package publication or production-data admission.

## Test allocation

| Acceptance scope | Named proof | Assertion |
|---|---|---|
| US-001-AC1/2/4; PUB-04 | protection.test.ts | Generic destinations, challenge validation and preserved moved resource targets |
| US-002-AC3; US-003-AC1/2 | server.test.ts | Signed token negatives, trusted host, membership and origin denials |
| US-004-AC1/2/3 | browser journey | Stable source resource, revision labeling and site-scoped storage |
| US-005-AC1/3/4/5 | server and browser journey | Native persistence/replies, draft retention, replay, keyboard/focus |
| US-007-AC1/2/3 | Hugo/browser integration | Same installer with two site IDs; source bytes unchanged and host navigation works |

Other criteria remain unimplemented; no full-story acceptance is asserted.
Browser UX: section navigation, keyboard details/form, async load/save, empty,
login, validation/error/replay states covered. Destructive actions are absent.
Service diagnostics contain only generic outcome/status; no OTel receiver
integration is claimed. Add OTel wiring before broader production operations.

## Observed results

See evidence/first-slices.json for source hashes, scoped passing results and open
cloud gates. The actual Worker bundle passes local D1 execution; real HELIX
rendering passes desktop/mobile posting and reload. Existing playbooks production
and custom-host admission challenges pass six generic probes. No cloud plan,
apply, remote migration or authenticated production journey was performed.

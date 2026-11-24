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

## Cloudflare packaging follow-up

Owner selected Wrangler plus a minimal reusable Terraform foundation. Implement
`infra/cloudflare`, an example native Wrangler profile and offline preparation /
explicit digest-approved deployment commands. Test route/profile refusal,
artifact tampering and approval failure before any subprocess invocation; run
the actual pinned Wrangler dry-run against a prepared bundle. Validate the
module against Cloudflare v5 without a backend or credentials. Keep migrations,
existing-state adoption, live protection verification and production data
admission separately reviewed. No change to another repository is needed to
prepare the consumable module and example.

## Observed first-slice results

See evidence/first-slices.json for source hashes, scoped passing results and open
cloud gates. The actual Worker bundle passes local D1 execution; real HELIX
rendering passes desktop/mobile posting and reload. Existing playbooks production
and custom-host admission challenges pass six generic probes. No cloud plan,
apply, remote migration or authenticated production journey was performed.

## Microsite and feedback implementation — 2026-11-23

Owner authorized building the public Concourse microsite with live comments and
feedback, initially Synaptiq Google. CONTRACT-002 governs the new private workflow.

1. Add separate feedback storage/validation and authenticated submission plus
   explicit-maintainer inbox. Test replay/conflict, authorization, cross-site
   isolation, bounded pagination and identity suppression against native SQLite
   and the production Worker on local D1.
2. Build reusable native feedback UI with accessible disclosure/form, context,
   receipt, private inbox and principal-scoped draft/uncertain-outcome recovery.
   Test real Chromium keyboard, anonymous, retry/reload and inbox journeys.
3. Publish authored documentation sources in `site/` with deterministic revisions
   and the actual shared assets. Test actual rendered pages, comments and feedback
   on desktop/mobile. Leave the unrelated untracked Novirhyza draft untouched.
4. Add a pinned build/artifact workflow and explicit release inventory. Prepare
   consuming infrastructure using the existing small module, public static pages
   and protected API. Do not merge infrastructure PRs or claim live acceptance
   before its normal human-reviewed apply and a real Google session succeed.
5. Review changes, run gates, open reviewable PRs and record remaining deployment
   operations. New installation outputs/credentials remain outside public source.

No arbitrary deadline or spending ceiling was supplied. Verification stays scoped
to native feedback, comments and the actual site build; no broad refactor or
external issue/message integration is included.

### Microsite implementation evidence

Implemented native private feedback, explicit-maintainer inbox, opt-in reusable
widget, a three-page static Concourse site, output hashes and a read-only CI site
artifact. The unrelated Novirhyza draft remains untouched. Native API tests cover
feedback privacy/isolation/bounds/replay; local production Worker/D1 execution
and actual Chromium comment/widget journeys passed, including lost-response
recovery and keyboard/mobile use. Source metadata and internal links are gated
in `tests/site.test.ts`. No live Google/Cloudflare acceptance is inferred.

An independent HELIX guide reader evaluated all three authored pages against
the cited source, ran the site build and an isolated Hugo install/check, and
recorded body-bound review metadata. This was performed by hand without adding
a documentor installation or changing the flow marker. Scope lacks a governed
architecture visualization model; the site uses no generated architecture views.

Infrastructure PR #378 in Synaptiq has a state-backed Cloudflare plan of five
additions, zero changes, zero deletions. New host deployment, database migration,
maintainer assignment and actual Google/comment/feedback verification remain
pending the human-reviewed apply and explicit operational authorization.

## Maintainer workspace implementation — 2026-11-23

Owner authorized implementation on PR #10. FEAT-008, SD-008 and CONTRACT-003
govern feedback and discussions together. Preserve the unrelated `microsite/` draft.

| Slice | Dependencies | Validation |
|---|---|---|
| Adopt admin/client/application/D1 boundaries | Existing module map | Boundary checker plus forbidden-import controls |
| Add rebuildable FTS/ancestry/heads and canonical review events | Boundary adoption | Migration/backfill, native query/replay/race/rollback/rebuild tests |
| Protect shell/assets and management HTTP ports | Repository ports | Signed identities, role matrix, origin/host/input/cursor denials |
| Build overview, both queues/detail and reader badges | HTTP contract | Chromium search/filter/sort/paging, reply matches, triage/resolve, recovery/mobile |
| Package and document operations | All preceding gates | Existing check, local production Worker/D1, browser suites and diff review |

No production migration, cloud deployment or installation-role change is authorized
by this implementation request. Local synthetic migration and restore tests are
part of implementation verification. Recovery must export canonical tables only
and rebuild projections in an isolated database before any production operation.

Execution estimate is unknown: no comparable measured usage is available. Use
one implementation and verification pass followed by review of changed behavior;
the runtime provides no enforced per-task token cap or monetary metering. Stop
for a concrete authority conflict or required production operation, preserving
remaining work here. No additional tracker is selected for this repository.

Completion requires both queues, separately authorized full-result search/counts,
immutable originals/history, replay-safe writes and reply-aware resolution through
the running application, with legacy APIs preserved. Test failures or unimplemented
required behavior remain unfinished work; local acceptance never implies live Google
or remote D1 qualification. Diagnostic payloads stay outside source commits.

### Maintainer workspace verification and review

Implemented application ports, separately protected shell/assets/APIs, complete
FTS queries/counts, canonical review events, ancestry/head projections, feedback
triage, thread resolution/reopening, and a responsive native DOM workspace.
`src/client` owns shared transport; widget code depends on it through the existing
export bridge. Module checks reject admin-to-server, client-to-widget and
application-to-D1 imports, with allowed-import controls.

| Proof | Implemented acceptance |
|---|---|
| `tests/management.test.ts` | MW-01/02/03/04/05: complete counts, query/keysets, Unicode, role matrix, origin/isolation, replay/conflict, both reply races, backfill, bounded history/replies and canonical restore/rebuild |
| `scripts/management-workerd.mjs` via `test:workerd` | Production Worker/D1: signed identity, FTS, guarded events, replay, trigger rollback and separate-binding restore/rebuild; 10,000 records per family |
| `scripts/management-browser.ts` | MW-01/02/03/04/06: dashboard drill-down, both queues, sort/filter/paging, reply-only search, review response loss/reload/replay, explicit conflict reconciliation, safe text, mobile/back/keyboard, capability omission and expiry |
| Existing inline/site browser journeys | Existing comments, private feedback, principal-scoped drafts, response recovery and actual site integration remain functional |

Curated verification covers local synthetic data only. Run receipts/screenshots
stay in ignored `test-results/`; raw diagnostics are excluded from the PR.
Review checked trusted site/capability boundaries, fixed SQL and cursor binding,
per-command replay identity, contribution guards, asset packaging and stale UI
response handling. Remote deployment/export, role assignment and Google acceptance
remain operator-authorized rollout work, not unfinished implementation claims.

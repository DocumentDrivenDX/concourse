# Cloudflare deployment: HELIX and reusable installations

The owner selected `helix.synaptiq.tools` with existing Synaptiq Google Workspace
login, then chose Wrangler plus a small reusable Terraform module. This guide
covers preparation and explicit operations. Nothing here establishes a live
Cloudflare installation or authorizes an apply, credential read or migration.

## Ownership

| Owner | Resources / operation |
|---|---|
| Existing infrastructure, using `infra/cloudflare` | Pages project (optional creation), Pages custom domain, DNS, Access application/policy, D1 database lifetime |
| Concourse Wrangler profile | Worker code, bindings, exact `/__concourse/*` routes, disabled workers.dev/version URLs |
| Publication's existing pipeline | Build/sign static content and upload it to the selected Pages project |
| Explicit database operation | Review and apply SQL migrations independently of code deployment |

The Terraform module references existing login-provider IDs. It has no backend,
provider credentials, Worker bundle or per-site source branches. D1 has
`prevent_destroy`. Do not manage the same Worker/routes through the legacy
`infra/collaboration-worker` module and Wrangler.

## 1. Review the infrastructure foundation

Copy the short [module example](../../../infra/cloudflare/README.md) into the
infrastructure root and pin its source to a reviewed immutable Concourse commit.
Use the infrastructure repository's existing account, zone and Google provider
references. The module exports one `installation` object with the IDs required
by the Wrangler profile.

For existing resources, add explicit state moves/imports in that root. Review a
saved Terraform/OpenTofu plan: existing Playbooks resources must have no
replacements, deletions or changed admission policy. Do not mix this adoption
with a production refactor. Apply only the reviewed plan after authorization.
There is no need to give Concourse the infrastructure repository's state access.

New empty Pages origins can exist before upload; do not upload private bytes
until the production, wildcard-preview and custom origins are protected. A
successful plan/apply is not proof of admission behavior.

The project is intentionally created before Access: Cloudflare rejects its
pages.dev destinations until the project exists. Wait for Access and admission
checks before the first content deployment. The custom-domain and DNS resources
remain ordered after Access. Consumers may vendor both sibling modules beneath
the root they stage for planning; retain provenance and review each local update.

## 2. Keep one explicit installation profile

Copy `deploy/cloudflare/profile.example.json` to an installation file, such as
`deploy/cloudflare/helix.json`. Replace placeholders with the module's output,
the existing Access team issuer and the intended site's explicit membership.
These IDs/policy values are not credentials. A profile can be kept in the public
repository only when its hostnames and membership policy are suitable for public
source; otherwise prepare it in the consuming repository or locally.

Profiles use JSON and the pinned Wrangler configuration subset in CONTRACT-001.
There are no environment inheritance rules, build hooks or automatic resource
creation. The preparer supplies the fixed bundle and migration paths. One
Worker can have multiple configured site routes, with one audience/membership
entry per site. Terraform foundation calls remain per publication; reuse one
installation's D1 for that shared Worker rather than allocating an unused
second database. Additional publication-only foundations can use
`infra/protected-publication` directly.

Review the exact account, database ID, issuer, audience and membership against
the infrastructure outputs. Every route must be an exact configured hostname
plus `/__concourse/*`; broad and foreign-host routes refuse. Alternate Worker
origins are disabled. Full private-site protection is the Terraform default;
`access_path = "/__concourse"` is for deliberately public static publications.

## 3. Prepare and review a release offline

Use the reviewed Concourse checkout, Bun 1.4.3 and Node 22+:

```sh
bun install --frozen-lockfile
bun run check
bun run test:workerd
bun run cloudflare:prepare deploy/cloudflare/helix.json /tmp/helix-release
```

The output directory must not exist. Preparation makes no Cloudflare calls and
reads no credentials. It packages the built Worker, normalized `wrangler.json`
and SQL files with a `release.json` manifest and prints a review summary and
release digest. The commit is provenance; file hashes identify the actual built
bytes, including any local changes. Review those changes before approval.

Inspect the summary and packaged configuration, Worker artifact and SQL. Keep
the previous release and recorded deployed Worker version. The summary describes
desired configuration; it is not a Terraform-style remote-state diff. Compare
existing Worker settings/routes on initial adoption and when changing them.

The manual **Prepare Cloudflare release** GitHub workflow performs the same
checks and uploads the release plus review summary. It has read-only repository
permissions, no deployment secret and no cloud deployment step. To deploy its
artifact, check out the workflow's exact commit, install its lockfile and use
the extracted release directory. Never approve a digest supplied by an
unreviewed artifact without inspecting its contents.

## 4. Initialize storage only after separate approval

List pending remote D1 migrations using the packaged configuration through the
normal authenticated operator process. Review the SQL, pending migration set,
backup/export/restore procedure and data policy before approving changes. For
an approved initialization, use the installed pinned Wrangler:

```sh
bunx --no-install wrangler d1 migrations apply DB --remote --config /tmp/helix-release/wrangler.json
```

This is a real mutation and is not run by preparation or deployment. Do not
admit private reader data until retention/export/restore and abuse controls are
settled. Later schema changes require a reviewed compatibility and recovery
plan; application rollback does not roll back D1.

## 5. Explicitly deploy the reviewed artifact

After approval, supply the exact printed digest:

```sh
bun run cloudflare:deploy /tmp/helix-release --approve REVIEWED_RELEASE_DIGEST
```

The command rechecks the manifest, every packaged byte, profile and pinned
Wrangler/lockfile before invoking Wrangler. Missing approval, placeholders,
changed files, extra files, symlinks and unsafe profiles abort before Wrangler
starts. It deploys only Worker code/bindings/routes; SQL and static content stay
separate. The invoking operator supplies a separately authorized, scoped
Cloudflare credential through the normal Wrangler mechanism. Never store it in
the profile or artifact. The digest is an integrity/review check, not a signature
or a substitute for operator authorization.

Build HELIX with pinned Concourse assets, its signing pipeline, baseURL
`https://helix.synaptiq.tools/` and comments enabled. The public GitHub Pages
build leaves comments disabled. Its existing content pipeline uploads the
protected output to `helix-internal`; the Concourse runtime release does not.

## 6. Verify before enabling real use

Run the shared publication probes for production/custom/preview origins,
HTML/assets/search/downloads. Verify Google login, logout/expiry and direct API
access. Then post/reply/reload beside a real section, recover an interrupted
write and verify cross-site/anonymous denials. Local JWT/SQLite and Wrangler
`--dry-run` checks do not qualify deployed Access behavior or retention/restore.
Record the deployment/version ID and probe results alongside the release digest.

## Rollback

Disable the site's comments integration or redeploy the retained previous
release through the same review/digest procedure. Confirm the old application's
schema compatibility first. Retain D1 and its data. A Cloudflare Worker rollback
alone does not restore database schema or external infrastructure configuration;
check routes/bindings and rerun admission probes. Static content rollback belongs
to its existing signed publication pipeline. No automatic destruction or reverse
migration is provided.

## References and other hosts

The native [Wrangler configuration](https://developers.cloudflare.com/workers/wrangler/configuration/)
is the source of truth for Worker settings. [Worker versions and deployments](https://developers.cloudflare.com/workers/versions-and-deployments/)
explain why upload, activation and database recovery are distinct operations.

Batten/Databricks Apps is a separate required host profile: collaboration backend
plugin plus a volume-backed static publication plugin behind the Apps proxy.
This Cloudflare package does not claim to implement or qualify that profile.

## Concourse's own public microsite

Sources live in `site/`; `bun run build:site` writes `dist/site/` with the actual
comments and feedback component. The build workflow uploads `concourse-microsite`
as a reviewable artifact and has no deployment credential. `build.json` records
source revisions and output file hashes. Neither build nor CI applies storage
migrations or provisions infrastructure.

The proposed installation is `concourse.synaptiq.tools`, Pages project `concourse`,
Worker `concourse-site`, site ID `concourse`. The consuming infrastructure change
uses the existing module and Google Workspace provider, with `synaptiq.ai`
membership and `access_path = "/__concourse"`. The static pages are public;
collaboration remains protected. A separate D1 database avoids migrating HELIX
for this adoption. Infrastructure human review/merge and its normal apply must
finish before filling the new site's profile. Do not create resources ad hoc.

Keep the actual installation output and maintainer addresses outside this public
repository. Populate the existing profile example from that output; optionally
add `maintainers` to the site entry as exact verified email addresses. Both normal
site membership and this additional assignment are required to read feedback.
Absent assignments, members can submit feedback but nobody can read the inbox.
Have the installation owner approve the maintainer assignment before admitting
private feedback. No commenter receives maintainer access by default.

For a new empty database, review/apply both `0001_comments.sql` and
`0002_feedback.sql`. Prepare/deploy the reviewed Worker through the existing
digest process. Protect `/__concourse` on custom, production and wildcard preview
origins, and configure the Worker route only on the custom hostname. Publish the
reviewed static artifact to the already provisioned project:

```sh
node node_modules/wrangler/bin/wrangler.js pages deploy dist/site \
  --project-name concourse --branch main
```

Verify public documentation/assets return 200, and signed-out session, comments
and feedback paths challenge for login on every origin. Previews must not provide
an alternate API. Verify real Synaptiq Google login on the custom hostname, then
comment/reload/reply, feedback receipt, member inbox denial and assigned-maintainer
inbox access. Record deployment/version IDs and artifact hashes locally without
publishing installation details or reader data. Local browser fixtures do not
qualify these deployed journeys. Retention/export/restore and abuse policy remain
installation decisions; this slice does not introduce moderation or notifications.

## Maintainer workspace rollout

The workspace is served by the existing Worker at `/__concourse/admin/`. Its
content-hashed JS/CSS and shell are embedded in the approved Worker bytes; no
public asset upload or new infrastructure module is required. Every asset/API
request verifies membership and the relevant capability. The feedback widget
links permitted users to the workspace. The existing login return allowlist
permits exactly `/__concourse/admin/` in addition to publication pages.

Prepare and review a new immutable release using the existing Wrangler profile
procedure. Before deploying its Worker, explicitly approve and apply pending
migrations in order through `0003_management.sql` on each selected installation.
An installation with only comments must also apply `0002_feedback.sql`; this
bundle's reader API depends on thread membership from migration 0003. Deployment
preparation packages SQL but never runs it. Keep installation IDs and real email
allowlists in private installation profiles, outside this public repository.

Existing exact-email `maintainers` grant feedback maintenance. The independent
optional `moderators` array grants discussion management; omitted means none.
Both still require site membership. Assigning one does not imply the other.
Review those profile changes explicitly before preparing the release; there is
no browser identity administration or group creation.

After an approved rollout, verify anonymous/non-role denial for shell/assets/API,
then both authorized queues with Google login. Submit synthetic feedback and a
root/reply; verify search, counts, triage, resolution, reply reopening and reload.
Use the actual publication resource identity; the workspace does not guess links
from Markdown paths. Remote performance/cost budgets and canonical-table export
behavior must be checked on an isolated remote database before production migration.
Local workerd verification does not qualify cloud quotas, Google or remote export.

### Canonical recovery and rollback

Take a canonical-table-only backup of `comments`, `feedback` and `review_events`
through the approved D1 export procedure, with writes paused. Do not rely on a
full FTS virtual-table dump being reimportable into D1. Verify that the export
includes exact IDs, event versions and retry payloads, and restrict access to
this private content. No production export is part of implementation verification.

For this recovery sequence, use data-only canonical inserts; a schema-inclusive
dump must not be applied over already migrated tables. Prove recovery in a separate
database: create all migrations, import comments
in ascending ID and feedback before importing review events in version order,
then execute `operations/rebuild-management.sql`. Rebuild never changes canonical
messages/events. Compare full-result query counts, ancestry, original bodies,
head versions/statuses, histories and retry acknowledgements. Projection writes
and canonical import must complete before enabling readers/writers. Retain the
old database until parity is confirmed. Local SQLite and D1 tests exercise this
restore/rebuild sequence using synthetic records.

On application failure, roll back to the prior approved Worker release while
retaining the additive schema and canonical events. If a projection trigger fails,
new writes fail closed and clients keep retry identity. Pause writes, diagnose
and rebuild in isolation before approving any repair; do not remove canonical
review history or retry keys. No destructive down-migration is provided.

# First deployment: HELIX protected mirror

Owner selected `helix.synaptiq.tools` with existing Synaptiq Google Workspace
login on 2026-10-29. Source changes span Concourse, infrastructure, Entropy
Exchange and HELIX. Each consumer must pin the reviewed Concourse commit.

1. Build Concourse with the lockfile and run `bun run check` plus browser proof.
2. In infrastructure, review a saved plan for the generic module state moves,
   new `helix-internal` Pages/Access/domain and optional collaboration runtime.
   Playbooks must have no resource replacement. Supply a reviewed Worker bundle
   and the exact Access team issuer through normal infrastructure configuration.
3. Apply only the reviewed plan after authorization. The D1 store has destruction
   protection. It is initially empty; use the committed migration with Wrangler
   only after separately approving database initialization. Do not admit private
   reader data until retention/export/restore and abuse controls are settled.
4. Build HELIX's source with pinned Concourse assets, existing signing pipeline,
   baseURL `https://helix.synaptiq.tools/` and comments enabled. The public GitHub
   Pages build leaves comments disabled. Upload the private build to
   `helix-internal` through the configured deployment credential.
5. Verify Google login, logout/expiry, all origin/preview/custom hosts and private
   assets. Then post/reply/reload beside a real section, recover an interrupted
   write and verify cross-site/anonymous denials. Local signatures and SQLite
   tests do not qualify this deployed behavior.

Rollback disables comments/redeploys the previous Worker/static artifact; retain
D1. Reverse state moves only with an explicit reviewed infrastructure plan.
No automated deletion of comments or schema rollback is included.

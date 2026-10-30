# Protected publication module

Generic Cloudflare v5 Pages custom-domain, DNS and Access composition. The Pages
project may already exist or be created with `create_project = true`. A new
project must exist before Access can reference its `pages.dev` destinations.
Keep that project empty until Access is active and admission checks pass; do
not start a content upload just because project creation succeeded. The custom
domain waits for Access and DNS waits for the custom domain.
Infrastructure owns this module's deployment; content
pipelines upload build output. No caller-specific defaults, cloud credentials,
provider registration or deployment is embedded.

Pass account_id, zone_id, name, pages_project, hostname, allowed_idps and at least
one allowed_email_domains/allowed_emails value. Empty membership denies module
admission. Default access_path protects the whole site; `/__concourse` protects
only the API/login paths on a public static site. A public site also needs a
Worker route for `/__concourse/*`; this module does not provision that runtime.

Existing consumers must use moved blocks for each old Access/Pages/DNS address.
Review a real plan for zero replacements before applying. Moving resources is
not proof the production app enforces the expected policy. Probe all actual
custom/Pages/preview hosts and representative asset/index/download routes.

Pin the module source to an immutable Concourse revision. Do not use a developer
checkout path in production infrastructure.

Consumers that require reviewed vendored code may copy both sibling directories
`infra/cloudflare` and `infra/protected-publication` beneath their root module.
Preserve their relative layout and record the reviewed source commit and local
changes. Keeping the copy inside the root also supports read-only plan runners
that stage only that directory. Review module updates as infrastructure code;
do not fetch or update them implicitly during an apply.

For a complete collaboration foundation including D1, prefer the small
[`infra/cloudflare`](../cloudflare/README.md) wrapper and its Wrangler release
profile. This lower-level module remains useful for publication-only adoption.

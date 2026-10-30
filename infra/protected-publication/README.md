# Protected publication module

Generic Cloudflare v5 Pages custom-domain, DNS and Access composition. The Pages
project must already exist. Infrastructure owns this module's deployment; content
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

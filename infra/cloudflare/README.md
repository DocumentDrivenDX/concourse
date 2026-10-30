# Cloudflare foundation

One module call creates the publication's Access application, Pages domain/DNS
and D1 database. Set `create_project = true` for a new direct-upload Pages
project; omit it for an existing project. It references existing login providers.
Wrangler owns the Worker, bindings and routes; this module never uploads code or
executes SQL. Terraform state remains in the consuming infrastructure repository.

```hcl
module "helix_concourse" {
  source = "git::https://github.com/DocumentDrivenDX/concourse.git//infra/cloudflare?ref=REVIEWED_COMMIT"

  account_id            = local.cloudflare_account_id
  zone_id               = local.synaptiq_tools_zone_id
  name                  = "helix-concourse"
  hostname              = "helix.synaptiq.tools"
  pages_project         = "helix-internal"
  create_project        = true
  allowed_idps          = [local.existing_google_workspace_idp_id]
  allowed_email_domains = ["synaptiq.ai"]
}

output "helix_concourse" {
  value = module.helix_concourse.installation
}
```

The local names above are illustrative inputs, not claims about Synaptiq's
configuration. Replace the source ref with a reviewed immutable commit. No
provider or backend configuration is embedded. Use the consuming repository's
Cloudflare v5 provider and its normal credentials and saved-plan/apply process.

The default protects the entire site, including production and wildcard preview
Pages origins. `access_path = "/__concourse"` deliberately leaves static content
public and protects collaboration only. Do not use it for private publications.

After reviewing/applying the infrastructure plan, copy the `installation` output
into the [Wrangler example](../../deploy/cloudflare/profile.example.json) and
add the existing Access team issuer and explicit site membership. IDs are not
credentials. Follow the [release procedure](../../docs/helix/05-deploy/first-slices.md).

## Existing resources

For adoption, use explicit `moved` blocks (or separately reviewed imports) in
the consuming root. Publication resource addresses are nested beneath
`module.helix_concourse.module.publication`; the D1 address is
`module.helix_concourse.cloudflare_d1_database.comments`. A saved plan must show
no replacement/deletion of existing Access, DNS, Pages or D1 resources. Do not
create a parallel Access application for an already protected hostname.

The old `infra/collaboration-worker` manages Worker code/routes and must not be
combined with this Wrangler profile. If already applied, transferring Worker
ownership needs a separate saved plan that relinquishes those resources without
destroying them, preserves the D1 ID, then verifies Wrangler configuration.
Switching module source alone is not an ownership migration.

locals {
  destinations = [
    "${var.pages_project}.pages.dev${var.access_path}",
    "*.${var.pages_project}.pages.dev${var.access_path}",
    "${var.hostname}${var.access_path}",
  ]
}
resource "cloudflare_zero_trust_access_application" "site" {
  account_id                  = var.account_id
  name                        = var.name
  type                        = "self_hosted"
  domain                      = local.destinations[0]
  allowed_idps                = var.allowed_idps
  app_launcher_visible        = false
  auto_redirect_to_identity   = true
  allow_authenticate_via_warp = false
  session_duration            = var.session_duration
  destinations                = [for uri in local.destinations : { type = "public", uri = uri }]
  policies = [{
    name       = "Allow publication members"
    decision   = "allow"
    precedence = 1
    include = concat(
      [for domain in var.allowed_email_domains : { email_domain = { domain = domain } }],
      [for email in var.allowed_emails : { email = { email = email } }],
    )
  }]
  lifecycle {
    precondition {
      condition     = length(var.allowed_email_domains) + length(var.allowed_emails) > 0
      error_message = "An explicit nonempty publication membership policy is required."
    }
  }
  # Cloudflare rejects a pages.dev destination if its project does not exist.
  # Keep new projects empty until Access is active and admission is verified;
  # the content pipeline must not upload protected bytes during bootstrap.
  depends_on = [cloudflare_pages_project.site]
}
resource "cloudflare_pages_project" "site" {
  count             = var.create_project ? 1 : 0
  account_id        = var.account_id
  name              = var.pages_project
  production_branch = "main"
}
resource "cloudflare_pages_domain" "site" {
  account_id   = var.account_id
  project_name = var.pages_project
  name         = var.hostname
  depends_on   = [cloudflare_zero_trust_access_application.site, cloudflare_pages_project.site]
}
resource "cloudflare_dns_record" "site" {
  zone_id    = var.zone_id
  name       = var.hostname
  type       = "CNAME"
  content    = "${var.pages_project}.pages.dev"
  proxied    = true
  ttl        = 1
  comment    = "Protected publication (Concourse)"
  depends_on = [cloudflare_pages_domain.site]
}

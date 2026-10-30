module "publication" {
  source                = "../protected-publication"
  account_id            = var.account_id
  zone_id               = var.zone_id
  name                  = var.name
  hostname              = var.hostname
  pages_project         = var.pages_project
  create_project        = var.create_project
  allowed_idps          = var.allowed_idps
  allowed_email_domains = var.allowed_email_domains
  allowed_emails        = var.allowed_emails
  session_duration      = var.session_duration
  access_path           = var.access_path
}

resource "cloudflare_d1_database" "comments" {
  account_id = var.account_id
  name       = "${var.name}-comments"
  lifecycle {
    prevent_destroy = true
  }
}

output "installation" {
  description = "Non-secret IDs to copy into the installation's reviewed Wrangler profile."
  value = {
    account_id    = var.account_id
    zone_id       = var.zone_id
    hostname      = var.hostname
    worker_name   = var.name
    database_id   = cloudflare_d1_database.comments.id
    database_name = cloudflare_d1_database.comments.name
    audience      = module.publication.audience
  }
}

variable "account_id" { type = string }
variable "name" { type = string }
variable "zone_id" { type = string }
variable "hostname" { type = string }
variable "script_path" { type = string }
variable "sites" {
  type = list(object({
    id       = string
    origin   = string
    issuer   = string
    audience = string
    domains  = list(string)
    emails   = list(string)
  }))
}
resource "cloudflare_d1_database" "comments" {
  account_id = var.account_id
  name       = "${var.name}-comments"
  lifecycle { prevent_destroy = true }
}
resource "cloudflare_workers_script" "comments" {
  account_id         = var.account_id
  script_name        = var.name
  content            = file(var.script_path)
  main_module        = "worker.js"
  body_part          = "worker.js"
  compatibility_date = "2026-08-06"
  bindings = [
    { name = "DB", type = "d1", id = cloudflare_d1_database.comments.id },
    { name = "SITES", type = "plain_text", text = jsonencode(var.sites) },
  ]
}
resource "cloudflare_workers_route" "comments" {
  zone_id = var.zone_id
  pattern = "${var.hostname}/__concourse/*"
  script  = cloudflare_workers_script.comments.script_name
}
output "database_id" { value = cloudflare_d1_database.comments.id }
output "worker_name" { value = cloudflare_workers_script.comments.script_name }

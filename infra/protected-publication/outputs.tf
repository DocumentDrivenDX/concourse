output "access_application_id" { value = cloudflare_zero_trust_access_application.site.id }
output "audience" { value = cloudflare_zero_trust_access_application.site.aud }
output "hostname" { value = var.hostname }

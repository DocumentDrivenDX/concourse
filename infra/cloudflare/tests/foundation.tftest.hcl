mock_provider "cloudflare" {}

run "foundation_without_runtime_ownership" {
  command = plan
  variables {
    account_id            = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
    zone_id               = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
    name                  = "review-concourse"
    hostname              = "guide.example"
    pages_project         = "review-publication"
    allowed_idps          = ["existing-google-provider"]
    allowed_email_domains = ["example.org"]
    create_project        = true
  }
  assert {
    condition     = output.installation.worker_name == "review-concourse" && output.installation.hostname == "guide.example"
    error_message = "The Wrangler handoff must retain the explicitly selected Worker and hostname."
  }
  assert {
    condition     = cloudflare_d1_database.comments.name == "review-concourse-comments" && output.installation.account_id == var.account_id
    error_message = "The D1 foundation must use the installation's account and stable database name."
  }
}

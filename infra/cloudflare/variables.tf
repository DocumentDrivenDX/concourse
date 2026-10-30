variable "account_id" { type = string }
variable "name" {
  description = "Stable Worker name and database-name prefix used by the Wrangler installation."
  type        = string
  validation {
    condition     = can(regex("^[a-z0-9][a-z0-9-]{0,53}$", var.name))
    error_message = "name must be a lowercase slug of at most 54 characters (leaving room for -comments)."
  }
}
variable "pages_project" {
  type = string
  validation {
    condition     = can(regex("^[a-z0-9][a-z0-9-]*$", var.pages_project))
    error_message = "pages_project must be a Pages project slug."
  }
}
variable "hostname" {
  type = string
  validation {
    condition     = can(regex("^[a-z0-9][a-z0-9.-]*\\.[a-z]{2,}$", var.hostname))
    error_message = "hostname must be an explicit lowercase DNS hostname, without a scheme, wildcard or path."
  }
}
variable "zone_id" { type = string }
variable "allowed_idps" {
  type = list(string)
  validation {
    condition     = length(var.allowed_idps) > 0
    error_message = "Explicit identity providers are required."
  }
}
variable "allowed_email_domains" {
  type    = list(string)
  default = []
}
variable "allowed_emails" {
  type    = list(string)
  default = []
}
variable "session_duration" {
  type    = string
  default = "24h"
}
variable "access_path" {
  description = "Empty protects the whole site; /__concourse protects only collaboration on a public site."
  type        = string
  default     = ""
  validation {
    condition     = contains(["", "/__concourse"], var.access_path)
    error_message = "Use whole-site protection or /__concourse."
  }
}

variable "create_project" {
  description = "Create a new direct-upload Pages project; keep false for existing content pipelines."
  type        = bool
  default     = false
}

# Practices: auth-managed-identity

## Design

Compare Cloudflare Access with the selected audience and public-site login
requirements. Specify trusted issuer/audience/signature/expiry validation and
provider-to-account mapping in an identity contract. Describe session, logout,
revocation, account linking and recovery limits. Select exact provider account
types and test accounts before qualification.

## Implementation

Use established authentication integrations and verified server context. Browser
claims cannot identify an author or grant membership. Application authorization
must check site/resource permissions separately. Managed identity replaces the
library's local-password backend default by owner direction.

## Verification

Exercise real login for the selected Microsoft, Google and GitHub profiles.
Reject forged/expired/wrong-audience credentials, email-only merges and cross-site
claims. Record provider configuration and deployed evidence without secrets.
A local identity stub cannot qualify a live provider or logout behavior.

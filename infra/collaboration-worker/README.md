# Legacy Terraform runtime alternative

This module owns Worker code, bindings, routes and D1. New installations should
use [`infra/cloudflare`](../cloudflare/README.md) with Wrangler owning the
application release. Do not use both to manage the same Worker, routes or D1.
Existing state requires a separately reviewed ownership transfer; no automated
state change or destruction is provided here.

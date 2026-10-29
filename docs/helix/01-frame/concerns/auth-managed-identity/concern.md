# Concern: auth-managed-identity

## Category

Infrastructure and identity.

## Areas

all

## Slot

auth-provider

## Boundary

Managed provider login supplies verified identity; Concourse owns account mapping and application authorization.

## Components

Microsoft, Google and GitHub integrations; trusted identity adapter; sessions; explicit account linking.

## Drift Signals

Trusting browser identity fields; email-only account merge; implicit password signup; unverified token/header acceptance.

## When to use

Concourse discovery through deployment; source: operator-override based on the
owner-accepted planning assumptions of 2026-10-29.

## Artifact Impact

PRD, architecture, identity/publication contracts, story test plans and deployment
procedures must carry the declared trust/evidence boundary. Read [practices](practices.md).

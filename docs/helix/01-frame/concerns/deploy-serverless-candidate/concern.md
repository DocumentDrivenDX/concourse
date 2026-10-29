# Concern: deploy-serverless-candidate

## Category

Infrastructure and identity.

## Areas

all

## Slot

deploy-target

## Boundary

Use serverless hosting; investigate Cloudflare first while retaining Azure as an alternative.

## Components

Managed static publication; serverless collaboration service; protected origins/previews; environment isolation.

## Drift Signals

Public private-content origins; credentials in source; assuming a chosen database or infrastructure account.

## When to use

Concourse discovery through deployment; source: operator-override based on the
owner-accepted planning assumptions of 2026-10-29.

## Artifact Impact

PRD, architecture, identity/publication contracts, story test plans and deployment
procedures must carry the declared trust/evidence boundary. Read [practices](practices.md).

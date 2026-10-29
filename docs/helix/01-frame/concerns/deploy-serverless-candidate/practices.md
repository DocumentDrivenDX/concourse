# Practices: deploy-serverless-candidate

## Design

Evaluate the existing playbooks Pages/Access pattern and Workers asset routing.
Specify every origin, preview alias, asset route and protected cache boundary.
Confirm infrastructure ownership and cloud account separately from application
ownership. Select versions, region, storage, budget and deployment/rollback plan.

## Implementation

Keep reusable infrastructure changes in the owning project. Establish policy
before making a private hostname/content live. Do not deploy during discovery
or framing. Keep public and protected build artifacts separated.

## Verification

Verify denial across custom domains, origin/preview hosts, indexes and downloads,
including signed-out and revoked principals and warm-cache requests. Record real
cloud evidence separately from local emulation. Verify rollback and restore
procedures for the selected data store before production admission.

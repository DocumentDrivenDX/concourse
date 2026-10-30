# Concern: datastore-cloudflare-d1

## Category

Implementation platform.

## Areas

api, data

## Slot

datastore

## Boundary

D1 stores append-only comments for the native protocol only.

## Components

See Architecture and CONTRACT-001.

## Drift Signals

Unqualified backend claims or competing UI ownership.

## When to use

Initial Concourse comment slice. Source: architecture assumption under authorized build.

## Artifact Impact

Contracts, test allocation and implementation follow [practices](practices.md).
